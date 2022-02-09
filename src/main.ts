import './style.css'
import './input.css'

import { Vector3 } from 'three'
import SimplexNoise from 'simplex-noise'

import Root from './scenes/Root'
import Basic from './scenes/Basic'
import Editor from './scenes/Editor'

const canvas = document.querySelector('canvas.webgl') as HTMLCanvasElement
const loading = document.getElementById('loading') as HTMLDivElement
const sceneData = localStorage.getItem('scene')

const root = new Root(canvas)
root.start()

const main = async () => {
    console.log('main')
    const size = sceneData ? JSON.parse(sceneData).size ?? 10 : 10

    const editor = new Editor(
        { size, noiseScale: 0.5, noiseScale3: new Vector3(0.2, 0.8, 0.2) },
        canvas,
        root.camera!
    )
    root.addChild(editor)
    console.time('load')

    await editor.loadTiles()
    console.timeEnd('load')
    loading.classList.add('hidden')
    editor.generate()
}
main()
