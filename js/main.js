import * as THREE from 'three'
import Physics from './modules/physics.js'
import Stats from 'stats.js'

export default class Main {

    constructor() {
        this.canvas = document.getElementById('canvas')

        this.width = window.innerWidth
        this.height = window.innerHeight

        this.renderer = new THREE.WebGLRenderer({antialias: true, canvas: this.canvas})
        this.renderer.setSize(this.width, this.height)
        this.renderer.outputColorSpace = THREE.SRGBColorSpace
        this.renderer.setClearColor('#000000', 1)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        delete this.renderer.domElement.dataset.engine

        this.scene = new THREE.Scene()

        this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.1, 50)
        this.scene.add(this.camera)

        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
        this.scene.add(this.ambientLight)

        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.4)
        this.directionalLight.position.set(200, 500, 300)
        this.scene.add(this.directionalLight)

        this.scene.fog = new THREE.Fog(0x18191A, 25, 30)

        this.stats = new Stats()
        this.stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild(this.stats.dom)

        this.physics = new Physics(this)

        setInterval(() => {
            this.physics.render()
        }, 1000 / 60)

        this.render()
    }

    windowResize() {
        this.width = window.innerWidth
        this.height = window.innerHeight

        this.renderer.setSize(this.width, this.height)
        this.camera.aspect = this.width / this.height
        this.camera.updateProjectionMatrix()
    }

    render() {
        this.stats.begin()
        this.windowResize()
        this.renderer.render(this.scene, this.camera)
        this.stats.end()
        requestAnimationFrame(() => this.render())
    }
}

addEventListener("DOMContentLoaded", () => {new Main()})