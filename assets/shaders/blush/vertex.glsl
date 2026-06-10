precision highp float;

in vec3 position;
in vec2 uv;
in vec2 uv2;   // UV برای ماسک
in vec2 uv3;   // UV برای تکسچر اصلی
in vec3 normal;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform vec3 uCameraPosition;   // حتماً تو JS هم ست کن

out vec2 vUvMain;
out vec2 vUvMask;
out vec3 vWorldPos;
out vec3 vWorldNormal;
out vec3 vViewDir;  // اضافه برای Fresnel

void main() {
    vUvMain = uv2;       // معادل _MainTexture
    vUvMask = uv;        // معادل _FaceMaskE

    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;

    vWorldNormal = normalize(mat3(modelMatrix) * normal);

    // جهت دید (از نقطه به دوربین)
    vViewDir = normalize(uCameraPosition - vWorldPos);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
}
