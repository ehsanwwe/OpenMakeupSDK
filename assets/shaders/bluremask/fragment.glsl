precision highp float;

uniform sampler2D tScene;   // تصویر اصلی (رندر کل صحنه)
uniform sampler2D tMask;    // ماسک (grayscale)
uniform float transmission;
uniform float roughTransmission;
uniform vec2 resolution;

varying vec2 vScreenUV;
varying vec3 vNormalWS;
varying vec3 vViewDirWS;

varying vec2 vMeshUV;   // ← UV مش

void main() {
    // تصویر اصلی از screenUV خونده میشه
    vec2 uv = clamp(vScreenUV, 0.0, 1.0);

    // ماسک از UV مش خونده میشه
    float mask = texture2D(tMask, vMeshUV).r;

    float blurScale = 4.0;
    float px = (blurScale / resolution.x) * mask;
    float py = (blurScale / resolution.y) * mask;

    vec4 c0 = texture2D(tScene, uv);
    vec4 blur = c0;

    if(mask > 0.0) {
        vec4 cx1 = texture2D(tScene, uv + vec2(px, 0.0));
        vec4 cx2 = texture2D(tScene, uv - vec2(px, 0.0));
        vec4 cy1 = texture2D(tScene, uv + vec2(0.0, py));
        vec4 cy2 = texture2D(tScene, uv - vec2(0.0, py));
        blur = (c0 * 0.4) + (cx1 + cx2 + cy1 + cy2) * 0.15;
    }

    float blurFactor = transmission * mask;
    vec3 finalColor = mix(c0.rgb, blur.rgb, blurFactor);

    gl_FragColor = vec4(finalColor, mask);
}
