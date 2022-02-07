import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

const textureLoader = new THREE.TextureLoader()

export default class Tiles {
    loader = new GLTFLoader()
    lib = new Map()
    loaded = false
    colorTexture = textureLoader.load('textures/bricks/color.jpg')
    normalTexture = textureLoader.load('textures/bricks/normal.jpg')
    roughessTexture = textureLoader.load('textures/bricks/roughess.jpg')
    aoTexture = textureLoader.load('textures/bricks/ambientOcclusion.jpg')
    material = new THREE.MeshStandardMaterial({
        // color: '#987e6f',
        // opacity: 0.5,
        // wireframe: true,
        vertexColors: true,
        map: this.colorTexture,
        normalMap: this.normalTexture,
        aoMap: this.aoTexture,
        aoMapIntensity: 1,
        roughnessMap: this.roughessTexture,
    })
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

                            const colors = new Float32Array(
                                mesh.geometry.attributes.position.count * 3
                            )
                            const color = new THREE.Color(
                                `hsl(${
                                    (index * 360) / gltf.scene.children.length
                                }, ${saturation}%, 50%)`
                            )

                            for (
                                let i = 0;
                                i < mesh.geometry.attributes.position.count;
                                i++
                            ) {
                                const i3 = i * 3
                                colors[i3] = color.r
                                colors[i3 + 1] = color.g
                                colors[i3 + 2] = color.b
                            }
                            mesh.geometry.setAttribute(
                                'color',
                                new THREE.BufferAttribute(colors, 3)
                            )
                            mesh.material = this.material
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
