precision highp float;

in vec2 vUv0;
in vec2 vUv2;
in vec2 vUvLip;
in vec3 vWorldPos;
in vec3 vWorldNormal;
in vec4 vClipPos;
in vec3 vLocalPos;

out vec4 fragColor;

// ----------------------
// Uniforms (مطابق Unity)
// ----------------------
uniform vec4 _MainColor;

uniform sampler2D _TextureSample1;
uniform vec4 _TextureSample1_ST;

uniform sampler2D _brightTexture;
uniform vec4 _brightTexture_ST;

uniform float _shine;
uniform float _bright;

uniform sampler2D _lipReflection;
uniform vec4 _lipReflection_ST;
uniform sampler2D _lipReflectionClose;
uniform vec4 _lipReflectionClose_ST;
uniform float _lipOpen;

uniform float _gradientSize;
uniform float _GredientSharpness;

uniform vec3 cameraPosition;

// ----------------------
// Simplex noise 2D (هم‌ارز)
// ----------------------
vec3 mod2D289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec2 mod2D289(vec2 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec3 permute(vec3 x){ return mod2D289(((x*34.0)+1.0)*x); }

float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
    -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod2D289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                     + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m *= m; m *= m;
    vec3 x = 2.0*fract(p* C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314*(a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz* x12.xz + h.yz* x12.yw;
    return 130.0 * dot(m, g);
}

// UV transform: uv * ST.xy + ST.zw
vec2 uvST(vec2 uv, vec4 ST){ return uv * ST.xy + ST.zw; }

void main(){
    // ----------------------
    // گرادیان بازتاب + اسکرین (تقریبِ عملکرد ASE_ComputeGrabScreenPos + WorldReflectionVector)
    // ----------------------
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(vWorldPos - cameraPosition);         // از دوربین به سطح
    vec3 R = reflect(V, N);                                  // بازتاب جهانی
    vec2 ndc = vClipPos.xy / vClipPos.w;                     // [-1..1]
    vec2 mixVec = ndc + R.xy;                                // ترکیب شبیه به جمع برداری در کُد Unity
    float grad = clamp((length(mixVec) - _gradientSize) * _GredientSharpness, 0.0, 1.0);

    // ----------------------
    // UV ها
    // ----------------------
    vec2 uv1 = uvST(vUv0, _TextureSample1_ST);
    // اگر uv2 وجود نداشت، vUv2 صفر است؛ در عمل می‌توانید از uniform برای کنترل fallback استفاده کنید
    vec2 uvBright = uvST(vUv2, _brightTexture_ST);
    vec2 uvLip    = uvST(vUvLip, _lipReflection_ST);
    vec2 uvLipC   = uvST(vUvLip, _lipReflectionClose_ST);

    // ----------------------
    // Perlin برای بُعد روشنایی (معادل simplePerlin2D139)
    // ----------------------
    float n = snoise((vLocalPos.xy * -1.0) * 20.0);
    n = n * 0.5 + 0.5; // به [0..1]
    vec2 nUV = vec2(n);

    // clampResult129 = clamp( ( -tex(bright,-uvBright).r + tex(bright, nUV).r ) / 2 , 0 , 0.5 )
    float brightA = texture(_brightTexture, -uvBright).r;
    float brightB = texture(_brightTexture,  nUV     ).r;
    float brightMix = clamp( ( -brightA + brightB ) * 0.5, 0.0, 0.5 );
    float brightTerm = brightMix * _bright;

    // ----------------------
    // Emission (Unlit)
    // o.Emission = _MainColor + grad + (tex1.r * _shine) + brightTerm
    // ----------------------
    float tex1r = texture(_TextureSample1, uv1).r;
    vec3 emission = _MainColor.rgb
    + vec3(grad)
    + vec3(tex1r * _shine)
    + vec3(brightTerm);

    // ----------------------
    // آلفا از دو تکسچر لب (lerp توسط _lipOpen)


    float a0 = texture(_lipReflection,      uvLip ).r;
    float a1 = texture(_lipReflectionClose, uvLipC).r;
    float alpha = mix(a0, a1, _lipOpen);
    fragColor = vec4(emission,alpha*0.4);
    //fragColor = vec4(_lipOpen, 0.0, 1.0 - _lipOpen, 1.0);
//
//    float alpha = texture(_lipReflection,      vUv0).r;
//    float a0 = texture(_lipReflection, vUvLip).r;
//    fragColor = vec4(texture(_lipReflection, vUvLip).rgb,a0);

}
