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
    secondaryToMainMap: Map<string, optionalNumber[]> = new Map()
    primaryToSecondaryMap: Map<string, optionalNumber[]> = new Map()
    mainIndiciesToUpdate: number[] = []
    secondaryIndiciesToUpdate: number[] = []
    secondaryIndiciesToCalculate: number[] = []
    constructor(size: Vector3) {
        this.mainSize = size.ceil()
        this.secondarySize = this.mainSize.clone().addScalar(1)
        this.main = this.create(this.mainSize)
        this.secondary = this.create(this.secondarySize)
        this.fillSecondaryMap()
        this.fillPrimaryMap()
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
    nynz(position: Vector3, main = true): optionalNumber {
        const pos = position.clone()
        pos.y -= 1
        pos.z -= 1
        return this.positionToIndex(pos, main)
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
    mainToSecondary(position: Vector3): optionalNumber[] {
        const mainPos = position.clone().addScalar(1)
        return [
            this.nxnz(mainPos, false),
            this.nx(mainPos, false),
            this.positionToIndex(mainPos, false),
            this.nz(mainPos, false),
            this.nxnynz(mainPos, false),
            this.nxny(mainPos, false),
            this.ny(mainPos, false),
            this.nynz(mainPos, false),
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
    calculateDualCell(cell: Cell) {
        if (!cell) return

        const old = cell.value
        cell.value = 0
        this.secondaryToMainMap
            .get(this.vectorToString(cell.position))
            ?.forEach((mainIndex, vertexIndex) => {
                if (mainIndex !== null) {
                    const value = this.main[mainIndex]?.value ?? 0
                    const valueInt = value > 0.5 ? 1 : 0

                    cell.value |= valueInt << vertexIndex
                }
            })
        const index = this.positionToIndex(cell.position, false)

        if (cell.value !== old && index !== null) {
            if (this.secondaryIndiciesToUpdate.includes(index)) return
            this.secondaryIndiciesToUpdate.push(index)
        }
    }
    resize(size: Vector3) {
        this.mainSize = size.ceil()
        this.secondarySize = this.mainSize.clone().addScalar(1)
        this.main = this.create(this.mainSize)
        this.secondary = this.create(this.secondarySize)
        this.mainIndiciesToUpdate = []
        this.secondaryIndiciesToUpdate = []
        this.secondaryIndiciesToCalculate = []
        this.primaryToSecondaryMap.clear()
        this.secondaryToMainMap.clear()
        this.fillSecondaryMap()
        this.fillPrimaryMap()
    }
    fillSecondaryMap() {
        this.secondaryToMainMap.clear()
        this.secondary.forEach((cell) => {
            const main = this.secondaryToMain(cell.position)
            this.secondaryToMainMap.set(
                this.vectorToString(cell.position),
                main
            )
        })
    }
    fillPrimaryMap() {
        this.primaryToSecondaryMap.clear()
        this.main.forEach((cell) => {
            const main = this.mainToSecondary(cell.position)
            this.primaryToSecondaryMap.set(
                this.vectorToString(cell.position),
                main
            )
        })
    }

    vectorToString(vector: Vector3) {
        return `${vector.x},${vector.y},${vector.z}`
    }
    replaceCell(cell: Cell) {
        const index = this.positionToIndex(cell.position)
        if (index === null) return
        this.main[index] = cell

        this.mainIndiciesToUpdate.push(index)
        const relations =
            this.primaryToSecondaryMap.get(
                this.vectorToString(cell.position)
            ) ?? []

        relations.forEach((relation) => {
            if (relation === null) return
            if (this.secondaryIndiciesToCalculate.includes(relation)) return
            this.secondaryIndiciesToCalculate.push(relation)
        })
        this.secondaryIndiciesToCalculate.forEach((secIndex) => {
            const secondary = this.secondary[secIndex]
            this.calculateDualCell(secondary)
        })
        this.calculateFromQueue()
    }
    calculateFromQueue() {
        this.secondaryIndiciesToCalculate.forEach((index) => {
            const secondary = this.secondary[index]
            this.calculateDualCell(secondary)
        })
        this.secondaryIndiciesToCalculate = []
    }
    getSecondaryQueue() {
        return this.secondaryIndiciesToUpdate.map(
            (index) => this.secondary[index]
        )
    }
    getMainQueue() {
        return this.mainIndiciesToUpdate.map((index) => this.main[index])
    }
    clearSecondaryQueue() {
        this.secondaryIndiciesToUpdate = []
    }
    clearMainQueue() {
        this.mainIndiciesToUpdate = []
    }
}
