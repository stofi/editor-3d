import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
// import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import myMaterial from '../shaders/experiment3'
import { sha256 } from 'crypto-hash'
import { StandardNodeMaterial } from 'three/examples/jsm/nodes/Nodes.js'

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
    // draco = new DRACOLoader()
    loader = new GLTFLoader()
    lib = new Map()
    loaded = false
    material = myMaterial
    hashes = new Map()
    constructor() {
        // this.draco.setDecoderPath(
        //     'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/libs/draco/'
        // )
        // this.draco.setDecoderConfig({ type: 'js' })
        // this.loader.setDRACOLoader(this.draco)
    }
    async load() {
        return new Promise((resolve, reject) => {
            this.loader.load(
                './tiles2.gltf',
                async (gltf: GLTF) => {
                    await gltf.scene.children.reduce(
                        async (prev, child, index) => {
                            await prev
                            if (child.type !== 'Mesh') return
                            const mesh = child as THREE.Mesh

                            const color = new THREE.Color(0x000000)

                            if (
                                mesh.geometry.attributes['_vg_color_1'] === null
                            ) {
                                delete mesh.geometry.attributes['_vg_color_1']
                            }
                            if (
                                mesh.geometry.attributes['_vg_color_2'] === null
                            ) {
                                delete mesh.geometry.attributes['_vg_color_2']
                            }
                            if (
                                mesh.geometry.attributes['_vg_color_3'] === null
                            ) {
                                delete mesh.geometry.attributes['_vg_color_3']
                            }
                            const colors = new Float32Array(
                                mesh.geometry.attributes.position.count * 3
                            )

                            const positionArray =
                                mesh.geometry.attributes.position.array
                            const hash = await sha256(
                                Array.from(positionArray)
                                    .map((x) => x.toString())
                                    .join(',')
                            )
                            if (!this.hashes.has(hash)) {
                                this.hashes.set(hash, mesh.geometry)
                            } else {
                                mesh.geometry.dispose()
                                mesh.geometry = this.hashes.get(hash)
                                mesh.geometry.attributes.position.needsUpdate =
                                    true
                            }
                            const saturation =
                                Math.floor(
                                    (index / gltf.scene.children.length) * 1000
                                ) % 100
                            const groups = [
                                '_vg_color_1',
                                '_vg_color_2',
                                '_vg_color_3',
                            ]
                            groups.forEach((group, index) => {
                                if (mesh.geometry.attributes[group]) {
                                    for (
                                        let i = 0;
                                        i <
                                        mesh.geometry.attributes[group].count;
                                        i++
                                    ) {
                                        const value =
                                            mesh.geometry.attributes[group]
                                                .array[i] * 65535
                                        const i3 = i * 3
                                        colors[i3 + index] = value
                                    }
                                }
                            })
                            mesh.geometry.setAttribute(
                                'color3',
                                new THREE.BufferAttribute(colors, 3)
                            )

                            mesh.material = this.material
                            mesh.scale.multiplyScalar(-0.25)
                            mesh.scale.y *= -1
                            mesh.position.set(0, 0, 0)
                            mesh.castShadow = true
                            mesh.receiveShadow = true

                            this.lib.set(child.name, mesh)
                        },
                        Promise.resolve()
                    )

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
