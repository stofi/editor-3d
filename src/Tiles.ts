import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

export default class Tiles {
    material = new THREE.MeshStandardMaterial({
        color: '#987e6f',
        // opacity: 0.5,
        wireframe: true,
    })
    loader = new GLTFLoader()
    lib = new Map()
    loaded = false
    load() {
        return new Promise((resolve, reject) => {
            this.loader.load(
                './tiles2.gltf',
                (gltf: GLTF) => {
                    gltf.scene.children.forEach((child, index) => {
                        if (child.type === 'Mesh') {
                            const mesh = child as THREE.Mesh
                            const saturation =
                                Math.floor(
                                    (index / gltf.scene.children.length) * 1000
                                ) % 100
                            const material = new THREE.MeshStandardMaterial({
                                color: `hsl(${
                                    (index * 360) / gltf.scene.children.length
                                }, ${saturation}%, 50%)`,
                                // wireframe: true,
                            })
                            mesh.material = material
                            mesh.scale.multiplyScalar(-0.25)
                            mesh.scale.y *= -1
                            mesh.position.set(0, 0, 0)
                            // mesh.rotation.y += Math.PI

                            this.lib.set(child.name, mesh)
                        }
                    })
                    this.loaded = true
                    resolve(true)
                },
                undefined,
                function (error) {
                    console.error(error)
                    reject(error)
                }
            )
        })
    }
    onLoad(gltf: GLTF) {
        gltf.scene.children.forEach((child, index) => {
            if (child.type === 'Mesh') {
                const mesh = child as THREE.Mesh
                mesh.material = this.material
                // const geometry = (child as THREE.Mesh).geometry
                // const rotation = (child as THREE.Mesh).rotation
                // const scale = (child as THREE.Mesh).scale
                // // create a new mesh with the new material
                // const mesh = new THREE.Mesh(geometry, this.material)
                // mesh.rotation.set(rotation.x, rotation.y, rotation.z)
                // mesh.scale.set(scale.x / 2, scale.y / 2, scale.z / 2)
                mesh.scale.set(0.25, 0.25, 0.25)

                this.lib.set(child.name, mesh)
            }
        })
        this.loaded = true
    }
}
