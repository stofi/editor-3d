import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

const textureLoader = new THREE.TextureLoader()
const simplexFShader = `
//
// Description : Array and textureless GLSL 2D/3D/4D simplex
//               noise functions.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : ijm
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
     return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v)
  {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

// Permutations
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients: 7x7 points over a square, mapped onto an octahedron.
// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
  }

// void main() {
//   float n = snoise(vPosition * scale);
//   gl_FragColor = vec4(1.0 * n, 1.0 * n, 1.0 * n, 1.0);
// }
`
const fShader = `

varying vec3 col;
varying vec3 transformedNormal;
// varying vec3 vPosition;
varying vec4 worldPosition;
${simplexFShader}
void main(void)
{
    // n is noise
    float scale = 1.0;
    // random with 7 digits
    vec3 gOffset = vec3(2469.0, 324.0, 666.0);
    vec3 bOffset = vec3(52.0, 7454.0, 456.0);
    vec3 wPScaled = worldPosition.xyz * scale;
    float r = snoise(wPScaled);
    float g = snoise((wPScaled) + gOffset);
    float b = snoise((wPScaled) + bOffset);
    vec3 noise3D = vec3(r,g,b);
    noise3D = noise3D * 0.5 + 0.5;
    noise3D = noise3D * 0.6;
    vec3 noisyNormal = transformedNormal + noise3D;
    // f is dot product of transformed normal and light direction
    float f = dot(noisyNormal, normalize(vec3(0.0, -1.0, 0.0)));
    // map f to 0-1 range
    f = (f + 1.0) / 2.0;
    // reverse f
    // f = 1.0 - f;
    // apply power curve to f
    f = pow(f, 0.9);
    // rock color #48331f
    vec3 rockColor = vec3(0.282,0.2,0.122);
    // grass color #61993e
    vec3 grassColor = vec3(0.38,0.6,0.243);
    // switch between rock and grass based on f value
    float threshold = 0.5;
    vec3 color = mix(rockColor, grassColor, step(threshold, f));


    gl_FragColor = vec4(color, 1.0);
    
    // gl_FragColor = vec4(noise3D, 1.0);
    // gl_FragColor = vec4(noisyNormal, 1.0);


    // gl_FragColor = vec4(f, f, f, 1.0);
    // gl_FragColor = vec4(col, 1.0);
    // gl_FragColor = vec4(normalize(abs(worldPosition.xyz)), 1.0);
    // gl_FragColor = worldPosition;
}

`
const vShader = `
varying vec3 col;
varying vec3 transformedNormal;
varying vec3 vPosition;
varying vec4 worldPosition;

void main() {
vPosition = normalize(position);
  transformedNormal = normal;
  col = position;
  worldPosition = modelMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}
  
`

const uniforms = {
    uWidth: { value: 0 },
    uHeight: { value: 0 },
}
const setUniforms = (uniforms: any, width: number, height: number) => {
    uniforms.uWidth.value = width
    uniforms.uHeight.value = height
}
window.addEventListener('resize', () => {
    setUniforms(uniforms, window.innerWidth, window.innerHeight)
})
setUniforms(uniforms, window.innerWidth, window.innerHeight)

const material = new THREE.ShaderMaterial({
    vertexShader: vShader,
    fragmentShader: fShader,
    uniforms,
    vertexColors: true,
})

export default class Tiles {
    loader = new GLTFLoader()
    lib = new Map()
    loaded = false
    material = material
    load() {
        return new Promise((resolve, reject) => {
            this.loader.load(
                './tiles2.gltf',
                (gltf: GLTF) => {
                    gltf.scene.children.forEach((child, index) => {
                        if (child.type === 'Mesh') {
                            const mesh = child as THREE.Mesh
                            const saturation =
                                Math.floor(
                                    (index / gltf.scene.children.length) * 1000
                                ) % 100

                            const colors = new Float32Array(
                                mesh.geometry.attributes.position.count * 3
                            )
                            const color = new THREE.Color(
                                `hsl(${
                                    (index * 360) / gltf.scene.children.length
                                }, ${saturation}%, 50%)`
                            )

                            for (
                                let i = 0;
                                i < mesh.geometry.attributes.position.count;
                                i++
                            ) {
                                const i3 = i * 3
                                colors[i3] = color.r
                                colors[i3 + 1] = color.g
                                colors[i3 + 2] = color.b
                            }
                            mesh.geometry.setAttribute(
                                'color',
                                new THREE.BufferAttribute(colors, 3)
                            )
                            mesh.material = this.material
                            mesh.scale.multiplyScalar(-0.25)
                            mesh.scale.y *= -1
                            mesh.position.set(0, 0, 0)
                            mesh.castShadow = true
                            mesh.receiveShadow = true
                            // mesh.rotation.y += Math.PI

                            this.lib.set(child.name, mesh)
                        }
                    })
                    this.loaded = true
                    resolve(true)
                },
                undefined,
                function (error) {
                    console.error(error)
                    reject(error)
                }
            )
        })
    }
    onLoad(gltf: GLTF) {
        gltf.scene.children.forEach((child, index) => {
            if (child.type === 'Mesh') {
                const mesh = child as THREE.Mesh
                mesh.material = this.material
                // const geometry = (child as THREE.Mesh).geometry
                // const rotation = (child as THREE.Mesh).rotation
                // const scale = (child as THREE.Mesh).scale
                // // create a new mesh with the new material
                // const mesh = new THREE.Mesh(geometry, this.material)
                // mesh.rotation.set(rotation.x, rotation.y, rotation.z)
                // mesh.scale.set(scale.x / 2, scale.y / 2, scale.z / 2)
                mesh.scale.set(0.25, 0.25, 0.25)

                this.lib.set(child.name, mesh)
            }
        })
        this.loaded = true
    }
}
