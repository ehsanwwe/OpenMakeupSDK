uniform sampler2D uVideo;
uniform float uFlipY;   // 0.0 or 1.0 — flip V if the projected image is upside down
varying vec2 vUv;

void main() {
  vec2 uv = vec2(vUv.x, mix(vUv.y, 1.0 - vUv.y, uFlipY));
  gl_FragColor = texture2D(uVideo, uv);
}
