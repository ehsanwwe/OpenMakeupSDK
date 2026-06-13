import { MakeupEngine } from './core/MakeupEngine.js';
import { CATEGORIES, resolveCategory, AI_SENTINEL } from './categories.js';
import { MORPH_CONTROLS } from './morphs.js';

// Used when a category's default color is `ai` but no aiColor provider is set,
// or when AI resolution fails — keeps `apply()` from ever producing no color.
const FALLBACK_AI_COLOR = '#b4002e';

/** Normalize '#rgb' / 'rgb' / '#rrggbb' / 'rrggbb' to '#rrggbb', or null. */
function normalizeHex(input) {
  if (typeof input !== 'string') return null;
  let h = input.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split('').map((c) => c + c).join('');
  if (/^[0-9a-fA-F]{6}$/.test(h)) return '#' + h.toLowerCase();
  return null;
}

/**
 * OpenMakeup — the public SDK API.
 *
 * Wraps MakeupEngine with a clean per-category interface:
 *   apply(category, { color, pattern, finish })
 * Every parameter has a sensible default, so `apply('eyeline')` works on its
 * own (black, built-in pattern). `finish` only applies to categories that
 * support it (foundation, blush, lipstick, eyeshadow).
 *
 * @example
 * const mk = new OpenMakeup({
 *   video: document.querySelector('#cam'),
 *   renderCanvas: document.querySelector('#out'),
 *   assetsBaseUrl: '/assets',
 *   aiColor: async () => '#c21f4d', // used for lipstick's default color
 * });
 * await mk.init();
 * await mk.apply('lipstick', { finish: 'glossy' });   // color from aiColor
 * await mk.apply('eyeline', { pattern: 1 });           // color defaults to black
 * await mk.apply('eyeshadow', { color: '#7a3b9d', pattern: 3, finish: 'glitter' });
 * mk.clear('eyeshadow');
 * mk.clearAll();
 */
export class OpenMakeup {
  /**
   * @param {object} options
   * @param {HTMLVideoElement}  options.video
   * @param {HTMLCanvasElement} options.renderCanvas
   * @param {HTMLCanvasElement} [options.overlayCanvas]
   * @param {string} [options.assetsBaseUrl]
   * @param {string} [options.mediapipeBaseUrl]
   * @param {object} [options.faceMesh]
   * @param {object} [options.camera]
   * @param {object} [options.defaults]  per-category default overrides, e.g.
   *                                      { lipstick: { color: '#ff0000' } }
   * @param {(category: string) => (string|Promise<string>)} [options.aiColor]
   *                                      provider for categories whose default
   *                                      color is `ai` (lipstick by default)
   */
  constructor(options = {}) {
    const {
      video, renderCanvas, overlayCanvas,
      assetsBaseUrl, mediapipeBaseUrl, faceMesh, camera,
      defaults = {}, aiColor = null,
    } = options;

    this.engine = new MakeupEngine({
      video, renderCanvas, overlayCanvas,
      assetsBaseUrl, mediapipeBaseUrl, faceMesh, camera,
    });

    this._aiColor = typeof aiColor === 'function' ? aiColor : null;

    // merge consumer default overrides over the built-in category defaults
    this._categories = {};
    for (const [name, cfg] of Object.entries(CATEGORIES)) {
      this._categories[name] = {
        ...cfg,
        defaults: { ...cfg.defaults, ...(defaults[name] || {}) },
      };
    }

    this._patterns = {}; // category -> [{ id, file, bundled }]
    this._ready = false;
  }

  /** Boot the engine and load the pattern manifest. */
  async init(onReady) {
    await this.engine.init();
    try {
      const res = await fetch(this.engine.assets.manifest());
      const manifest = await res.json();
      this._patterns = manifest.categories || {};
    } catch (e) {
      this._patterns = {};
    }
    this._ready = true;
    if (onReady) onReady(this);
    return this;
  }

  get ready() {
    return this._ready;
  }

  /** List the patterns available for a category: [{ number, id, bundled }]. */
  getPatterns(category) {
    const name = resolveCategory(category);
    if (!name) return [];
    return (this._patterns[name] || []).map((p, i) => ({
      number: i + 1,
      id: p.id,
      bundled: !!p.bundled,
    }));
  }

  /** The canonical category names supported by the SDK. */
  get categories() {
    return Object.keys(this._categories);
  }

  /**
   * Apply (or update) a makeup layer. Resolves missing parameters from the
   * category defaults. Returns the resolved { category, color, finish, pattern }.
   */
  async apply(category, opts = {}) {
    const name = resolveCategory(category);
    if (!name) throw new Error(`OpenMakeup: unknown category "${category}"`);
    const cfg = this._categories[name];

    const color = await this._resolveColor(name, opts);
    const colorMode = this._resolveColorMode(name, opts);

    // color + visibility
    this.engine.setAR(cfg.engine, color, colorMode);

    // pattern (only when one is requested or defaulted; otherwise the shader's
    // built-in texture is kept)
    const patternId = this._resolvePatternId(name, opts);
    if (patternId != null) {
      try {
        await this.engine.setPattern(cfg.engine, patternId);
      } catch (e) {
        console.warn(`OpenMakeup: could not load pattern ${patternId} for "${name}".`);
      }
    }

    return {
      category: name,
      color,
      finish: cfg.supportsFinish ? (opts.finish ?? cfg.defaults.finish) : null,
      pattern: patternId,
    };
  }

  /** Hide one makeup layer. */
  clear(category) {
    const name = resolveCategory(category);
    if (name) this.engine.clearPart(this._categories[name].engine);
  }

  /** Hide every makeup layer. */
  clearAll() {
    this.engine.clearAll();
  }

  /* ───────────────────────── face reshape (morph) ───────────────────────── */

  /**
   * Reshape the face. Accepts friendly controls and/or raw glb target names:
   *   mk.morph({ noseSlim: 0.6, cheeks: 0.3, jawWide: 0.4, browLift: 0.5 });
   * Weights are typically 0..1 (negative or >1 exaggerate).
   */
  morph(map = {}) {
    this.engine.morph(map);
  }

  /** Set a single reshape control. */
  setMorph(name, value) {
    this.engine.setMorph(name, value);
  }

  /** Reset all reshape controls to 0. */
  resetMorph() {
    this.engine.resetMorph();
  }

  /** Friendly reshape control names (see morphs.js for what each does). */
  get morphControls() {
    return Object.keys(MORPH_CONTROLS);
  }

  /** All morph target names baked into the model (friendly + raw). */
  getMorphTargets() {
    return this.engine.getMorphTargets();
  }

  /** Debug: show/hide a wireframe of the morphed face mesh. */
  setWireframe(on) {
    this.engine.setWireframe(on);
  }

  /** Show/hide the blur/refraction layer (off by default). */
  setBlur(on) {
    this.engine.setBlur(on);
  }

  start() { this.engine.start(); }
  stop() { this.engine.stop(); }
  dispose() { this.engine.dispose(); }

  /* ───────────────────────── internals ───────────────────────── */

  async _resolveColor(name, opts) {
    const cfg = this._categories[name];
    let color = opts.color != null ? opts.color : cfg.defaults.color;

    if (color === AI_SENTINEL) {
      if (this._aiColor) {
        try { color = await this._aiColor(name); }
        catch (e) { color = FALLBACK_AI_COLOR; }
      } else {
        color = FALLBACK_AI_COLOR;
      }
    }
    return normalizeHex(color) || FALLBACK_AI_COLOR;
  }

  _resolveColorMode(name, opts) {
    const cfg = this._categories[name];
    if (!cfg.supportsFinish) {
      if (opts.finish != null) {
        console.warn(`OpenMakeup: "${name}" has no finish; ignoring finish "${opts.finish}".`);
      }
      return undefined;
    }
    const finish = opts.finish != null ? opts.finish : cfg.defaults.finish;
    const code = cfg.finishMap[finish];
    if (code == null) {
      console.warn(`OpenMakeup: finish "${finish}" not supported for "${name}"; using "${cfg.defaults.finish}".`);
      return cfg.finishMap[cfg.defaults.finish];
    }
    return code;
  }

  _resolvePatternId(name, opts) {
    if (opts.patternId != null) return opts.patternId; // explicit image id wins
    const cfg = this._categories[name];
    let p = opts.pattern != null ? opts.pattern : cfg.defaults.pattern;
    if (p == null) return null; // keep the shader's built-in texture

    const list = this._patterns[name] || [];
    if (Number.isInteger(p) && p >= 1 && p <= list.length) return list[p - 1].id; // 1-based number
    const byId = list.find((x) => x.id === p);
    if (byId) return byId.id;

    console.warn(`OpenMakeup: pattern ${p} not found for "${name}" (valid: 1..${list.length}); keeping built-in.`);
    return null;
  }
}
