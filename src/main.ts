import './style.css'
import Scene from './Scene'
import Test from './Test'
import { Vector3 } from 'three'

const canvas = document.querySelector('canvas.webgl') as HTMLCanvasElement

// const scene = new Scene(canvas)
const test = new Test(canvas)
const count = 1
for (let i = 0; i < count; i++) {
    test.addCube(new Vector3(i, 0, 0))
}
test.center()
