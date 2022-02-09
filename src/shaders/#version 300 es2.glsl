 #version 300 es
 precision mediump sampler2DArray;
 #define attribute in
 #define varying out
 #define texture2D texture
 precision highp float;
 precision highp int;
 #define HIGH_PRECISION
 #define SHADER_NAME MeshPhysicalMaterial
 #define STANDARD 
 #define PHYSICAL 
 #define USE_CUSTOM 1
 #define VERTEX_TEXTURES
 #define MAX_BONES 0
 #define USE_TRANSMISSION
 #define BONE_TEXTURE
 #define USE_SHADOWMAP
 #define SHADOWMAP_TYPE_PCF_SOFT
 uniform mat4 modelMatrix;
 uniform mat4 modelViewMatrix;
 uniform mat4 projectionMatrix;
 uniform mat4 viewMatrix;
 uniform mat3 normalMatrix;
 uniform vec3 cameraPosition;
 uniform bool isOrthographic;
 #ifdef USE_INSTANCING
 	attribute mat4 instanceMatrix;
 #endif
 #ifdef USE_INSTANCING_COLOR
 	attribute vec3 instanceColor;
 #endif
 attribute vec3 position;
 attribute vec3 normal;
 attribute vec2 uv;
 #ifdef USE_TANGENT
 	attribute vec4 tangent;
 #endif
 #if defined( USE_COLOR_ALPHA )
 	attribute vec4 color;
 #elif defined( USE_COLOR )
 	attribute vec3 color;
 #endif
 #if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )
 	attribute vec3 morphTarget0;
 	attribute vec3 morphTarget1;
 	attribute vec3 morphTarget2;
 	attribute vec3 morphTarget3;
 	#ifdef USE_MORPHNORMALS
 		attribute vec3 morphNormal0;
 		attribute vec3 morphNormal1;
 		attribute vec3 morphNormal2;
 		attribute vec3 morphNormal3;
 	#else
 		attribute vec3 morphTarget4;
 		attribute vec3 morphTarget5;
 		attribute vec3 morphTarget6;
 		attribute vec3 morphTarget7;
 	#endif
 #endif
 #ifdef USE_SKINNING
 	attribute vec4 skinIndex;
 	attribute vec4 skinWeight;
 #endif
 
 
     uniform vec2 myValue;
     uniform float uWidth;
     uniform float uHeight;
     uniform float noiseScale;
     uniform float noiseFactor;
     uniform vec3 color1;
     uniform vec3 color2;
     
     #define STANDARD
 varying vec3 vViewPosition;
 #ifdef USE_TRANSMISSION
 	varying vec3 vWorldPosition;
 #endif
 
 #ifdef USE_CUSTOM 
     
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
 
 
 #endif
 #define PI 3.141592653589793
 #define PI2 6.283185307179586
 #define PI_HALF 1.5707963267948966
 #define RECIPROCAL_PI 0.3183098861837907
 #define RECIPROCAL_PI2 0.15915494309189535
 #define EPSILON 1e-6
 #ifndef saturate
 #define saturate( a ) clamp( a, 0.0, 1.0 )
 #endif
 #define whiteComplement( a ) ( 1.0 - saturate( a ) )
 float pow2( const in float x ) { return x*x; }
 float pow3( const in float x ) { return x*x*x; }
 float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
 float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
 float average( const in vec3 color ) { return dot( color, vec3( 0.3333 ) ); }
 highp float rand( const in vec2 uv ) {
 	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
 	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
 	return fract( sin( sn ) * c );
 }
 #ifdef HIGH_PRECISION
 	float precisionSafeLength( vec3 v ) { return length( v ); }
 #else
 	float precisionSafeLength( vec3 v ) {
 		float maxComponent = max3( abs( v ) );
 		return length( v / maxComponent ) * maxComponent;
 	}
 #endif
 struct IncidentLight {
 	vec3 color;
 	vec3 direction;
 	bool visible;
 };
 struct ReflectedLight {
 	vec3 directDiffuse;
 	vec3 directSpecular;
 	vec3 indirectDiffuse;
 	vec3 indirectSpecular;
 };
 struct GeometricContext {
 	vec3 position;
 	vec3 normal;
 	vec3 viewDir;
 #ifdef USE_CLEARCOAT
 	vec3 clearcoatNormal;
 #endif
 };
 vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
 	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
 }
 vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
 	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
 }
 mat3 transposeMat3( const in mat3 m ) {
 	mat3 tmp;
 	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
 	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
 	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
 	return tmp;
 }
 float linearToRelativeLuminance( const in vec3 color ) {
 	vec3 weights = vec3( 0.2126, 0.7152, 0.0722 );
 	return dot( weights, color.rgb );
 }
 bool isPerspectiveMatrix( mat4 m ) {
 	return m[ 2 ][ 3 ] == - 1.0;
 }
 vec2 equirectUv( in vec3 dir ) {
 	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
 	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
 	return vec2( u, v );
 }
 
 #ifdef USE_UV
 	#ifdef UVS_VERTEX_ONLY
 		vec2 vUv;
 	#else
 		varying vec2 vUv;
 	#endif
 	uniform mat3 uvTransform;
 #endif
 #if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
 	attribute vec2 uv2;
 	varying vec2 vUv2;
 	uniform mat3 uv2Transform;
 #endif
 #ifdef USE_DISPLACEMENTMAP
 	uniform sampler2D displacementMap;
 	uniform float displacementScale;
 	uniform float displacementBias;
 #endif
 #if defined( USE_COLOR_ALPHA )
 	varying vec4 vColor;
 #elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
 	varying vec3 vColor;
 #endif
 #ifdef USE_FOG
 	varying float vFogDepth;
 #endif
 #ifndef FLAT_SHADED
 	varying vec3 vNormal;
 	#ifdef USE_TANGENT
 		varying vec3 vTangent;
 		varying vec3 vBitangent;
 	#endif
 #endif
 #ifdef USE_MORPHTARGETS
 	uniform float morphTargetBaseInfluence;
 	#ifdef MORPHTARGETS_TEXTURE
 		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
 		uniform sampler2DArray morphTargetsTexture;
 		uniform vec2 morphTargetsTextureSize;
 		vec3 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset, const in int stride ) {
 			float texelIndex = float( vertexIndex * stride + offset );
 			float y = floor( texelIndex / morphTargetsTextureSize.x );
 			float x = texelIndex - y * morphTargetsTextureSize.x;
 			vec3 morphUV = vec3( ( x + 0.5 ) / morphTargetsTextureSize.x, y / morphTargetsTextureSize.y, morphTargetIndex );
 			return texture( morphTargetsTexture, morphUV ).xyz;
 		}
 	#else
 		#ifndef USE_MORPHNORMALS
 			uniform float morphTargetInfluences[ 8 ];
 		#else
 			uniform float morphTargetInfluences[ 4 ];
 		#endif
 	#endif
 #endif
 #ifdef USE_SKINNING
 	uniform mat4 bindMatrix;
 	uniform mat4 bindMatrixInverse;
 	#ifdef BONE_TEXTURE
 		uniform highp sampler2D boneTexture;
 		uniform int boneTextureSize;
 		mat4 getBoneMatrix( const in float i ) {
 			float j = i * 4.0;
 			float x = mod( j, float( boneTextureSize ) );
 			float y = floor( j / float( boneTextureSize ) );
 			float dx = 1.0 / float( boneTextureSize );
 			float dy = 1.0 / float( boneTextureSize );
 			y = dy * ( y + 0.5 );
 			vec4 v1 = texture2D( boneTexture, vec2( dx * ( x + 0.5 ), y ) );
 			vec4 v2 = texture2D( boneTexture, vec2( dx * ( x + 1.5 ), y ) );
 			vec4 v3 = texture2D( boneTexture, vec2( dx * ( x + 2.5 ), y ) );
 			vec4 v4 = texture2D( boneTexture, vec2( dx * ( x + 3.5 ), y ) );
 			mat4 bone = mat4( v1, v2, v3, v4 );
 			return bone;
 		}
 	#else
 		uniform mat4 boneMatrices[ MAX_BONES ];
 		mat4 getBoneMatrix( const in float i ) {
 			mat4 bone = boneMatrices[ int(i) ];
 			return bone;
 		}
 	#endif
 #endif
 #ifdef USE_SHADOWMAP
 	#if 1 > 0
 		uniform mat4 directionalShadowMatrix[ 1 ];
 		varying vec4 vDirectionalShadowCoord[ 1 ];
 		struct DirectionalLightShadow {
 			float shadowBias;
 			float shadowNormalBias;
 			float shadowRadius;
 			vec2 shadowMapSize;
 		};
 		uniform DirectionalLightShadow directionalLightShadows[ 1 ];
 	#endif
 	#if 0 > 0
 		uniform mat4 spotShadowMatrix[ 0 ];
 		varying vec4 vSpotShadowCoord[ 0 ];
 		struct SpotLightShadow {
 			float shadowBias;
 			float shadowNormalBias;
 			float shadowRadius;
 			vec2 shadowMapSize;
 		};
 		uniform SpotLightShadow spotLightShadows[ 0 ];
 	#endif
 	#if 0 > 0
 		uniform mat4 pointShadowMatrix[ 0 ];
 		varying vec4 vPointShadowCoord[ 0 ];
 		struct PointLightShadow {
 			float shadowBias;
 			float shadowNormalBias;
 			float shadowRadius;
 			vec2 shadowMapSize;
 			float shadowCameraNear;
 			float shadowCameraFar;
 		};
 		uniform PointLightShadow pointLightShadows[ 0 ];
 	#endif
 #endif
 #ifdef USE_LOGDEPTHBUF
 	#ifdef USE_LOGDEPTHBUF_EXT
 		varying float vFragDepth;
 		varying float vIsPerspective;
 	#else
 		uniform float logDepthBufFC;
 	#endif
 #endif
 #if 0 > 0
 	varying vec3 vClipPosition;
 #endif
 void main() {
 #ifdef USE_UV
 	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
 #endif
 #if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
 	vUv2 = ( uv2Transform * vec3( uv2, 1 ) ).xy;
 #endif
 #if defined( USE_COLOR_ALPHA )
 	vColor = vec4( 1.0 );
 #elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
 	vColor = vec3( 1.0 );
 #endif
 #ifdef USE_COLOR
 	vColor *= color;
 #endif
 #ifdef USE_INSTANCING_COLOR
 	vColor.xyz *= instanceColor.xyz;
 #endif
 vec3 objectNormal = vec3( normal );
 #ifdef USE_TANGENT
 	vec3 objectTangent = vec3( tangent.xyz );
 #endif
 #ifdef USE_MORPHNORMALS
 	objectNormal *= morphTargetBaseInfluence;
 	#ifdef MORPHTARGETS_TEXTURE
 		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
 			if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1, 2 ) * morphTargetInfluences[ i ];
 		}
 	#else
 		objectNormal += morphNormal0 * morphTargetInfluences[ 0 ];
 		objectNormal += morphNormal1 * morphTargetInfluences[ 1 ];
 		objectNormal += morphNormal2 * morphTargetInfluences[ 2 ];
 		objectNormal += morphNormal3 * morphTargetInfluences[ 3 ];
 	#endif
 #endif
 #ifdef USE_SKINNING
 	mat4 boneMatX = getBoneMatrix( skinIndex.x );
 	mat4 boneMatY = getBoneMatrix( skinIndex.y );
 	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
 	mat4 boneMatW = getBoneMatrix( skinIndex.w );
 #endif
 #ifdef USE_SKINNING
 	mat4 skinMatrix = mat4( 0.0 );
 	skinMatrix += skinWeight.x * boneMatX;
 	skinMatrix += skinWeight.y * boneMatY;
 	skinMatrix += skinWeight.z * boneMatZ;
 	skinMatrix += skinWeight.w * boneMatW;
 	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
 	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
 	#ifdef USE_TANGENT
 		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
 	#endif
 #endif
 vec3 transformedNormal = objectNormal;
 #ifdef USE_INSTANCING
 	mat3 m = mat3( instanceMatrix );
 	transformedNormal /= vec3( dot( m[ 0 ], m[ 0 ] ), dot( m[ 1 ], m[ 1 ] ), dot( m[ 2 ], m[ 2 ] ) );
 	transformedNormal = m * transformedNormal;
 #endif
 transformedNormal = normalMatrix * transformedNormal;
 #ifdef FLIP_SIDED
 	transformedNormal = - transformedNormal;
 #endif
 #ifdef USE_TANGENT
 	vec3 transformedTangent = ( modelViewMatrix * vec4( objectTangent, 0.0 ) ).xyz;
 	#ifdef FLIP_SIDED
 		transformedTangent = - transformedTangent;
 	#endif
 #endif
 #ifndef FLAT_SHADED
 	vNormal = normalize( transformedNormal );
 	#ifdef USE_TANGENT
 		vTangent = normalize( transformedTangent );
 		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
 	#endif
 #endif
 vec3 transformed = vec3( position );
 	
 #ifdef USE_CUSTOM 
     vec4 mvp = vec4(transformed,1.0);
     vec4 glp = vec4(0.0);
     #ifdef USE_INSTANCING
         mvp = instanceMatrix * mvp;
     #endif
     mvp = modelViewMatrix * mvp;
     glp = projectionMatrix * mvp;
     glp = worldMatrix * mvp;
     float r = snoise(mvp.xyz);
     transformed += vec3(0, r, 0) * noiseScale;
 #endif
 #ifdef USE_MORPHTARGETS
 	transformed *= morphTargetBaseInfluence;
 	#ifdef MORPHTARGETS_TEXTURE
 		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
 			#ifndef USE_MORPHNORMALS
 				if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0, 1 ) * morphTargetInfluences[ i ];
 			#else
 				if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0, 2 ) * morphTargetInfluences[ i ];
 			#endif
 		}
 	#else
 		transformed += morphTarget0 * morphTargetInfluences[ 0 ];
 		transformed += morphTarget1 * morphTargetInfluences[ 1 ];
 		transformed += morphTarget2 * morphTargetInfluences[ 2 ];
 		transformed += morphTarget3 * morphTargetInfluences[ 3 ];
 		#ifndef USE_MORPHNORMALS
 			transformed += morphTarget4 * morphTargetInfluences[ 4 ];
 			transformed += morphTarget5 * morphTargetInfluences[ 5 ];
 			transformed += morphTarget6 * morphTargetInfluences[ 6 ];
 			transformed += morphTarget7 * morphTargetInfluences[ 7 ];
 		#endif
 	#endif
 #endif
 
 #ifdef USE_SKINNING
 	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
 	vec4 skinned = vec4( 0.0 );
 	skinned += boneMatX * skinVertex * skinWeight.x;
 	skinned += boneMatY * skinVertex * skinWeight.y;
 	skinned += boneMatZ * skinVertex * skinWeight.z;
 	skinned += boneMatW * skinVertex * skinWeight.w;
 	transformed = ( bindMatrixInverse * skinned ).xyz;
 #endif
 #ifdef USE_DISPLACEMENTMAP
 	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vUv ).x * displacementScale + displacementBias );
 #endif
 vec4 mvPosition = vec4( transformed, 1.0 );
 #ifdef USE_INSTANCING
 	mvPosition = instanceMatrix * mvPosition;
 #endif
 mvPosition = modelViewMatrix * mvPosition;
 gl_Position = projectionMatrix * mvPosition;
 #ifdef USE_LOGDEPTHBUF
 	#ifdef USE_LOGDEPTHBUF_EXT
 		vFragDepth = 1.0 + gl_Position.w;
 		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
 	#else
 		if ( isPerspectiveMatrix( projectionMatrix ) ) {
 			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
 			gl_Position.z *= gl_Position.w;
 		}
 	#endif
 #endif
 #if 0 > 0
 	vClipPosition = - mvPosition.xyz;
 #endif
 	vViewPosition = - mvPosition.xyz;
 #if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION )
 	vec4 worldPosition = vec4( transformed, 1.0 );
 	#ifdef USE_INSTANCING
 		worldPosition = instanceMatrix * worldPosition;
 	#endif
 	worldPosition = modelMatrix * worldPosition;
 #endif
 #ifdef USE_SHADOWMAP
 	#if 1 > 0 || 0 > 0 || 0 > 0
 		vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
 		vec4 shadowWorldPosition;
 	#endif
 	#if 1 > 0
 	
 		shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ 0 ].shadowNormalBias, 0 );
 		vDirectionalShadowCoord[ 0 ] = directionalShadowMatrix[ 0 ] * shadowWorldPosition;
 	
 	#endif
 	#if 0 > 0
 	
 	#endif
 	#if 0 > 0
 	
 	#endif
 #endif
 #ifdef USE_FOG
 	vFogDepth = - mvPosition.z;
 #endif
 #ifdef USE_TRANSMISSION
 	vWorldPosition = worldPosition.xyz;
 #endif
 }
     