import * as THREE from 'three';
import { TerrainScene }      from './terrain.js';
import { ShapeShifterScene } from './shapeShifter.js';
import { CurvatureScene }    from './curvature.js';
import { SaddleScene }       from './saddle.js';
import { modalCopy }         from './modal.js';

// ── Renderer ────────────────────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ── Scenes ──────────────────────────────────────────────────────────────────
const scenes = {
  terrain:   new TerrainScene(renderer),
  shaper:    new ShapeShifterScene(renderer),
  curvature: new CurvatureScene(renderer),
  saddle:    new SaddleScene(renderer),
};

let activeTab  = 'terrain';
let activeScene = scenes.terrain;
activeScene.activate();

// ── Zoom slider ──────────────────────────────────────────────────────────────
const zoomSlider = document.getElementById('zoom-slider');
zoomSlider.addEventListener('input', () => {
  activeScene.setZoom(parseInt(zoomSlider.value) / 100);
});

// ── Tab switching ────────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const name = btn.dataset.tab;
    if (name === activeTab) return;

    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('.ctrl-panel').forEach(p => { p.hidden = true; });
    document.getElementById(`ctrl-${name}`).hidden = false;

    activeScene.deactivate();
    activeTab   = name;
    activeScene = scenes[name];
    activeScene.activate();
    zoomSlider.value = Math.round(activeScene._zoomT * 100);
  });
});

// Initial panel state
document.querySelectorAll('.ctrl-panel').forEach(p => { p.hidden = true; });
document.getElementById('ctrl-terrain').hidden = false;

// ── Resize ───────────────────────────────────────────────────────────────────
function resize() {
  const workspace = document.getElementById('workspace');
  const controls  = document.getElementById('sidebar');
  const w = workspace.clientWidth - controls.offsetWidth;
  const h = workspace.clientHeight;
  if (w > 0 && h > 0) {
    renderer.setSize(w, h);
    Object.values(scenes).forEach(s => s.resize(w, h));
  }
}
window.addEventListener('resize', resize);
resize();

// ── Math Modal ───────────────────────────────────────────────────────────────
let modalLang = 'en';
const mathModal    = document.getElementById('math-modal');
const mathContent  = document.getElementById('math-content');

function renderModal() {
  mathContent.innerHTML = modalCopy[modalLang];
  if (window.renderMathInElement) {
    window.renderMathInElement(mathContent, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$',  right: '$',  display: false },
      ],
    });
  }
  if (window.Prism) window.Prism.highlightAllUnder(mathContent);
}

document.getElementById('open-math').addEventListener('click', () => {
  renderModal();
  mathModal.hidden = false;
});
document.getElementById('close-math').addEventListener('click', () => {
  mathModal.hidden = true;
});
document.getElementById('language-toggle').addEventListener('click', () => {
  modalLang = modalLang === 'en' ? 'zhTW' : 'en';
  renderModal();
});
mathModal.addEventListener('click', (e) => {
  if (e.target === mathModal) mathModal.hidden = true;
});

// ── Animation loop ────────────────────────────────────────────────────────────
function animate(t = 0) {
  requestAnimationFrame(animate);
  activeScene.update(t);
  activeScene.render();
}
animate();
