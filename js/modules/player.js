import * as THREE from 'three'

export default class Player {
    constructor(scene, camera) {
        this.scene = scene
        this.camera = camera

		this.init()
    }
    
    init() {
        this.playerMesh = new THREE.Mesh(
            new THREE.CapsuleGeometry(1, 1.5, 4, 8),
            new THREE.MeshNormalMaterial()
        )
        this.scene.add(this.playerMesh)
    }
}