precision highp float;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

varying vec2 vUv;

void main() {
    // تکسچر رو ۹۰ درجه بچرخونیم (حول مبدا 0..1)
    vUv = vec2(uv.y, 1.0 - uv.x);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
