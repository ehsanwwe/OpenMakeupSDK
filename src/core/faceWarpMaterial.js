import { ShaderMaterial, DoubleSide } from 'three';

async function loadSrc(url) {
  const res = await fetch(url);
  return res.text();
}

/**
 * Material that renders the camera video projected onto the face mesh.
 * The vertex shader reads the unmorphed fit (aBasePos) to pick the camera UV,
 * then renders at the morphed position so the image stretches with the mesh.
 *
 * @param {object} assets   asset resolver (createAssetResolver)
 * @param {THREE.Texture} videoTexture  the camera VideoTexture
 * @param {boolean} [flipY=false]  flip V if the projection comes out upside down
 */
export async function loadFaceWarpMat(assets, videoTexture, flipY = false) {
  const vertexShader = await loadSrc(assets.shader('facewarp', 'vertex.glsl'));
  const fragmentShader = await loadSrc(assets.shader('facewarp', 'fragment.glsl'));
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uVideo: { value: videoTexture },
      uFlipY: { value: flipY ? 1.0 : 0.0 },
    },
    side: DoubleSide,
    transparent: false,
    depthTest: true,
    depthWrite: true,
  });
}
