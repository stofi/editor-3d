import * as THREE from 'three'
import _ from 'lodash'
import SimplexNoise from 'simplex-noise'

import BaseScene from '../lib/BaseScene'

import Dual from '../lib/Dual'
import Tiles from '../lib/Tiles'

interface EditorParams {
    size: number
    noiseScale: number
    noiseScale3: THREE.Vector3
}

export default class Basic extends BaseScene {
    canvas: HTMLCanvasElement
    camera: THREE.Camera
    cubes: THREE.Mesh[] = []
    duals: THREE.Mesh[] = []
    showHitBoxes = false
    disableEdit = false
    swapControls = false

    cubeGeometry = new THREE.BoxBufferGeometry(1, 1, 1)
    cubeMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        wireframe: true,
    })

    cubeRaycast = new THREE.Raycaster()
    dualRaycast = new THREE.Raycaster()
    mouse: THREE.Vector2 = new THREE.Vector2()
    lastTouch = -Infinity
    hover = ''

    dual: Dual
    tiles = new Tiles()

    queue: THREE.Vector3[] = []
    queueStep = 100

    onTick?: () => void

    params: EditorParams

    constructor(
        params: Partial<EditorParams> = {},
        canvas: HTMLCanvasElement,
        camera: THREE.Camera
    ) {
        super()
        this.params = {
            size: 10,
            noiseScale: 0.01,
            noiseScale3: new THREE.Vector3(0.01, 0.01, 0.01),
            ...params,
        }
        this.camera = camera
        this.canvas = canvas
        this.dual = new Dual(
            new THREE.Vector3(
                this.params.size,
                this.params.size,
                this.params.size
            )
        )
    }
    // Super overrides:
    tick(): void {
        super.tick()

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

    async start() {
        this.addListeners()
        await this.loadTiles()
        this.addGui()
        super.start()
    }
    destroy() {
        super.destroy()
        this.removeListeners()
    }

    // Window events
    addListeners(): void {
        window.addEventListener('mousemove', this.onMouseMove.bind(this))
        window.addEventListener('click', this.onClick.bind(this))
        //capture right click
        window.addEventListener('contextmenu', this.onRightClick.bind(this))
        window.addEventListener('touchend', this.onTouchEnd.bind(this))
        window.addEventListener('touchstart', this.onTouchStart.bind(this))
    }
    removeListeners(): void {
        window.removeEventListener('mousemove', this.onMouseMove.bind(this))
        window.removeEventListener('click', this.onClick.bind(this))
        //capture right click
        window.removeEventListener('contextmenu', this.onRightClick.bind(this))
        window.removeEventListener('touchend', this.onTouchEnd.bind(this))
        window.removeEventListener('touchstart', this.onTouchStart.bind(this))
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
    // Methods
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
                this.scene.remove(object)
            }
        }
        this.updateDual()
    }
    getIntersects(): THREE.Intersection[] {
        this.cubeRaycast.setFromCamera(this.mouse, this.camera)
        return this.cubeRaycast.intersectObjects(this.cubes)
    }
    getHover(): THREE.Intersection[] {
        this.dualRaycast.setFromCamera(this.mouse, this.camera)
        return this.dualRaycast.intersectObjects(this.duals)
    }
    updateDual(): void {
        this.duals.forEach((dualCube, index) => {
            this.scene.remove(dualCube)
        })
        this.duals = []
        this.dual.calculateDual()
        this.dual.secondary.forEach((dual, index) => {
            const position = dual.position
            this.addDualCube(position, dual.value)
        })
    }
    async loadTiles() {
        return this.tiles.load()
    }
    generate() {
        const local = this.showHitBoxes
        this.showHitBoxes = true
        this.dual.resize(
            new THREE.Vector3(
                this.params.size,
                this.params.size,
                this.params.size
            )
        )

        const simplex = new SimplexNoise()
        let i = 0
        const batch = Math.min(this.params.size ** 2, 150)
        console.time('loop')

        this.cubes.forEach((cube) => {
            this.scene.remove(cube)
        })
        this.duals.forEach((dualCube) => {
            this.scene.remove(dualCube)
        })
        this.cubes = []
        this.duals = []
        this.dual.main.forEach((cell) => {
            const x = cell.position.x
            const y = cell.position.y
            const z = cell.position.z
            const scale = this.params.noiseScale ?? 0.1
            const noise = simplex.noise3D(
                x * scale * this.params.noiseScale3.x,
                y * scale * this.params.noiseScale3.y,
                z * scale * this.params.noiseScale3.z
            )
            cell.value = noise
        })
        this.onTick = () => {
            // loop end
            if (i >= this.dual.main.length) {
                console.timeEnd('loop')
                this.updateDual()
                this.onTick = () => {
                    this.cubes.forEach((cube) => {
                        cube.visible = local
                        this.showHitBoxes = local
                    })
                    this.onTick = () => null
                }
                return
            }
            for (let j = 0; j < batch && i + j < this.dual.main.length; j++) {
                const batchIndex = i + j
                if (!this.dual.main[batchIndex]) continue

                const noise = this.dual.main[batchIndex].value
                if (noise > 0.5) {
                    this.addCube(this.dual.main[batchIndex].position, true)

                    this.dual.main[batchIndex].value = 1
                } else {
                    this.removeCube(this.dual.main[batchIndex].position)
                }
            }
            i += batch
        }
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
            this.scene.remove(cube)
        })
        this.duals.forEach((dualCube) => {
            this.scene.remove(dualCube)
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
            this.scene.remove(cube)
        })
        this.duals.forEach((dual) => {
            this.scene.remove(dual)
        })
        this.cubes = []
        this.duals = []

        this.addCube(new THREE.Vector3(15, 15, 15))
    }

    // Objects
    addCube(position = new THREE.Vector3(0, 0, 0), skipDual = false) {
        const mainIndex = this.dual.positionToIndex(position)
        if (mainIndex === null) return

        const cube = new THREE.Mesh(this.cubeGeometry, this.cubeMaterial)
        position && cube.position.copy(position)
        cube.layers.enable(1)
        cube.visible = this.showHitBoxes
        this.cubes.push(cube)
        this.scene.add(cube)
        if (skipDual) return
        this.dual.main[mainIndex].value = 1
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
        this.scene.add(dualCube)
    }
    removeCube(position: THREE.Vector3): void {
        const mainIndex = this.dual.positionToIndex(position)
        if (mainIndex === null) return
        const index = this.cubes.findIndex((cube) => {
            return cube.position.equals(position)
        })
        if (index > -1) {
            this.dual.main[mainIndex].value = 0
            this.scene.remove(this.cubes[index])
            this.cubes.splice(index, 1)
        }
    }
    addGui(): void {
        if (!this.gui) {
            throw new Error('No GUI')
        }
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

            this.gui
                .add(mat.userData.noiseScale, 'value')
                .min(0.1)
                .max(1.0)
                .step(0.001)
            this.gui
                .add(mat.userData.noiseFactor, 'value')
                .min(0.0)
                .max(2.0)
                .step(0.01)
            // random color
            const randomColor1 = new THREE.Color(0xffffff)
            randomColor1.setHSL(
                Math.random(),
                Math.random() * 0.5 + 0.5,
                Math.random() * 0.5 + 0.5
            )
            const randomColor2 = new THREE.Color(0xffffff)
            randomColor2.setHSL(
                Math.random(),
                Math.random() * 0.5 + 0.5,
                Math.random() * 0.5 + 0.5
            )
            mat.userData.color1.value = randomColor1
            mat.userData.color2.value = randomColor2
            this.gui.addColor(mat.userData.color1, 'value')
            this.gui.addColor(mat.userData.color2, 'value')
        }
        this.gui.add(this, 'disableEdit')
        this.gui.add(this, 'swapControls')
        this.gui.add(this, 'hover').listen() //.disable()
        this.gui.add(this, 'generate')
        this.gui.add(this.params, 'size', 1, 20).step(1)
        this.gui.add(this.params, 'noiseScale', 0, 1).step(0.01)
        this.gui.add(this.params.noiseScale3, 'x', 0, 1).step(0.01)
        this.gui.add(this.params.noiseScale3, 'y', 0, 1).step(0.01)
        this.gui.add(this.params.noiseScale3, 'z', 0, 1).step(0.01)
    }
}