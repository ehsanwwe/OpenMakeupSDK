// ShaderMaterial auto-declares: position, projectionMatrix, modelViewMatrix.
attribute vec3 aBasePos;   // unmorphed landmark-fit position (per frame)
varying vec2 vUv;

void main() {
  // Where this vertex sits on screen BEFORE morphing -> sample the camera there.
  vec4 baseClip = projectionMatrix * modelViewMatrix * vec4(aBasePos, 1.0);
  vec2 ndc = baseClip.xy / baseClip.w;
  vUv = ndc * 0.5 + 0.5;

  // Render at the MORPHED position -> the sampled image stretches with the mesh.
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
