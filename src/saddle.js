import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createAxesGuide, createSurfaceGeometry } from './utils.js';

// y = 0.4*(x² − z²): stable in x, unstable in z
const saddleFn = (x, z) => 0.4 * (x * x - z * z);

export class SaddleScene {
  constructor(renderer) {
    this.renderer = renderer;
    this.controls = null;
    this._zoomT = 0.5;
    this._buildScene();
    this._bindUI();
    this._resetBall();
  }

  _buildScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2E3440);
    this.scene.fog = new THREE.FogExp2(0x2E3440, 0.05);

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.01, 200);
    this.camera.position.set(1.5, 4.5, 8);
    this.camera.lookAt(0, 0, 0);

    const dir = new THREE.DirectionalLight(0xECEFF4, 1.6);
    dir.position.set(3, 6, 4);
    this.scene.add(dir);
    this.scene.add(new THREE.AmbientLight(0x4C566A, 0.9));

    // Saddle surface
    const geo = createSurfaceGeometry(saddleFn, 6, 64);
    this.surfaceMesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      vertexColors: true, side: THREE.DoubleSide, roughness: 0.65,
    }));
    this.scene.add(this.surfaceMesh);

    // Grid & axes
    const grid = new THREE.GridHelper(10, 20, 0x3B4252, 0x3B4252);
    grid.position.y = -1.5;
    this.scene.add(grid);
    this.scene.add(createAxesGuide(2.0, new THREE.Vector3(-4.8, -1.48, -4.8)));

    // Eigenvector arrows at origin (λ₁=+0.8 x-axis, λ₂=-0.8 z-axis)
    this.ev1Arrow = new THREE.ArrowHelper(
      new THREE.Vector3(1,0,0), new THREE.Vector3(0,0.05,0), 2.5, 0xA3BE8C, 0.3, 0.15
    );
    this.ev2Arrow = new THREE.ArrowHelper(
      new THREE.Vector3(0,0,1), new THREE.Vector3(0,0.05,0), 2.5, 0xBF616A, 0.3, 0.15
    );
    this.scene.add(this.ev1Arrow);
    this.scene.add(this.ev2Arrow);

    // Ball (Nord13 gold)
    const ballGeo = new THREE.SphereGeometry(0.17, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xEBCB8B, roughness: 0.15, metalness: 0.9 });
    this.ball = new THREE.Mesh(ballGeo, ballMat);
    this.scene.add(this.ball);

    // Velocity arrow (red)
    this.velArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1,0,0), new THREE.Vector3(), 0.5,
      0xBF616A, 0.18, 0.10
    );
    this.velArrow.visible = false;
    this.scene.add(this.velArrow);

    // Shadow circle under ball
    const shadowGeo = new THREE.CircleGeometry(0.14, 24);
    this.ballShadow = new THREE.Mesh(shadowGeo, new THREE.MeshBasicMaterial({
      color: 0x000000, transparent: true, opacity: 0.35,
    }));
    this.scene.add(this.ballShadow);
  }

  _resetBall() {
    this.bx = 0.08;
    this.bz = 0.12;
    this.vx = 0;
    this.vz = 0;
    this._prevT = null;
  }

  _bindUI() {
    document.getElementById('reset-ball').addEventListener('click', () => this._resetBall());
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
    this.controls.target.set(0, 0, 0);
  }

  deactivate() {
    this.controls?.dispose();
    this.controls = null;
  }

  update(t) {
    if (this._prevT === null) { this._prevT = t; }
    const dt = Math.min((t - this._prevT) / 1000, 0.04);
    this._prevT = t;

    // ∇f(x,z) = (0.8x, -0.8z) → force = -g·∇f = (-g·0.8x, +g·0.8z)
    const g = 3.0, k = 0.8, damp = 0.995;
    this.vx += (-g * k * this.bx) * dt;
    this.vz += ( g * k * this.bz) * dt;
    this.vx *= damp;
    this.vz *= damp;
    this.bx += this.vx * dt;
    this.bz += this.vz * dt;

    // Soft boundary
    const bound = 2.7;
    if (Math.abs(this.bx) > bound) { this.bx = Math.sign(this.bx) * bound; this.vx *= -0.6; }
    if (Math.abs(this.bz) > bound) { this.bz = Math.sign(this.bz) * bound; this.vz *= -0.6; }

    const by = saddleFn(this.bx, this.bz) + 0.17;
    this.ball.position.set(this.bx, by, this.bz);
    this.ballShadow.position.set(this.bx, saddleFn(this.bx, this.bz) + 0.01, this.bz);
    this.ballShadow.rotation.x = -Math.PI / 2;

    const speed = Math.sqrt(this.vx * this.vx + this.vz * this.vz);
    if (speed > 0.05) {
      this.velArrow.position.set(this.bx, by, this.bz);
      this.velArrow.setDirection(new THREE.Vector3(this.vx, 0, this.vz).normalize());
      this.velArrow.setLength(Math.min(speed * 0.4, 1.6), 0.18, 0.10);
      this.velArrow.visible = true;
    } else {
      this.velArrow.visible = false;
    }

    this.controls?.update();
  }

  render() { this.renderer.render(this.scene, this.camera); }

  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
}
