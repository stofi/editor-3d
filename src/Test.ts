import Scene from './Scene'
import * as THREE from 'three'

export default class Test extends Scene {
    cubes: THREE.Mesh[] = []
    ambientLight?: THREE.AmbientLight
    directLight?: THREE.DirectionalLight

    group = new THREE.Group()
    cubeGeometry = new THREE.BoxBufferGeometry(1, 1, 1)
    cubeMaterial = new THREE.MeshStandardMaterial({
        color: 0x003300,
        roughness: 1,
        // wireframe: true,
        // vertexColors: true,
    })
    raycaster = new THREE.Raycaster()
    mouse: THREE.Vector2 = new THREE.Vector2()

    constructor(canvas: HTMLCanvasElement) {
        super(canvas)
        this.raycaster.layers.set(1)
        this.scene.add(this.group)
        this.addAmbientLight()
        this.addDirectLight()
        this.addAxisHelper()
    }

    addCube(position?: THREE.Vector3) {
        const cube = new THREE.Mesh(this.cubeGeometry, this.cubeMaterial)
        position && cube.position.copy(position)
        cube.layers.enable(1)
        this.cubes.push(cube)
        this.group.add(cube)
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
    onClick(event: MouseEvent): void {
        const intersects = this.getIntersects()
        if (intersects.length > 0) {
            const intersect = intersects[0] as THREE.Intersection
            const object = intersect.object as THREE.Mesh
            // index of intersected object
            const position = object.position.clone()
            const normal = intersect?.face?.normal.clone() ?? null
            normal && this.addCube(position.add(normal))
        }
    }

    addListeners(): void {
        super.addListeners()
        window.addEventListener('mousemove', this.onMouseMove.bind(this))
        window.addEventListener('click', this.onClick.bind(this))
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
