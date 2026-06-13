import { OpenMakeup, MORPH_CONTROLS } from './src/index.js';

const status = document.getElementById('status');
const $ = (id) => document.getElementById(id);

const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619';

const mk = new OpenMakeup({
  video:        $('video'),
  renderCanvas: $('renderCanvas'),
  assetsBaseUrl: '/assets',
  mediapipeBaseUrl: MP,
  aiColor: async () => '#c21f4d',
});

// declared before init() because buildMorphSliders() runs during init
const sliders = [];

try {
  status.textContent = 'Loading face model + shaders…';
  await mk.init();
  status.textContent = 'Ready. Allow the camera, then try makeup + reshape.';
  buildMorphSliders();
} catch (e) {
  status.textContent = 'Init failed: ' + (e?.message || e);
  console.error(e);
}

// ── makeup ──
$('lipstick').onclick   = () => mk.apply('lipstick',  { finish: 'glossy' });
$('eyeshadow').onclick  = () => mk.apply('eyeshadow', { color: '#7a3b9d', pattern: 1, finish: 'glitter' });
$('eyeline').onclick    = () => mk.apply('eyeline',   { pattern: 1 });
$('blush').onclick      = () => mk.apply('blush',     { color: '#e26d7a' });
$('foundation').onclick = () => mk.apply('foundation',{ color: '#d9b89c', finish: 'matte' });
$('mascara').onclick    = () => mk.apply('mascara',   {});
$('clear').onclick      = () => mk.clearAll();

// ── morph sliders (built from the SDK's own control list) ──

function makeSlider(name, about) {
  const row = document.createElement('label');
  row.className = 'slider';
  row.innerHTML =
    `<span>${name}${about ? ` — <i>${about}</i>` : ''}</span>` +
    `<input type="range" min="-1" max="1.5" step="0.05" value="0">` +
    `<output>0.00</output>`;
  const input = row.querySelector('input');
  const out = row.querySelector('output');
  input.addEventListener('input', () => {
    out.textContent = (+input.value).toFixed(2);
    mk.setMorph(name, +input.value);
  });
  $('morph-panel').appendChild(row);
  sliders.push({ input, out });
}

function buildMorphSliders() {
  // friendly label lookup: raw glb target -> { name, about }
  const friendly = {};
  for (const [name, cfg] of Object.entries(MORPH_CONTROLS || {})) {
    friendly[cfg.target] = { name, about: cfg.about };
  }

  // build one slider per ACTUAL morph target in the loaded model
  const targets = mk.getMorphTargets();
  console.log('morph targets in model (' + targets.length + '):', targets);

  if (targets.length) {
    for (const t of targets) {
      const f = friendly[t];
      makeSlider(f ? f.name : t, f ? f.about : `raw target (${t})`);
    }
  } else {
    // fallback: static control list
    for (const [name, cfg] of Object.entries(MORPH_CONTROLS || {})) makeSlider(name, cfg.about);
  }
  console.log('morph sliders built:', sliders.length);
}

$('reset-morph').onclick = () => {
  mk.resetMorph();
  for (const s of sliders) { s.input.value = 0; s.out.textContent = '0.00'; }
};

$('wireframe').onchange = (e) => mk.setWireframe(e.target.checked);
$('blur').onchange = (e) => mk.setBlur(e.target.checked);

window.mk = mk;
