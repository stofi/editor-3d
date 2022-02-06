import Scene from './Scene'
import * as THREE from 'three'
import Dual from './Dual'

export default class Test extends Scene {
    cubes: THREE.Mesh[] = []
    duals: THREE.Mesh[] = []
    ambientLight?: THREE.AmbientLight
    directLight?: THREE.DirectionalLight

    group = new THREE.Group()
    cubeGeometry = new THREE.BoxBufferGeometry(1, 1, 1)
    cubeMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
    })
    dualMaterial = new THREE.MeshStandardMaterial({
        color: 0xff33ff,
        wireframe: true,
    })
    raycaster = new THREE.Raycaster()
    mouse: THREE.Vector2 = new THREE.Vector2()
    lastTouch = -Infinity
    dual = new Dual(new THREE.Vector3(3, 3, 3))

    constructor(canvas: HTMLCanvasElement) {
        super(canvas)
        this.raycaster.layers.set(1)
        this.scene.add(this.group)
        this.addAmbientLight()
        this.addDirectLight()
        this.addAxisHelper()
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
    addDualCube(position?: THREE.Vector3) {
        const dualCube = new THREE.Mesh(this.cubeGeometry, this.dualMaterial)
        position && dualCube.position.copy(position).subScalar(0.5)
        this.duals.push(dualCube)
        this.group.add(dualCube)
    }
    updateDual(): void {
        this.dual.calculateDual()
        for (let i = this.duals.length - 1; i >= 0; i--) {
            const dualCube = this.duals[i]
            this.group.remove(dualCube)
            this.duals.splice(i, 1)
        }

        this.dual.secondary.forEach((dual, index) => {
            if (dual.value === 0) return
            const position = dual.position
            this.addDualCube(position)
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
    }
    center(): void {
        new THREE.Box3()
            .setFromObject(this.group)
            .getCenter(this.group.position)
            .multiplyScalar(-1)
    }
}
