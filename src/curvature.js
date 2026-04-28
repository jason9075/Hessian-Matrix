import * as THREE from 'three';
import { HESSIAN } from './shapeShifter.js';
import { createAxesGuide, eigendecompose2x2, definiteness } from './utils.js';

export class CurvatureScene {
  constructor(renderer) {
    this.renderer = renderer;
    this._ellipse = null;
    this._arrows = [];
    this._prevHash = '';
    this._zoomT = 0.5;
    this._aspect = 1;
    this._S = 5.5;
    this._buildScene();
    this._bindUI();
  }

  _buildScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2E3440);

    const S = 5.5;
    this.camera = new THREE.OrthographicCamera(-S, S, S, -S, 0.01, 100);
    this.camera.position.set(0, 10, 0);
    this.camera.lookAt(0, 0, 0);

    this.scene.add(new THREE.GridHelper(12, 24, 0x3B4252, 0x3B4252));
    this.scene.add(createAxesGuide(1.6, new THREE.Vector3(-5.4, 0.03, -5.4)));

    // X/Z axis lines
    const axisMat = new THREE.LineBasicMaterial({ color: 0x4C566A });
    [[5,0,0,-5,0,0],[0,0,5,0,0,-5]].forEach(([x1,y1,z1,x2,y2,z2]) => {
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x1,0.02,z1), new THREE.Vector3(x2,0.02,z2)
      ]);
      this.scene.add(new THREE.Line(g, axisMat));
    });

    // Axis labels via sprites (simple colored dots at tips)
    const labelGeo = new THREE.SphereGeometry(0.08);
    [[5,0,0, 0xD08770],[0,0,5, 0x88C0D0]].forEach(([x,y,z,color]) => {
      this.scene.add(new THREE.Mesh(labelGeo, new THREE.MeshBasicMaterial({ color })));
    });

    this._rebuild();
  }

  _stateHash() {
    return `${HESSIAN.fxx.toFixed(3)},${HESSIAN.fxy.toFixed(3)},${HESSIAN.fyy.toFixed(3)}`;
  }

  _clearDrawings() {
    if (this._ellipse) { this.scene.remove(this._ellipse); this._ellipse = null; }
    this._arrows.forEach(a => this.scene.remove(a));
    this._arrows = [];
  }

  _rebuild() {
    this._clearDrawings();
    const { fxx, fxy, fyy } = HESSIAN;
    const { lambda1, lambda2, v1, v2 } = eigendecompose2x2(fxx, fxy, fyy);
    const def = definiteness(fxx, fxy, fyy);

    // Update eigenvalue display
    const l1El = document.getElementById('lambda1');
    const l2El = document.getElementById('lambda2');
    if (l1El) l1El.textContent = lambda1.toFixed(3);
    if (l2El) l2El.textContent = lambda2.toFixed(3);

    const colorL1 = lambda1 >= 0 ? 0xD08770 : 0x5E81AC;
    const colorL2 = lambda2 >= 0 ? 0xD08770 : 0x5E81AC;

    // Draw ellipse for definite matrices (level curve z=c for c=2)
    if (def === 'positive-definite' || def === 'negative-definite') {
      const c = 2;
      const a = Math.abs(lambda1) > 0.01 ? Math.sqrt(2 * c / Math.abs(lambda1)) : 4;
      const b = Math.abs(lambda2) > 0.01 ? Math.sqrt(2 * c / Math.abs(lambda2)) : 4;
      const angle = Math.atan2(v1.y, v1.x);
      const pts = [];
      for (let i = 0; i <= 128; i++) {
        const t = (i / 128) * Math.PI * 2;
        const lx = a * Math.cos(t);
        const ly = b * Math.sin(t);
        pts.push(new THREE.Vector3(
          lx * Math.cos(angle) - ly * Math.sin(angle),
          0.03,
          lx * Math.sin(angle) + ly * Math.cos(angle)
        ));
      }
      const ellipseColor = def === 'positive-definite' ? 0xD08770 : 0x5E81AC;
      this._ellipse = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: ellipseColor })
      );
      this.scene.add(this._ellipse);
    } else {
      // Indefinite: draw asymptotes (eigenvectors through origin)
      const asMat = new THREE.LineDashedMaterial({ color: 0xEBCB8B, dashSize: 0.2, gapSize: 0.1 });
      [[v1.x, v1.y], [v2.x, v2.y]].forEach(([vx, vz]) => {
        const g = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-vx*4.5, 0.03, -vz*4.5),
          new THREE.Vector3( vx*4.5, 0.03,  vz*4.5),
        ]);
        const l = new THREE.Line(g, asMat);
        l.computeLineDistances();
        this.scene.add(l);
        this._arrows.push(l);
      });
    }

    // Eigenvector arrows
    const arrowLen1 = def !== 'semi-definite' && Math.abs(lambda1) > 0.01
      ? Math.min(Math.sqrt(2 * 2 / Math.abs(lambda1)) * 0.9, 4.5) : 2.5;
    const arrowLen2 = def !== 'semi-definite' && Math.abs(lambda2) > 0.01
      ? Math.min(Math.sqrt(2 * 2 / Math.abs(lambda2)) * 0.9, 4.5) : 2.5;

    const origin = new THREE.Vector3(0, 0.05, 0);
    const makeArrow = (vx, vz, len, color) => {
      const dir = new THREE.Vector3(vx, 0, vz).normalize();
      const arr = new THREE.ArrowHelper(dir, origin, len, color, 0.3, 0.15);
      const arrNeg = new THREE.ArrowHelper(dir.clone().negate(), origin, len, color, 0.3, 0.15);
      this.scene.add(arr);
      this.scene.add(arrNeg);
      this._arrows.push(arr, arrNeg);
    };
    makeArrow(v1.x, v1.y, arrowLen1, colorL1);
    makeArrow(v2.x, v2.y, arrowLen2, colorL2);
  }

  _bindUI() {
    document.getElementById('reset-hessian2').addEventListener('click', () => {
      HESSIAN.fxx = 1; HESSIAN.fyy = 1; HESSIAN.fxy = 0;
      document.getElementById('fxx2').value = 1;
      document.getElementById('fyy2').value = 1;
      document.getElementById('fxy2').value = 0;
      document.getElementById('fxx-val2').textContent = '1.00';
      document.getElementById('fyy-val2').textContent = '1.00';
      document.getElementById('fxy-val2').textContent = '0.00';
      // Keep shaper sliders in sync
      document.getElementById('fxx').value = 1;
      document.getElementById('fyy').value = 1;
      document.getElementById('fxy').value = 0;
      this._rebuild();
    });
    ['fxx2','fyy2','fxy2'].forEach(id => {
      document.getElementById(id).addEventListener('input', () => {
        HESSIAN.fxx = parseFloat(document.getElementById('fxx2').value);
        HESSIAN.fyy = parseFloat(document.getElementById('fyy2').value);
        HESSIAN.fxy = parseFloat(document.getElementById('fxy2').value);
        document.getElementById('fxx-val2').textContent = HESSIAN.fxx.toFixed(2);
        document.getElementById('fyy-val2').textContent = HESSIAN.fyy.toFixed(2);
        document.getElementById('fxy-val2').textContent = HESSIAN.fxy.toFixed(2);

        // Keep shaper sliders in sync
        document.getElementById('fxx').value = HESSIAN.fxx;
        document.getElementById('fyy').value = HESSIAN.fyy;
        document.getElementById('fxy').value = HESSIAN.fxy;

        this._rebuild();
      });
    });
  }

  setZoom(t) {
    this._zoomT = t;
    this._S = 8 - 6 * t; // t=0 → S=8 (far), t=1 → S=2 (close)
    this._updateOrtho();
  }

  _updateOrtho() {
    this.camera.left   = -this._S * this._aspect;
    this.camera.right  =  this._S * this._aspect;
    this.camera.top    =  this._S;
    this.camera.bottom = -this._S;
    this.camera.updateProjectionMatrix();
  }

  activate() {
    // Sync sliders from current HESSIAN state
    document.getElementById('fxx2').value = HESSIAN.fxx;
    document.getElementById('fyy2').value = HESSIAN.fyy;
    document.getElementById('fxy2').value = HESSIAN.fxy;
    document.getElementById('fxx-val2').textContent = HESSIAN.fxx.toFixed(2);
    document.getElementById('fyy-val2').textContent = HESSIAN.fyy.toFixed(2);
    document.getElementById('fxy-val2').textContent = HESSIAN.fxy.toFixed(2);
    this._rebuild();
  }

  deactivate() {}

  update() {
    const h = this._stateHash();
    if (h !== this._prevHash) { this._prevHash = h; this._rebuild(); }
  }

  render() { this.renderer.render(this.scene, this.camera); }

  resize(w, h) {
    this._aspect = w / h;
    this._updateOrtho();
  }
}
