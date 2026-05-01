import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createAxesGuide, createSurfaceGeometry } from './utils.js';

const SURFACES = {
  bowl:   (x, z) =>  0.35 * (x * x + z * z),
  bell:   (x, z) =>  2.0  * Math.exp(-(x * x + z * z) * 0.6),
  saddle: (x, z) =>  0.35 * (x * x - z * z),
};

const HESSIANS = {
  bowl: () => ({ hxx: 0.7, hxz: 0.0, hzz: 0.7 }),
  bell: (x, z) => {
    const expTerm = Math.exp(-(x * x + z * z) * 0.6);
    return {
      hxx: expTerm * (2.88 * x * x - 2.4),
      hxz: expTerm * (2.88 * x * z),
      hzz: expTerm * (2.88 * z * z - 2.4),
    };
  },
  saddle: () => ({ hxx: 0.7, hxz: 0.0, hzz: -0.7 }),
};

export class TerrainScene {
  constructor(renderer) {
    this.renderer = renderer;
    this.controls = null;
    this._surfaceKey = 'bowl';
    this._fn = SURFACES.bowl;
    this._mouse = new THREE.Vector2();
    this._raycaster = new THREE.Raycaster();
    this._pointReadout = document.getElementById('terrain-point-readout');
    this._j00 = document.getElementById('terrain-j00');
    this._j01 = document.getElementById('terrain-j01');
    this._j10 = document.getElementById('terrain-j10');
    this._j11 = document.getElementById('terrain-j11');
    this._hoverH00 = document.getElementById('terrain-hover-h00');
    this._hoverH01 = document.getElementById('terrain-hover-h01');
    this._hoverH10 = document.getElementById('terrain-hover-h10');
    this._hoverH11 = document.getElementById('terrain-hover-h11');
    this._buildScene();
    this._bindUI();
    this._setupMouse();
    this._clearHoverReadout();
  }

  _buildScene() {
    this._zoomT = 0.5;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2E3440);
    this.scene.fog = new THREE.FogExp2(0x2E3440, 0.06);

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.01, 200);
    this.camera.position.set(0, 4.5, 7);
    this.camera.lookAt(0, 0, 0);

    const dir = new THREE.DirectionalLight(0xECEFF4, 1.5);
    dir.position.set(3, 5, 4);
    this.scene.add(dir);
    this.scene.add(new THREE.AmbientLight(0x4C566A, 0.9));

    const grid = new THREE.GridHelper(10, 24, 0x3B4252, 0x3B4252);
    grid.position.y = -0.02;
    this.scene.add(grid);
    this.scene.add(createAxesGuide(2.0, new THREE.Vector3(-4.8, -0.02, -4.8)));

    this._buildSurface();

    // Gradient arrow (Nord13 yellow)
    this.gradArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1,
      0xEBCB8B, 0.28, 0.14
    );
    this.gradArrow.visible = false;
    this.scene.add(this.gradArrow);

    // Tangent plane
    const tpMat = new THREE.MeshBasicMaterial({
      color: 0x88C0D0, transparent: true, opacity: 0.30, side: THREE.DoubleSide,
    });
    this.tangentPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), tpMat);
    this.tangentPlane.visible = false;
    this.scene.add(this.tangentPlane);

    // Hover dot
    this.hoverDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xECEFF4 })
    );
    this.hoverDot.visible = false;
    this.scene.add(this.hoverDot);
  }

  _buildSurface() {
    if (this.surfaceMesh) this.scene.remove(this.surfaceMesh);
    const geo = createSurfaceGeometry(this._fn, 6, 64);
    this.surfaceMesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      vertexColors: true, side: THREE.DoubleSide, roughness: 0.65, metalness: 0.05,
    }));
    this.scene.add(this.surfaceMesh);
  }

  _bindUI() {
    document.getElementById('surface-type').addEventListener('change', (e) => {
      this._surfaceKey = e.target.value;
      this._fn = SURFACES[this._surfaceKey];
      this._buildSurface();
      this._onLeave();
    });
  }

  _setupMouse() {
    const el = this.renderer.domElement;
    this._onMove = (e) => {
      const r = el.getBoundingClientRect();
      this._mouse.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -((e.clientY - r.top) / r.height) * 2 + 1
      );
      this._hover();
    };
    this._onLeave = () => {
      this.gradArrow.visible = false;
      this.tangentPlane.visible = false;
      this.hoverDot.visible = false;
      this._clearHoverReadout();
    };
    el.addEventListener('mousemove', this._onMove);
    el.addEventListener('mouseleave', this._onLeave);
  }

  _format(n) {
    return Number.isFinite(n) ? n.toFixed(2) : '--';
  }

  _clearHoverReadout() {
    this._pointReadout.innerHTML = 'Move over the surface to inspect the local point.';
    this._j00.textContent = '--';
    this._j01.textContent = '0.00';
    this._j10.textContent = '0.00';
    this._j11.textContent = '--';
    this._hoverH00.textContent = '--';
    this._hoverH01.textContent = '--';
    this._hoverH10.textContent = '--';
    this._hoverH11.textContent = '--';
  }

  _updateHoverReadout(point, jacobian, hessian) {
    this._pointReadout.innerHTML =
      `x = <strong>${this._format(point.x)}</strong>, ` +
      `z = <strong>${this._format(point.z)}</strong><br>` +
      `y = f(x, z) = <strong>${this._format(point.y)}</strong>`;
    this._j00.textContent = this._format(jacobian.fx);
    this._j01.textContent = '0.00';
    this._j10.textContent = '0.00';
    this._j11.textContent = this._format(jacobian.fz);
    this._hoverH00.textContent = this._format(hessian.hxx);
    this._hoverH01.textContent = this._format(hessian.hxz);
    this._hoverH10.textContent = this._format(hessian.hxz);
    this._hoverH11.textContent = this._format(hessian.hzz);
  }

  _hover() {
    if (!this.surfaceMesh) return;
    this._raycaster.setFromCamera(this._mouse, this.camera);
    const hits = this._raycaster.intersectObject(this.surfaceMesh);
    if (!hits.length) {
      this.gradArrow.visible = false;
      this.tangentPlane.visible = false;
      this.hoverDot.visible = false;
      this._clearHoverReadout();
      return;
    }
    const p = hits[0].point;
    const eps = 0.015;
    const gx = (this._fn(p.x + eps, p.z) - this._fn(p.x - eps, p.z)) / (2 * eps);
    const gz = (this._fn(p.x, p.z + eps) - this._fn(p.x, p.z - eps)) / (2 * eps);
    const gradLen = Math.sqrt(gx * gx + gz * gz);

    const gradDir = new THREE.Vector3(gx, 0, gz);
    if (gradLen > 1e-4) gradDir.normalize();

    this.gradArrow.position.copy(p);
    this.gradArrow.setDirection(gradDir);
    this.gradArrow.setLength(Math.min(gradLen * 0.7 + 0.35, 2.2), 0.28, 0.14);
    this.gradArrow.visible = true;

    const normal = new THREE.Vector3(-gx, 1, -gz).normalize();
    this.tangentPlane.position.copy(p);
    this.tangentPlane.lookAt(p.clone().add(normal));
    this.tangentPlane.visible = true;

    this.hoverDot.position.copy(p);
    this.hoverDot.visible = true;

    const hessian = HESSIANS[this._surfaceKey](p.x, p.z);
    this._updateHoverReadout(p, { fx: gx, fz: gz }, hessian);
  }

  activate() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.set(0, 0.3, 0);
  }

  deactivate() {
    this.controls?.dispose();
    this.controls = null;
    this._onLeave();
  }

  setZoom(t) {
    this._zoomT = t;
    const target = this.controls?.target.clone() ?? new THREE.Vector3(0, 0.3, 0);
    const dir = this.camera.position.clone().sub(target).normalize();
    const dist = 18 - 15.5 * t; // t=0 → 18 (far), t=1 → 2.5 (close)
    this.camera.position.copy(target).addScaledVector(dir, dist);
    this.controls?.update();
  }

  update() { this.controls?.update(); }

  render() { this.renderer.render(this.scene, this.camera); }

  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
}
