import Scene from './Scene'
import * as THREE from 'three'
import _ from 'lodash'

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
    raycasterHover = new THREE.Raycaster()
    mouse: THREE.Vector2 = new THREE.Vector2()
    lastTouch = -Infinity
    dual: Dual
    tiles = new Tiles()
    labelRenderer = new CSS2DRenderer()
    showHitBoxes = false
    onTick?: () => void
    disableEdit = false
    swapControls = false
    hover: string
    queue: THREE.Vector3[] = []
    queueStep = 100

    constructor(
        canvas: HTMLCanvasElement,
        dualSize = new THREE.Vector3(10, 10, 10)
    ) {
        super(canvas)
        this.dual = new Dual(dualSize)
        this.raycaster.layers.set(1)
        this.raycasterHover.layers.set(0)
        this.scene.add(this.group)
        this.addAmbientLight()
        this.addDirectLight()
        // this.addAxisHelper()

        // labels
        this.labelRenderer.setSize(this.sizes.width, this.sizes.height)
        this.labelRenderer.domElement.style.position = 'absolute'
        this.labelRenderer.domElement.style.top = '0'
        this.labelRenderer.domElement.style.pointerEvents = 'none'
        document.body.appendChild(this.labelRenderer.domElement)

        let color = new THREE.Color(0xffffff)
        this.gui.add(this, 'save')
        this.gui.add(this, 'clear')
        this.gui.add(this, 'showHitBoxes').onChange(() => {
            this.cubes.forEach((cube) => {
                cube.visible = this.showHitBoxes
            })
        })
        this.gui.add(this.tiles.material, 'wireframe').onChange(() => {
            this.tiles.material.needsUpdate = true
        })
        if ((this.tiles.material as any).color) {
            const mat = this.tiles.material as any
            this.gui.add(mat, 'vertexColors').onChange(() => {
                if (mat.vertexColors) {
                    color = mat.color.clone()
                    mat.color = new THREE.Color(0xffffff)
                } else {
                    mat.color = color
                }
                mat.needsUpdate = true
            })
            this.gui.addColor(mat, 'color').onChange(() => {
                // mat.vertexColors = false
                mat.needsUpdate = true
            })
        } else {
            const mat = this.tiles.material as any
            this.gui
                .add(mat.noiseScale, 'value')
                .min(0.001)
                .max(10.0)
                .step(0.001)
            this.gui.add(mat.noiseFactor, 'value').min(0.0).max(2.0).step(0.01)
            // .onChange(() => {
            //     this.tiles.material.needsUpdate = true
            // })
        }
        this.gui.add(this, 'disableEdit')
        this.gui.add(this, 'swapControls')
        this.hover = ''
        this.gui.add(this, 'hover').listen() //.disable()
        this.gui.add(this, 'updateDual')
    }
    async loadTiles() {
        return this.tiles.load()
    }

    addCube(position = new THREE.Vector3(0, 0, 0), skipDual = false) {
        const mainIndex = this.dual.positionToIndex(position)
        if (mainIndex === null) return

        const cube = new THREE.Mesh(this.cubeGeometry, this.cubeMaterial)
        position && cube.position.copy(position)
        cube.layers.enable(1)
        cube.visible = this.showHitBoxes
        this.cubes.push(cube)
        this.group.add(cube)
        if (skipDual) return
        this.dual.main[mainIndex].value = 1
        this.updateDual()
    }
    removeCube(position: THREE.Vector3): void {
        const mainIndex = this.dual.positionToIndex(position)
        if (mainIndex === null) return
        const index = this.cubes.findIndex((cube) => {
            return cube.position.equals(position)
        })
        if (index > -1) {
            this.dual.main[mainIndex].value = 0
            this.group.remove(this.cubes[index])
            this.cubes.splice(index, 1)
        }
    }
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
    addAxisHelper() {
        const axisHelper = new THREE.AxesHelper(1)
        this.scene.add(axisHelper)
    }
    getIntersects(): THREE.Intersection[] {
        this.raycaster.setFromCamera(this.mouse, this.camera)
        return this.raycaster.intersectObjects(this.cubes)
    }
    getHover(): THREE.Intersection[] {
        this.raycasterHover.setFromCamera(this.mouse, this.camera)
        return this.raycasterHover.intersectObjects(this.duals)
    }

    onMouseMove(event: MouseEvent) {
        this.mouse.x = (event.clientX / this.canvas.clientWidth) * 2 - 1
        this.mouse.y = -(event.clientY / this.canvas.clientHeight) * 2 + 1
        this.handleHoverThrottled()
    }
    onTouchStart(event: TouchEvent): void {
        this.lastTouch = event.timeStamp
    }
    onTouchEnd(event: TouchEvent): void {
        if (this.disableEdit) return
        const longpress = event.timeStamp - this.lastTouch > 500

        const touch = ((event.changedTouches || [])[0] || {}) as Touch

        this.mouse.x = (touch.clientX / this.canvas.clientWidth) * 2 - 1
        this.mouse.y = -(touch.clientY / this.canvas.clientHeight) * 2 + 1
        if (!this.swapControls) {
            if (longpress) {
                this.handleRemove()
            } else {
                this.handleAdd()
            }
        } else {
            if (longpress) {
                this.handleAdd()
            } else {
                this.handleRemove()
            }
        }
    }
    onClick(event: MouseEvent): void {
        if (this.disableEdit) return
        if (!this.swapControls) {
            this.handleAdd()
        } else {
            this.handleRemove()
        }
    }
    onRightClick(event: MouseEvent): void {
        if (this.disableEdit) return
        event.preventDefault()
        if (!this.swapControls) {
            this.handleRemove()
        } else {
            this.handleAdd()
        }
    }
    handleHoverThrottled = _.throttle(() => {
        const intersects = this.getHover()
        this.hover = intersects.length > 0 ? intersects[0].object.name : ''
    }, 300)
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
        if (this.queue.length) {
            for (let i = 0; i < this.queueStep && i < this.queue.length; i++) {
                this.addCube(this.queue[i], true)
            }
            this.queue.splice(0, this.queueStep)
            if (this.queue.length === 0) {
                this.updateDual()
            }
        }
        this.onTick && this.onTick()
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
    export(): string {
        const mapData = (cell: { value: number }) => cell.value
        const main = this.dual.main.map(mapData)
        const secondary = this.dual.secondary.map(mapData)
        const camera = this.camera.position.toArray()
        const size = this.dual.mainSize.x
        return JSON.stringify({ main, secondary, camera, size })
    }
    import(data: string): void {
        if (this.initialized) return
        const { main, secondary, camera } = JSON.parse(data)
        const mapData =
            (main = true) =>
            (value: number, index: number) => {
                const collection = main ? this.dual.main : this.dual.secondary
                const cell = collection[index]
                cell.value = value
                return cell
            }
        this.dual.main = main.map(mapData(true))
        this.dual.secondary = secondary.map(mapData(false))
        this.camera.position.fromArray(camera)
        this.cubes.forEach((cube) => {
            this.group.remove(cube)
        })
        this.duals.forEach((dualCube) => {
            this.group.remove(dualCube)
        })
        this.cubes = []
        this.duals = []
        this.dual.main.forEach((cell) => {
            if (cell.value > 0.5) {
                this.queue.push(cell.position)
            }
        })
    }
    save() {
        localStorage.setItem('scene', this.export())
    }
    clear() {
        const agree = confirm('Are you sure you want to clear the scene?')
        if (!agree) return
        localStorage.removeItem('scene')
        const mapData = ({
            value,
            position,
        }: {
            value: number
            position: {
                x: number
                y: number
                z: number
            }
        }) => ({
            value: 0,
            position: new THREE.Vector3(position.x, position.y, position.z),
        })
        this.dual.main = this.dual.main.map(mapData)
        this.dual.secondary = this.dual.secondary.map(mapData)
        this.cubes.forEach((cube) => {
            this.group.remove(cube)
        })
        this.duals.forEach((dual) => {
            this.group.remove(dual)
        })
        this.cubes = []
        this.duals = []

        this.addCube(new THREE.Vector3(15, 15, 15))
    }
    resize(newSize: THREE.Vector3) {
        this.dual.resize(newSize)
    }
}
