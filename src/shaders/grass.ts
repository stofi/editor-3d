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
    varying float vReflectionFactor;
    void main() {
    vPosition = normalize(position);

      float fresnelBias= 0.1;
      float fresnelScale= 1.0;
      float fresnelPower= 2.0;

      vNormal = normal;
      transformedNormal = normalMatrix * normal;
      vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    
      worldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );
    
      col = position;
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
    // varying vec3 vPosition;
    varying vec4 worldPosition;
    varying float vReflectionFactor;

    uniform float noiseScale;
    uniform float noiseFactor;


    ${simplex}
    void main(void)
    {
        // n is noise
        // random with 7 digits
        vec3 gOffset = vec3(2469.0, 324.0, 666.0);
        vec3 bOffset = vec3(52.0, 7454.0, 456.0);
        vec3 wPScaled = worldPosition.xyz * pow(noiseScale, 0.6);
        float r = snoise(wPScaled);
        float g = snoise((wPScaled) + gOffset);
        float b = snoise((wPScaled) + bOffset);
        vec3 noise3D = vec3(r,g,b);
        noise3D = noise3D * 2.0 - 1.0;
        noise3D = noise3D * noiseFactor;
        vec3 direction = normalize(vec3(0.0, -1.0, 0.0));
        // f is dot product of transformed normal and light direction
        float f = dot(worldNormal, direction);
        // map f to 0-1 range
        f = (f + 1.0) / 2.0;
        // reverse f
        // f = 1.0 - f;
        // apply power curve to f
        // f = smoothstep(0.0, 1.0, f);
        f = pow(f, 1.1);


        // rock color #48331f
        vec3 rockColor = vec3(0.282,0.2,0.122);
        // grass color #61993e
        vec3 grassColor = vec3(0.38,0.6,0.243);
        // switch between rock and grass based on f value
        float threshold = 0.5;
        
        float blend = r * 0.5 + 0.5;
        float target = f;
        
        float l = (blend * target + target);
        l = smoothstep(0.0, 1.0, l);
        
        vec3 color = mix(grassColor,rockColor, l);
        gl_FragColor = vec4(color, 1.0);

        vec3 fresnelColor = vec3(0.0, 0.0, 0.0);
        // gl_FragColor = vec4(mix(color, fresnelColor, vec3(clamp( vReflectionFactor, 0.0, 1.0 ))), 1.0);
        
        // gl_FragColor = vec4(abs(noise3D), 1.0);
        // gl_FragColor = vec4(noisyNormal, 1.0);
        // gl_FragColor = vec4(worldNormal, 1.0);
    
    
        // gl_FragColor = vec4(col, 1.0);
        // gl_FragColor = vec4(normalize(abs(worldPosition.xyz)), 1.0);
        // gl_FragColor = worldPosition;
        // gl_FragColor = vec4(worldNormal.xyz, 1.0);
        // gl_FragColor = vec4(normalize(abs(worldNormal.xyz)), 1.0);
    }
  `,
}
