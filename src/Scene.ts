import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'

export default class Scene {
    gui: dat.GUI
    canvas: HTMLCanvasElement
    scene: THREE.Scene
    sizes: {
        width: number
        height: number
    }
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    clock: THREE.Clock
    controls: OrbitControls
    elapsedTime = 0
    initialized = false

    constructor(canvas: HTMLCanvasElement) {
        this.gui = new dat.GUI()
        this.canvas = canvas
        this.scene = new THREE.Scene()
        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight,
        }
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.sizes.width / this.sizes.height,
            0.1,
            100
        )
        this.camera.position.x = 10
        this.camera.position.y = 10
        this.camera.position.z = 10
        this.scene.add(this.camera)
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
        })
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
        this.clock = new THREE.Clock()
        this.controls = new OrbitControls(this.camera, this.canvas)

        this.onResize()
        this.addListeners()
    }
    addListeners() {
        window.addEventListener('resize', this.onResize.bind(this))
    }
    removeListeners() {
        window.removeEventListener('resize', this.onResize.bind(this))
    }
    updateSizes() {
        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight,
        }
    }
    onResize() {
        this.updateSizes()
        // Update camera
        this.camera.aspect = this.sizes.width / this.sizes.height
        this.camera.updateProjectionMatrix()

        // Update renderer
        this.renderer.setSize(this.sizes.width, this.sizes.height)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }
    tick() {
        this.elapsedTime = this.clock.getElapsedTime()
        this.controls.update()
        this.renderer.render(this.scene, this.camera)

        window.requestAnimationFrame(this.tick.bind(this))
    }
    start() {
        this.initialized = true
        this.tick()
    }
}
