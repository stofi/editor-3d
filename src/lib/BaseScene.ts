import * as THREE from 'three'
import * as dat from 'lil-gui'

import { Group } from './types'

export default class BaseScene implements Group {
    gui?: dat.GUI
    scene: THREE.Group | THREE.Scene
    initialized = false
    children: Group[] = []
    parent?: Group | undefined

    constructor(children: Group[] = []) {
        this.scene = new THREE.Group()

        children.forEach((child) => {
            this.addChild(child)
        })
    }

    /**
     * Calls tick on all children
     **/
    tick() {
        this.children.forEach((child) => {
            child.tick()
        })
    }

    /**
     * Sets initialized to true
     **/
    start() {
        this.initialized = true
    }

    /**
     * Removes all children
     **/
    destroy() {
        this.children.forEach((child) => {
            this.removeChild(child)
        })
    }

    /**
     * Adds a child to the scene
     * @param child
     **/
    addChild(child: Group) {
        child.parent = this
        child.gui = this.gui
        this.children.push(child)
        this.scene.add(child.scene)
        child.start()
    }

    /**
     * Removes a child to the scene
     * @param child
     **/
    removeChild(child: Group) {
        const index = this.children.indexOf(child)
        if (index !== -1) {
            child.destroy()
            this.children.splice(index, 1)
            this.scene.remove(child.scene)
        }
    }
}
