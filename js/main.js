import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js'
import Physics from './modules/physics.js'
import Stats from 'stats.js'

export default class Main {

    constructor() {
        this.canvas = document.getElementById('canvas')

        this.width = window.innerWidth
        this.height = window.innerHeight

        this.renderer = new THREE.WebGLRenderer({antialias: true, canvas: this.canvas})
        this.renderer.setSize(this.width, this.height)
        this.renderer.setClearColor(0x18191A, 1)

        this.scene = new THREE.Scene()

        this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.1, 50)
        this.camera.position.z = 5
        this.scene.add(this.camera)

        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
        this.scene.add(this.ambientLight)

        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.4)
        this.directionalLight.position.set(200, 500, 300)
        this.scene.add(this.directionalLight)

        this.scene.fog = new THREE.Fog(0x18191A, 25, 30)

        this.composer = new EffectComposer(this.renderer)
        this.renderPixelatedPass = new RenderPixelatedPass(4, this.scene, this.camera)
        this.renderPixelatedPass.normalEdgeStrength = 0
        this.renderPixelatedPass.depthEdgeStrength = 0.3
        this.composer.addPass(this.renderPixelatedPass)

        this.stats = new Stats()
        this.stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild(this.stats.dom)

        this.physics = new Physics(this)

        this.postProcessing = false

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
        switch(this.postProcessing) {
            case true:
                this.composer.render(this.scene, this.camera)
                break

            case false:
                this.renderer.render(this.scene, this.camera)
                break
        }
        this.stats.end()
        requestAnimationFrame(() => this.render())
    }
}

addEventListener("DOMContentLoaded", () => {new Main()})