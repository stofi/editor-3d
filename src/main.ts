import './style.css'
import Test from './Test'
import { Vector3 } from 'three'
import SimplexNoise from 'simplex-noise'

const canvas = document.querySelector('canvas.webgl') as HTMLCanvasElement

// load scenedata from local storage
const sceneData = localStorage.getItem('scene')

const main = async () => {
    console.log('main')
    const size = sceneData ? JSON.parse(sceneData).size ?? 10 : 10
    const params = {
        generate: () => {
            // void
        },
        size,
        noiseScale: 0.5,
        noiseScale3: new Vector3(0.2, 0.8, 0.2),
    }
    const test = new Test(canvas, new Vector3(size, size, size))
    await test.loadTiles()

    params.generate = () => {
        test.dual.resize(new Vector3(params.size, params.size, params.size))
        const complexity = params.size ** 3 * 9
        if (params.size > 13) {
            const agree =
                confirm(`Warning: sizes above 13x13x13 may take a long time to generate. Higher values may hang your browser.

Are you sure you want to generate ${params.size ** 3} cells?
This will create up to ${complexity} objects.
    `)
            if (!agree) return
        }
        const simplex = new SimplexNoise()
        let i = 0
        const batch = Math.min(params.size ** 2, 150)
        console.time('loop')
        test.onTick = () => {
            if (i >= test.dual.main.length) {
                console.timeEnd('loop')
                test.onTick = () => null
                return
            }
            for (let j = 0; j < batch && i + j < test.dual.main.length; j++) {
                const batchIndex = i + j
                if (!test.dual.main[batchIndex]) continue
                const x = test.dual.main[batchIndex].position.x
                const y = test.dual.main[batchIndex].position.y
                const z = test.dual.main[batchIndex].position.z
                const scale = params.noiseScale ?? 0.1
                const noise = simplex.noise3D(
                    x * scale * params.noiseScale3.x,
                    y * scale * params.noiseScale3.y,
                    z * scale * params.noiseScale3.z
                )
                test.dual.main[batchIndex].value = noise
                if (noise > 0.5) {
                    test.addCube(test.dual.main[batchIndex].position)
                } else {
                    test.removeCube(test.dual.main[batchIndex].position)
                }
            }
            i += batch
        }
    }

    test.gui.add(params, 'generate')
    test.gui.add(params, 'size', 1, 20).step(1)
    test.gui.add(params, 'noiseScale', 0, 1).step(0.01)
    test.gui.add(params.noiseScale3, 'x', -1, 1).step(0.01)
    test.gui.add(params.noiseScale3, 'y', -1, 1).step(0.01)
    test.gui.add(params.noiseScale3, 'z', -1, 1).step(0.01)
    if (sceneData) {
        test.import(sceneData)
    } else {
        params.generate()
    }
    // test.center()
    test.start()
}
main()
