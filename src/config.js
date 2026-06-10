/**
 * OpenMakeupSDK — runtime configuration & asset resolution.
 *
 * Every asset (shaders, 3D model, makeup patterns) is resolved from ONE base
 * path. Move the `assets/` folder anywhere — CDN, /public, npm package dir —
 * and you only change `assetsBaseUrl`. Nothing else hardcodes a location.
 */

export const defaultConfig = {
  // Root of the assets folder.
  //   relative : './assets'
  //   absolute : '/static/openmakeup'
  //   full URL : 'https://cdn.example.com/openmakeup'
  assetsBaseUrl: './assets',

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
    shader:   (type, file) => resolveAsset(assetsBaseUrl, 'shaders', type, file),
    model:    (file)       => resolveAsset(assetsBaseUrl, 'models', file),
    pattern:  (type, id)   => resolveAsset(assetsBaseUrl, 'patterns', type, `${id}.png`),
    manifest: ()           => resolveAsset(assetsBaseUrl, 'patterns', 'patterns.json'),
  };
}
