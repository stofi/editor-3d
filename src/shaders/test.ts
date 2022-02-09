import * as THREE from 'three'
import simplex from './simplex'

export default {
    uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.lights,
        THREE.UniformsLib.fog,
        {},
    ]),

    vertexShader: `
    varying vec3 col;
    varying vec3 transformedNormal;
    varying vec3 vNormal;
    varying vec3 worldNormal;
    varying vec3 vPosition;
    varying vec4 worldPosition;
    varying vec4 worldDirection;
    varying float vReflectionFactor;
    #if NUM_DIR_LIGHTS > 0
        struct DirectionalLight {
            vec3 direction;
            vec3 color;
            int shadow;
            float shadowBias;
            float shadowRadius;
            vec2 shadowMapSize;
        };
        uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
    #endif
    void main() {
    vPosition = normalize(position);

      float fresnelBias= 0.1;
      float fresnelScale= 1.0;
      float fresnelPower= 2.0;

      vNormal = normal;
      transformedNormal = normalMatrix * normal;
      vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    
      worldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );
      col = directionalLights[0].direction;
      worldPosition = modelMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      vec3 I = worldPosition.xyz - cameraPosition;

      vReflectionFactor = fresnelBias + fresnelScale * pow( 1.0 + dot( normalize( I ), worldNormal ), fresnelPower );
    }
  `,

    fragmentShader: `
    varying vec3 col;
    varying vec3 transformedNormal;
    varying vec3 worldNormal;
    varying vec3 vPosition;
    varying vec4 worldPosition;
    varying vec4 worldDirection;
    varying float vReflectionFactor;

    uniform float noiseScale;
    uniform float noiseFactor;


    ${simplex}
    void main(void)
    {
      vec3 gOffset = vec3(2469.0, 324.0, 666.0);
      vec3 bOffset = vec3(52.0, 7454.0, 456.0);
      vec3 wPScaled = worldPosition.xyz * pow(noiseScale, 0.6);
      float r = snoise(wPScaled);
      float g = snoise((wPScaled) + gOffset);
      float b = snoise((wPScaled) + bOffset);
      vec3 noise3D = vec3(r,g,b);
      vec3 noise3DScaled = noise3D * noiseFactor;

      vec3 worldShift = mod(worldPosition.xyz+ vec3(0.5, 0.46, 0.5) ,1.0);
      float smoothTops = worldShift.y;
     
      float topMask = worldNormal.y > 0.0 ? worldNormal.y : 0.0;
      float bottomMask = worldNormal.y < 0.0 ? -worldNormal.y : 0.0;
      // smoothTops and not bottomFace
      float topFaceMask = bottomMask >= 0.0 ? (1.0-bottomMask) * smoothTops : smoothTops;
      gl_FragColor = vec4(vec3(topFaceMask,topFaceMask,topFaceMask), 1.0);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
}
