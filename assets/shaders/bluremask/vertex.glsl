varying vec2 vScreenUV;
varying vec3 vNormalWS;
varying vec3 vViewDirWS;


varying vec2 vMeshUV;     // UV که به fragment پاس داده می‌شود

void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vec4 clipPos  = projectionMatrix * viewMatrix * worldPos;

    // NDC → [0,1] uv
    vScreenUV = clipPos.xy / clipPos.w * 0.5 + 0.5;

    // پاس دادن UV مش به fragment
    vMeshUV = uv;

    vNormalWS   = normalize(mat3(modelMatrix) * normal);
    vViewDirWS  = normalize(cameraPosition - worldPos.xyz);

    gl_Position = clipPos;
}
