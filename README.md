<div align="center">

# 💄 OpenMakeupSDK

### Open-source, real-time AR **virtual makeup** & **face reshape** SDK for the web

The open alternative to closed commercial AR beauty SDKs — runs **entirely in the browser**, no backend, no per-call fees, no licensing lock-in.

<br/>

[![npm version](https://img.shields.io/npm/v/open-makeup-sdk?color=cb3837&logo=npm&label=npm)](https://www.npmjs.com/package/open-makeup-sdk)
[![npm downloads](https://img.shields.io/npm/dm/open-makeup-sdk?color=cb3837&logo=npm)](https://www.npmjs.com/package/open-makeup-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/ehsanwwe/OpenMakeupSDK/pulls)
[![GitHub stars](https://img.shields.io/github/stars/ehsanwwe/OpenMakeupSDK?style=social)](https://github.com/ehsanwwe/OpenMakeupSDK/stargazers)

[![Live Demo](https://img.shields.io/badge/%E2%96%B6%20live%20demo-try%20it%20now-e0567a?style=for-the-badge)](https://ehsanwwe.github.io/open-makeup-sdk/)

[![Three.js](https://img.shields.io/badge/Three.js-000000?logo=three.js&logoColor=white)](https://threejs.org)
[![WebGL](https://img.shields.io/badge/WebGL-2.0-990000)](https://www.khronos.org/webgl/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-FaceMesh-00897B)](https://developers.google.com/mediapipe)
[![GLSL](https://img.shields.io/badge/Shaders-GLSL-5586A4)](https://www.khronos.org/opengl/wiki/Core_Language_(GLSL))
[![TypeScript](https://img.shields.io/badge/types-included-3178c6?logo=typescript&logoColor=white)]()

</div>

---

<!-- 👉 Tip: drop a short demo GIF here for an even stronger first impression -->
<div align="center">

### ▶️ [**Try the live demo →**](https://ehsanwwe.github.io/open-makeup-sdk/)

<em>Point your webcam, pick a look, and reshape your face in real time — no install, no upload.</em>
<br/>
<sub>Runs fully in the browser · needs camera access · best on Chrome (desktop / Android)</sub>

</div>

---

## ✨ Why OpenMakeupSDK?

Commercial AR beauty SDKs (YouCam / Perfect Corp, Banuba, ModiFace…) are powerful — but they're **closed-source, licensed, and often metered per call**. OpenMakeupSDK gives you the same core experience as a **free, MIT-licensed package** you can read, fork, self-host, and ship without asking anyone for permission.

It's a real-time AR makeup mirror **and** a beauty face-reshape engine, built on **MediaPipe face tracking + custom WebGL/GLSL shaders**, running fully client-side.

---

## 🚀 Features

### 💋 Virtual makeup
- **Real-time face tracking** — 468-point MediaPipe FaceMesh, live on a webcam.
- **6 makeup categories** — `foundation`, `blush`, `lipstick`, `eyeliner`, `mascara`, `eyeshadow`.
- **73 ready-to-use pattern textures** out of the box.
- **Material finishes** — `matte`, `shimmer`, `glossy`, `glitter` (where supported).
- **Custom GLSL shaders** for believable blending, gloss, and glitter — not flat overlays.
- **Smart defaults** — every parameter has one; plug in your own AI color provider for lipstick.

### 🧬 Face reshape (morph / blend shapes)
Project the live camera image onto a morphable 3D mesh so the user's **actual face** reshapes in real time — brow, lips, nose, cheeks, and jaw. The editable Blender rig is included.

### 🧰 Developer experience
- **Drop-in, framework-agnostic** — plain ES modules, works with any stack.
- **Zero backend** — everything runs client-side.
- **TypeScript types included.**
- **Config-driven assets** — one base URL points every shader, model, and pattern.

---

## 📦 Installation

```bash
npm install open-makeup-sdk three @mediapipe/face_mesh @mediapipe/camera_utils
```

`three` and the two `@mediapipe/*` packages are peer dependencies — install them alongside the SDK.

---

## ⚡ Quick start

You need three things: a `<video>` (webcam), a `<canvas>` (output), and the assets served somewhere. The easiest setup loads MediaPipe and the assets straight from a CDN — no extra build config.

```html
<!-- MediaPipe runtime: sets window.FaceMesh / window.Camera -->
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js"></script>

<video id="cam" playsinline></video>
<canvas id="out"></canvas>

<script type="module">
  import { OpenMakeup } from 'open-makeup-sdk';

  const mk = new OpenMakeup({
    video:        document.querySelector('#cam'),
    renderCanvas: document.querySelector('#out'),
    // Serve the assets yourself, or use the published CDN copy:
    assetsBaseUrl:    'https://cdn.jsdelivr.net/npm/open-makeup-sdk/assets',
    mediapipeBaseUrl: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619',
  });

  await mk.init();                                           // boots tracking + camera

  await mk.apply('lipstick',  { color: '#b4002e', finish: 'glossy' });
  await mk.apply('eyeshadow', { color: '#7a3b9d', pattern: 3, finish: 'glitter' });
  await mk.apply('eyeliner',  { pattern: 1 });               // defaults to black

  mk.morph({ noseSlim: 0.6, cheeks: 0.3, jawWide: 0.4, browLift: 0.5 });
</script>
```

> **Hosting the assets yourself?** Copy `node_modules/open-makeup-sdk/assets` into your public folder and set `assetsBaseUrl` to its URL (e.g. `'/assets'`).

---

## 🎛️ API reference

```js
const mk = new OpenMakeup(options);
```

| Method | Description |
|---|---|
| `await mk.init(onReady?)` | Boot the engine, load assets, start the camera. |
| `await mk.apply(category, opts)` | Apply/update a layer: `{ color, finish, pattern }`. |
| `mk.clear(category)` | Remove one makeup layer. |
| `mk.clearAll()` | Remove all makeup. |
| `mk.morph(map)` | Reshape: `{ noseSlim: 0.6, cheeks: 0.3, ... }`. |
| `mk.setMorph(name, value)` | Set a single reshape control. |
| `mk.resetMorph()` | Reset the face shape. |
| `mk.getPatterns(category)` | List patterns for a category. |
| `mk.getMorphTargets()` | List the model's reshape targets. |
| `mk.setWireframe(on)` | Toggle the debug face mesh. |
| `mk.start()` / `mk.stop()` / `mk.dispose()` | Control / release the engine. |

**Constructor options:** `video`, `renderCanvas`, `assetsBaseUrl`, `mediapipeBaseUrl`, `defaults`, `aiColor`.

---

## 🎨 Categories & finishes

| Category | Color | Finish | Patterns |
|---|:---:|:---:|:---:|
| `foundation` | ✅ | matte · shimmer · glossy · glitter | ✅ |
| `blush` | ✅ | matte · shimmer · glossy · glitter | ✅ |
| `lipstick` | ✅ | matte · shimmer · glossy · glitter | ✅ |
| `eyeshadow` | ✅ | matte · shimmer · glossy · glitter | ✅ |
| `eyeliner` | ✅ | — | ✅ |
| `mascara` | ✅ | — | ✅ |

## 🧬 Reshape controls

| Control | Effect |
|---|---|
| `browLift` | Lift the outer brow corner |
| `lipPlump` / `lipPlump2` | Plump the lips |
| `noseSlim` | Narrow the nose |
| `noseBridge` | Reduce the nose-bridge prominence between the eyes |
| `cheeks` | Fuller cheeks |
| `jawAngle` | Define the jaw angle |
| `jawWide` | Widen the jaw angle away from the ear |

Weights are typically `0..1`; negative values and values above 1 exaggerate the effect.

---

## 🆚 OpenMakeupSDK vs. commercial SDKs

| | **OpenMakeupSDK** | Commercial AR beauty SDKs |
|---|:---:|:---:|
| Price | **Free** | Paid license / per-call fees |
| Source | **Fully open (MIT)** | Closed |
| Runs in the browser | ✅ | ✅ |
| Backend required | **None** | Often |
| Self-hostable | ✅ | ❌ |
| Editable shaders & 3D rig | ✅ | ❌ |
| Face reshape (morph) | ✅ | Usually premium |
| Lock-in | **None** | Yes |

---

## 🗺️ Roadmap

- [x] Real-time makeup engine (6 categories, finishes, 73 patterns)
- [x] Public `OpenMakeup` API with smart defaults
- [x] Face reshape via blend shapes
- [x] Interactive playground + hosted live demo
- [x] TypeScript types
- [x] **Published to npm** 🎉

> v1 is live. Next up: more patterns, demo recipes, and community-contributed looks.

---

## 🤝 Let's build something together

I'm **Ehsan** — I've spent years building real-time AR, 3D rendering, SLAM, computer-vision and AI systems, end to end. OpenMakeupSDK is a slice of that work, opened up.

If this project resonates with you:

- 🧑‍💻 **Hiring** for AR / WebGL / 3D / computer-vision work? I'm open to remote contract & freelance projects — let's talk.
- 🧩 **Integrating** this into your product, or want a custom feature? Reach out.
- 🛠️ **Contributing**? PRs and issues are very welcome.

**Get in touch**
- GitHub: [@ehsanwwe](https://github.com/ehsanwwe)
- LinkedIn: [ehsan-hightech](https://www.linkedin.com/in/ehsan-hightech)
- Email: ehsan.hightech@gmail.com

<div align="center">

### ⭐ If OpenMakeupSDK saved you a five-figure SDK license, drop it a star — it genuinely helps.

[![Star History Chart](https://api.star-history.com/svg?repos=ehsanwwe/OpenMakeupSDK&type=Date)](https://star-history.com/#ehsanwwe/OpenMakeupSDK&Date)

</div>

---

## 📄 License

[MIT](./LICENSE) © Ehsan Moradi — use it, ship it, build on it.
