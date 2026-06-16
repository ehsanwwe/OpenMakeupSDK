<div align="center">

# 💄 OpenMakeupSDK

### Open-source, real-time AR **virtual makeup** & **face reshape** SDK for the web

The open alternative to closed commercial AR beauty SDKs — runs **entirely in the browser**, no backend, no per-call fees, no licensing lock-in.

<br/>

[![npm version](https://img.shields.io/npm/v/open-makeup-sdk?color=cb3837&logo=npm&label=npm)](https://www.npmjs.com/package/open-makeup-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/ehsanwwe/OpenMakeupSDK/pulls)
[![GitHub issues](https://img.shields.io/github/issues/ehsanwwe/OpenMakeupSDK)](https://github.com/ehsanwwe/OpenMakeupSDK/issues)
[![GitHub stars](https://img.shields.io/github/stars/ehsanwwe/OpenMakeupSDK?style=social)](https://github.com/ehsanwwe/OpenMakeupSDK/stargazers)

[![Live Demo](https://img.shields.io/badge/%E2%96%B6%20live%20demo-try%20it%20now-e0567a?style=for-the-badge)](https://ehsanwwe.github.io/open-makeup-sdk/)

[![Three.js](https://img.shields.io/badge/Three.js-000000?logo=three.js&logoColor=white)](https://threejs.org)
[![WebGL](https://img.shields.io/badge/WebGL-2.0-990000)](https://www.khronos.org/webgl/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-FaceMesh-00897B)](https://developers.google.com/mediapipe)
[![GLSL](https://img.shields.io/badge/Shaders-GLSL-5586A4)](https://www.khronos.org/opengl/wiki/Core_Language_(GLSL))
[![Runs in](https://img.shields.io/badge/runs%20in-the%20browser-orange)]()
[![No backend](https://img.shields.io/badge/backend-none-success)]()

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

> Built over years of production AR work — and battle-tested before most of today's web makeup SDKs existed.

---

## 🚀 Features

### 💋 Virtual makeup
- **Real-time face tracking** — 468-point MediaPipe FaceMesh, runs live on a webcam.
- **6 makeup categories** — `foundation`, `blush`, `lipstick`, `eyeliner`, `mascara`, `eyeshadow`.
- **73 ready-to-use pattern textures** out of the box.
- **Material finishes** — `matte`, `shimmer`, `glossy`, `glitter` (where the category supports it).
- **Custom GLSL shaders** for believable blending, glossiness, glitter and skin response — not flat overlays.
- **Smart defaults** — every parameter has one. No color on eyeliner? It's black. No color on lipstick? Plug in your own **AI color** provider.
- **Pluggable colors & patterns** — any hex color, pattern by simple number or by id.

### 🧬 Face reshape (morph / blend shapes)
Project the live camera image onto a morphable 3D face mesh, so the user's **actual face** reshapes in real time:

| Control | What it does |
|---|---|
| `browLift` | lift the outer brow corner |
| `lipPlump` / `lipPlump2` | plump the lips (filler look) |
| `noseSlim` | narrow the nose |
| `noseBridge` | reduce the nose-bridge prominence between the eyes |
| `cheeks` | fuller cheeks |
| `jawAngle` | define the jaw angle |
| `jawWide` | move the jaw angle away from the ear |

…all driven by blend shapes baked into the included 3D rig — **and the Blender source is shipped**, so you can author your own.

### 🧰 Developer experience
- **Drop-in, framework-agnostic** — plain ES modules, works with any stack.
- **Zero backend** — everything runs client-side.
- **Config-driven assets** — move the `assets/` folder anywhere; one base URL updates every path.
- **No vendor lock-in** — MIT, yours to ship.

---

## ⚡ Quick start

```bash
npm install open-makeup-sdk three @mediapipe/face_mesh @mediapipe/camera_utils
```

```js
import { OpenMakeup } from 'open-makeup-sdk';

const mk = new OpenMakeup({
  video:        document.querySelector('#camera'),
  renderCanvas: document.querySelector('#output'),
  assetsBaseUrl: '/assets',
});

await mk.init();

// makeup
mk.apply('lipstick',  { color: '#b4002e', finish: 'glossy' });
mk.apply('eyeshadow', { color: '#7a3b9d', pattern: 3, finish: 'glitter' });
mk.apply('eyeliner',  { pattern: 1 });          // defaults to black

// face reshape
mk.morph({ noseSlim: 0.6, cheeks: 0.3, jawWide: 0.4, browLift: 0.5 });

mk.clearAll();   // remove makeup
mk.resetMorph(); // reset the face shape
```

> MediaPipe's runtime can be loaded from npm or a CDN `<script>` tag — your choice.

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
- [ ] TypeScript types
- [ ] npm release `v1.0`

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
