import * as THREE from 'three'
import _ from 'lodash'
import SimplexNoise from 'simplex-noise'
import BaseScene from '../lib/BaseScene'

import Dual from '../lib/Dual'
import Tiles from '../lib/Tiles'

interface EditorParams {
    size: THREE.Vector3
    noiseScale: number
    noiseScale3: THREE.Vector3
}

type Tool = 'add' | 'remove' | 'inspect' | 'object'

export default class Basic extends BaseScene {
    canvas: HTMLCanvasElement
    camera: THREE.Camera
    cubes: THREE.Mesh[] = []
    duals: THREE.Mesh[] = []
    objects: THREE.Mesh[] = []
    hoverCube?: THREE.Mesh
    debugCubes: THREE.Mesh[] = []
    showHitBoxes = false
    disableEdit = false
    swapControls = false

    cubeGeometry = new THREE.BoxBufferGeometry(1, 1, 1)
    cubeMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        wireframe: true,
    })
    hoverCubeMaterial = new THREE.MeshBasicMaterial({
        color: 0xffbbbb,
        transparent: true,
        opacity: 0.2,
    })
    objectMaterial = new THREE.MeshStandardMaterial({
        color: 0xffbbbb,
    })

    cubeRaycast = new THREE.Raycaster()
    dualRaycast = new THREE.Raycaster()
    mouse: THREE.Vector2 = new THREE.Vector2()
    lastTouch = -Infinity
    hover = ''
    line = new THREE.Line()

    dual: Dual
    tiles = new Tiles()

    onTick?: () => void

    params: EditorParams
    tool: Tool = 'inspect'

    constructor(
        params: Partial<EditorParams> = {},
        canvas: HTMLCanvasElement,
        camera: THREE.Camera
    ) {
        super()
        this.params = {
            size: new THREE.Vector3(10, 10, 10),
            noiseScale: 0.01,
            noiseScale3: new THREE.Vector3(0.01, 0.01, 0.01),
            ...params,
        }
        this.camera = camera
        this.canvas = canvas
        this.dual = new Dual(this.params.size.clone())
        this.scene.scale.y = 1
        this.scene.position.set(
            -this.params.size.x / 2,
            -this.params.size.y / 2,
            -this.params.size.z / 2
        )
    }
    // Super overrides:
    tick(): void {
        super.tick()

        // const cubesToUpdate = this.dual.getMainQueue()
        this.updateDual()
        this.updateCubes()

        this.onTick && this.onTick()
    }

    async start() {
        this.addListeners()
        await this.loadTiles()
        this.addHoverCube()
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
        const targetNotCanvas = (event?.target as HTMLElement) !== this.canvas

        const longpress = event.timeStamp - this.lastTouch > 500

        const touch = ((event.changedTouches || [])[0] || {}) as Touch

        this.mouse.x = (touch.clientX / this.canvas.clientWidth) * 2 - 1
        this.mouse.y = -(touch.clientY / this.canvas.clientHeight) * 2 + 1
        if (targetNotCanvas) return

        switch (this.tool) {
            case 'add':
                !this.disableEdit && this.handleAdd()
                break
            case 'remove':
                !this.disableEdit && this.handleRemove()
                break
            case 'inspect':
                this.printRelations()
                break
            case 'object':
                !this.disableEdit && this.handleObject()
                break
        }
    }
    onClick(event: MouseEvent): void {
        const targetNotCanvas = (event?.target as HTMLElement) !== this.canvas
        if (targetNotCanvas) return

        switch (this.tool) {
            case 'add':
                !this.disableEdit && this.handleAdd()
                break
            case 'remove':
                !this.disableEdit && this.handleRemove()
                break
            case 'inspect':
                this.printRelations()
                break
            case 'object':
                !this.disableEdit && this.handleObject()
                break
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
    handleHoverThrottled = _.throttle(
        () => {
            const intersects = this.getHover()
            this.hover = intersects.length > 0 ? intersects[0].object.name : ''
        },
        300,
        { leading: true, trailing: true }
    )
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
    handleObject() {
        const intersects = this.getIntersects()
        if (intersects.length > 0) {
            const intersect = intersects[0] as THREE.Intersection
            const object = intersect.object as THREE.Mesh
            // index of intersected object
            const position = object.position.clone()
            const normal = intersect?.face?.normal.clone() ?? null
            if (!normal) return
            position.add(normal)
            this.addObject(position)
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
                const cell = this.dual.main[mainIndex]
                this.dual.replaceCell({
                    position: cell.position,
                    value: 0,
                    locked: false,
                })
            }
        }
    }
    printRelations() {
        this.debugCubes.forEach((cube) => {
            this.scene.remove(cube)
        })
        const intersects = this.getIntersects()
        if (intersects.length > 0) {
            const intersect = intersects[0] as THREE.Intersection
            const object = intersect.object as THREE.Mesh
            const index = this.cubes.indexOf(object)

            const mainIndex = this.dual.positionToIndex(object.position)
            if (mainIndex === null) return
            const cell = this.dual.main[mainIndex]
            const relations = this.dual.primaryToSecondaryMap.get(
                `${cell.position.x},${cell.position.y},${cell.position.z}`
            )
            const positions = relations?.map((relation) => {
                if (relation === null) return
                const position = this.dual.secondary[relation].position
                return position
            })
            if (positions) {
                positions.forEach((position) => {
                    if (position === undefined) return
                    const c = new THREE.Mesh(
                        this.cubeGeometry,
                        this.hoverCubeMaterial
                    )
                    c.position.copy(position).subScalar(0.5)
                    this.debugCubes.push(c)
                    this.scene.add(c)
                })
            }
        }
    }
    getIntersects(): THREE.Intersection[] {
        this.cubeRaycast.setFromCamera(this.mouse, this.camera)
        return this.cubeRaycast.intersectObjects(this.cubes)
    }
    getHover(): THREE.Intersection[] {
        this.dualRaycast.setFromCamera(this.mouse, this.camera)
        const result = this.dualRaycast.intersectObjects(this.duals)
        const cubes = this.getIntersects()

        if (
            this.hoverCube &&
            cubes.length > 0 &&
            cubes[0].object.position &&
            cubes[0].face
        ) {
            const pos = cubes[0].object.position.clone()

            if (this.tool !== 'remove' && this.tool !== 'inspect') {
                pos.add(cubes[0].face.normal)
            }

            this.hoverCube.position.copy(pos)
            !this.disableEdit && (this.hoverCube.visible = true)
        } else if (this.hoverCube) {
            this.hoverCube.visible = false
        }

        return result
    }
    updateDual(): void {
        const dualCellsToUpdate = this.dual.getSecondaryQueue()
        if (dualCellsToUpdate.length === 0) return
        const dualPositionsToUpdate = dualCellsToUpdate.map(({ position }) =>
            position.clone().subScalar(0.5)
        )
        const dualsToUpdate = this.duals.filter((dual) =>
            dualPositionsToUpdate.some((position) =>
                dual.position.equals(position)
            )
        )

        dualsToUpdate.forEach((dualCube) => {
            dualCube.geometry.dispose()
            this.scene.remove(dualCube)
            this.duals.splice(this.duals.indexOf(dualCube), 1)
        })
        dualCellsToUpdate.forEach((dual) => {
            const position = dual.position
            this.addDualCube(position, dual.value)
        })
        this.dual.clearSecondaryQueue()
    }
    updateCubes(): void {
        const cubesCellsToUpdate = this.dual.getMainQueue()

        if (cubesCellsToUpdate.length === 0) return
        const cubePositionsToUpdate = cubesCellsToUpdate.map(({ position }) =>
            position.clone()
        )
        const cubesToUpdate = this.cubes.filter((dual) =>
            cubePositionsToUpdate.some((position) =>
                dual.position.equals(position)
            )
        )
        const objectsToUpdate = this.objects.filter((dual) =>
            cubePositionsToUpdate.some((position) =>
                dual.position.equals(position)
            )
        )

        cubesToUpdate.forEach((cube) => {
            cube.geometry.dispose()
            this.scene.remove(cube)
            this.cubes.splice(this.cubes.indexOf(cube), 1)
        })
        objectsToUpdate.forEach((object) => {
            object.geometry.dispose()
            this.scene.remove(object)
            this.objects.splice(this.objects.indexOf(object), 1)
        })
        cubesCellsToUpdate.forEach((cubeCell) => {
            if (cubeCell.value === 0 && !cubeCell.metadata) return
            if (cubeCell.metadata && cubeCell.metadata.type === 'object') {
                const obj = new THREE.Mesh(
                    this.cubeGeometry,
                    this.objectMaterial
                )
                obj.position.copy(cubeCell.position.clone())
                this.objects.push(obj)
                this.scene.add(obj)
            }

            const position = cubeCell.position
            const cube = new THREE.Mesh(this.cubeGeometry, this.cubeMaterial)
            position && cube.position.copy(position)
            cube.layers.enable(1)
            cube.visible = this.showHitBoxes
            this.cubes.push(cube)
            this.scene.add(cube)
        })
        this.dual.clearMainQueue()
    }
    async loadTiles() {
        await this.tiles.load()
    }
    generate() {
        this.dual.resize(this.params.size.clone())
        this.scene.position.set(
            -this.params.size.x / 2,
            -this.params.size.y / 2,
            -this.params.size.z / 2
        )

        const simplex = new SimplexNoise()
        const batch = Math.min(this.params.size.x, 150)

        this.cubes.forEach((cube) => {
            cube.geometry.dispose()
            this.scene.remove(cube)
        })
        this.objects.forEach((object) => {
            object.geometry.dispose()
            this.scene.remove(object)
        })
        this.duals.forEach((dualCube) => {
            dualCube.geometry.dispose()
            this.scene.remove(dualCube)
        })
        this.cubes = []
        this.objects = []
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

            cell.value = noise > 0 ? 1 : 0
        })
        let i = 0
        let batchIndex = 0
        this.onTick = () => {
            // loop end
            if (i >= this.dual.main.length) {
                this.onTick = undefined
                return
            }
            for (let j = 0; j < batch && i + j < this.dual.main.length; j++) {
                batchIndex = i + j
                if (!this.dual.main[batchIndex]) continue

                const noise = this.dual.main[batchIndex].value
                if (noise > 0.5) {
                    this.addCube(this.dual.main[batchIndex].position)
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
        const size = this.dual.mainSize.toArray()
        return JSON.stringify({ main, secondary, camera, size })
    }
    import(data: string): void {
        // if (this.initialized) return
        const { main, secondary, camera, size } = JSON.parse(data)
        this.params.size.fromArray(size)
        this.dual.resize(this.params.size)
        this.scene.position.set(
            -this.params.size.x / 2,
            -this.params.size.y / 2,
            -this.params.size.z / 2
        )
        const mapData =
            (main = true) =>
            (value: number, index: number) => {
                const collection = main ? this.dual.main : this.dual.secondary
                const cell = collection[index]
                cell.value = value
                this.dual.replaceCell(cell)
                // return cell
            }
        main.forEach(mapData(true))
        // this.dual.secondary = secondary.map(mapData(false))
        // this.camera.position.fromArray(camera)
        this.cubes.forEach((cube) => {
            this.scene.remove(cube)
        })
        this.objects.forEach((object) => {
            this.scene.remove(object)
        })
        this.duals.forEach((dualCube) => {
            this.scene.remove(dualCube)
        })
        this.cubes = []
        this.duals = []
        this.objects = []
    }
    save() {
        localStorage.setItem('scene', this.export())
    }
    load() {
        const data = localStorage.getItem('scene')
        if (data) {
            this.import(data)
        }
    }
    clear() {
        const agree = confirm('Are you sure you want to clear the scene?')
        if (!agree) return
        const mapData = ({
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
            locked: false,
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
    addCube(position = new THREE.Vector3(0, 0, 0)) {
        !this.disableEdit && this.hoverCube && (this.hoverCube.visible = false)
        // debugger
        const mainIndex = this.dual.positionToIndex(position)
        if (mainIndex === null) return

        this.dual.replaceCell({
            position,
            value: 1,
            locked: false,
        })
    }
    addDualCube(position: THREE.Vector3, value: number) {
        if (value === 0) return
        const mesh = this.tiles.lib.get(`Cube${value}`)

        if (!mesh) return
        const dualCube = mesh.clone()
        position && dualCube.position.copy(position).subScalar(0.5)

        this.duals.push(dualCube)
        this.scene.add(dualCube)
    }
    addHoverCube() {
        if (this.hoverCube) return
        this.hoverCube = new THREE.Mesh(
            this.cubeGeometry,
            this.hoverCubeMaterial
        )
        this.hoverCube.scale.set(1.1, 1.1, 1.1)
        this.hoverCube.visible = false
        this.scene.add(this.hoverCube)
    }
    removeCube(position: THREE.Vector3): void {
        !this.disableEdit && this.hoverCube && (this.hoverCube.visible = false)
        const mainIndex = this.dual.positionToIndex(position)
        if (mainIndex === null) return
        const index = this.cubes.findIndex((cube) => {
            return cube.position.equals(position)
        })
        if (index > -1) {
            this.dual.replaceCell({
                position,
                value: 0,
                locked: false,
            })
            // this.scene.remove(this.cubes[index])
            // this.cubes.splice(index, 1)
        }
    }
    addGui(): void {
        if (!this.gui) {
            throw new Error('No GUI')
        }
        let color = new THREE.Color(0xffffff)
        this.gui.add(this, 'save').name('Save')
        this.gui.add(this, 'load').name('Load')
        this.gui.add(this, 'clear').name('Clear')

        this.gui
            .add(this, 'disableEdit')
            .name('Disable editing')
            .onChange(() => {
                if (!this.disableEdit) {
                    this.debugCubes.forEach((cube) => {
                        this.scene.remove(cube)
                    })
                }
            })

        this.gui.add(this, 'swapControls').name('Swap controls')
        this.gui
            .add(this, 'showHitBoxes')
            .onChange(() => {
                this.cubes.forEach((cube) => {
                    cube.visible = this.showHitBoxes
                })
            })
            .name('Show hit boxes')
        this.gui
            .add(this.tiles.material, 'wireframe')
            .onChange(() => {
                this.tiles.material.needsUpdate = true
            })
            .name('Wireframe')

        this.gui.add(this, 'hover').listen().name('Model name')
        const mat = this.tiles.material as any
        if (mat.color) {
            const shader = this.gui.addFolder('Shader')
            shader
                .add(mat, 'vertexColors')
                .onChange(() => {
                    if (mat.vertexColors) {
                        color = mat.color.clone()
                        mat.color = new THREE.Color(0xffffff)
                    } else {
                        mat.color = color
                    }
                    mat.needsUpdate = true
                })
                .name('Color individual tiles')

            shader
                .add(mat.userData.noiseScale, 'value')
                .min(0.1)
                .max(1.0)
                .step(0.001)
                .name('Noise Intensity')
            shader
                .add(mat.userData.noiseFactor, 'value')
                .min(0.0)
                .max(2.0)
                .step(0.01)
                .name('Noise Scale')
            shader.add(mat, 'roughness', 0, 1).name('Roughness')
            shader.add(mat, 'metalness', 0, 1).step(1).name('Metallic')
            shader
                .add(mat.userData.noiseScale2, 'value')
                .min(0.1)
                .max(20.0)
                .step(0.001)
                .name('Displacement Intensity')
            shader
                .add(mat.userData.noiseFactor2, 'value')
                .min(0.0)
                .max(2.0)
                .step(0.01)
                .name('Displacement Scale')
            shader
                .add(mat.userData.fromMin, 'value')
                .min(0.0)
                .max(1.0)
                .step(0.01)
                .name('fromMin')
            shader
                .add(mat.userData.fromMax, 'value')
                .min(0.0)
                .max(100.0)
                .step(0.01)
                .name('fromMax')
            shader
                .add(mat.userData.toMin, 'value')
                .min(0.0)
                .max(100.0)
                .step(0.01)
                .name('toMin')
            shader
                .add(mat.userData.toMax, 'value')
                .min(0.0)
                .max(100.0)
                .step(0.01)
                .name('toMax')
            // random color
            const randomColor1 = new THREE.Color('#babdb6')
            const randomColor2 = new THREE.Color('#28a7e8')

            mat.userData.color1.value = randomColor1
            mat.userData.color2.value = randomColor2
            shader.addColor(mat.userData.color1, 'value').name('Color 1')
            shader.addColor(mat.userData.color2, 'value').name('Color 2')
            shader.close()
            shader.hide()
            this.parent &&
                shader
                    .addColor(this.parent.scene, 'background')
                    .name('Background')
        }
        const generator = this.gui.addFolder('Generator')
        generator.close()

        const size = generator.addFolder('Size')
        size.add(this.params.size, 'x', 1, 20).step(1).name('Width')
        size.add(this.params.size, 'y', 1, 8).step(1).name('Height')
        size.add(this.params.size, 'z', 1, 20).step(1).name('Depth')
        generator
            .add(this.params, 'noiseScale', 0, 1)
            .step(0.01)
            .name('Noise Scale')

        const noise = generator.addFolder('3D Noise')
        noise.add(this.params.noiseScale3, 'x', 0, 1).step(0.01)
        noise.add(this.params.noiseScale3, 'y', 0, 1).step(0.01)
        noise.add(this.params.noiseScale3, 'z', 0, 1).step(0.01)
        generator.add(this, 'generate').name('Generate')
    }
    setTool(tool: Tool) {
        this.debugCubes.forEach((cube) => {
            this.scene.remove(cube)
        })
        this.tool = tool
    }
    addObject(position: THREE.Vector3) {
        !this.disableEdit && this.hoverCube && (this.hoverCube.visible = false)
        // debugger
        const mainIndex = this.dual.positionToIndex(position)
        if (mainIndex === null) return

        this.dual.replaceCell({
            position,
            value: 0,
            locked: false,
            metadata: {
                type: 'object',
            },
        })
    }
}
