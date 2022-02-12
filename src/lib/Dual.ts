import { Vector3 } from 'three'

interface Cell {
    position: Vector3
    value: number
    locked: boolean
    metadata?: any
}
type optionalNumber = number | null

export default class Dual {
    mainSize: Vector3
    secondarySize: Vector3
    main: Cell[] = []
    secondary: Cell[] = []
    secondaryToMainMap: Map<Vector3, optionalNumber[]> = new Map()
    constructor(size: Vector3) {
        this.mainSize = size.ceil()
        this.secondarySize = this.mainSize.clone().addScalar(1)
        this.main = this.create(this.mainSize)
        this.secondary = this.create(this.secondarySize)
        this.fillMap()
    }
    create(size: Vector3) {
        const array = new Array(size.x * size.y * size.z)
            .fill(0)
            .map((_, index) => {
                const position = new Vector3()
                position.x = index % size.x
                position.y = Math.floor(index / size.x) % size.y
                position.z = Math.floor(index / size.x / size.y)
                return {
                    position,
                    value: 0,
                    locked: false,
                }
            })
        return array
    }
    positionToIndex(position: Vector3, main = true): optionalNumber {
        const size = main ? this.mainSize : this.secondarySize
        if (position.x < 0 || position.x >= size.x) return null
        if (position.y < 0 || position.y >= size.y) return null
        if (position.z < 0 || position.z >= size.z) return null
        return position.x + position.y * size.x + position.z * size.x * size.y
    }
    px(position: Vector3, main = true): optionalNumber {
        const pos = position.clone()
        pos.x += 1
        return this.positionToIndex(pos, main)
    }
    nx(position: Vector3, main = true): optionalNumber {
        const pos = position.clone()
        pos.x -= 1
        return this.positionToIndex(pos, main)
    }
    py(position: Vector3, main = true): optionalNumber {
        const pos = position.clone()
        pos.y += 1
        return this.positionToIndex(pos, main)
    }
    ny(position: Vector3, main = true): optionalNumber {
        const pos = position.clone()
        pos.y -= 1
        return this.positionToIndex(pos, main)
    }
    pz(position: Vector3, main = true): optionalNumber {
        const pos = position.clone()
        pos.z += 1
        return this.positionToIndex(pos, main)
    }
    nz(position: Vector3, main = true): optionalNumber {
        const pos = position.clone()
        pos.z -= 1
        return this.positionToIndex(pos, main)
    }
    pxpypz(position: Vector3, main = true): optionalNumber {
        const pos = position.clone()
        pos.x += 1
        pos.y += 1
        pos.z += 1
        return this.positionToIndex(pos, main)
    }
    nxnz(position: Vector3, main = true): optionalNumber {
        const pos = position.clone()
        pos.x -= 1
        pos.z -= 1
        return this.positionToIndex(pos, main)
    }
    nxpy(position: Vector3, main = true): optionalNumber {
        const pos = position.clone()
        pos.x -= 1
        pos.y += 1
        return this.positionToIndex(pos, main)
    }
    nxpynz(position: Vector3, main = true): optionalNumber {
        const pos = position.clone()
        pos.x -= 1
        pos.y += 1
        pos.z -= 1
        return this.positionToIndex(pos, main)
    }
    nxny(position: Vector3, main = true): optionalNumber {
        const pos = position.clone()
        pos.x -= 1
        pos.y -= 1
        return this.positionToIndex(pos, main)
    }
    nxnynz(position: Vector3, main = true): optionalNumber {
        const pos = position.clone()
        pos.x -= 1
        pos.y -= 1
        pos.z -= 1
        return this.positionToIndex(pos, main)
    }
    nynz(position: Vector3): optionalNumber {
        const pos = position.clone()
        pos.y -= 1
        pos.z -= 1
        return this.positionToIndex(pos)
    }
    secondaryToMain(position: Vector3): optionalNumber[] {
        return [
            this.nxnz(position),
            this.nx(position),
            this.positionToIndex(position),
            this.nz(position),
            this.nxnynz(position),
            this.nxny(position),
            this.ny(position),
            this.nynz(position),
        ]
    }
    getYPlane(y: number, main = true) {
        const collection = main ? this.main : this.secondary
        return collection.filter((cell) => cell.position.y === y)
    }
    getXPlane(x: number, main = true) {
        const collection = main ? this.main : this.secondary
        return collection.filter((cell) => cell.position.x === x)
    }
    getZPlane(z: number, main = true) {
        const collection = main ? this.main : this.secondary
        return collection.filter((cell) => cell.position.z === z)
    }
    calculateDual() {
        this.secondary.forEach((cell) => {
            cell.value = 0
            this.secondaryToMainMap
                .get(cell.position)
                ?.forEach((mainIndex, vertexIndex) => {
                    if (mainIndex !== null) {
                        const value = this.main[mainIndex]?.value ?? 0
                        const valueInt = value > 0.5 ? 1 : 0

                        cell.value |= valueInt << vertexIndex
                    }
                })
        })
    }
    resize(size: Vector3) {
        this.mainSize = size.ceil()
        this.secondarySize = this.mainSize.clone().addScalar(1)
        this.main = this.create(this.mainSize)
        this.secondary = this.create(this.secondarySize)
        this.fillMap()
    }
    fillMap() {
        this.secondaryToMainMap.clear()
        this.secondary.forEach((cell) => {
            const main = this.secondaryToMain(cell.position)
            this.secondaryToMainMap.set(cell.position, main)
        })
    }
}
