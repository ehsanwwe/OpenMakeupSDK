precision highp float;

in vec2 vUv;
in vec3 vWorldPos;
in vec3 vWorldNormal;

uniform vec4 _MainColor;
uniform sampler2D _Mask;
uniform vec4 _Mask_ST; // xy = scale, zw = offset
uniform float _shedat;
uniform vec3 uCameraPosition;

out vec4 outColor;

void main() {
    // محاسبه UV با scale و offset
    vec2 uvMask = vUv * _Mask_ST.xy + _Mask_ST.zw;

    // جهت دید در فضای جهانی
    vec3 viewDir = normalize(uCameraPosition - vWorldPos);

    // Fresnel
    float fresnelNdotV = dot(normalize(vWorldNormal), viewDir);
    float fresnel = 0.0 + 0.8 * pow(max(1.0 - fresnelNdotV, 0.0001), 1.0);

    // نمونه‌گیری از ماسک
    float maskVal = texture(_Mask, uvMask).r;

    // آلفا بر اساس ماسک و فِرِنل
    float alpha = maskVal * fresnel;

    // رنگ نهایی
    vec4 baseColor = vec4(_MainColor.rgb, alpha*_shedat*0.5);

    outColor = baseColor ;//* _shedat;
    //gl_FragDepth = 0.3;

}
