import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createAxesGuide, createSurfaceGeometry, updateSurfaceGeometry, definiteness } from './utils.js';

export const HESSIAN = { fxx: 1.0, fyy: 1.0, fxy: 0.0 };

const DEF_COLORS = {
  'positive-definite': { border: '#A3BE8C', label: 'Positive Definite ▲' },
  'negative-definite': { border: '#BF616A', label: 'Negative Definite ▼' },
  'indefinite':        { border: '#EBCB8B', label: 'Indefinite — Saddle ✕' },
  'semi-definite':     { border: '#81A1C1', label: 'Semi-Definite ─' },
};

function surfaceFn(x, z) {
  return 0.5 * (HESSIAN.fxx * x * x + 2 * HESSIAN.fxy * x * z + HESSIAN.fyy * z * z);
}

export class ShapeShifterScene {
  constructor(renderer) {
    this.renderer = renderer;
    this.controls = null;
    this._dirty = false;
    this._zoomT = 0.5;
    this._prevT = null;
    this._buildScene();
    this._bindUI();
    this._resetBall();
  }

  _buildScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2E3440);

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.01, 200);
    this.camera.position.set(0, 5, 8);
    this.camera.lookAt(0, 0, 0);

    const dir = new THREE.DirectionalLight(0xECEFF4, 1.5);
    dir.position.set(3, 5, 4);
    this.scene.add(dir);
    this.scene.add(new THREE.AmbientLight(0x4C566A, 0.9));

    this.scene.add(new THREE.GridHelper(10, 20, 0x3B4252, 0x3B4252));
    this.scene.add(createAxesGuide(1.9, new THREE.Vector3(-4.8, 0, -4.8)));

    this.surfaceGeo = createSurfaceGeometry(surfaceFn, 5, 60);
    this.surfaceMesh = new THREE.Mesh(this.surfaceGeo, new THREE.MeshStandardMaterial({
      vertexColors: true, side: THREE.DoubleSide, roughness: 0.6,
    }));
    this.scene.add(this.surfaceMesh);

    // Ball (Nord13 gold)
    this.ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xEBCB8B, roughness: 0.12, metalness: 0.9 })
    );
    this.scene.add(this.ball);

    // Shadow disc under ball
    this.ballShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.12, 24),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 })
    );
    this.scene.add(this.ballShadow);
  }

  _resetBall() {
    this.bbx = 0.15;
    this.bbz = 0.15;
    this.bvx = 0;
    this.bvz = 0;
    this._prevT = null;
  }

  _bindUI() {
    ['fxx', 'fyy', 'fxy'].forEach(id => {
      document.getElementById(id).addEventListener('input', () => this._onSlider());
    });
    document.getElementById('reset-hessian').addEventListener('click', () => {
      HESSIAN.fxx = 1; HESSIAN.fyy = 1; HESSIAN.fxy = 0;
      document.getElementById('fxx').value = 1;
      document.getElementById('fyy').value = 1;
      document.getElementById('fxy').value = 0;
      this._syncUI();
      this._dirty = true;
      this._resetBall();
    });
    document.getElementById('reset-ball-shaper').addEventListener('click', () => this._resetBall());
    this._syncUI();
  }

  _onSlider() {
    HESSIAN.fxx = parseFloat(document.getElementById('fxx').value);
    HESSIAN.fyy = parseFloat(document.getElementById('fyy').value);
    HESSIAN.fxy = parseFloat(document.getElementById('fxy').value);
    this._syncUI();
    this._dirty = true;
  }

  _syncUI() {
    const { fxx, fyy, fxy } = HESSIAN;
    document.getElementById('fxx-val').textContent = fxx.toFixed(2);
    document.getElementById('fyy-val').textContent = fyy.toFixed(2);
    document.getElementById('fxy-val').textContent = fxy.toFixed(2);
    document.getElementById('m00').textContent = fxx.toFixed(2);
    document.getElementById('m01').textContent = fxy.toFixed(2);
    document.getElementById('m10').textContent = fxy.toFixed(2);
    document.getElementById('m11').textContent = fyy.toFixed(2);

    const def = definiteness(fxx, fxy, fyy);
    const info = DEF_COLORS[def];
    document.getElementById('definiteness-label').textContent = info.label;
    document.getElementById('definiteness-label').style.color = info.border;
    document.getElementById('matrix-display').style.borderColor = info.border;
  }

  setZoom(t) {
    this._zoomT = t;
    const target = this.controls?.target.clone() ?? new THREE.Vector3();
    const dir = this.camera.position.clone().sub(target).normalize();
    const dist = 18 - 15.5 * t;
    this.camera.position.copy(target).addScaledVector(dir, dist);
    this.controls?.update();
  }

  activate() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
  }

  deactivate() {
    this.controls?.dispose();
    this.controls = null;
  }

  update(t) {
    if (this._dirty) {
      updateSurfaceGeometry(this.surfaceGeo, surfaceFn, 5, 60);
      this._dirty = false;
    }

    // Ball physics: roll down ∇f = (fxx·x + fxy·z, fxy·x + fyy·z)
    if (this._prevT !== null) {
      const dt = Math.min((t - this._prevT) / 1000, 0.04);
      const { fxx, fxy, fyy } = HESSIAN;
      const g = 3.0, damp = 0.992;
      const gx = fxx * this.bbx + fxy * this.bbz;
      const gz = fxy * this.bbx + fyy * this.bbz;
      this.bvx += -g * gx * dt;
      this.bvz += -g * gz * dt;
      this.bvx *= damp;
      this.bvz *= damp;
      this.bbx += this.bvx * dt;
      this.bbz += this.bvz * dt;

      const bound = 2.3;
      if (Math.abs(this.bbx) > bound) { this.bbx = Math.sign(this.bbx) * bound; this.bvx *= -0.55; }
      if (Math.abs(this.bbz) > bound) { this.bbz = Math.sign(this.bbz) * bound; this.bvz *= -0.55; }
    }
    this._prevT = t;

    const by = surfaceFn(this.bbx, this.bbz) + 0.15;
    this.ball.position.set(this.bbx, by, this.bbz);
    this.ballShadow.position.set(this.bbx, surfaceFn(this.bbx, this.bbz) + 0.01, this.bbz);
    this.ballShadow.rotation.x = -Math.PI / 2;

    this.controls?.update();
  }

  render() { this.renderer.render(this.scene, this.camera); }

  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
}
