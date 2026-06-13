/**
 * OpenMakeupSDK — public entry point.
 */
export { OpenMakeup } from './OpenMakeup.js';
export { CATEGORIES, FINISHES, resolveCategory } from './categories.js';
export { MORPH_CONTROLS, MORPH_TARGETS_EXTRA, resolveMorphTarget } from './morphs.js';

// Lower-level engine + config (advanced use)
export { MakeupEngine } from './core/MakeupEngine.js';
export { defaultConfig, resolveAsset, createAssetResolver } from './config.js';
