export default `
// Linear dodge
    float LinearDodge( in float a, in float b ) {
        return clamp(a + b, 0.0, 1.0);
    }
    // Linear burn
    float LinearBurn( in float a, in float b ) {
        return clamp(a + b - 1.0, 0.0, 1.0);
    }
    // Linear light
    float LinearLight( in float a, in float b ) {
        if (b < 0.5) {
            return LinearBurn(a, (2.0 * b));
        } else {
            return LinearDodge(a, (2.0 * (b - 0.5)));
        }
    }
    // rotate v around axis a by theta
    vec3 rotateAround(vec3 v, vec3 a, float theta) { 
        float c = cos(theta);
        float s = sin(theta);
        float t = 1.0 - c;
        vec3 vr = v * t + cross(a, v) * s + a * dot(a, v) * (1.0 - t);
        return vr;
    }
  `
