precision highp float;

in vec2 vUvMain;
in vec2 vUvMask;
in vec3 vWorldPos;
in vec3 vWorldNormal;
in vec3 vViewDir;   // از vertex گرفتیم

out vec4 fragColor;

uniform vec4 _ShadowColor;
uniform sampler2D _EyeShadowTexture;
uniform sampler2D _FaceMaskE;
uniform float _noise;
uniform float _transparency;

// --- Simplex Noise Implementation (2D) ---
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
    -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);

    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;

    i = mod289(i);
    vec3 p = permute( permute(
                          i.y + vec3(0.0, i1.y, 1.0))
                      + i.x + vec3(0.0, i1.x, 1.0));

    vec3 m = max(0.5 - vec3(dot(x0,x0),
    dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;

    vec3 x = 2.0*fract(p*C.www)-1.0;
    vec3 h = abs(x)-0.5;
    vec3 ox = floor(x+0.5);
    vec3 a0 = x-ox;

    m *= 1.79284291400159 - 0.85373472095314*(a0*a0+h*h);

    vec3 g;
    g.x  = a0.x*x0.x + h.x*x0.y;
    g.yz = a0.yz*x12.xz + h.yz*x12.yw;

    return 130.0*dot(m,g);
}

void main() {
    vec4 texColor = texture(_EyeShadowTexture, vUvMain);
    vec4 mask = texture(_FaceMaskE, vUvMask);

    // رنگ پایه + نویز پرلین
    float noiseVal = snoise(vUvMain * 50.0) * _noise * 0.2;
    vec3 baseColor = _ShadowColor.rgb + noiseVal;

    // Fresnel برای لبه‌ها
    float fresnel = 0.8 * pow(max(1.0 - dot(normalize(vWorldNormal), normalize(vViewDir)), 0.0001), 0.5);

    // خروجی نهایی
    float alpha = texColor.a * mask.r * _ShadowColor.a * _transparency * fresnel;

    fragColor = vec4(baseColor , alpha*0.7);
    //fragColor = vec4(vec3(fresnel,fresnel,fresnel), 1);
}
