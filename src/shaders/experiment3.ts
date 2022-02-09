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
// const vertHook = 'vec3'
const vertHook = '#include <morphtarget_vertex>'
const vertFunctionHook = '#include <common>'

const customFunctionChunk = `
#ifdef USE_CUSTOM 
    ${simplex}
#endif
${functionHook}
`
const customVertexChunk = `
#ifdef USE_CUSTOM 
    vec4 mvp = vec4(transformed,1.0);
    vec4 glp = vec4(0.0);
    #ifdef USE_INSTANCING
        mvp = instanceMatrix * mvp;
    #endif
    mvp = modelMatrix * mvp;
    glp = projectionMatrix * mvp;

    vec3 pScaled = glp.xyz * pow(noiseFactor2, 0.6);
    float r = (snoise(pScaled.xyz));
    // normal;
    float z = (1.0 - abs(glp.y)) * 0.1;
    
    float horizontal = abs(dot(normal, vec3(0.0, 1.0, 0.0)));
    vec3 displace = ((1.0 - horizontal) * r) * normal *  z;
    transformed += displace * noiseScale2;
#endif
${vertHook}
`

const customVertexFunctionChunk = `
#ifdef USE_CUSTOM 
    ${simplex}
#endif
${vertFunctionHook}
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
    noiseScale2: {
        type: 'f',
        value: 0.1,
    },
    noiseFactor2: {
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
    shader.uniforms.noiseScale2 = myMaterial.userData.noiseScale2
    shader.uniforms.noiseFactor2 = myMaterial.userData.noiseFactor2
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
    shader.vertexShader = `
    uniform vec2 myValue;
    uniform float uWidth;
    uniform float uHeight;
    uniform float noiseScale2;
    uniform float noiseFactor2;
    uniform vec3 color1;
    uniform vec3 color2;
    
    ${shader.vertexShader}
    `

    shader.fragmentShader = shader.fragmentShader.replace(
        functionHook,
        customFunctionChunk
    )
    shader.fragmentShader = shader.fragmentShader.replace(
        colorHook,
        customFragmentChunk
    )
    shader.vertexShader = shader.vertexShader.replace(
        vertFunctionHook,
        customVertexFunctionChunk
    )
    shader.vertexShader = shader.vertexShader.replace(
        vertHook,
        customVertexChunk
    )
}
export default myMaterial
