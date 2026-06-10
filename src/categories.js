/**
 * OpenMakeupSDK — category definitions (single source of truth).
 *
 * Maps the public API to the engine, declares which categories support a
 * `finish`, how each finish maps to the engine's original colorMode, and the
 * per-category defaults. Defaults can be overridden per consumer via the
 * `defaults` option on `OpenMakeup`.
 *
 * Finish → colorMode mapping is faithful to the original shader behavior:
 *   '1' = matte          '2' = high shine (lipstick only)
 *   '5' = glossy+glitter  '7' = low shine
 * For non-lipstick categories the shaders only expose the combined '5', so
 * `glossy` and `glitter` both map to '5' there.
 */

// Sentinel meaning "resolve this color from the AI color provider at apply time".
export const AI_SENTINEL = 'ai';

// Canonical finish names exposed by the API.
export const FINISHES = ['matte', 'shimmer', 'glossy', 'glitter'];

export const CATEGORIES = {
  foundation: {
    engine: 'foundation',
    patternType: 'foundation',
    supportsFinish: true,
    finishMap: { matte: '1', shimmer: '7', glossy: '5', glitter: '5' },
    defaults: { color: '#d9b89c', finish: 'matte', pattern: null },
  },
  blush: {
    engine: 'blush',
    patternType: 'blush',
    supportsFinish: true,
    finishMap: { matte: '1', shimmer: '7', glossy: '5', glitter: '5' },
    defaults: { color: '#e26d7a', finish: 'matte', pattern: null },
  },
  lipstick: {
    engine: 'lipstick',
    patternType: 'lipstick',
    supportsFinish: true,
    finishMap: { matte: '1', shimmer: '7', glossy: '2', glitter: '5' },
    defaults: { color: AI_SENTINEL, finish: 'glossy', pattern: null },
  },
  eyeshadow: {
    engine: 'eyeshadow',
    patternType: 'eyeshadow',
    supportsFinish: true,
    finishMap: { matte: '1', shimmer: '7', glossy: '5', glitter: '5' },
    defaults: { color: '#7a3b9d', finish: 'matte', pattern: null },
  },
  eyeline: {
    engine: 'eyeline',
    patternType: 'eyeline',
    supportsFinish: false,
    defaults: { color: '#000000', pattern: null },
  },
  mascara: {
    engine: 'mascara',
    patternType: 'mascara',
    supportsFinish: false,
    defaults: { color: '#000000', pattern: null },
  },
};

// Friendly aliases → canonical names.
export const CATEGORY_ALIASES = {
  eyeliner: 'eyeline',
  'eye-liner': 'eyeline',
  'eye-shadow': 'eyeshadow',
  foundationmakeup: 'foundation',
};

/** Resolve an input category name to a canonical key, or null if unknown. */
export function resolveCategory(name) {
  const key = String(name || '').trim().toLowerCase();
  const canonical = CATEGORY_ALIASES[key] || key;
  return CATEGORIES[canonical] ? canonical : null;
}
