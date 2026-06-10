/**
 * OpenMakeupSDK — public entry point.
 */
export { OpenMakeup } from './OpenMakeup.js';
export { CATEGORIES, FINISHES, resolveCategory } from './categories.js';

// Lower-level engine + config (advanced use)
export { MakeupEngine } from './core/MakeupEngine.js';
export { defaultConfig, resolveAsset, createAssetResolver } from './config.js';
