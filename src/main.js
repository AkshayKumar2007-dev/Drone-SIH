import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as CANNON from 'cannon-es';

window._test = 'start';
window._errLog = [];
window.addEventListener('error', e => {
  const d = document.createElement('div');
  d.style.position = 'fixed';
  d.style.top = '0';
  d.style.left = '0';
  d.style.background = 'red';
  d.style.color = 'white';
  d.style.padding = '8px';
  d.style.zIndex = '9999';
  d.textContent = 'ERR:' + e.message;
  document.body.appendChild(d);
  window._errLog.push(e.message);
});

const container = document.getElementById('canvas-container');

// Three.js Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 140, 750);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1400);
camera.position.set(0, 3.2, -7.5);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.tabIndex = 0;
renderer.domElement.style.outline = 'none';
container.appendChild(renderer.domElement);
renderer.domElement.focus();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 2.0;
controls.maxDistance = 650;
controls.maxPolarAngle = Math.PI / 2.02;
controls.target.set(0, 0.8, 3.0);

// Lighting + Day/Night
const hemi = new THREE.HemisphereLight(0xffffff, 0x444455, 1.05);
scene.add(hemi);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(80, 120, -60);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 700;
dirLight.shadow.camera.left = -380;
dirLight.shadow.camera.right = 380;
dirLight.shadow.camera.top = 380;
dirLight.shadow.camera.bottom = -380;
scene.add(dirLight);
let dayPhase = 0; // 0 day, 1 night

// Physics world - 6-DOF with Rigidbody
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.81, 0), allowSleep: false });
world.broadphase = new CANNON.SAPBroadphase(world);
world.solver.iterations = 14;
world.defaultContactMaterial.friction = 0.5;
world.defaultContactMaterial.restitution = 0.08;

const droneMat = new CANNON.Material('drone');
const groundMat = new CANNON.Material('ground');
world.addContactMaterial(new CANNON.ContactMaterial(droneMat, groundMat, { friction: 0.55, restitution: 0.06 }));
world.addContactMaterial(new CANNON.ContactMaterial(droneMat, droneMat, { friction: 0.4, restitution: 0.1 }));

// Ground physics
const groundBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: groundMat });
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

// Visual ground
const groundGeo = new THREE.PlaneGeometry(1400, 1400);
const groundMatVis = new THREE.MeshStandardMaterial({ color: 0x2e4a2e, roughness: 0.92 });
const ground = new THREE.Mesh(groundGeo, groundMatVis);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(1400, 140, 0x3a4a3a, 0x2a3a2a);
grid.position.y = 0.02;
scene.add(grid);

const hillGeo = new THREE.PlaneGeometry(1400, 180);
const hillCanvas = document.createElement('canvas');
hillCanvas.width = 1024;
hillCanvas.height = 128;
const hctx = hillCanvas.getContext('2d');
hctx.fillStyle = '#87CEEB';
hctx.fillRect(0, 0, 1024, 128);
hctx.fillStyle = '#6a8a6a';
hctx.beginPath();
hctx.moveTo(0, 80);
for (let x = 0; x <= 1024; x += 28) {
  hctx.lineTo(x, 38 + Math.sin(x * 0.012) * 22 + Math.cos(x * 0.03) * 10);
}
hctx.lineTo(1024, 128);
hctx.lineTo(0, 128);
hctx.closePath();
hctx.fill();
const hillTex = new THREE.CanvasTexture(hillCanvas);
for (const rot of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
  const hill = new THREE.Mesh(hillGeo, new THREE.MeshBasicMaterial({ map: hillTex, transparent: false, fog: false }));
  hill.position.set(Math.sin(rot) * 700, 70, Math.cos(rot) * 700);
  hill.rotation.y = rot;
  scene.add(hill);
}

// Helipad (H Pad)
const padGeo = new THREE.CylinderGeometry(4, 4, 0.2, 32);
const padMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.3, roughness: 0.6 });
const pad = new THREE.Mesh(padGeo, padMat);
pad.position.y = 0.1;
pad.receiveShadow = true;
scene.add(pad);

const padRing = new THREE.RingGeometry(3, 3.4, 32);
const padRingMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, side: THREE.DoubleSide });
const ring = new THREE.Mesh(padRing, padRingMat);
ring.rotation.x = -Math.PI / 2;
ring.position.y = 0.21;
scene.add(ring);

const hGeo = new THREE.PlaneGeometry(2.2, 2.2);
const hCan = document.createElement('canvas');
hCan.width = 128;
hCan.height = 128;
const hctx2 = hCan.getContext('2d');
hctx2.fillStyle = 'transparent';
hctx2.fillRect(0, 0, 128, 128);
hctx2.fillStyle = '#ffcc00';
hctx2.font = 'bold 96px sans-serif';
hctx2.textAlign = 'center';
hctx2.textBaseline = 'middle';
hctx2.fillText('H', 64, 72);
const hTex = new THREE.CanvasTexture(hCan);
const hMat = new THREE.MeshBasicMaterial({ map: hTex, transparent: true, side: THREE.DoubleSide });
const hMesh = new THREE.Mesh(hGeo, hMat);
hMesh.rotation.x = -Math.PI / 2;
hMesh.position.y = 0.22;
scene.add(hMesh);

// Environment setup & buildings
let seed = 1337;
function rnd() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
const obstacles = [];
const obstacleBodies = [];

function addBuilding(x, z, w, h, d, color = 0x555566) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.08 })
  );
  m.position.set(x, h / 2, z);
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  const shape = new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2));
  const b = new CANNON.Body({ mass: 0, shape, position: new CANNON.Vec3(x, h / 2, z), material: groundMat });
  world.addBody(b);
  obstacleBodies.push(b);
  const ent = { x, z, w, h, d, body: b, mesh: m };
  obstacles.push(ent);
  return ent;
}

function addTarmac(x, z, w, d, color = 0x2e333a) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.06 })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, 0.04, z);
  m.receiveShadow = true;
  scene.add(m);
}

// Airport Apron & Runway
addTarmac(0, -6, 110, 70, 0x3a4048);
addTarmac(0, -6, 108, 68, 0x454b54);
for (let i = -3; i <= 3; i++) {
  if (i === 0) continue;
  const line = new THREE.Mesh(new THREE.PlaneGeometry(12, 0.18), new THREE.MeshBasicMaterial({ color: 0xe8e8a0 }));
  line.rotation.x = -Math.PI / 2;
  line.position.set(i * 14, 0.06, -10);
  scene.add(line);
  const line2 = line.clone();
  line2.position.z = -2;
  scene.add(line2);
}
addTarmac(0, 26, 14, 58, 0x2f343b);
addTarmac(0, 72, 320, 14, 0x2f343b);
const runwayX = 0, runwayZ = 88, runwayL = 320, runwayW = 26;
const runway = new THREE.Mesh(new THREE.PlaneGeometry(runwayL, runwayW), new THREE.MeshStandardMaterial({ color: 0x1e2329, roughness: 0.9 }));
runway.rotation.x = -Math.PI / 2;
runway.position.set(runwayX, 0.05, runwayZ);
runway.receiveShadow = true;
scene.add(runway);

const shoulder1 = new THREE.Mesh(new THREE.PlaneGeometry(runwayL + 8, 3), new THREE.MeshStandardMaterial({ color: 0x50565e }));
shoulder1.rotation.x = -Math.PI / 2;
shoulder1.position.set(0, 0.045, runwayZ + runwayW / 2 + 1.5);
scene.add(shoulder1);
const shoulder2 = shoulder1.clone();
shoulder2.position.z = runwayZ - runwayW / 2 - 1.5;
scene.add(shoulder2);

for (let x = -runwayL / 2 + 12; x < runwayL / 2; x += 14) {
  const dash = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.7), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  dash.rotation.x = -Math.PI / 2;
  dash.position.set(x, 0.07, runwayZ);
  scene.add(dash);
}

// Airport Buildings
// Main terminal
addBuilding(0, -38, 52, 9, 14, 0xd8dde6);
// Control tower
addBuilding(-46, -36, 7, 22, 7, 0xc8cdd6);
// Terminal wings
addBuilding(-42, 12, 20, 8.5, 22, 0x8a919e);
addBuilding(42, 12, 20, 8.5, 22, 0x8a919e);
// Hangars
addBuilding(58, -18, 14, 6, 18, 0xb0b5bf);
addBuilding(-58, -18, 12, 5.5, 16, 0xc0392b);
// Additional airport structures
addBuilding(-70, -42, 18, 5, 12, 0x7a8594);   // cargo warehouse
addBuilding(70, -42, 18, 5, 12, 0x7a8594);     // cargo warehouse mirror
addBuilding(-30, -55, 14, 4, 10, 0x6b7585);     // maintenance hangar
addBuilding(30, -55, 14, 4, 10, 0x6b7585);      // maintenance hangar mirror
addBuilding(0, -58, 24, 3.5, 8, 0x8899aa);      // ground support facility
addBuilding(-68, 8, 10, 7, 10, 0x993333);       // fire station
addBuilding(68, 8, 10, 7, 10, 0x993333);        // fire station mirror
addBuilding(-50, -55, 8, 4.5, 8, 0x556677);     // fuel depot office
addBuilding(50, -55, 8, 4.5, 8, 0x556677);      // fuel depot office mirror
addBuilding(-80, -20, 16, 10, 16, 0x4a5568);    // large hangar left
addBuilding(80, -20, 16, 10, 16, 0x4a5568);     // large hangar right
addBuilding(0, -72, 40, 3, 12, 0x8a95a5);       // far terminal extension
addBuilding(-90, -50, 12, 3.5, 10, 0x6a7585);   // perimeter building
addBuilding(90, -50, 12, 3.5, 10, 0x6a7585);    // perimeter building mirror
addBuilding(-100, -30, 8, 6, 8, 0x556070);      // distant tower
addBuilding(100, -30, 8, 6, 8, 0x556070);       // distant tower mirror
addBuilding(-75, 25, 12, 4, 14, 0x8a8a7a);      // admin building
addBuilding(75, 25, 12, 4, 14, 0x8a8a7a);       // admin building mirror
addBuilding(-95, 10, 10, 5, 10, 0x7a7a6a);      // workshop
addBuilding(95, 10, 10, 5, 10, 0x7a7a6a);       // workshop mirror
addBuilding(0, 35, 16, 3, 10, 0x8a95a5);        // arrivals hall
addBuilding(-25, 40, 10, 2.5, 8, 0x99a5b5);     // arrivals annex
addBuilding(25, 40, 10, 2.5, 8, 0x99a5b5);      // arrivals annex mirror

// Fuel tanks (cylindrical)
function addFuelTank(x, z, r, h) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r, h, 16),
    new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.4, metalness: 0.3 })
  );
  m.position.set(x, h / 2, z);
  m.castShadow = true;
  scene.add(m);
  const shape = new CANNON.Cylinder(r, r, h, 12);
  const b = new CANNON.Body({ mass: 0, shape, position: new CANNON.Vec3(x, h / 2, z) });
  world.addBody(b);
  obstacleBodies.push(b);
}
addFuelTank(-65, -55, 3, 7);
addFuelTank(-58, -60, 2.5, 6);
addFuelTank(65, -55, 3, 7);
addFuelTank(58, -60, 2.5, 6);
addFuelTank(-72, -60, 2, 5);
addFuelTank(72, -60, 2, 5);

// Light poles along runway
for (let x = -runwayL / 2 + 20; x <= runwayL / 2 - 20; x += 30) {
  for (const side of [-1, 1]) {
    const pz = runwayZ + side * (runwayW / 2 + 4);
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0x888888 })
    );
    pole.position.set(x, 3, pz);
    scene.add(pole);
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffff88, emissiveIntensity: 1.5 })
    );
    lamp.position.set(x, 6.2, pz);
    scene.add(lamp);
  }
}

// Apron vehicles (static trucks/carts)
function addVehicle(x, z, w, h, d, color) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.2 })
  );
  m.position.set(x, h / 2 + 0.04, z);
  m.castShadow = true;
  scene.add(m);
}
addVehicle(-20, -8, 3, 1.2, 2, 0x3366aa);
addVehicle(-16, -8, 2.5, 1, 1.8, 0xcc3333);
addVehicle(18, -12, 2.8, 1.1, 2, 0xeeee33);
addVehicle(22, -12, 2, 0.8, 1.5, 0x44aa44);
addVehicle(-35, -14, 4, 1.5, 2.5, 0xdd8800);
addVehicle(38, -6, 3.5, 1.3, 2.2, 0x4488cc);

// Perimeter fence
function addFence(x1, z1, x2, z2) {
  const dx = x2 - x1, dz = z2 - z1;
  const len = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dx, dz);
  const segments = Math.ceil(len / 4);
  for (let i = 0; i < segments; i++) {
    const t = i / segments;
    const sx = x1 + dx * t, sz = z1 + dz * t;
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 2.2, 4),
      new THREE.MeshStandardMaterial({ color: 0x888888 })
    );
    post.position.set(sx, 1.1, sz);
    scene.add(post);
  }
  // fence mesh panel
  const fenceMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(len, 2),
    new THREE.MeshStandardMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
  );
  fenceMesh.rotation.y = angle;
  fenceMesh.position.set((x1 + x2) / 2, 1, (z1 + z2) / 2);
  scene.add(fenceMesh);
}
addFence(-115, -80, 115, -80);
addFence(-115, 80, 115, 80);
addFence(-115, -80, -115, 80);
addFence(115, -80, 115, 80);

// Runway threshold markings (chevrons)
for (const side of [-1, 1]) {
  const rx = side * (runwayL / 2 - 8);
  for (let j = 0; j < 4; j++) {
    const mark = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.3),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    mark.rotation.x = -Math.PI / 2;
    mark.position.set(rx, 0.07, runwayZ + (j - 1.5) * 2);
    scene.add(mark);
  }
}

// Taxiway signs
function addSign(x, z, rotY, text) {
  const can = document.createElement('canvas');
  can.width = 128; can.height = 64;
  const ctx = can.getContext('2d');
  ctx.fillStyle = '#1a1a6a';
  ctx.fillRect(0, 0, 128, 64);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 64, 34);
  const tex = new THREE.CanvasTexture(can);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.6),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })
  );
  sign.position.set(x, 1.8, z);
  sign.rotation.y = rotY;
  scene.add(sign);
  const sp = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 1.8, 4),
    new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  sp.position.set(x, 0.9, z);
  scene.add(sp);
}
addSign(-15, 20, 0, 'A1');
addSign(15, 20, 0, 'A2');
addSign(-8, 45, Math.PI / 2, 'B1');
addSign(8, 45, Math.PI / 2, 'B2');
addSign(0, 60, 0, 'RWY');

// Trees
function addTree(tx, tz, scale = 1, type = 'pine') {
  const s = scale;
  const trunkH = (1.6 + rnd() * 1.0) * s;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * s, 0.24 * s, trunkH, 7), new THREE.MeshStandardMaterial({ color: 0x3d2817 }));
  trunk.position.set(tx, trunkH / 2, tz);
  trunk.castShadow = true;
  scene.add(trunk);
  const trunkShape = new CANNON.Cylinder(0.24 * s, 0.24 * s, trunkH, 6);
  const trunkBody = new CANNON.Body({ mass: 0, shape: trunkShape, position: new CANNON.Vec3(tx, trunkH / 2, tz) });
  world.addBody(trunkBody);
  if (type === 'pine') {
    const h = (2.2 + rnd() * 1.8) * s, r = (1.0 + rnd() * 0.6) * s;
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(r, h, 8), new THREE.MeshStandardMaterial({ color: rnd() > 0.5 ? 0x1e6b2e : 0x2a7a3a }));
    leaves.position.set(tx, trunkH + h * 0.45, tz);
    leaves.castShadow = true;
    scene.add(leaves);
  } else {
    const r = (1.1 + rnd() * 0.7) * s;
    const leaves = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), new THREE.MeshStandardMaterial({ color: rnd() > 0.5 ? 0x2d7a2e : 0x3a8a2a }));
    leaves.position.set(tx, trunkH + r * 0.6, tz);
    leaves.castShadow = true;
    scene.add(leaves);
  }
}

for (let i = 0; i < 150; i++) {
  let tx = (rnd() - 0.5) * 400, tz = (rnd() - 0.5) * 400;
  if (Math.hypot(tx, tz) < 16) continue;
  if (Math.abs(tx) < 115 && tz > -80 && tz < 80) continue;
  addTree(tx, tz, 0.6 + rnd() * 0.9, rnd() > 0.32 ? 'pine' : 'round');
}
// Trees around the airport perimeter
for (let i = 0; i < 40; i++) {
  const angle = rnd() * Math.PI * 2;
  const dist = 100 + rnd() * 40;
  const tx = Math.cos(angle) * dist;
  const tz = Math.sin(angle) * dist;
  addTree(tx, tz, 0.7 + rnd() * 0.8, rnd() > 0.4 ? 'pine' : 'round');
}

// Rocks near runway edges
for (let i = 0; i < 20; i++) {
  const rx = (rnd() - 0.5) * 300;
  const rz = runwayZ + (rnd() > 0.5 ? 1 : -1) * (runwayW / 2 + 6 + rnd() * 10);
  const rs = 0.3 + rnd() * 0.5;
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(rs, 0),
    new THREE.MeshStandardMaterial({ color: 0x777777 + Math.floor(rnd() * 0x222222), roughness: 0.9 })
  );
  rock.position.set(rx, rs * 0.4, rz);
  rock.rotation.set(rnd() * Math.PI, rnd() * Math.PI, 0);
  rock.castShadow = true;
  scene.add(rock);
}

const windSockMeshes = [];
function addWindsock(x, z) {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5, 8), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  pole.position.set(x, 2.5, z);
  scene.add(pole);
  const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.7, 2.6, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0xff6b2a, side: THREE.DoubleSide }));
  sock.rotation.z = Math.PI / 2;
  sock.position.set(x + 1.1, 4.6, z);
  scene.add(sock);
  windSockMeshes.push({ sock, x, z });
}
addWindsock(-62, 52);
addWindsock(62, 52);

// ==========================================
// 3D DRONE VISUAL MODEL
// ==========================================
const drone = new THREE.Group();
scene.add(drone);

const crankcase = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.26, 0.46), new THREE.MeshStandardMaterial({ color: 0x3a3f4a, metalness: 0.72, roughness: 0.32 }));
crankcase.position.y = 0.02;
crankcase.castShadow = true;
drone.add(crankcase);

const gearbox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.5), new THREE.MeshStandardMaterial({ color: 0x2b2f3a, metalness: 0.6, roughness: 0.4 }));
gearbox.position.y = 0.19;
gearbox.castShadow = true;
drone.add(gearbox);

const fuelTankVis = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.42, 16), new THREE.MeshStandardMaterial({ color: 0xc23a2a, metalness: 0.3, roughness: 0.45 }));
fuelTankVis.rotation.z = Math.PI / 2;
fuelTankVis.position.set(0, -0.06, -0.28);
fuelTankVis.castShadow = true;
drone.add(fuelTankVis);

const camBox = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.10, 0.28), new THREE.MeshStandardMaterial({ color: 0x1c1e24 }));
camBox.position.set(0, -0.10, 0.30);
camBox.castShadow = true;
drone.add(camBox);

const lensM = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.07, 16), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.9, roughness: 0.15 }));
lensM.rotation.x = Math.PI / 2;
lensM.position.set(0, -0.10, 0.46);
drone.add(lensM);

// Arms & Rotors: +Z = Front (Camera/Green LED), -Z = Rear (Red LED), +X = Right, -X = Left
const armPositions = [
  { x: 0.72, z: 0.72 },   // 0: Front-Right (+X, +Z)
  { x: -0.72, z: 0.72 },  // 1: Front-Left  (-X, +Z)
  { x: 0.72, z: -0.72 },  // 2: Rear-Right  (+X, -Z)
  { x: -0.72, z: -0.72 }  // 3: Rear-Left   (-X, -Z)
];

const armMat = new THREE.MeshStandardMaterial({ color: 0x2f3542, metalness: 0.55, roughness: 0.45 });
const propellerGroups = [];
armPositions.forEach(p => {
  const len = Math.hypot(p.x, p.z);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, len), armMat);
  arm.position.set(p.x / 2, 0.02, p.z / 2);
  arm.rotation.y = Math.atan2(p.z, p.x);
  arm.castShadow = true;
  drone.add(arm);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.09, 16), new THREE.MeshStandardMaterial({ color: 0x252a33, metalness: 0.6, roughness: 0.4 }));
  hub.position.set(p.x, 0.09, p.z);
  hub.castShadow = true;
  drone.add(hub);

  const propGroup = new THREE.Group();
  propGroup.position.set(p.x, 0.165, p.z);
  const bladeGeo = new THREE.BoxGeometry(1.02, 0.018, 0.12);
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.55, metalness: 0.04 });
  const b1 = new THREE.Mesh(bladeGeo, bladeMat);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 12), new THREE.MeshStandardMaterial({ color: 0x1a1d24 }));
  cap.position.y = 0.012;
  b1.castShadow = true;
  propGroup.add(b1, cap);
  drone.add(propGroup);
  propellerGroups.push(propGroup);
});

// Landing Gear Skids (Visual bottom at y = -0.31)
[-0.28, 0.28].forEach(x => {
  const strutF = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.38, 6), new THREE.MeshStandardMaterial({ color: 0x3a3f4a }));
  strutF.position.set(x, -0.14, 0.18);
  strutF.rotation.x = -0.35;
  drone.add(strutF);
  const strutR = strutF.clone();
  strutR.position.set(x, -0.14, -0.18);
  strutR.rotation.x = 0.35;
  drone.add(strutR);
});

const skidL = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.88, 8), new THREE.MeshStandardMaterial({ color: 0x2b2f3a }));
skidL.rotation.x = Math.PI / 2;
skidL.position.set(-0.28, -0.31, 0);
skidL.castShadow = true;
drone.add(skidL);

const skidR = skidL.clone();
skidR.position.x = 0.28;
drone.add(skidR);

const cross1 = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.016, 0.016), new THREE.MeshStandardMaterial({ color: 0x3a3f4a }));
cross1.position.set(0, -0.31, 0.30);
drone.add(cross1);
const cross2 = cross1.clone();
cross2.position.z = -0.30;
drone.add(cross2);

// Navigation LEDs
const ledGeo = new THREE.SphereGeometry(0.028, 8, 8);
const ledFront = new THREE.Mesh(ledGeo, new THREE.MeshStandardMaterial({ emissive: 0x00ff88, emissiveIntensity: 2.2, color: 0x00ff88 }));
ledFront.position.set(0, 0.04, 0.42);
drone.add(ledFront);

const ledRear = new THREE.Mesh(ledGeo, new THREE.MeshStandardMaterial({ emissive: 0xff1a1a, emissiveIntensity: 2.2, color: 0xff2222 }));
ledRear.position.set(0, 0.04, -0.42);
drone.add(ledRear);

const strobe = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), new THREE.MeshStandardMaterial({ emissive: 0xffffff, emissiveIntensity: 3, color: 0xffffff }));
strobe.position.set(0, 0.22, 0);
drone.add(strobe);

// Smoke exhaust particles
const smokeGroup = new THREE.Group();
drone.add(smokeGroup);
const smokeParticles = [];
for (let i = 0; i < 14; i++) {
  const s = new THREE.Mesh(new THREE.SphereGeometry(0.05 + Math.random() * 0.04, 6, 6), new THREE.MeshStandardMaterial({ color: 0x666666, transparent: true, opacity: 0 }));
  s.visible = false;
  smokeGroup.add(s);
  smokeParticles.push(s);
}

// ==========================================
// CANNON RIGIDBODY SETUP
// ==========================================
const droneBody = new CANNON.Body({
  mass: 2.2,
  position: new CANNON.Vec3(0, 0.08, 0),
  material: droneMat,
  linearDamping: 0.12,
  angularDamping: 0.15,
  allowSleep: false,
});

droneBody.addShape(new CANNON.Box(new CANNON.Vec3(0.28, 0.08, 0.28)));
droneBody.angularFactor.set(1, 1, 1);
world.addBody(droneBody);

droneBody.addEventListener('collide', e => {
  const spd = droneBody.velocity.length();
  const vertical = Math.abs(droneBody.velocity.y);
  if (spd > 9.5 || vertical > 5.5) {
    const other = e.body;
    const isGround = other === groundBody;
    if (!isGround || vertical > 6.8) {
      triggerCrash(spd > 11 ? 'HIT BUILDING / OBSTACLE' : 'HARD CRASH IMPACT');
    }
  }
});

// ==========================================
// PROCEDURAL WEB AUDIO ENGINE
// ==========================================
class DroneAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.engineGain = null;
    this.noiseGain = null;
    this.osc1 = null;
    this.osc2 = null;
    this.filter = null;
    this.noiseNode = null;
    this.noiseFilter = null;
    this.isMuted = false;
    this.isStarted = false;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = 'sawtooth';
      this.osc1.frequency.setValueAtTime(55, this.ctx.currentTime);

      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'triangle';
      this.osc2.frequency.setValueAtTime(110, this.ctx.currentTime);

      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(280, this.ctx.currentTime);
      this.filter.Q.setValueAtTime(3.5, this.ctx.currentTime);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.osc1.connect(this.filter);
      this.osc2.connect(this.filter);
      this.filter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);

      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;

      this.noiseFilter = this.ctx.createBiquadFilter();
      this.noiseFilter.type = 'bandpass';
      this.noiseFilter.frequency.setValueAtTime(600, this.ctx.currentTime);
      this.noiseFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

      this.noiseGain = this.ctx.createGain();
      this.noiseGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.noiseNode.connect(this.noiseFilter);
      this.noiseFilter.connect(this.noiseGain);
      this.noiseGain.connect(this.masterGain);

      this.osc1.start();
      this.osc2.start();
      this.noiseNode.start();
      this.isStarted = true;
    } catch (e) {
      console.warn('Web Audio not supported or failed to initialize', e);
    }
  }

  update(throttle, isArmed, isCrashed) {
    if (!this.ctx || !this.isStarted || this.isMuted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    const t = this.ctx.currentTime;
    if (!isArmed || isCrashed) {
      this.engineGain.gain.setTargetAtTime(0, t, 0.15);
      this.noiseGain.gain.setTargetAtTime(0, t, 0.15);
      return;
    }

    const baseFreq = 50 + throttle * 135;
    this.osc1.frequency.setTargetAtTime(baseFreq, t, 0.08);
    this.osc2.frequency.setTargetAtTime(baseFreq * 2.01, t, 0.08);

    const cutoff = 220 + throttle * 1200;
    this.filter.frequency.setTargetAtTime(cutoff, t, 0.08);

    const engVol = 0.08 + throttle * 0.32;
    this.engineGain.gain.setTargetAtTime(engVol, t, 0.06);

    const propVol = 0.03 + throttle * 0.22;
    this.noiseGain.gain.setTargetAtTime(propVol, t, 0.06);
    this.noiseFilter.frequency.setTargetAtTime(450 + throttle * 850, t, 0.08);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}

const audio = new DroneAudioEngine();

// ==========================================
// STATE & FLIGHT CONTROLLER PARAMETERS
// ==========================================
const state = {
  pos: droneBody.position,
  vel: droneBody.velocity,
  armed: false,
  fuel: 50,
  battery: 100,
  flightTime: 0,
  engineTemp: 68,
  oilHealth: 100,
  engineHealth: 100,
  imuBias: 0,
  atmPressure: 1013.25,
  densityFactor: 1,
  mapPressure: 98,
  oilPressure: 48,
  fuelPressure: 44,
  pressDiff: 0,
};

const params = {
  maxTilt: THREE.MathUtils.degToRad(26),
  thrustPower: 16.5,
  gravity: 9.81,
  yawSpeed: 2.2,
  followCam: true,
  fuelBurnIdle: 0.08,
  fuelBurnHover: 0.22,
  fuelBurnFull: 0.64,
  batteryDrainIdle: 0.015,
  batteryDrainLoad: 0.065,
  fuelRefuelRate: 12,
  battRechargeRate: 28,
  ambientTemp: 18,
  optimalTemp: 82,
  overheatThreshold: 102,
};

const WIND = {
  enabled: true,
  baseSpeed: 1.2,
  direction: (135 * Math.PI) / 180,
  gustAmp: 0,
  currentSpeed: 1.2,
  currentDir: (135 * Math.PI) / 180,
  vec: new THREE.Vector3(),
  verticalGust: 0
};

// Flight modes: 0 Manual, 1 Stabilize (default), 2 Alt Hold
let flightMode = 1;
const flightModeNames = ['MANUAL / ACRO', 'STABILIZE', 'ALT HOLD'];
let altHoldTarget = 3.5;

// Attitude PID Controllers (Analytically critically damped for I=0.11kg*m^2)
const pidPitch = { kp: 1.4, ki: 0.15, kd: 0.38, integral: 0 };
const pidRoll  = { kp: 1.4, ki: 0.15, kd: 0.38, integral: 0 };
const pidYaw   = { kp: 0.85, ki: 0.05, kd: 0.25, integral: 0 };

let manualThrottle = 0;
let filteredPitch = 0;
let filteredRoll = 0;
const keys = {};

// DOM Elements
const speedEl = document.getElementById('speed');
const altitudeEl = document.getElementById('altitude');
const pitchEl = document.getElementById('pitch');
const rollEl = document.getElementById('roll');
const yawEl = document.getElementById('yaw');
const modeEl = document.getElementById('mode');
const fuelPctEl = document.getElementById('fuel-pct');
const fuelFillEl = document.getElementById('fuel-fill');
const fuelBarEl = document.getElementById('fuel-bar');
const fuelHintEl = document.getElementById('fuel-hint');
const battPctEl = document.getElementById('batt-pct');
const battFillEl = document.getElementById('batt-fill');
const battBarEl = document.getElementById('batt-bar');
const battHintEl = document.getElementById('batt-hint');
const engTempEl = document.getElementById('eng-temp');
const engFillEl = document.getElementById('eng-fill');
const engHintEl = document.getElementById('eng-hint');
const armBanner = document.getElementById('arm-banner');
const yawRollBanner = document.getElementById('yawroll-banner');
const windPctEl = document.getElementById('wind-pct');
const windFillEl = document.getElementById('wind-fill');
const windBarEl = document.getElementById('wind-bar');
const windHintEl = document.getElementById('wind-hint');
const thrPctEl = document.getElementById('thr-pct');
const thrFillEl = document.getElementById('thr-fill');
const thrBarEl = document.getElementById('thr-bar');
const thrHintEl = document.getElementById('thr-hint');
const throttleSliderEl = document.getElementById('throttle-slider');
const atmPctEl = document.getElementById('atm-pct');
const atmFillEl = document.getElementById('atm-fill');
const atmBarEl = document.getElementById('atm-bar');
const atmHintEl = document.getElementById('atm-hint');
const oilPctEl = document.getElementById('oil-pct');
const oilFillEl = document.getElementById('oil-fill');
const oilBarEl = document.getElementById('oil-bar');
const oilHintEl = document.getElementById('oil-hint');
const crashOverlay = document.getElementById('crash-overlay');
const crashReasonEl = document.getElementById('crash-reason');
const flashEl = document.getElementById('flash');
const crashBtn = document.getElementById('crash-reset');
const vsEl = document.getElementById('vspeed');
const hdgEl = document.getElementById('heading');
const battHudEl = document.getElementById('batt-hud');
const modeHudEl = document.getElementById('mode-hud');

let isCrashed = false;
let crashTimer = 0;
let crashCount = 0;
const activeFaults = {};
let noCrashUntil = 0;
let yawAccum = 0, rollAccum = 0, combinedAccum = 0, yawRollState = 0;

function updateYawRollFailure(dt) {
  const invQ = new CANNON.Quaternion();
  droneBody.quaternion.inverse(invQ);
  const bodyAng = new CANNON.Vec3();
  invQ.vmult(droneBody.angularVelocity, bodyAng);
  const yawRate = Math.abs(bodyAng.y);

  const q = droneBody.quaternion;
  const localRight = new CANNON.Vec3();
  q.vmult(new CANNON.Vec3(1, 0, 0), localRight);
  const rollAngle = Math.abs(Math.asin(THREE.MathUtils.clamp(-localRight.y, -1, 1)));

  const yawWarn = 4.5;
  const rollWarnA = THREE.MathUtils.degToRad(55);
  const yawExcess = yawRate > yawWarn ? (yawRate - yawWarn) * 0.8 : 0;
  const rollExcess = rollAngle > rollWarnA ? (rollAngle - rollWarnA) * 1.2 : 0;

  if (yawExcess > 0) yawAccum += dt * yawExcess;
  else yawAccum = Math.max(0, yawAccum - dt * 2.0);

  if (rollExcess > 0) rollAccum += dt * rollExcess;
  else rollAccum = Math.max(0, rollAccum - dt * 2.0);

  const score = yawAccum * 0.6 + rollAccum * 0.8;
  if (score > 6.0) yawRollState = 4;
  else if (score > 4.2) yawRollState = 3;
  else if (score > 2.5) yawRollState = 2;
  else if (score > 1.1) yawRollState = 1;
  else yawRollState = 0;

  let thrustFactor = 1;
  let controlFactor = 1;
  if (yawRollState === 1) { controlFactor = 0.95; }
  else if (yawRollState === 2) { thrustFactor = 0.92; controlFactor = 0.85; }
  else if (yawRollState === 3) { thrustFactor = 0.82; controlFactor = 0.68; }
  else if (yawRollState === 4) { thrustFactor = 0.60; controlFactor = 0.45; }

  updateYawRollFailure.thrustFactor = thrustFactor;
  updateYawRollFailure.controlFactor = controlFactor;

  if (yawRollBanner) {
    const labels = ['NORMAL', 'HIGH YAW RATE', 'ROLL INSTABILITY', 'CRITICAL STRESS', 'LOSS OF CONTROL'];
    const classes = ['', 'warn', 'inst', 'crit', 'loss'];
    yawRollBanner.textContent = labels[yawRollState];
    yawRollBanner.className = classes[yawRollState] ? classes[yawRollState] : '';
    yawRollBanner.title = `Yaw: ${yawRate.toFixed(1)} rad/s · Roll: ${(rollAngle * 57.3).toFixed(0)}°`;
  }
  return { thrustFactor, controlFactor };
}
updateYawRollFailure.thrustFactor = 1;
updateYawRollFailure.controlFactor = 1;

function resetDrone() {
  droneBody.position.set(0, 0.08, 0);
  droneBody.velocity.set(0, 0, 0);
  droneBody.angularVelocity.set(0, 0, 0);
  droneBody.quaternion.set(0, 0, 0, 1);
  droneBody.force.set(0, 0, 0);
  droneBody.torque.set(0, 0, 0);

  state.fuel = 50;
  state.battery = 100;
  state.flightTime = 0;
  state.engineTemp = 68;
  state.oilHealth = 100;
  state.engineHealth = Math.max(70, state.engineHealth - crashCount * 1.5);
  state.imuBias = 0;
  state.armed = false;
  manualThrottle = 0;
  filteredPitch = 0;
  filteredRoll = 0;

  pidPitch.integral = 0;
  pidRoll.integral = 0;
  pidYaw.integral = 0;
  altHoldTarget = 3.5;

  yawAccum = 0;
  rollAccum = 0;
  combinedAccum = 0;
  yawRollState = 0;
  if (yawRollBanner) {
    yawRollBanner.textContent = 'NORMAL';
    yawRollBanner.className = '';
  }
  for (const k in activeFaults) delete activeFaults[k];

  isCrashed = false;
  crashTimer = 0;
  noCrashUntil = clock.getElapsedTime() + 1.2;

  if (crashOverlay) crashOverlay.classList.remove('show');
  if (flashEl) flashEl.classList.remove('hit');
  if (crashBtn) crashBtn.blur();
  renderer.domElement.focus();
  updatePowerUI();
  updateArmUI();
}

function handleArmToggle(forceArm = false) {
  audio.init();
  const onPad = Math.hypot(droneBody.position.x, droneBody.position.z) < 4.5 && droneBody.position.y < 1.1;

  if (!state.armed || forceArm) {
    state.armed = true;
    manualThrottle = 0;
    if (flashEl) {
      flashEl.style.background = '#00ff88';
      flashEl.classList.add('hit');
      setTimeout(() => flashEl.classList.remove('hit'), 180);
    }
  } else {
    if (!onPad && droneBody.position.y > 1.2) {
      return;
    }
    state.armed = false;
    manualThrottle = 0;
  }
  updateArmUI();
}

function updateArmUI() {
  if (!armBanner) return;
  if (isCrashed) {
    armBanner.textContent = '💥 CRASHED — Press R to Reset';
    armBanner.className = 'crit';
    return;
  }
  if (state.armed) {
    armBanner.textContent = '● ARMED — Space to Climb (X to Disarm)';
    armBanner.className = 'armed';
  } else {
    armBanner.textContent = '● DISARMED — Press Space or X to ARM & FLY';
    armBanner.className = 'disarmed';
  }
}

if (armBanner) armBanner.addEventListener('click', () => handleArmToggle());

function triggerCrash(reason) {
  if (isCrashed) return;
  if (clock.getElapsedTime() < noCrashUntil) return;
  isCrashed = true;
  crashTimer = 1.6;
  crashCount++;
  if (crashReasonEl) crashReasonEl.textContent = reason;
  if (crashOverlay) crashOverlay.classList.add('show');
  if (flashEl) {
    flashEl.style.background = '#ff3a3a';
    flashEl.classList.add('hit');
    setTimeout(() => flashEl.classList.remove('hit'), 220);
  }
  droneBody.velocity.scale(0.15, droneBody.velocity);
  droneBody.angularVelocity.scale(0.2, droneBody.angularVelocity);
  updateArmUI();
}
if (crashBtn) crashBtn.addEventListener('click', resetDrone);

function updatePowerUI() {
  const f = Math.max(0, Math.min(100, state.fuel));
  const b = Math.max(0, Math.min(100, state.battery));
  if (fuelPctEl) fuelPctEl.textContent = Math.ceil(f) + '%';
  if (fuelFillEl) fuelFillEl.style.width = f + '%';
  if (battPctEl) battPctEl.textContent = Math.ceil(b) + '%';
  if (battFillEl) battFillEl.style.width = b + '%';
  if (fuelBarEl) fuelBarEl.classList.toggle('low', f < 20);
  if (battBarEl) battBarEl.classList.toggle('low', b < 20);
  if (fuelHintEl) fuelHintEl.textContent = f < 0.5 ? '⛽ OUT OF FUEL' : `~${(f / 0.30 / 60).toFixed(1)} min flight time`;
  if (battHintEl) battHintEl.textContent = b < 0.5 ? '🔋 DEPLETED' : 'Avionics · Servos · OK';
}

function updateThrottleUI(throttle) {
  const pct = Math.round(throttle * 100);
  if (thrPctEl) thrPctEl.textContent = pct + '%';
  if (thrFillEl) thrFillEl.style.width = pct + '%';
  if (thrHintEl) {
    if (!state.armed) thrHintEl.textContent = 'Disarmed · Press W or Space to Arm & Climb';
    else if (throttle < 0.05) thrHintEl.textContent = 'Throttle 0% · Hold W to increase';
    else if (throttle >= 0.32 && throttle <= 0.38) thrHintEl.textContent = 'Hover Throttle (~35%) · W↑ S↓';
    else if (throttle > 0.75) thrHintEl.textContent = 'High Power · Rapid Climb';
    else thrHintEl.textContent = 'Manual Throttle Stick · W↑ S↓ or use slider';
  }
}

function updateWind(dt) {
  const t = clock.getElapsedTime();
  if (!WIND.enabled) {
    WIND.currentSpeed = THREE.MathUtils.lerp(WIND.currentSpeed, 0, dt * 2);
    WIND.vec.lerp(new THREE.Vector3(0, 0, 0), dt * 2);
  } else {
    const gust = Math.sin(t * 0.35) * 0.5 + Math.sin(t * 0.82) * 0.3;
    WIND.currentSpeed = THREE.MathUtils.clamp(WIND.baseSpeed + gust, 0.2, 8.5);
    WIND.verticalGust = Math.sin(t * 0.6) * 0.15;
    WIND.vec.set(Math.cos(WIND.currentDir) * WIND.currentSpeed, WIND.verticalGust, Math.sin(WIND.currentDir) * WIND.currentSpeed);
    windSockMeshes.forEach(({ sock }) => {
      sock.rotation.y = THREE.MathUtils.lerp(sock.rotation.y, WIND.currentDir, dt * 2.5);
    });
  }
  if (windPctEl) windPctEl.textContent = WIND.currentSpeed.toFixed(1) + ' m/s';
  if (windFillEl) windFillEl.style.width = THREE.MathUtils.clamp((WIND.currentSpeed / 9) * 100, 5, 100) + '%';
}

function updatePressures(dt, throttle) {
  const alt = Math.max(0, droneBody.position.y);
  const atm = 1013.25 * Math.exp(-alt / 8430);
  state.atmPressure = atm;
  state.densityFactor = THREE.MathUtils.clamp(atm / 1013.25, 0.65, 1.05);
  state.mapPressure = atm * (0.35 + throttle * 0.65);
  state.oilPressure = 42 + throttle * 18;
  state.fuelPressure = 40 + throttle * 6;
  if (atmPctEl) atmPctEl.textContent = Math.round(atm) + ' hPa';
  if (oilPctEl) oilPctEl.textContent = Math.round(state.oilPressure) + ' psi';
}

function updateEngineHeat(dt, throttle) {
  const targetTemp = state.armed ? (params.optimalTemp + throttle * 18) : params.ambientTemp;
  state.engineTemp = THREE.MathUtils.lerp(state.engineTemp, targetTemp, dt * 0.08);
  if (engTempEl) engTempEl.textContent = Math.round(state.engineTemp) + '°C';
  if (engFillEl) {
    const pct = THREE.MathUtils.clamp(((state.engineTemp - 20) / (115 - 20)) * 100, 0, 100);
    engFillEl.style.width = pct + '%';
  }
}

// Weather
let weather = { mode: 'clear', rainParticles: null };
function setWeather(mode) {
  weather.mode = mode;
  if (mode === 'clear') {
    scene.fog = new THREE.Fog(0x87CEEB, 140, 750);
    hemi.intensity = 1.05;
    dirLight.intensity = 1.2;
    if (weather.rainParticles) weather.rainParticles.visible = false;
  } else if (mode === 'cloudy') {
    scene.fog = new THREE.Fog(0xb0c4d8, 90, 520);
    hemi.intensity = 0.82;
    dirLight.intensity = 0.92;
    if (weather.rainParticles) weather.rainParticles.visible = false;
  } else if (mode === 'rain') {
    scene.fog = new THREE.Fog(0x8a9aa8, 70, 420);
    hemi.intensity = 0.68;
    dirLight.intensity = 0.72;
    if (weather.rainParticles) weather.rainParticles.visible = true;
  } else if (mode === 'fog') {
    scene.fog = new THREE.Fog(0xc8d8e8, 35, 220);
    hemi.intensity = 0.52;
    dirLight.intensity = 0.42;
    if (weather.rainParticles) weather.rainParticles.visible = false;
  }
}
const rainGeo = new THREE.BufferGeometry();
const rainCount = 1400;
const rainPos = new Float32Array(rainCount * 3);
for (let i = 0; i < rainCount; i++) {
  rainPos[i * 3] = (Math.random() - 0.5) * 600;
  rainPos[i * 3 + 1] = Math.random() * 300;
  rainPos[i * 3 + 2] = (Math.random() - 0.5) * 600;
}
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rainMat = new THREE.PointsMaterial({ color: 0x9ab8d8, size: 1.2, transparent: true, opacity: 0.6 });
const rainPoints = new THREE.Points(rainGeo, rainMat);
rainPoints.visible = false;
scene.add(rainPoints);
weather.rainParticles = rainPoints;

// Keyboard input listeners
window.addEventListener('keydown', e => {
  audio.init();
  if (e.code === 'Space') e.preventDefault();
  keys[e.code] = true;

  if (e.code === 'Space' && !state.armed) {
    handleArmToggle(true);
    keys[e.code] = false;
  }
  if (e.code === 'KeyX') handleArmToggle();
  if (e.code === 'KeyR') resetDrone();
  if (e.code === 'KeyC') params.followCam = !params.followCam;
  if (e.code === 'KeyV') WIND.enabled = !WIND.enabled;
  if (e.code === 'KeyU') audio.toggleMute();
  if (e.code === 'KeyM') {
    flightMode = (flightMode + 1) % 3;
    if (flightMode === 2) altHoldTarget = Math.max(2.0, droneBody.position.y);
  }
  if (e.code === 'KeyN') dayPhase = (dayPhase + 1) % 2;
  if (e.code === 'KeyG') {
    const w = ['clear', 'cloudy', 'rain', 'fog'];
    const idx = w.indexOf(weather.mode);
    setWeather(w[(idx + 1) % w.length]);
  }
});

window.addEventListener('keyup', e => {
  if (e.code === 'Space') e.preventDefault();
  keys[e.code] = false;
});

window.addEventListener('click', () => audio.init());
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
let propSpin = 0;

// ==========================================
// MAIN SIMULATION & ANIMATION LOOP
// ==========================================
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.033);
  const t = clock.getElapsedTime();

  // 1. Gather Control Inputs
  let targetPitch = 0; // +1 forward (nose down), -1 back (nose up)
  let targetRoll = 0;  // +1 roll right, -1 roll left
  let yawInput = 0;    // +1 yaw left (CCW), -1 yaw right (CW)
  let climbInput = 0;  // +1 throttle up, -1 throttle down (W/S = manual throttle stick)

  if (keys['ArrowUp'] || keys['KeyW'])  targetPitch += 1;  // Pitch forward (nose down)
  if (keys['ArrowDown'] || keys['KeyS']) targetPitch -= 1; // Pitch back (nose up)
  if (keys['KeyD']) targetRoll += 1;
  if (keys['KeyA']) targetRoll -= 1;
  if (keys['KeyQ'] || keys['ArrowLeft']) yawInput += 1;
  if (keys['KeyE'] || keys['ArrowRight']) yawInput -= 1;
  // Space = Throttle Up, Shift = Throttle Down
  if (keys['Space']) climbInput += 1;
  if (keys['ShiftLeft'] || keys['ShiftRight'] || keys['ControlLeft']) climbInput -= 1;

  // 2. Manual Throttle Stick Management
  if (state.armed && !isCrashed) {
    if (flightMode === 2) {
      // ALT HOLD Mode (Automatic Altitude PID)
      if (climbInput !== 0) {
        altHoldTarget = Math.max(0.4, altHoldTarget + climbInput * 3.5 * dt);
      }
      // Hover throttle increases at altitude where air is thinner
      const hoverThrottle = THREE.MathUtils.clamp(0.35 / Math.max(state.densityFactor, 0.55), 0.35, 0.75);
      const altErr = altHoldTarget - droneBody.position.y;
      const vsErr = -droneBody.velocity.y;
      const altCorrection = altErr * 0.24 + vsErr * 0.16;
      manualThrottle = THREE.MathUtils.clamp(hoverThrottle + altCorrection, 0.05, 0.95);
    } else {
      // STABILIZE & MANUAL Modes: Direct throttle stick (W=up, S=down, retains last value)
      if (climbInput > 0) {
        manualThrottle = THREE.MathUtils.clamp(manualThrottle + dt * 0.55, 0, 1);
      } else if (climbInput < 0) {
        manualThrottle = THREE.MathUtils.clamp(manualThrottle - dt * 0.55, 0, 1);
      }
      // Throttle holds its value when stick is released (like a real transmitter)
    }
    // Sync slider with current throttle
    if (throttleSliderEl) throttleSliderEl.value = manualThrottle;
  } else {
    manualThrottle = 0;
    if (throttleSliderEl) throttleSliderEl.value = 0;
  }

  // Fuel / Battery consumption
  const onPad = !isCrashed && Math.hypot(droneBody.position.x, droneBody.position.z) < 3.8 && droneBody.position.y < 0.9;
  if (state.armed && !isCrashed && !onPad) {
    state.fuel = Math.max(0, state.fuel - (params.fuelBurnIdle + manualThrottle * params.fuelBurnHover) * dt);
    state.battery = Math.max(0, state.battery - (params.batteryDrainIdle + manualThrottle * params.batteryDrainLoad) * dt);
    state.flightTime += dt;
  } else if (onPad && !isCrashed) {
    state.fuel = Math.min(100, state.fuel + params.fuelRefuelRate * dt);
    state.battery = Math.min(100, state.battery + params.battRechargeRate * dt);
  }

  updateWind(dt);
  updatePressures(dt, manualThrottle);
  updateEngineHeat(dt, manualThrottle);
  if (!isCrashed) updateYawRollFailure(dt);
  updatePowerUI();
  updateThrottleUI(manualThrottle);
  audio.update(manualThrottle, state.armed, isCrashed);

  // 3. True 6-DOF Multi-Rotor Physics & Stabilization
  let effectiveThrottle = manualThrottle * (state.fuel > 0 ? 1 : 0) * (state.battery > 0 ? 1 : 0);
  effectiveThrottle *= updateYawRollFailure.thrustFactor;

  // Extract Drone's Principal Axes in World Coordinates
  const q = droneBody.quaternion;
  const localForward = new CANNON.Vec3();
  q.vmult(new CANNON.Vec3(0, 0, 1), localForward); // Nose vector (+Z)
  const localRight = new CANNON.Vec3();
  q.vmult(new CANNON.Vec3(1, 0, 0), localRight);   // Right wing vector (+X)

  // Local Angular Velocity in Body Coordinates
  const invQ = new CANNON.Quaternion();
  q.inverse(invQ);
  const bodyAngVel = new CANNON.Vec3();
  invQ.vmult(droneBody.angularVelocity, bodyAngVel);

  // Measure Real Physical Attitude Angles:
  // Pitch: Angle between nose (+Z) and ground plane.
  // When nose tilts down, localForward.y < 0 -> currentPitch < 0.
  const currentPitch = Math.asin(THREE.MathUtils.clamp(localForward.y, -1, 1));

  // Roll: Angle between right wing (+X) and ground plane.
  // When right wing tilts down (roll right), localRight.y < 0 -> currentRoll > 0.
  const currentRoll = Math.asin(THREE.MathUtils.clamp(-localRight.y, -1, 1));

  // Desired Flight Attitude
  let desiredPitch = 0;
  let desiredRoll = 0;
  let desiredYawRate = yawInput * params.yawSpeed;

  if (flightMode >= 1) { // STABILIZE or ALT HOLD
    desiredPitch = -targetPitch * params.maxTilt;
    desiredRoll = targetRoll * params.maxTilt;
  }

  // Slew rate smoothing on attitude commands
  const slew = Math.min(1, dt * 8.0);
  filteredPitch = THREE.MathUtils.lerp(filteredPitch, desiredPitch, slew);
  filteredRoll = THREE.MathUtils.lerp(filteredRoll, desiredRoll, slew);

  // Attitude PID Error calculations
  const pitchErr = filteredPitch - currentPitch;
  const rollErr = filteredRoll - currentRoll;
  const yawRateErr = desiredYawRate - bodyAngVel.y;

  // Integral with anti-windup
  if (state.armed && effectiveThrottle > 0.05) {
    pidPitch.integral = THREE.MathUtils.clamp(pidPitch.integral + pitchErr * dt, -0.15, 0.15);
    pidRoll.integral = THREE.MathUtils.clamp(pidRoll.integral + rollErr * dt, -0.15, 0.15);
    pidYaw.integral = THREE.MathUtils.clamp(pidYaw.integral + yawRateErr * dt, -0.15, 0.15);
  } else {
    pidPitch.integral = 0;
    pidRoll.integral = 0;
    pidYaw.integral = 0;
  }

  // Controller torque outputs — scale with inverse density so PID authority
  // stays constant even when air thins at altitude
  const ctrlFactor = updateYawRollFailure.controlFactor || 1;
  const pidBoost = 1 / Math.max(state.densityFactor, 0.55);
  let torquePitch = (-pitchErr * 0.85 - pidPitch.integral * 0.05 - bodyAngVel.x * 0.45) * ctrlFactor * pidBoost;
  let torqueRoll  = (-rollErr  * 0.85 - pidRoll.integral  * 0.05 - bodyAngVel.z * 0.45) * ctrlFactor * pidBoost;
  let torqueYaw   = (yawRateErr * 0.65 + pidYaw.integral   * 0.03 - bodyAngVel.y * 0.35) * ctrlFactor * pidBoost;

  // Clamp torques — also scale clamp limits with density
  torquePitch = THREE.MathUtils.clamp(torquePitch, -1.2 * pidBoost, 1.2 * pidBoost);
  torqueRoll  = THREE.MathUtils.clamp(torqueRoll, -1.2 * pidBoost, 1.2 * pidBoost);
  torqueYaw   = THREE.MathUtils.clamp(torqueYaw, -0.9 * pidBoost, 0.9 * pidBoost);

  // Altitude-based instability — above 350m, turbulence and PID degradation
  // kick in, peaking at 400m+ where the drone becomes very hard to control
  const altInstability = droneBody.position.y > 350
    ? THREE.MathUtils.clamp((droneBody.position.y - 350) / 100, 0, 1)  // 0 at 350m, 1 at 450m
    : 0;
  if (altInstability > 0 && state.armed && !isCrashed) {
    // Random turbulence torque that increases with altitude
    const turb = altInstability * 2.8;
    torquePitch += (Math.random() - 0.5) * turb;
    torqueRoll  += (Math.random() - 0.5) * turb;
    torqueYaw   += (Math.random() - 0.5) * turb * 0.6;
    // Degrade PID authority — less correction at altitude
    const degrade = 1 - altInstability * 0.65;
    torquePitch *= degrade;
    torqueRoll  *= degrade;
    torqueYaw   *= degrade;
    // Add lateral wind shear gusts
    const gustX = (Math.random() - 0.5) * altInstability * 18;
    const gustZ = (Math.random() - 0.5) * altInstability * 18;
    droneBody.applyForce(new CANNON.Vec3(gustX, 0, gustZ), new CANNON.Vec3(0, 0, 0));
  }

  // ALWAYS apply PID torque to maintain level attitude (even during ground-to-air transition)
  if (state.armed && !isCrashed) {
    const worldTorque = new CANNON.Vec3();
    q.vmult(new CANNON.Vec3(torquePitch, torqueYaw, torqueRoll), worldTorque);
    droneBody.torque.copy(worldTorque);
  }

  // Apply thrust and ground effect only when producing lift
  if (state.armed && effectiveThrottle > 0.05 && !isCrashed) {
    // Apply total collective thrust upward along local Y
    // Extra thrust loss above 350m compounds instability at altitude
    const altThrustLoss = droneBody.position.y > 350 ? (1 - altInstability * 0.30) : 1;
    const totalThrust = effectiveThrottle * 66.0 * state.densityFactor * altThrustLoss;
    const worldThrust = new CANNON.Vec3();
    q.vmult(new CANNON.Vec3(0, totalThrust, 0), worldThrust);
    droneBody.applyForce(worldThrust, new CANNON.Vec3(0, 0, 0));

    // Ground effect cushion when taking off (alt < 0.65m)
    if (droneBody.position.y < 0.65) {
      const groundFactor = Math.max(0, (0.65 - droneBody.position.y) / 0.65);
      droneBody.applyForce(new CANNON.Vec3(0, groundFactor * 2.5, 0), new CANNON.Vec3(0, 0, 0));
      droneBody.velocity.x *= (1 - groundFactor * 0.12);
      droneBody.velocity.z *= (1 - groundFactor * 0.12);
    }
  }

  // 4. Environmental Wind & Aerodynamic Drag
  if (WIND.enabled) {
    const relWind = new CANNON.Vec3(
      WIND.vec.x - droneBody.velocity.x,
      WIND.vec.y - droneBody.velocity.y,
      WIND.vec.z - droneBody.velocity.z
    );
    const windAlt = droneBody.position.y < 2 ? Math.max(0.2, droneBody.position.y / 2) : 1;
    // Wind force scales with air density — thinner air = less push at altitude
    const windDensity = state.densityFactor;
    droneBody.applyForce(
      new CANNON.Vec3(relWind.x * 0.24 * windAlt * windDensity, relWind.y * 0.12 * windDensity, relWind.z * 0.24 * windAlt * windDensity),
      new CANNON.Vec3(0, 0, 0)
    );
  }

  // Natural aerodynamic velocity drag — scales with air density
  const velLen = droneBody.velocity.length();
  if (velLen > 0.05) {
    const drag = new CANNON.Vec3().copy(droneBody.velocity);
    drag.scale(-0.24 * velLen * 0.08 * state.densityFactor, drag);
    droneBody.applyForce(drag, new CANNON.Vec3(0, 0, 0));
  }



  // Step Physics World
  world.step(1 / 60, dt, 3);

  // Sync Three.js Visual Drone to Cannon Physics Rigidbody
  drone.position.copy(droneBody.position);
  drone.quaternion.copy(droneBody.quaternion);

  // Visual Propeller Animation
  const baseSpin = state.armed ? (28 + effectiveThrottle * 60) : 0;
  propSpin += baseSpin * dt;
  propellerGroups.forEach((pg, i) => {
    pg.rotation.y = propSpin * (i % 2 === 0 ? 1 : -1);
  });

  // Strobe Light blink
  if (strobe) {
    strobe.material.emissiveIntensity = Math.floor(t * 1.5) % 2 === 0 ? 3.5 : 0.1;
  }

  // Exhaust Smoke
  const exhaustActive = state.armed && effectiveThrottle > 0.15 && !isCrashed;
  smokeParticles.forEach((s, idx) => {
    if (!exhaustActive) {
      s.visible = false;
      return;
    }
    const emitPhase = (t * 6 + idx * 1.4) % 1;
    if (emitPhase < 0.08) {
      s.visible = true;
      s.userData.life = 1.0;
      s.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.6 + Math.random() * 0.5, (Math.random() - 0.5) * 0.4);
      const side = idx % 2 === 0 ? 1 : -1;
      s.position.set(side * 0.31, -0.12, 0.12);
      s.scale.setScalar(0.4);
      s.material.opacity = 0.35;
    }
    if (s.visible) {
      s.userData.life -= dt * 1.8;
      s.position.add(s.userData.vel.clone().multiplyScalar(dt));
      s.material.opacity = Math.max(0, s.userData.life * 0.35);
      if (s.userData.life <= 0) s.visible = false;
    }
  });

  // Crash timer
  if (isCrashed) {
    crashTimer -= dt;
    if (crashTimer <= 0) resetDrone();
  }

  // Update HUD
  const alt = Math.max(0, droneBody.position.y - 0.08);
  const spd = droneBody.velocity.length();
  const vs = droneBody.velocity.y;
  const hdg = (THREE.MathUtils.radToDeg(Math.atan2(localForward.x, localForward.z)) + 360) % 360;

  if (speedEl) speedEl.textContent = spd.toFixed(1);
  if (altitudeEl) altitudeEl.textContent = alt.toFixed(1);
  if (pitchEl) pitchEl.textContent = (currentPitch * (180 / Math.PI)).toFixed(0);
  if (rollEl) rollEl.textContent = (currentRoll * (180 / Math.PI)).toFixed(0);
  if (yawEl) yawEl.textContent = Math.round(hdg);
  if (modeEl) modeEl.textContent = params.followCam ? 'FOLLOW' : 'ORBIT';
  if (vsEl) vsEl.textContent = vs.toFixed(1);
  if (hdgEl) hdgEl.textContent = Math.round(hdg) + '°';
  if (battHudEl) battHudEl.textContent = Math.ceil(state.battery) + '%';
  if (modeHudEl) modeHudEl.textContent = flightModeNames[flightMode];

  // Camera Orbit / Third-Person Flight Chase
  if (params.followCam) {
    const camDist = 6.5;
    const camHeight = 2.2;
    // Position camera directly behind the drone's forward direction (+Z)
    const targetX = drone.position.x - localForward.x * camDist;
    const targetZ = drone.position.z - localForward.z * camDist;
    const targetY = Math.max(0.6, drone.position.y + camHeight);

    camera.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.08);
    controls.target.lerp(drone.position.clone().add(new THREE.Vector3(0, 0.35, localForward.z * 1.5)), 0.12);
  }
  controls.update();

  renderer.render(scene, camera);
}

// Start simulation
animate();
updateArmUI();
updatePowerUI();

window._scene = scene;
window._renderer = renderer;
window._camera = camera;
window._drone = drone;
window._droneBody = droneBody;
window._world = world;
window._audio = audio;
