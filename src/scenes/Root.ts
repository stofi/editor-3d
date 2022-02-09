import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'

import BaseScene from '../lib/BaseScene'

export default class extends BaseScene {
    gui: dat.GUI
    canvas: HTMLCanvasElement
    scene: THREE.Scene
    sizes: {
        width: number
        height: number
    }
    renderer: THREE.WebGLRenderer
    clock?: THREE.Clock
    elapsedTime = 0
    camera?: THREE.PerspectiveCamera
    controls?: OrbitControls

    ambientLight?: THREE.AmbientLight
    directLight?: THREE.DirectionalLight

    constructor(canvas: HTMLCanvasElement) {
        super()
        this.gui = new dat.GUI()
        this.canvas = canvas
        this.scene = new THREE.Scene()

        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight,
        }

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
        })
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

        this.onResize()
        this.addListeners()
    }
    // Super overrides:
    tick() {
        if (!this.clock) {
            throw new Error('Root is not initialized')
        }
        if (!this.camera) {
            throw new Error('Root has no camera')
        }

        this.elapsedTime = this.clock.getElapsedTime()
        this.renderer.render(this.scene, this.camera)

        super.tick()

        window.requestAnimationFrame(this.tick.bind(this))
    }
    start() {
        this.clock = new THREE.Clock()

        this.addListeners()
        this.addCamera()
        this.addAmbientLight()
        this.addDirectLight()
        super.start()
        this.tick()
        return
    }
    destroy() {
        super.destroy()
        this.removeListeners()
        this.gui.destroy()
        this.renderer.dispose()
    }

    // Window events
    addListeners() {
        window.addEventListener('resize', this.onResize.bind(this))
    }
    removeListeners() {
        window.removeEventListener('resize', this.onResize.bind(this))
    }
    onResize() {
        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight,
        }

        if (this.camera) {
            this.camera.aspect = this.sizes.width / this.sizes.height
            this.camera.updateProjectionMatrix()
        }

        // Update renderer
        this.renderer.setSize(this.sizes.width, this.sizes.height)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }

    // Objects
    addAmbientLight() {
        this.ambientLight = new THREE.AmbientLight(0x404040)
        this.scene.add(this.ambientLight)
    }
    addDirectLight() {
        this.directLight = new THREE.DirectionalLight(0xffffff, 1)
        this.directLight.castShadow = true
        this.directLight.shadow.mapSize.width = 2048
        this.directLight.shadow.mapSize.height = 2048
        this.directLight.shadow.camera.near = 0.5
        this.directLight.shadow.camera.far = 30
        this.directLight.shadow.camera.left = -15
        this.directLight.shadow.camera.right = 15
        this.directLight.shadow.camera.top = 15
        this.directLight.shadow.camera.bottom = -15
        this.directLight.position.set(20, 20, 20)
        this.scene.add(this.directLight)
    }

    addCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.sizes.width / this.sizes.height,
            0.1,
            100
        )
        this.camera.position.x = 30
        this.camera.position.y = 30
        this.camera.position.z = 30
        this.controls = new OrbitControls(this.camera, this.canvas)
        this.scene.add(this.camera)
    }
}