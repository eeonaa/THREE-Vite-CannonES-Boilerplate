import * as THREE from 'three'
import * as CANNON from 'cannon-es'

export default class PhysicsControls extends THREE.EventDispatcher {
    constructor(camera, cannonBody, mesh) {
        // Calls original class
        super()

        // Defining params
        this.cannonBody = cannonBody
        this.player = mesh

        // Sets the pointer lock to false initially
        this.enabled = false

        // Allows for the reading of the cameras pitch and yaw
        this.pitchObject = new THREE.Object3D()
        this.camera = camera
        camera.position.y = 0.5
        this.pitchObject.add(camera)

        this.yawObject = new THREE.Object3D()
        this.yawObject.position.y = 2
        this.yawObject.add(this.pitchObject)

        // Creates temp quat
        this.quaternion = new THREE.Quaternion()

        // Base movement params
        this.baseSpeed = 30
        this.maxAccel = 600
        this.jumpVelocity = 7.5
        this.friction = 0.08

        // Ground acceleration params
        this.groundAccel = 0.03
        this.groundDecel = 0.015

        // Air acceleration params
        this.airAccel = 0.000002
        this.airDecel = 0.000002

        // Mouse sens
        this.lookFactor = 20

        // Basic movement checks
        this.moveForward = false
        this.moveBackward = false
        this.moveLeft = false
        this.moveRight = false

        // Ground checks and params
        this.onGround = true
        this.canJump = true

        // Collision params
        this.contactNormal = new CANNON.Vec3() // Normal in the contact, pointing *out* of whatever the player touched
        this.upAxis = new CANNON.Vec3(0, 1, 0)

        // Collision check
        this.cannonBody.addEventListener('collide', (event) => { this.collision(event) })

        // Set initial world velocity
        this.velocity = this.cannonBody.velocity

        // Set initial local velocity
        this.inputVelocity = new THREE.Vector3()
        this.euler = new THREE.Euler()

        // Pointer lock types
        this.lockEvent = { type: 'lock' }
        this.unlockEvent = { type: 'unlock' }

        // Init pointer lock
        this.connect()
    }

    // Get funcs
    getObject() {
        return this.yawObject
    }

    getDirection() {
        const vector = new CANNON.Vec3(0, 0, -1)
        vector.applyQuaternion(this.quaternion)
        return vector
    }

    // Pointer lock controls
    connect() {
        document.addEventListener('mousemove', this.onMouseMove)
        document.addEventListener('pointerlockchange', this.onPointerlockChange)
        document.addEventListener('pointerlockerror', this.onPointerlockError)
        document.addEventListener('keydown', this.onKeyDown)
        document.addEventListener('keyup', this.onKeyUp)
    }

    disconnect() {
        document.removeEventListener('mousemove', this.onMouseMove)
        document.removeEventListener('pointerlockchange', this.onPointerlockChange)
        document.removeEventListener('pointerlockerror', this.onPointerlockError)
        document.removeEventListener('keydown', this.onKeyDown)
        document.removeEventListener('keyup', this.onKeyUp)
    }

    dispose() {
        this.disconnect()
    }

    lock() {
        document.body.requestPointerLock()
    }

    unlock() {
        document.exitPointerLock()
    }

    onPointerlockChange = () => {
        if (!document.pointerLockElement) {
            this.dispatchEvent(this.unlockEvent)
            this.isLocked = false
            return
        }
        this.dispatchEvent(this.lockEvent)
        this.isLocked = true
    }

    onPointerlockError = () => {
        console.error('PhysicsControls (PointerLockControls): Unable to use Pointer Lock API')
    }

    onMouseMove = (event) => {
        if (!this.enabled) {
            return
        }

        const { movementX, movementY } = event

        this.yawObject.rotation.y -= movementX * (0.0001 * this.lookFactor)
        this.pitchObject.rotation.x -= movementY * (0.0001 * this.lookFactor)

        this.pitchObject.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitchObject.rotation.x))
    }

    onKeyDown = (event) => {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveForward = true
                break

            case 'KeyA':
            case 'ArrowLeft':
                this.moveLeft = true
                break

            case 'KeyS':
            case 'ArrowDown':
                this.moveBackward = true
                break

            case 'KeyD':
            case 'ArrowRight':
                this.moveRight = true
                break

            case 'Space':
                this.jumpCheck()
                break
        }
    }

        // Extra logic for the onKeyDown event
        jumpCheck() {
            if (this.canJump) {
                this.velocity.y = this.jumpVelocity
                this.onGround = false
                this.canJump = false
            }
        }

    onKeyUp = (event) => {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveForward = false
                break

            case 'KeyA':
            case 'ArrowLeft':
                this.moveLeft = false
                break

            case 'KeyS':
            case 'ArrowDown':
                this.moveBackward = false
                break

            case 'KeyD':
            case 'ArrowRight':
                this.moveRight = false
                break
        }
    }

    // Collision logic 
    collision(event) {
        const { contact } = event

        // contact.bi and contact.bj are the colliding bodies
        if (contact.bi.id === this.cannonBody.id) {
            // bi is the player body, flip the contact normal
            contact.ni.negate(this.contactNormal)
        } else {
            // bi is something else. Keep the normal as it is
            this.contactNormal.copy(contact.ni)
        }

        if (this.onGround) {
            return
        }

        // If contactNormal.dot(upAxis) is between 0 and 1 the contact normal is in the up direction
        if (this.contactNormal.dot(this.upAxis) > 0 && this.velocity.y < 9) {
            this.onGround = true
            this.canJump = true
        } else {
            this.onGround = false
            this.canJump = false
        }
    }

    // Movement scripts
    groundmove(wishdir) {
        this.applyFriction(this.delta)

        wishdir.normalize()
        let wishspeed = this.vectorLength(wishdir)
        wishspeed *= this.baseSpeed
        
        this.accelerate(wishdir, wishspeed, this.groundAccel)
    }
    
    airMove(wishdir) {
        let wishspeed = this.vectorLength(wishdir)
        wishspeed *= this.baseSpeed
        
        let accel = this.vectorDot(this.velocity, wishdir) < 0 ? this.airDecel : this.airAccel
        
        if (!this.moveForward && !this.moveBackward && !this.moveLeft && !this.moveRight) {
            if (wishspeed > this.sideStrafeSpeed) {
                wishspeed = this.sideStrafeSpeed
            }
            accel = this.sideStrafeAccel
        }
            
        this.accelerate(wishdir, wishspeed, accel)
    }

    accelerate(wishdir, wishspeed, accel) {
        let currentspeed = this.vectorDot(this.velocity, wishdir)
        let addspeed = wishspeed - currentspeed
        let accelspeed = accel * this.delta * wishspeed

        if (addspeed <= 0) {
            return
        }

        if (accelspeed > addspeed) {
            accelspeed = addspeed
        }

        if (currentspeed + accelspeed > this.maxAccel) {
            accelspeed = Math.max(this.maxAccel - currentspeed, 0)
        }

        this.velocity.x += accelspeed * wishdir.x
        this.velocity.z += accelspeed * wishdir.z
    }

    // Pseudo friction
    applyFriction(t) {
        let speed = this.vectorLength({ x: this.velocity.x, y: 0, z : this.velocity.z })
        let drop = 0

        if (this.onGround) {
            let control = speed < this.groundDecel ? this.groundDecel : speed
            drop = control * this.friction * this.delta * t
        }

        let newspeed = speed - drop

        if (newspeed < 0) {
            newspeed = 0
        }

        if (speed > 0) {
            newspeed /= speed
        }

        this.velocity.x *= newspeed
        this.velocity.z *= newspeed
    }

    // Vector math
    vectorDot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z
    }
    
    vectorLength(v) {
        return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
    }
    
    vectorNormalize(v) {
        let s = this.vectorLength(v) || 1
        
        v.x *= 1 / s
        v.y *= 1 / s
        v.z *= 1 / s

        return v
    }

    // Update loop (called in physics.js)
    update(delta) {
        this.delta = delta

        this.yawObject.position.copy(this.cannonBody.position)

        this.delta *= 1000
        this.delta *= 0.1

        this.inputVelocity.set(0, 0, 0)

        if (this.moveForward) {
            this.inputVelocity.z = -this.baseSpeed * this.delta
            // x = 0, z = ~ -0.02
        }
        if (this.moveBackward) {
            this.inputVelocity.z = this.baseSpeed * this.delta
            // x = 0, z = ~ 0.02
        }

        if (this.moveLeft) {
            this.inputVelocity.x = -this.baseSpeed * this.delta
            // x = ~ -0.02, z = 0
        }
        if (this.moveRight) {
            this.inputVelocity.x = this.baseSpeed * this.delta
            // x = ~ 0.02, z = 0
        }

        if (this.moveForward && this.moveLeft ||
            this.moveForward && this.moveRight ||
            this.moveBackward && this.moveLeft ||
            this.moveBackward && this.moveRight) {
            this.inputVelocity.x = this.inputVelocity.x / 1.4
            this.inputVelocity.z = this.inputVelocity.z / 1.4
        }

        // if tabbed out, ingnore all inputs
        if (this.enabled === false) {
            this.inputVelocity.set(0, 0, 0)
            if (this.onGround) {
                this.velocity.z = 0
                this.velocity.x = 0
            }
            return
        }

        // Convert velocity to world coordinates
        this.euler.y = this.yawObject.rotation.y
        this.euler.order = 'XYZ'
        this.quaternion.setFromEuler(this.euler)
        this.inputVelocity.applyQuaternion(this.quaternion)

        if (this.onGround) {
            this.groundmove(this.inputVelocity)
            return
        }
        
        this.airMove(this.inputVelocity)
    }
}
