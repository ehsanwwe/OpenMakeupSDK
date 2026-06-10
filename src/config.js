/**
 * OpenMakeupSDK — runtime configuration & asset resolution.
 *
 * Every asset (shaders, 3D model, makeup patterns, and the MediaPipe runtime)
 * is resolved from configurable base paths. Move the `assets/` folder anywhere
 * and you only change `assetsBaseUrl`. Nothing hardcodes a host.
 */

export const defaultConfig = {
  // Root of the assets folder.
  //   relative : './assets'
  //   absolute : '/static/openmakeup'
  //   full URL : 'https://cdn.example.com/openmakeup'
  assetsBaseUrl: './assets',

  // Where the MediaPipe FaceMesh runtime files (wasm / data) are served from.
  // Host the files shipped with @mediapipe/face_mesh here, or point to a CDN
  // of the matching version.
  mediapipeBaseUrl: '/mediapipe/face_mesh',

  faceMesh: {
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7,
  },
  camera: { width: 1280, height: 720 },
};

/** Join a base path with sub-paths, normalizing slashes. */
export function resolveAsset(base, ...parts) {
  const cleanBase = String(base).replace(/\/+$/, '');
  const cleanParts = parts.filter(Boolean).map((p) => String(p).replace(/^\/+|\/+$/g, ''));
  return [cleanBase, ...cleanParts].join('/');
}

/**
 * Asset resolver bound to a base URL. The engine fetches shaders, the face
 * model, and pattern textures through this — never a hardcoded host.
 */
export function createAssetResolver(assetsBaseUrl = defaultConfig.assetsBaseUrl) {
  return {
    base: assetsBaseUrl,
    // shaders under a per-makeup-type folder, e.g. shader('lip', 'fragment.glsl')
    shader:     (type, file) => resolveAsset(assetsBaseUrl, 'shaders', type, file),
    // shared shader assets at the shaders root, e.g. shaderRoot('foundation_mask.PNG')
    shaderRoot: (file)       => resolveAsset(assetsBaseUrl, 'shaders', file),
    model:      (file)       => resolveAsset(assetsBaseUrl, 'models', file),
    pattern:    (type, id)   => resolveAsset(assetsBaseUrl, 'patterns', type, `${id}.png`),
    manifest:   ()           => resolveAsset(assetsBaseUrl, 'patterns', 'patterns.json'),
  };
}
