import Scene from './Scene'
import * as THREE from 'three'

import {
    CSS2DRenderer,
    CSS2DObject,
} from 'three/examples/jsm/renderers/CSS2DRenderer.js'

import Dual from './Dual'
import Tiles from './Tiles'

export default class Test extends Scene {
    cubes: THREE.Mesh[] = []
    duals: THREE.Mesh[] = []
    labels: any[] = []
    ambientLight?: THREE.AmbientLight
    directLight?: THREE.DirectionalLight

    group = new THREE.Group()
    cubeGeometry = new THREE.BoxBufferGeometry(1, 1, 1)
    cubeMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        wireframe: true,
    })
    dualMaterial = new THREE.MeshStandardMaterial({
        color: 0xff33ff,
        wireframe: true,
    })
    raycaster = new THREE.Raycaster()
    mouse: THREE.Vector2 = new THREE.Vector2()
    lastTouch = -Infinity
    dual = new Dual(new THREE.Vector3(3, 3, 3))
    tiles = new Tiles()
    labelRenderer = new CSS2DRenderer()

    constructor(canvas: HTMLCanvasElement) {
        super(canvas)
        this.raycaster.layers.set(1)
        this.scene.add(this.group)
        this.addAmbientLight()
        this.addDirectLight()
        this.addAxisHelper()

        // labels
        this.labelRenderer.setSize(this.sizes.width, this.sizes.height)
        this.labelRenderer.domElement.style.position = 'absolute'
        this.labelRenderer.domElement.style.top = '0'
        this.labelRenderer.domElement.style.pointerEvents = 'none'
        document.body.appendChild(this.labelRenderer.domElement)
    }
    async loadTiles() {
        return this.tiles.load()
    }

    addCube(position = new THREE.Vector3(0, 0, 0)) {
        const mainIndex = this.dual.positionToIndex(position)
        if (mainIndex === null) return

        const cube = new THREE.Mesh(this.cubeGeometry, this.cubeMaterial)
        position && cube.position.copy(position)
        cube.layers.enable(1)
        this.cubes.push(cube)
        this.group.add(cube)
        this.dual.main[mainIndex].value = 1
        this.updateDual()
    }
    addAmbientLight() {
        this.ambientLight = new THREE.AmbientLight(0x404040)
        this.scene.add(this.ambientLight)
    }
    addDirectLight() {
        this.directLight = new THREE.DirectionalLight(0xffffff, 1)
        this.directLight.position.set(5, 15, 5)
        this.scene.add(this.directLight)
    }
    addAxisHelper() {
        const axisHelper = new THREE.AxesHelper(1)
        this.scene.add(axisHelper)
    }
    getIntersects(): THREE.Intersection[] {
        this.raycaster.setFromCamera(this.mouse, this.camera)
        return this.raycaster.intersectObjects(this.cubes)
    }

    onMouseMove(event: MouseEvent) {
        this.mouse.x = (event.clientX / this.canvas.clientWidth) * 2 - 1
        this.mouse.y = -(event.clientY / this.canvas.clientHeight) * 2 + 1
    }
    onTouchStart(event: TouchEvent): void {
        this.lastTouch = event.timeStamp
    }
    onTouchEnd(event: TouchEvent): void {
        const longpress = event.timeStamp - this.lastTouch > 500
        console.log(longpress, event.timeStamp, this.lastTouch)

        const touch = ((event.changedTouches || [])[0] || {}) as Touch

        this.mouse.x = (touch.clientX / this.canvas.clientWidth) * 2 - 1
        this.mouse.y = -(touch.clientY / this.canvas.clientHeight) * 2 + 1

        if (longpress) {
            this.handleRemove()
        } else {
            this.handleAdd()
        }
    }
    onClick(event: MouseEvent): void {
        this.handleAdd()
    }
    onRightClick(event: MouseEvent): void {
        event.preventDefault()
        this.handleRemove()
    }
    handleAdd() {
        const intersects = this.getIntersects()
        if (intersects.length > 0) {
            const intersect = intersects[0] as THREE.Intersection
            const object = intersect.object as THREE.Mesh
            // index of intersected object
            const position = object.position.clone()
            const normal = intersect?.face?.normal.clone() ?? null
            if (!normal) return
            position.add(normal)
            this.addCube(position)
        }
    }
    handleRemove() {
        const intersects = this.getIntersects()
        if (intersects.length > 0) {
            const intersect = intersects[0] as THREE.Intersection
            const object = intersect.object as THREE.Mesh
            const index = this.cubes.indexOf(object)

            const mainIndex = this.dual.positionToIndex(object.position)
            if (mainIndex === null) return
            if (index > -1) {
                this.dual.main[mainIndex].value = 0
                this.cubes.splice(index, 1)
                this.group.remove(object)
            }
        }
        this.updateDual()
    }
    addDualCube(position: THREE.Vector3, value: number) {
        if (value === 0) return
        const mesh = this.tiles.lib.get(`Cube${value}`)
        // const dualCube = new THREE.Mesh(this.cubeGeometry, this.dualMaterial)

        if (!mesh) return
        const dualCube = mesh.clone()
        position && dualCube.position.copy(position).subScalar(0.5)

        this.duals.push(dualCube)
        this.group.add(dualCube)
    }
    updateDual(): void {
        this.duals.forEach((dualCube, index) => {
            this.group.remove(dualCube)
        })
        this.duals = []
        this.dual.calculateDual()
        this.dual.secondary.forEach((dual, index) => {
            const position = dual.position
            this.addDualCube(position, dual.value)
        })
    }
    addListeners(): void {
        super.addListeners()
        window.addEventListener('mousemove', this.onMouseMove.bind(this))
        window.addEventListener('click', this.onClick.bind(this))
        //capture right click
        window.addEventListener('contextmenu', this.onRightClick.bind(this))
        window.addEventListener('touchend', this.onTouchEnd.bind(this))
        window.addEventListener('touchstart', this.onTouchStart.bind(this))
    }
    tick(): void {
        super.tick()
        if (this.labelRenderer) {
            this.labelRenderer.render(this.scene, this.camera)
        }
    }
    addLabels() {
        this.dual.secondary.forEach((cell, index) => {
            const element = document.createElement('div')
            const value = cell.value
            const position = cell.position
            const label = new CSS2DObject(element)
            element.innerText = `${value}`
            element.classList.add('label')
            element.dataset.value = `${value}`
            label.position.copy(position)
            label.visible = true
            this.labels.push(label)
            this.group.add(label)
        })
    }
    center(): void {
        new THREE.Box3()
            .setFromObject(this.group)
            .getCenter(this.group.position)
            .multiplyScalar(-1)
    }
}
