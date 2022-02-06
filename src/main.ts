import './style.css'
import Scene from './Scene'
import Test from './Test'
import { Vector3 } from 'three'

const canvas = document.querySelector('canvas.webgl') as HTMLCanvasElement

const main = async () => {
    // const scene = new Scene(canvas)
    const test = new Test(canvas)
    await test.loadTiles()
    const count = 3
    for (let i = 0; i < count; i++) {
        test.addCube(new Vector3(i, 0, 0))
    }
    test.start()
    test.center()
    // test.addLabels()
    // test.group.translateX(10)
    ;[...test.tiles.lib.keys()].forEach((key, index) => {
        const mesh = test.tiles.lib.get(key).clone()
        mesh.position.set(index % 8, 0, (index - (index % 8)) / 8)
        mesh.position.add(new Vector3(2, 0, 0))
        mesh.position.multiplyScalar(2)

        test.scene.add(mesh)
    })
}
main()
