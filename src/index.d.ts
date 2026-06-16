/**
 * OpenMakeupSDK — TypeScript definitions for the public API.
 *
 * These types are hand-authored to match `src/index.js`. They are dependency
 * free (DOM lib only) so consumers get full IntelliSense without pulling in
 * `@types/three` or the MediaPipe typings.
 */

/* ───────────────────────────── makeup ───────────────────────────── */

/** Canonical material finishes. Not every category supports a finish. */
export type Finish = 'matte' | 'shimmer' | 'glossy' | 'glitter';

/** Canonical category keys understood by the SDK. */
export type Category =
  | 'foundation'
  | 'blush'
  | 'lipstick'
  | 'eyeshadow'
  | 'eyeline'
  | 'mascara';

/** A pattern entry as returned by {@link OpenMakeup.getPatterns}. */
export interface PatternInfo {
  /** 1-based index into the category's pattern list (pass this to `apply`). */
  number: number;
  /** The underlying asset id. */
  id: string | number;
  /** Whether the texture ships bundled with the package. */
  bundled: boolean;
}

/** Options for {@link OpenMakeup.apply}. */
export interface ApplyOptions {
  /** Hex color, e.g. `'#b4002e'`. Falls back to the category default. */
  color?: string;
  /** Finish (only honoured by categories that support one). */
  finish?: Finish;
  /** Pattern: a 1-based `number` from `getPatterns`, or a raw pattern id. */
  pattern?: number | string | null;
}

/** Resolved result returned by {@link OpenMakeup.apply}. */
export interface AppliedLook {
  category: Category;
  color: string;
  finish: Finish | null;
  pattern: number | string | null;
}

/** Provider that resolves a color for categories whose default color is AI-driven. */
export type AiColorProvider = (category: Category) => string | Promise<string>;

/** Constructor options for {@link OpenMakeup}. */
export interface OpenMakeupOptions {
  /** The webcam `<video>` element MediaPipe reads frames from. */
  video: HTMLVideoElement;
  /** The `<canvas>` the result is rendered to. */
  renderCanvas: HTMLCanvasElement;
  /** Optional overlay canvas for debug drawing. */
  overlayCanvas?: HTMLCanvasElement;
  /** Base URL for shaders, model and pattern assets. Default: `'/assets'`. */
  assetsBaseUrl?: string;
  /** Base URL for the MediaPipe FaceMesh runtime files. */
  mediapipeBaseUrl?: string;
  /** A pre-built MediaPipe FaceMesh instance (advanced). */
  faceMesh?: object;
  /** A pre-built MediaPipe Camera instance (advanced). */
  camera?: object;
  /** Per-category default overrides, e.g. `{ lipstick: { color: '#ff0000' } }`. */
  defaults?: Partial<Record<Category, ApplyOptions>>;
  /** Resolves the color for AI-defaulted categories (lipstick by default). */
  aiColor?: AiColorProvider;
}

/**
 * High-level entry point: an AR makeup mirror plus a face-reshape engine.
 *
 * ```ts
 * const mk = new OpenMakeup({ video, renderCanvas, assetsBaseUrl: '/assets' });
 * await mk.init();
 * await mk.apply('lipstick', { color: '#b4002e', finish: 'glossy' });
 * mk.morph({ noseSlim: 0.6, cheeks: 0.3 });
 * ```
 */
export class OpenMakeup {
  constructor(options: OpenMakeupOptions);

  /** Low-level engine (advanced use). */
  readonly engine: MakeupEngine;

  /** Whether {@link init} has completed. */
  readonly ready: boolean;

  /** The canonical category names supported by the SDK. */
  readonly categories: Category[];

  /** Boot the engine, load assets, and start the camera. */
  init(onReady?: (mk: OpenMakeup) => void): Promise<OpenMakeup>;

  /** List the patterns available for a category. */
  getPatterns(category: Category | string): PatternInfo[];

  /** Apply (or update) a makeup layer. Resolves the final look. */
  apply(category: Category | string, opts?: ApplyOptions): Promise<AppliedLook>;

  /** Hide one makeup layer. */
  clear(category: Category | string): void;

  /** Hide every makeup layer. */
  clearAll(): void;

  /** Reshape the face. Weights are typically 0..1 (negative or >1 exaggerate). */
  morph(map?: Record<string, number>): void;

  /** Set a single reshape control by friendly name or raw target name. */
  setMorph(name: string, value: number): void;

  /** Reset every reshape control to zero. */
  resetMorph(): void;

  /** The reshape target names available on the loaded model. */
  getMorphTargets(): string[];

  /** Toggle the debug wireframe of the face mesh. */
  setWireframe(on: boolean): void;

  /** Toggle the background blur layer. */
  setBlur(on: boolean): void;

  /** Start the render loop / camera. */
  start(): void;

  /** Stop the render loop / camera. */
  stop(): void;

  /** Release GPU and MediaPipe resources. */
  dispose(): void;
}

/* ──────────────────────────── categories ────────────────────────── */

export interface CategoryConfig {
  engine: string;
  patternType: string;
  supportsFinish: boolean;
  finishMap?: Record<Finish, string>;
  defaults: ApplyOptions;
}

/** The category definitions (single source of truth). */
export const CATEGORIES: Record<Category, CategoryConfig>;

/** All canonical finish names. */
export const FINISHES: Finish[];

/** Resolve an input category name (incl. aliases) to a canonical key, or null. */
export function resolveCategory(name: string): Category | null;

/* ─────────────────────────────── morphs ─────────────────────────── */

export interface MorphControl {
  /** The underlying blend-shape target name in the model. */
  target: string;
  /** Human-readable description of what the control does. */
  about: string;
}

/** Friendly reshape controls mapped to model blend-shape targets. */
export const MORPH_CONTROLS: Record<string, MorphControl>;

/** Raw blend-shape target names not covered by a friendly control. */
export const MORPH_TARGETS_EXTRA: string[];

/** Resolve a friendly control name or raw target to a model target name. */
export function resolveMorphTarget(name: string): string;

/* ───────────────────────── engine + config ──────────────────────── */

/** Lower-level engine. Most apps should use {@link OpenMakeup} instead. */
export class MakeupEngine {
  constructor(options: Record<string, unknown>);
  /** Global multiplier for reshape strength (default 1). */
  morphGain: number;
  init(): Promise<void>;
  start(): void;
  stop(): void;
  dispose(): void;
  setAR(arType: string, color: string, colorMode: string | number): void;
  setPattern(arType: string, patternId: number | string): Promise<void>;
  clearAll(): void;
  clearPart(arType: string): void;
  morph(map?: Record<string, number>): void;
  setMorph(name: string, value: number): void;
  resetMorph(): void;
  getMorphTargets(): string[];
  setWireframe(on: boolean): void;
  setBlur(on: boolean): void;
}

export interface AssetResolver {
  shader(type: string, file: string): string;
  shaderRoot(file: string): string;
  model(file: string): string;
  pattern(type: string, id: string | number): string;
  manifest(): string;
}

export interface DefaultConfig {
  assetsBaseUrl: string;
  mediapipeBaseUrl: string;
}

export const defaultConfig: DefaultConfig;

export function resolveAsset(baseUrl: string, ...parts: string[]): string;

export function createAssetResolver(assetsBaseUrl: string): AssetResolver;
