import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import CannonDebugger from 'cannon-es-debugger'
import ThreeToCannon from './threeToCannon.js'
import PhysicsControls from './physicsControls.js'
import Player from './player.js'

export default class Physics {
    constructor(Game) {
        this.scene = Game.scene
        this.camera = Game.camera

        this.lastCallTime = performance.now()

        this.physicsInit()
        this.createObjects()
        this.physicsDebug()
        this.initPointer()
        this.time = 0;
    }

    // Main character controls with physicsControls.js
    initPointer() {
        this.physicsControls = new PhysicsControls(this.camera, this.playerBody, this.player)
        let temp = this.physicsControls
        this.scene.add(this.physicsControls.getObject())

        addEventListener("click", function () {
            temp.lock()
        })

        this.physicsControls.addEventListener('lock', () => {
            temp.enabled = true
        })

        this.physicsControls.addEventListener('unlock', () => {
            temp.enabled = false
        })
    }

    // Initialise the physics world
    physicsInit() {
        this.physicsWorld = new CANNON.World({
            gravity: new CANNON.Vec3(0, -20, 0)
        })

        const solver = new CANNON.GSSolver()
        solver.iterations = 30
        solver.tolerance = 0.0000001
        this.physicsWorld.solver = new CANNON.SplitSolver(solver)

        let physicsMaterial = new CANNON.Material('physics')
        this.contactMaterial = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, {
            friction: 0,
            restitution: 0
        })
        this.physicsWorld.addContactMaterial(this.contactMaterial)
    }

    // Create CANNON body from THREE Geometry
    complexGeo(mesh, parent) {
        this.threeToCannon = new ThreeToCannon(mesh)
        let faces = this.threeToCannon.getFaces()
        let verts = this.threeToCannon.getVertices()

        let shape = new CANNON.Trimesh(verts, faces)
        parent.addShape(shape)
    }

    initGeo(geo, parent) {
        geo.traverse((child) => {
            if (child.isMesh) {
                this.complexGeo(child, parent)
            }
        })
    }

    // Create custom capsule physics object
    createPlayerBody(mass, pos, height, radius) {
        let playerBody = new CANNON.Body({
            mass: mass,
            position: pos,
            material: this.contactMaterial
        })

        let sphereShape = new CANNON.Sphere(radius)

        playerBody.addShape(sphereShape, new CANNON.Vec3(0, height / 2, 0))
        playerBody.addShape(sphereShape, new CANNON.Vec3(0, -height / 2, 0))

        return playerBody
    }

    // Create box physics object
    createBox(mass, pos, dim) {
        let boxBody = new CANNON.Body({
            mass: mass,
            shape: new CANNON.Box(dim),
            position: pos,
            material: this.contactMaterial
        })

        return boxBody
    }

    // Initialises player object
    createPlayer() {
        this.playerBody = this.createPlayerBody(
            5,
            new CANNON.Vec3(0, 2, 0),
            1.5,
            1
        )

        this.playerBody.fixedRotation = true
        this.playerBody.updateMassProperties()
        this.physicsWorld.addBody(this.playerBody)

        this.player = new Player(this.scene, this.camera)
    }

    // Start of wrapper
    createObjects() {
        // Ground plane
        this.groundBody = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Plane(),
            material: this.contactMaterial
        })
        this.groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
        this.physicsWorld.addBody(this.groundBody)

        // Player object
        this.createPlayer()
    }

    // Shows wireframes of CANNON objects
    physicsDebug() {
        this.cannonDebugger = new CannonDebugger(this.scene, this.physicsWorld, {
            color: 0xffffff,
            scale: 0
        })
    }

    // Updates positions of THREE objects to follow CANNON objects
    updateObj(mesh, body) {
        mesh.position.copy(body.position)
        mesh.quaternion.copy(body.quaternion)
    }

    // List of physics objects that need updating
    updateObjList() {
        this.updateObj(this.player.playerMesh, this.playerBody)
    }

    // Render loop called in main.js
    render() {
        const time = performance.now() / 1000
        const dt = time - this.lastCallTime
        this.lastCallTime = time

        this.physicsWorld.fixedStep()
        this.cannonDebugger.update()
        this.physicsControls.update(dt)
        this.updateObjList()
    }
}