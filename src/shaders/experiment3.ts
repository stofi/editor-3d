import * as THREE from 'three'
import simplex from './simplex'

const myMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xff22ff,
    metalness: 0,
    roughness: 1,
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
    vec3 wPScaled = vWorldPosition.xyz * pow(0.5, 0.6);
    float r = snoise(wPScaled);
    float g = snoise((wPScaled) + gOffset);
    float b = snoise((wPScaled) + bOffset);
    // diffuseColor.rgb = vec3(r, 0.0, 0.0);
    vec3 noise3D = vec3(r,g,b) * 0.1;
    float y = mod(vWorldPosition+noise3D, 1.0).y;
    diffuseColor.rgb = vec3(y, y, y);
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
myMaterial.userData.myValue = { value: 2 } //this will be our input, the system will just reference it

myMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.myValue = myMaterial.userData.myValue //pass this input by reference

    //prepend the input to the shader
    shader.fragmentShader = 'uniform vec2 myValue;\n' + shader.fragmentShader //the rest is the same
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
