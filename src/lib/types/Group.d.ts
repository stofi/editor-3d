import * as dat from 'lil-gui'
import * as THREE from 'three'

export default interface Group {
    scene: THREE.Scene | THREE.Group
    tick: () => void
    start: () => void
    destroy: () => void
    addChild: (child: Group) => void
    removeChild: (child: Group) => void
    children: Group[]
    initialized: boolean
    parent?: Group
    gui?: dat.GUI
}
