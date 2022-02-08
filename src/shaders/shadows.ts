import * as THREE from 'three'

export default {
    uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.lights,
        THREE.UniformsLib.fog,
    ]),
    vertexShader: `
    #include <common>
    #include <fog_pars_vertex>
    #include <shadowmap_pars_vertex>
    varying vec3 transformedNormal;
    
    void main() {
      #include <begin_vertex>
      #include <project_vertex>
      #include <worldpos_vertex>
      #include <shadowmap_vertex>
      #include <fog_vertex>
    }
  `,

    fragmentShader: `
    #include <common>
    #include <packing>
    #include <fog_pars_fragment>
    #include <bsdfs>
    #include <lights_pars_begin>
    #include <shadowmap_pars_fragment>
    #include <shadowmask_pars_fragment>
    #include <dithering_pars_fragment>

    void main() {
      // CHANGE THAT TO YOUR NEEDS
      // ------------------------------
      vec3 finalColor = vec3(0, 0.75, 0);
      vec3 shadowColor = vec3(0, 0, 0);
      float shadowPower = 0.5;
      // ------------------------------
      
      // it just mixes the shadow color with the frag color
      gl_FragColor = vec4( mix(finalColor, shadowColor, (1.0 - getShadowMask() ) * shadowPower), 1.0);
      
      // #include <fog_fragment>
      // #include <dithering_fragment>
    }
  `,
}
