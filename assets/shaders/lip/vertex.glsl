precision highp float;

in vec3 position;
in vec3 normal;
in vec2 uv;
in vec2 uv2; // اگر geometry نداشته باشد صفر خواهد بود

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;

out vec2 vUv0;
out vec2 vUv2;
out vec3 vWorldPos;
out vec3 vWorldNormal;
out vec4 vClipPos;
out vec3 vLocalPos;


in vec2 uvLip;   // از geometry میاد
out vec2 vUvLip; // میره به فرگمنت

void main() {
    vUvLip = uvLip;
    vUv0 = uv;
    vUv2 = uv2;
    vLocalPos = position;

    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;

    // توجه: برای مقیاس‌های غیر یکنواخت، world normal ایده‌آل invTrans(model) است.
    // این تقریب در اکثر موارد کافی است:
    vWorldNormal = normalize(mat3(modelMatrix) * normal);

    vec4 viewPos = viewMatrix * worldPos;
    vClipPos = projectionMatrix * viewPos;

    gl_Position = vClipPos;
}