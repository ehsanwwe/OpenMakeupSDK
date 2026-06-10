precision highp float;

in vec3 position;
in vec2 uv;
in vec2 uvEyeShadow;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

out vec2 vUv;
out vec2 vUv2;

void main() {
    vUv = uv;
    vUv2 = uvEyeShadow;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
