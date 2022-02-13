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

const buttons = {
    add: document.getElementById('add') as HTMLButtonElement,
    remove: document.getElementById('remove') as HTMLButtonElement,
    inspect: document.getElementById('inspect') as HTMLButtonElement,
    object: document.getElementById('object') as HTMLButtonElement,
}

const setActiveClass = (activeKey: string) => {
    Object.entries(buttons).forEach(([key, button]) => {
        button.classList.remove('opacity-40')
        if (key === activeKey) {
            button.classList.add('opacity-40')
        }
    })
}

const root = new Root(canvas)
root.start()

const main = async () => {
    // const size = sceneData ? JSON.parse(sceneData).size ?? 10 : 10

    const editor = new Editor(
        { noiseScale: 0.5, noiseScale3: new Vector3(0.2, 0.8, 0.2) },
        canvas,
        root.camera!
    )
    buttons.add.addEventListener('click', () => {
        editor.setTool('add')
        setActiveClass('add')
    })
    buttons.remove.addEventListener('click', () => {
        editor.setTool('remove')
        setActiveClass('remove')
    })
    buttons.inspect.addEventListener('click', () => {
        editor.setTool('inspect')
        setActiveClass('inspect')
    })
    buttons.object.addEventListener('click', () => {
        editor.setTool('object')
        setActiveClass('object')
    })
    root.addChild(editor)
    console.time('load')

    await editor.loadTiles()
    console.timeEnd('load')
    loading.classList.add('hidden')
    editor.generate()
}
main()
