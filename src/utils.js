import * as THREE from 'three';

const NEUTRAL = new THREE.Color(0x4C566A); // Nord3
const WARM    = new THREE.Color(0xD08770); // Nord12
const COOL    = new THREE.Color(0x5E81AC); // Nord10

export function createAxesGuide(length = 3, position = new THREE.Vector3()) {
  const group = new THREE.Group();
  group.position.copy(position);
  group.add(new THREE.AxesHelper(length));

  const makeLabel = (text, color, position) => {
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2E3440';
    ctx.beginPath();
    ctx.arc(48, 48, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = `#${new THREE.Color(color).getHexString()}`;
    ctx.stroke();
    ctx.fillStyle = '#ECEFF4';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 48, 50);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.scale.setScalar(length * 0.24);
    return sprite;
  };

  group.add(makeLabel('X', 0xff5555, new THREE.Vector3(length + 0.35, 0, 0)));
  group.add(makeLabel('Y', 0xA3BE8C, new THREE.Vector3(0, length + 0.35, 0)));
  group.add(makeLabel('Z', 0x5E81AC, new THREE.Vector3(0, 0, length + 0.35)));
  return group;
}

export function heightToColor(h, maxAbs) {
  const t = Math.min(1, Math.abs(h) / Math.max(maxAbs, 0.01));
  return h >= 0
    ? NEUTRAL.clone().lerp(WARM, t)
    : NEUTRAL.clone().lerp(COOL, t);
}

export function createSurfaceGeometry(fn, size = 5, N = 60) {
  const count = (N + 1) * (N + 1);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const indices = [];
  const hs = new Float32Array(count);
  let minH = Infinity, maxH = -Infinity;

  for (let i = 0; i <= N; i++) {
    for (let j = 0; j <= N; j++) {
      const x = (i / N - 0.5) * size;
      const z = (j / N - 0.5) * size;
      const y = fn(x, z);
      const idx = i * (N + 1) + j;
      hs[idx] = y;
      positions[idx * 3]     = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;
      if (y < minH) minH = y;
      if (y > maxH) maxH = y;
      if (i < N && j < N) {
        const a = idx, b = a + 1, c = a + (N + 1), d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
  }

  const maxAbs = Math.max(Math.abs(minH), Math.abs(maxH));
  for (let k = 0; k < count; k++) {
    const c = heightToColor(hs[k], maxAbs);
    colors[k * 3]     = c.r;
    colors[k * 3 + 1] = c.g;
    colors[k * 3 + 2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function updateSurfaceGeometry(geo, fn, size = 5, N = 60) {
  const pos = geo.attributes.position.array;
  const col = geo.attributes.color.array;
  const count = (N + 1) * (N + 1);
  const hs = new Float32Array(count);
  let minH = Infinity, maxH = -Infinity;

  for (let i = 0; i <= N; i++) {
    for (let j = 0; j <= N; j++) {
      const idx = i * (N + 1) + j;
      const x = pos[idx * 3];
      const z = pos[idx * 3 + 2];
      const y = fn(x, z);
      hs[idx] = y;
      pos[idx * 3 + 1] = y;
      if (y < minH) minH = y;
      if (y > maxH) maxH = y;
    }
  }

  const maxAbs = Math.max(Math.abs(minH), Math.abs(maxH));
  for (let k = 0; k < count; k++) {
    const c = heightToColor(hs[k], maxAbs);
    col[k * 3]     = c.r;
    col[k * 3 + 1] = c.g;
    col[k * 3 + 2] = c.b;
  }

  geo.attributes.position.needsUpdate = true;
  geo.attributes.color.needsUpdate = true;
  geo.computeVertexNormals();
}

/** Returns { lambda1, lambda2, v1, v2 } for 2×2 symmetric [[a,b],[b,d]] */
export function eigendecompose2x2(a, b, d) {
  const trace = a + d;
  const disc  = Math.sqrt(Math.max(0, (a - d) ** 2 + 4 * b * b));
  const lambda1 = (trace + disc) / 2;
  const lambda2 = (trace - disc) / 2;

  let v1x = 1, v1z = 0;
  if (Math.abs(b) > 1e-9) {
    const nx = lambda1 - d;
    const nz = b;
    const len = Math.sqrt(nx * nx + nz * nz);
    v1x = nx / len;
    v1z = nz / len;
  } else if (d > a) {
    v1x = 0; v1z = 1;
  }

  return {
    lambda1, lambda2,
    v1: new THREE.Vector2(v1x, v1z),
    v2: new THREE.Vector2(-v1z, v1x),
  };
}

export function definiteness(fxx, fxy, fyy) {
  const det = fxx * fyy - fxy * fxy;
  if (det > 1e-9 && fxx > 1e-9) return 'positive-definite';
  if (det > 1e-9 && fxx < -1e-9) return 'negative-definite';
  if (det < -1e-9) return 'indefinite';
  return 'semi-definite';
}
