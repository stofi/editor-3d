import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import myMaterial from '../shaders/experiment3'

import { StandardNodeMaterial } from 'three/examples/jsm/nodes/Nodes.js'

const textureLoader = new THREE.TextureLoader()

const uniforms = {
    uWidth: { value: 0 },
    uHeight: { value: 0 },
    noiseScale: {
        type: 'f',
        value: 0.1,
    },
    noiseFactor: {
        type: 'f',
        value: 1.0,
    },
}
const setUniforms = (uniforms: any, width: number, height: number) => {
    uniforms.uWidth.value = width
    uniforms.uHeight.value = height
}
window.addEventListener('resize', () => {
    setUniforms(uniforms, window.innerWidth, window.innerHeight)
})
setUniforms(uniforms, window.innerWidth, window.innerHeight)

export default class Tiles {
    loader = new GLTFLoader()
    lib = new Map()
    loaded = false
    material = myMaterial
    load() {
        return new Promise((resolve, reject) => {
            this.loader.load(
                './tiles2.gltf',
                (gltf: GLTF) => {
                    gltf.scene.children.forEach((child, index) => {
                        if (child.type === 'Mesh') {
                            const mesh = child as THREE.Mesh
                            if (index < 10) {
                                // log mesh.geometry attributes
                                console.log(mesh.geometry.attributes)
                            }
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
                            mesh.geometry.computeVertexNormals()
                            mesh.material = this.material
                            mesh.scale.multiplyScalar(-0.25)
                            mesh.scale.y *= -1
                            mesh.position.set(0, 0, 0)
                            mesh.castShadow = true
                            mesh.receiveShadow = true
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
}