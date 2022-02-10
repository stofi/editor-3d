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
    diffuseColor.rgb = myValue;
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

    float g = (snoise(pScaled.xyz + vec3(0.0, 100.0, 0.0)));
    vec3 noise3D = vec3(0,g,0) * -0.6;
    
    float horizontal = 1.0 - (dot(normal, vec3(0.0, 1.0, 0.0))) ;
    
    float sigmoid = plot(horizontal,pow(horizontal,1.5));
    float y = mod(mvp.xyz + vec3(0.0,0.5,0.0),1.0).y;
    // t is y mapped from fromMin, fromMax to toMin, toMax
    // float fromMin = 0.45;
    // float fromMax = 0.33;
    // float toMin = 0.0;
    // float toMax = 0.9;
    float t = (y - fromMin) / (fromMax - fromMin);
    // t is now mapped from 0,1 to toMin, toMax
    t = t * (toMax - toMin) + toMin;
    // t is now mapped from toMin, toMax to 0,1

    t = t * sigmoid * noiseScale2 * 0.1;
    vec3 displacement = (noise3D) * t;
    myValue = color2;

    // transformed += displacement;
#endif
${vertHook}
`

const customVertexFunctionChunk = `
#ifdef USE_CUSTOM 
    ${simplex}
    float plot(float st, float pct){
        return  smoothstep( pct-0.02, pct, st);
      }
#endif
${vertFunctionHook}
`

myMaterial.defines.USE_CUSTOM = '1'
myMaterial.userData = {
    myValue: { type: 'v3', value: new THREE.Vector3(0, 0, 0) },
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
        value: 7.0,
    },
    noiseFactor2: {
        type: 'f',
        value: 0.5,
    },
    fromMin: {
        type: 'f',
        value: 0.45,
    },
    fromMax: {
        type: 'f',
        value: 0.33,
    },
    toMin: {
        type: 'f',
        value: 0.0,
    },
    toMax: {
        type: 'f',
        value: 0.9,
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
    shader.uniforms.fromMin = myMaterial.userData.fromMin
    shader.uniforms.fromMax = myMaterial.userData.fromMax
    shader.uniforms.toMin = myMaterial.userData.toMin
    shader.uniforms.toMax = myMaterial.userData.toMax

    shader.fragmentShader = `
    in vec3 myValue;
    uniform float uWidth;
    uniform float uHeight;
    uniform float noiseScale;
    uniform float noiseFactor;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform float fromMin;
    uniform float fromMax;
    uniform float toMin;
    uniform float toMax;

    ${shader.fragmentShader}
    `
    shader.vertexShader = `
    attribute vec3 color2;
    out vec3 myValue;
    uniform float uWidth;
    uniform float uHeight;
    uniform float noiseScale2;
    uniform float noiseFactor2;
    uniform float fromMin;
    uniform float fromMax;
    uniform float toMin;
    uniform float toMax;
    uniform vec3 color1;
    
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
