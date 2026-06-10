/**
 * OpenMakeupSDK — public entry point.
 */
export { defaultConfig, resolveAsset, createAssetResolver } from './config.js';
export { MakeupEngine } from './core/MakeupEngine.js';

// Phase 2 will add a higher-level public `OpenMakeup` class with apply(category,
// { color, pattern, finish }) + sensible per-category defaults, built on top of
// MakeupEngine.
