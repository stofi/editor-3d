import { Vector3 } from 'three'

interface CurveOptions {
    points: Vector3[]
}

export class Curve {
    points: Vector3[]
    constructor(options: CurveOptions) {
        this.points = options.points.map((p) => p.clone())
    }
    getPoint(t: number): Vector3 {
        // interpolate between points
        const n = this.points.length - 1
        const i = Math.floor(t * n)
        const d = t * n - i
        const i2 = Math.min(i + 1, n)
        const p0 = this.points[i].clone()
        const p1 = this.points[i2].clone()
        return p0.clone().lerp(p1, d)
    }
    getWholePoints(): Vector3[] {
        const points: Map<string, Vector3> = new Map()
        for (let t = 0; t <= 1; t += 0.01) {
            const p = this.getPoint(t)
            const string = p.x + ',' + p.y + ',' + p.z
            points.set(string, p.round())
        }
        return Array.from(points.values())
    }
}
