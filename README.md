# OpenMakeupSDK

Open-source AR virtual makeup SDK for the web. Real-time face tracking with
MediaPipe, rendered through WebGL/Three.js custom shaders, with live face
morphing — and no licensing lock-in.

> An open alternative to closed commercial AR makeup SDKs.

## Status

Early scaffold. Folder structure, assets, and the asset-resolution layer are in
place. The rendering engine is being wired into `src/core` next.

## Makeup types

`foundation` · `blush` · `lipstick` · `eyeline` · `mascara` · `eyeshadow`

## Folder structure

```
OpenMakeupSDK/
├── src/
│   ├── index.js         # public entry
│   ├── config.js        # config + asset resolver (single source of paths)
│   └── core/            # rendering engine (ported next)
├── assets/
│   ├── models/          # face.glb
│   ├── shaders/         # GLSL per makeup type + face masks + default textures
│   ├── patterns/        # makeup pattern textures, one folder per type
│   │   ├── foundation/  ├── blush/    ├── lipstick/
│   │   ├── eyeline/     ├── mascara/  └── eyeshadow/
│   │   └── patterns.json   # manifest (relative paths, per category)
│   └── blender/         # face-rigged .blend source (edit morph/blend shapes)
├── examples/basic/      # minimal demo (no backend)
└── docs/
```

## Path handling (important)

Every asset path is derived from a single base, `assetsBaseUrl`. Move the
`assets/` folder anywhere and you change only that one value — every shader,
model, and pattern URL updates automatically. Nothing hardcodes a host.

```js
import { createAssetResolver } from 'open-makeup-sdk';

const assets = createAssetResolver('/static/openmakeup'); // or a CDN URL
assets.pattern('eyeshadow', 6333); // -> /static/openmakeup/patterns/eyeshadow/6333.png
assets.shader('lip', 'fragment.glsl');
assets.model('face.glb');
```

## Patterns manifest

`assets/patterns/patterns.json` lists every pattern per makeup type with a
relative `file` path and a `bundled` flag. A few sample patterns ship with the
repo; the rest are added by dropping `<id>.png` into the matching type folder
and flipping `bundled` to `true`. See `docs/pattern-catalog.json` for the full
catalog of pattern IDs per type.

## License

MIT

## Completing the pattern set

The repo ships a few sample pattern textures. To pull the full set from your
own asset server into the correct folders, run the importer (it reads a local,
git-ignored `.import/patterns-urls.txt` of `<url>\t<target>` lines):

```bash
# bash
./scripts/import-patterns.sh
# or, cross-platform
node scripts/import-patterns.mjs
```

Each file lands at `assets/patterns/<type>/<id>.png`, matching `patterns.json`.
The URL list is kept out of git on purpose; commit only the downloaded images.
