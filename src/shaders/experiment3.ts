import * as THREE from 'three'
import simplex from './simplex'
THREE.MeshToonMaterial
const myMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xff22ff,
    metalness: 0,
    roughness: 0.2,
    reflectivity: 0.5,
    // vertexColors: true,
    transparent: true,
})
myMaterial.transmission = 0.01

const colorHook = '#include <color_fragment>'
const functionHook = '#include <common>'
//modelMatrix viewMatrix projectionMatrix
const customFragmentChunk = `
#ifdef USE_CUSTOM 
    vec3 gOffset = vec3(2469.0, 324.0, 666.0);
    vec3 bOffset = vec3(52.0, 7454.0, 456.0);
    vec3 wPScaled = vWorldPosition.xyz * pow(noiseFactor, 0.6);
    float r = snoise(wPScaled);
    float g = snoise((wPScaled) + gOffset);
    float b = snoise((wPScaled) + bOffset);
    // diffuseColor.rgb = vec3(r, 0.0, 0.0);
    vec3 noise3D = vec3(r,g,b) * noiseScale;
    float y = mod(vWorldPosition+noise3D, 1.0).y;
    diffuseColor.rgb = mix(color1, color2, y);
#endif
${colorHook}
`

const customFunctionChunk = `
#ifdef USE_CUSTOM 
    ${simplex}
#endif
${functionHook}
`

myMaterial.defines.USE_CUSTOM = '1'
myMaterial.userData = {
    myValue: { value: 2 },
    uWidth: { value: 0 },
    uHeight: { value: 0 },
    noiseScale: {
        type: 'f',
        value: 0.1,
    },
    noiseFactor: {
        type: 'f',
        value: 0.5,
    },
    color1: {
        type: 'c',
        value: new THREE.Color(0xff22ff),
    },
    color2: {
        type: 'c',
        value: new THREE.Color(0xffffff),
    },
}

myMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.myValue = myMaterial.userData.myValue //pass this input by reference
    shader.uniforms.uWidth = myMaterial.userData.uWidth
    shader.uniforms.uHeight = myMaterial.userData.uHeight
    shader.uniforms.noiseScale = myMaterial.userData.noiseScale
    shader.uniforms.noiseFactor = myMaterial.userData.noiseFactor
    shader.uniforms.color1 = myMaterial.userData.color1
    shader.uniforms.color2 = myMaterial.userData.color2

    shader.fragmentShader = `
    uniform vec2 myValue;
    uniform float uWidth;
    uniform float uHeight;
    uniform float noiseScale;
    uniform float noiseFactor;
    uniform vec3 color1;
    uniform vec3 color2;
    
    ${shader.fragmentShader}
    `
    shader.fragmentShader = shader.fragmentShader.replace(
        functionHook,
        customFunctionChunk
    )
    shader.fragmentShader = shader.fragmentShader.replace(
        colorHook,
        customFragmentChunk
    )
}
export default myMaterial
