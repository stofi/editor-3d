import * as THREE from 'three'

import BaseScene from '../lib/BaseScene'

export default class Basic extends BaseScene {
    box?: THREE.Mesh
    constructor() {
        super()
    }
    // Super overrides:
    tick(): void {
        if (this.box) {
            this.box.rotation.x += 0.01
            this.box.rotation.y += 0.01
        }
    }
    start(): void {
        this.addBox()
    }
    // Window events
    // Objects
    addBox(): void {
        this.box = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        )
        this.scene.add(this.box)
    }
}
