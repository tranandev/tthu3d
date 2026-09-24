const container = document.getElementById("webgl-container");
const hasCoarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false;
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  ) ||
  window.innerWidth < 768 ||
  hasCoarsePointer;

const deviceMemory = navigator.deviceMemory || 8;
const logicalCpuCount = navigator.hardwareConcurrency || 8;
const isLowPowerMobile =
  isMobile && (deviceMemory <= 4 || logicalCpuCount <= 4);
const MAX_PIXEL_RATIO = isLowPowerMobile ? 1 : isMobile ? 1.1 : 1.75;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x060312, 0.008);

const camera = new THREE.PerspectiveCamera(
  isMobile ? 60 : 45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

const DEFAULT_CAM_POS = isMobile
  ? new THREE.Vector3(0, 12, 45)
  : new THREE.Vector3(0, 10, 40);
const DEFAULT_CAM_TARGET = new THREE.Vector3(0, 6.0, 0);

camera.position.copy(DEFAULT_CAM_POS);

const renderer = new THREE.WebGLRenderer({
  antialias: !isMobile,
  alpha: false,
  powerPreference: "high-performance",
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = !isMobile;
controls.rotateSpeed = isMobile ? 0.65 : 1;
controls.zoomSpeed = isMobile ? 0.8 : 1;
controls.maxPolarAngle = Math.PI / 2 + 0.05;
controls.minDistance = 8;
controls.maxDistance = 85;
controls.target.copy(DEFAULT_CAM_TARGET);

// LIGHTS
const ambientLight = new THREE.AmbientLight(0x2a103d, 1.4);
scene.add(ambientLight);

const treeLight = new THREE.PointLight(0xffb6c1, 2.5, 45);
treeLight.position.set(0, 8, 0);
scene.add(treeLight);

const warmLight = new THREE.PointLight(0xffaa33, 2.0, 30);
warmLight.position.set(0, -2, 0);
scene.add(warmLight);

// ISLAND
const islandGroup = new THREE.Group();
scene.add(islandGroup);

const islandGeo = new THREE.CylinderGeometry(
  8.5,
  2.2,
  7.5,
  isMobile ? 24 : 48,
  isMobile ? 8 : 12,
);
const posAttr = islandGeo.attributes.position;
for (let i = 0; i < posAttr.count; i++) {
  const vx = posAttr.getX(i);
  const vy = posAttr.getY(i);
  const vz = posAttr.getZ(i);

  const distFromCenter = Math.sqrt(vx * vx + vz * vz);
  const noise =
    Math.sin(vx * 0.8) * Math.cos(vz * 0.8) * 0.6 +
    Math.sin(vx * 1.8 + vz * 1.5) * 0.3;

  if (vy > 0) {
    posAttr.setY(i, vy + noise * (1.0 - distFromCenter / 12));
  } else {
    posAttr.setX(i, vx + (Math.random() - 0.5) * 1.4);
    posAttr.setZ(i, vz + (Math.random() - 0.5) * 1.4);
  }
}
islandGeo.computeVertexNormals();

const islandMat = new THREE.MeshStandardMaterial({
  color: 0x3d231b,
  roughness: 0.85,
  flatShading: true,
});
const islandMesh = new THREE.Mesh(islandGeo, islandMat);
islandGroup.add(islandMesh);

const topGeo = new THREE.CylinderGeometry(8.6, 7.8, 0.8, isMobile ? 24 : 48, isMobile ? 3 : 4);
const topPos = topGeo.attributes.position;
for (let i = 0; i < topPos.count; i++) {
  const vx = topPos.getX(i);
  const vy = topPos.getY(i);
  const vz = topPos.getZ(i);
  const noise = Math.sin(vx * 0.9) * Math.cos(vz * 0.9) * 0.5;
  topPos.setY(i, vy + noise * 0.4);
}
topGeo.computeVertexNormals();
const topMat = new THREE.MeshStandardMaterial({
  color: 0x22130e,
  roughness: 0.9,
  flatShading: true,
});
const topMesh = new THREE.Mesh(topGeo, topMat);
topMesh.position.y = 3.6;
islandGroup.add(topMesh);

// BỆ MẶT ĐÁ NHỎ & ĐÁ TẢNG RẢI RÁC ÍT HƠN
const stoneMat = new THREE.MeshStandardMaterial({
  color: 0x4a4d52,
  roughness: 0.85,
  metalness: 0.1,
  flatShading: true,
});

// 1. Bệ đá nhỏ dẹt ẩn nhẹ dưới gốc cây
const mainStonePlatformGeo = new THREE.CylinderGeometry(2.5, 3.0, 0.15, 6);
const mainStonePlatform = new THREE.Mesh(mainStonePlatformGeo, stoneMat);
mainStonePlatform.position.set(0, 3.9, 0);
islandGroup.add(mainStonePlatform);

// 2. Chỉ 3 viên đá nhỏ điểm xuyết trên mặt đất
const rockCount = 3;
for (let i = 0; i < rockCount; i++) {
  const rockGeo = new THREE.DodecahedronGeometry(0.2 + Math.random() * 0.25, 0);
  const rockMesh = new THREE.Mesh(rockGeo, stoneMat);

  const angle = (i / rockCount) * Math.PI * 2 + 0.5;
  const dist = 3.8 + Math.random() * 2.0;

  rockMesh.position.set(Math.cos(angle) * dist, 3.9, Math.sin(angle) * dist);
  rockMesh.rotation.set(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI,
  );
  islandGroup.add(rockMesh);
}

// TREE TRUNK & BRANCHES
const treeGroup = new THREE.Group();
treeGroup.position.set(0, 4.0, 0);
islandGroup.add(treeGroup);

const trunkMat = new THREE.MeshStandardMaterial({
  color: 0x2b140e,
  roughness: 0.85,
});

const trunkCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0.15, 2.5, -0.1),
  new THREE.Vector3(-0.1, 5.0, 0.1),
  new THREE.Vector3(0.0, 7.5, 0.0),
]);

const trunkGeo = new THREE.TubeGeometry(trunkCurve, isMobile ? 20 : 32, 0.28, isMobile ? 6 : 8, false);
const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
treeGroup.add(trunkMesh);

const branchClusters = [];
const mainBranchCount = 12;
for (let i = 0; i < mainBranchCount; i++) {
  const angle = (i / mainBranchCount) * Math.PI * 2 + Math.random() * 0.3;
  const h = 3.0 + Math.random() * 4.0;
  const startP = trunkCurve.getPointAt(h / 7.5);
  const len = 3.0 + Math.random() * 2.2;

  const endP = new THREE.Vector3(
    startP.x + Math.cos(angle) * len,
    startP.y + 0.8 + Math.random() * 1.0,
    startP.z + Math.sin(angle) * len,
  );

  const midP = new THREE.Vector3().addVectors(startP, endP).multiplyScalar(0.5);
  midP.y += 0.4;

  const bCurve = new THREE.CatmullRomCurve3([startP, midP, endP]);
  const bGeo = new THREE.TubeGeometry(bCurve, isMobile ? 7 : 10, 0.09, isMobile ? 5 : 6, false);
  const bMesh = new THREE.Mesh(bGeo, trunkMat);
  treeGroup.add(bMesh);

  branchClusters.push({ center: endP, radius: 3.2 + Math.random() * 1.0 });
}

// HỆ THỐNG TÁN LÁ
const particleCount = isLowPowerMobile ? 3000 : isMobile ? 5500 : 30000;
const blossomGeo = new THREE.BufferGeometry();
const blossomPos = new Float32Array(particleCount * 3);
const blossomColors = new Float32Array(particleCount * 3);

const colorDustyPink = new THREE.Color(0xe8a2a8);
const colorSoftPink = new THREE.Color(0xf0b6bc);
const colorPaleRose = new THREE.Color(0xf7d1d5);
const colorSoftWhite = new THREE.Color(0xfdf0f2);

const clusters = [
  { center: new THREE.Vector3(0, 9.5, 0), radius: 6.2 },
  { center: new THREE.Vector3(0, 7.5, 0), radius: 7.0 },
  { center: new THREE.Vector3(0, 5.5, 0), radius: 6.0 },
  ...branchClusters,
];

for (let i = 0; i < particleCount; i++) {
  const c = clusters[Math.floor(Math.random() * clusters.length)];

  const u = Math.random();
  const r = Math.pow(u, 0.65) * c.radius;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);

  const x = c.center.x + r * Math.sin(phi) * Math.cos(theta);
  const y = c.center.y + r * Math.sin(phi) * Math.sin(theta) * 0.8;
  const z = c.center.z + r * Math.cos(phi);

  blossomPos[i * 3] = x;
  blossomPos[i * 3 + 1] = y;
  blossomPos[i * 3 + 2] = z;

  const heightFactor = THREE.MathUtils.clamp((y - 3) / 7, 0, 1);
  const randC = Math.random();
  let col;

  if (heightFactor < 0.3) {
    col = randC < 0.6 ? colorDustyPink : colorSoftPink;
  } else if (heightFactor < 0.7) {
    col =
      randC < 0.4
        ? colorSoftPink
        : randC < 0.8
          ? colorPaleRose
          : colorDustyPink;
  } else {
    col = randC < 0.5 ? colorSoftWhite : colorPaleRose;
  }

  blossomColors[i * 3] = col.r;
  blossomColors[i * 3 + 1] = col.g;
  blossomColors[i * 3 + 2] = col.b;
}

blossomGeo.setAttribute("position", new THREE.BufferAttribute(blossomPos, 3));
blossomGeo.setAttribute("color", new THREE.BufferAttribute(blossomColors, 3));

function createParticleTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.4, "rgba(240,182,188,0.6)");
  grad.addColorStop(1, "rgba(240,182,188,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(16, 16, 16, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

const particleTexture = createParticleTexture();

const blossomMat = new THREE.PointsMaterial({
  size: isMobile ? 0.5 : 0.42,
  vertexColors: true,
  map: particleTexture,
  transparent: true,
  opacity: 0.75,
  blending: THREE.NormalBlending,
  depthWrite: false,
});

const blossomParticles = new THREE.Points(blossomGeo, blossomMat);
treeGroup.add(blossomParticles);

// RABBITS
function createRabbit() {
  const group = new THREE.Group();
  const rabbitMat = new THREE.MeshStandardMaterial({
    color: 0xf8f8ff,
    roughness: 0.5,
  });

  const bodyGeo = new THREE.SphereGeometry(0.5, isMobile ? 8 : 12, isMobile ? 8 : 12);
  bodyGeo.scale(0.8, 1, 0.9);
  const bodyMesh = new THREE.Mesh(bodyGeo, rabbitMat);
  bodyMesh.position.y = 0.4;
  group.add(bodyMesh);

  const headGeo = new THREE.SphereGeometry(0.35, isMobile ? 8 : 12, isMobile ? 8 : 12);
  const headMesh = new THREE.Mesh(headGeo, rabbitMat);
  headMesh.position.set(0, 0.85, 0.2);
  group.add(headMesh);

  const earGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.5, 8);
  const earLeft = new THREE.Mesh(earGeo, rabbitMat);
  earLeft.position.set(-0.12, 1.25, 0.18);
  earLeft.rotation.z = 0.15;
  earLeft.rotation.x = -0.1;
  group.add(earLeft);

  const earRight = earLeft.clone();
  earRight.position.x = 0.12;
  earRight.rotation.z = -0.15;
  group.add(earRight);

  return group;
}

const rabbits = [];
for (let i = 0; i < 4; i++) {
  const rabbitMesh = createRabbit();
  islandGroup.add(rabbitMesh);

  rabbits.push({
    mesh: rabbitMesh,
    orbitRadius: 2.8 + Math.random() * 3.2,
    orbitSpeed: (0.12 + Math.random() * 0.15) * (i % 2 === 0 ? 1 : -1),
    phase: (i / 4) * Math.PI * 2,
    baseY: 4.05,
    hopSpeed: 4.5 + Math.random() * 2.0,
    hopHeight: 0.15,
    scale: 0.75 + Math.random() * 0.25,
  });
  rabbits[i].mesh.scale.setScalar(rabbits[i].scale);
}

function updateRabbits(time) {
  rabbits.forEach((r) => {
    const angle = r.phase + time * r.orbitSpeed;
    const sign = Math.sign(r.orbitSpeed) || 1;

    const x = Math.cos(angle) * r.orbitRadius;
    const z = Math.sin(angle) * r.orbitRadius;
    const hop = Math.abs(Math.sin(time * r.hopSpeed)) * r.hopHeight;

    r.mesh.position.set(x, r.baseY + hop, z);

    const dx = -Math.sin(angle) * sign;
    const dz = Math.cos(angle) * sign;
    r.mesh.rotation.y = Math.atan2(dx, dz);
  });
}

// LANTERNS & MESSAGES WITH IMAGES
const lanternsGroup = new THREE.Group();
scene.add(lanternsGroup);

const lanterns = [];
const interactiveObjects = [];

const wishMessages = [
  "Chúc cậu và gia đình một mùa Trung Thu đoàn viên, tràn ngập niềm vui và hạnh phúc!",
  "Cầu chúc cho mọi nguyện ước của cậu đêm nay sẽ trở thành hiện thực.",
  "Trăng tròn ấm áp, chúc tình cậu và tình yêu của chúng ta mãi bền chặt.",
  "Chúc cậu luôn giữ được tâm hồn trong trẻo, yêu đời như ánh trăng rằm.",
  "Trung Thu bình an, vạn sự như ý, công danh thăng tiến rực rỡ!",
  "Chúc riêng cậu một đêm trăng thật lãng mạn và ngọt ngào.",
  "Sức khỏe dồi dào, tâm an yên, miệng luôn mỉm cười rạng rỡ.",
];

const photoIds = [
  "001", "001b", "002", "003", "004", "005", "006", "007",
  "008", "009", "011", "012", "013", "014", "015", "017",
  "018", "019", "020", "021", "022", "023", "024", "025",
  "026", "027", "028", "029",
];

const photoCatalog = photoIds.map((id) => ({
  preview: `./assets/photos/${id}-144.webp`,
  full: `./assets/photos/${id}-576.webp`,
}));

const networkConnection =
  navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const saveDataEnabled = Boolean(networkConnection?.saveData);
const fastConnection =
  !saveDataEnabled &&
  (!networkConnection?.effectiveType || networkConnection.effectiveType === "4g");
const prefetchInFlight = new Set();

function prefetchUrls(urls, concurrency) {
  let nextIndex = 0;

  function loadNext() {
    if (nextIndex >= urls.length) return;

    const image = new Image();
    if ("fetchPriority" in image) image.fetchPriority = "low";
    prefetchInFlight.add(image);
    image.onload = image.onerror = () => {
      prefetchInFlight.delete(image);
      loadNext();
    };
    image.src = urls[nextIndex++];
  }

  const workerCount = Math.min(concurrency, urls.length);
  for (let i = 0; i < workerCount; i++) loadNext();
}

function scheduleIdle(task, timeout = 1200) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(task, { timeout });
  } else {
    window.setTimeout(task, 350);
  }
}

window.addEventListener(
  "load",
  () => {
    if (!saveDataEnabled) {
      scheduleIdle(
        () => prefetchUrls(photoCatalog.map((photo) => photo.preview), 4),
        1000,
      );
    }

    if (fastConnection) {
      window.setTimeout(
        () =>
          scheduleIdle(
            () => prefetchUrls(photoCatalog.map((photo) => photo.full), 2),
            2200,
          ),
        1600,
      );
    }
  },
  { once: true },
);

function createLanternTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, "#ff4d4d");
  grad.addColorStop(0.5, "#e63946");
  grad.addColorStop(1, "#ffb703");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = "#ffd700";
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 120, 120);
  return new THREE.CanvasTexture(canvas);
}

const lanternTex = createLanternTexture();
const lanternBodyGeo = new THREE.CylinderGeometry(0.6, 0.45, 1.4, 6);
const lanternBodyMat = new THREE.MeshStandardMaterial({
  map: lanternTex,
  emissive: 0xff7700,
  emissiveIntensity: 0.7,
  roughness: 0.3,
});
const lanternCapGeo = new THREE.CylinderGeometry(0.63, 0.63, 0.1, 6);
const lanternCapMat = new THREE.MeshStandardMaterial({
  color: 0xffd700,
  metalness: 0.5,
});
const lanternTagGeo = new THREE.PlaneGeometry(0.35, 0.7);
const lanternTagMat = new THREE.MeshBasicMaterial({
  color: 0xd90429,
  side: THREE.DoubleSide,
});
const lanternGlowMat = new THREE.SpriteMaterial({
  map: particleTexture,
  color: 0xffaa00,
  transparent: true,
  opacity: 0.7,
  blending: THREE.AdditiveBlending,
});
const lanternHitGeo = new THREE.SphereGeometry(isMobile ? 1.9 : 1.6, 8, 8);
const lanternHitMat = new THREE.MeshBasicMaterial({ visible: false });

function createLanternMesh() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(lanternBodyGeo, lanternBodyMat);
  group.add(body);

  const capTop = new THREE.Mesh(lanternCapGeo, lanternCapMat);
  capTop.position.y = 0.7;
  group.add(capTop);

  const tag = new THREE.Mesh(lanternTagGeo, lanternTagMat);
  tag.position.set(0, -1.1, 0);
  group.add(tag);

  const glow = new THREE.Sprite(lanternGlowMat);
  glow.scale.set(3.2, 3.2, 1);
  group.add(glow);

  const hitMesh = new THREE.Mesh(lanternHitGeo, lanternHitMat);
  group.add(hitMesh);

  return { group, hitMesh };
}

const lanternCount = photoCatalog.length;
for (let i = 0; i < lanternCount; i++) {
  const { group: lantern, hitMesh } = createLanternMesh();

  const radius = 9 + Math.random() * 25;
  const angle = Math.random() * Math.PI * 2;
  const y = -1 + Math.random() * 30;

  lantern.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);

  const photo = photoCatalog[i % photoCatalog.length];
  const wish = wishMessages[i % wishMessages.length];

  lantern.userData = {
    speedY: 0.008 + Math.random() * 0.012,
    swingSpeed: 0.8 + Math.random() * 1.2,
    initialX: lantern.position.x,
    initialZ: lantern.position.z,
    wish,
    photo,
    id: i,
  };

  const sc = 0.75 + Math.random() * 0.5;
  lantern.scale.set(sc, sc, sc);

  hitMesh.userData.parentLantern = lantern;

  lanternsGroup.add(lantern);
  lanterns.push(lantern);
  interactiveObjects.push(hitMesh);
}

// FALLING PETALS & STARS
const fallingPetalsCount = isLowPowerMobile ? 20 : isMobile ? 36 : 150;
const petalsGeo = new THREE.BufferGeometry();
const petalsPos = new Float32Array(fallingPetalsCount * 3);
const petalsData = [];

for (let i = 0; i < fallingPetalsCount; i++) {
  petalsPos[i * 3] = (Math.random() - 0.5) * 36;
  petalsPos[i * 3 + 1] = Math.random() * 36;
  petalsPos[i * 3 + 2] = (Math.random() - 0.5) * 36;

  petalsData.push({
    speedY: 0.02 + Math.random() * 0.03,
  });
}

petalsGeo.setAttribute("position", new THREE.BufferAttribute(petalsPos, 3));
const petalsMat = new THREE.PointsMaterial({
  size: isMobile ? 0.35 : 0.3,
  color: 0xf7d1d5,
  transparent: true,
  opacity: 0.75,
  map: particleTexture,
  blending: THREE.NormalBlending,
  depthWrite: false,
});

const petalsParticles = new THREE.Points(petalsGeo, petalsMat);
scene.add(petalsParticles);

const starCount = isLowPowerMobile ? 120 : isMobile ? 220 : 800;
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  starPos[i * 3] = (Math.random() - 0.5) * 180;
  starPos[i * 3 + 1] = Math.random() * 90;
  starPos[i * 3 + 2] = (Math.random() - 0.5) * 180;
}
starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.4,
  transparent: true,
  opacity: 0.7,
});
scene.add(new THREE.Points(starGeo, starMat));

// FIREWORKS
let fireworks = [];
function createFirework(pos) {
  const pCount = isLowPowerMobile ? 20 : isMobile ? 30 : 50;
  const pGeo = new THREE.BufferGeometry();
  const pPositions = new Float32Array(pCount * 3);
  const velocities = [];

  for (let i = 0; i < pCount; i++) {
    pPositions[i * 3] = pos.x;
    pPositions[i * 3 + 1] = pos.y;
    pPositions[i * 3 + 2] = pos.z;

    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const speed = 0.08 + Math.random() * 0.12;

    velocities.push(
      new THREE.Vector3(
        speed * Math.sin(phi) * Math.cos(theta),
        speed * Math.sin(phi) * Math.sin(theta),
        speed * Math.cos(phi),
      ),
    );
  }

  pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
  const pMat = new THREE.PointsMaterial({
    size: 0.35,
    color: 0xffd700,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
  });

  const pMesh = new THREE.Points(pGeo, pMat);
  scene.add(pMesh);

  fireworks.push({ mesh: pMesh, velocities: velocities, life: 1.0 });
}

// RAYCASTER & INTERACTION
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let targetCamPos = null;
let targetCamTarget = null;
let selectedLantern = null;

const wishModal = document.getElementById("wishModal");
const wishText = document.getElementById("wishText");
const wishPreview = document.getElementById("wishPreview");
const wishImage = document.getElementById("wishImage");
const wishImageContainer = document.getElementById("wishImageContainer");
const closeWishBtn = document.getElementById("closeWishBtn");

let pointerDownPos = { x: 0, y: 0 };
let modalOpenTimer = null;
let scenePaused = false;
let imageLoadId = 0;

function loadWishImage(photo) {
  const loadId = ++imageLoadId;
  let previewFailed = false;
  let fullFailed = false;

  wishImageContainer.classList.add("is-loading");
  wishImageContainer.classList.remove("preview-ready", "full-ready", "has-error");

  wishPreview.onload = null;
  wishPreview.onerror = null;
  wishImage.onload = null;
  wishImage.onerror = null;
  wishPreview.removeAttribute("src");
  wishImage.removeAttribute("src");

  const showErrorIfNeeded = () => {
    if (previewFailed && fullFailed && loadId === imageLoadId) {
      wishImageContainer.classList.remove("is-loading");
      wishImageContainer.classList.add("has-error");
    }
  };

  wishPreview.onload = () => {
    if (loadId !== imageLoadId) return;
    wishImageContainer.classList.add("preview-ready");
    wishImageContainer.classList.remove("is-loading");
  };

  wishPreview.onerror = () => {
    previewFailed = true;
    showErrorIfNeeded();
  };

  wishImage.onload = async () => {
    if (loadId !== imageLoadId) return;
    try {
      if (wishImage.decode) await wishImage.decode();
    } catch (_) {
      // The image is already loadable; decoding can fail on some older browsers.
    }
    if (loadId !== imageLoadId) return;
    wishImageContainer.classList.add("full-ready");
    wishImageContainer.classList.remove("is-loading", "has-error");
  };

  wishImage.onerror = () => {
    fullFailed = true;
    showErrorIfNeeded();
  };

  if ("fetchPriority" in wishPreview) wishPreview.fetchPriority = "high";
  if ("fetchPriority" in wishImage) wishImage.fetchPriority = "high";

  wishPreview.src = photo.preview;
  requestAnimationFrame(() => {
    if (loadId === imageLoadId) wishImage.src = photo.full;
  });
}


function onPointerDown(event) {
  pointerDownPos.x =
    event.clientX || (event.touches && event.touches[0].clientX) || 0;
  pointerDownPos.y =
    event.clientY || (event.touches && event.touches[0].clientY) || 0;
}

function onPointerUp(event) {
  if (event.target.closest(".top-bar") || event.target.closest(".wish-modal"))
    return;

  const clientX =
    event.clientX ||
    (event.changedTouches && event.changedTouches[0].clientX) ||
    0;
  const clientY =
    event.clientY ||
    (event.changedTouches && event.changedTouches[0].clientY) ||
    0;

  const distMoved = Math.hypot(
    clientX - pointerDownPos.x,
    clientY - pointerDownPos.y,
  );
  if (distMoved > 8) return;

  mouse.x = (clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactiveObjects, false);

  if (intersects.length > 0) {
    const hitMesh = intersects[0].object;
    selectedLantern = hitMesh.userData.parentLantern || hitMesh.parent;
    const lPos = selectedLantern.position;

    wishText.textContent = `"${selectedLantern.userData.wish}"`;
    loadWishImage(selectedLantern.userData.photo);

    clearTimeout(modalOpenTimer);
    if (isMobile) {
      wishModal.classList.add("active");
      wishModal.setAttribute("aria-hidden", "false");
      scenePaused = true;
      stopAnimation();
    } else {
      createFirework(lPos);
      const offset = new THREE.Vector3()
        .subVectors(camera.position, lPos)
        .normalize()
        .multiplyScalar(5.5);
      targetCamPos = new THREE.Vector3().addVectors(lPos, offset);
      targetCamTarget = lPos.clone();

      modalOpenTimer = setTimeout(() => {
        wishModal.classList.add("active");
        wishModal.setAttribute("aria-hidden", "false");
        scenePaused = true;
        stopAnimation();
      }, 140);
    }
  }
}

window.addEventListener("pointerdown", onPointerDown, { passive: true });
window.addEventListener("pointerup", onPointerUp, { passive: true });

function resetCamera() {
  targetCamPos = DEFAULT_CAM_POS.clone();
  targetCamTarget = DEFAULT_CAM_TARGET.clone();
  selectedLantern = null;
}

function closeWishCard(e) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }

  clearTimeout(modalOpenTimer);
  wishModal.classList.remove("active");
  wishModal.setAttribute("aria-hidden", "true");
  scenePaused = false;
  resetCamera();
  startAnimation();
}

closeWishBtn.addEventListener("click", closeWishCard);

wishModal.addEventListener("click", (e) => {
  if (e.target === wishModal) closeWishCard(e);
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeWishCard();
});

// AUDIO
const bgm = document.getElementById("bgm");
const audioBtn = document.getElementById("audio-btn");

function syncAudioButton() {
  const playing = !bgm.paused;
  audioBtn.classList.toggle("is-playing", playing);
  audioBtn.setAttribute("aria-label", playing ? "Tắt nhạc" : "Bật nhạc");
}

audioBtn.addEventListener("click", async () => {
  if (!bgm.paused) {
    bgm.pause();
    syncAudioButton();
    return;
  }

  try {
    if (!bgm.getAttribute("src")) {
      bgm.src = bgm.dataset.src;
      bgm.load();
    }
    await bgm.play();
  } catch (_) {
    // Autoplay policies may reject playback until a valid user gesture.
  }
  syncAudioButton();
});

bgm.addEventListener("play", syncAudioButton);
bgm.addEventListener("pause", syncAudioButton);

// ANIMATION
const clock = new THREE.Clock();
let animationFrameId = null;

function animate() {
  animationFrameId = null;
  if (scenePaused || document.hidden) return;

  const delta = clock.getDelta();
  const time = clock.elapsedTime;

  lanterns.forEach((lantern) => {
    lantern.position.y += lantern.userData.speedY;
    lantern.position.x =
      lantern.userData.initialX +
      Math.sin(time * lantern.userData.swingSpeed + lantern.userData.id) * 0.4;
    lantern.position.z =
      lantern.userData.initialZ +
      Math.cos(time * lantern.userData.swingSpeed + lantern.userData.id) * 0.4;
    lantern.rotation.y += 0.005;

    if (lantern.position.y > 30) {
      lantern.position.y = -3;
    }
  });

  const pPos = petalsGeo.attributes.position.array;
  for (let i = 0; i < fallingPetalsCount; i++) {
    pPos[i * 3 + 1] -= petalsData[i].speedY;
    pPos[i * 3] += Math.sin(time + i) * 0.01;
    pPos[i * 3 + 2] += Math.cos(time + i) * 0.01;

    if (pPos[i * 3 + 1] < -3) {
      pPos[i * 3 + 1] = 30;
      pPos[i * 3] = (Math.random() - 0.5) * 36;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 36;
    }
  }
  petalsGeo.attributes.position.needsUpdate = true;

  for (let i = fireworks.length - 1; i >= 0; i--) {
    const fw = fireworks[i];
    fw.life -= delta * 1.2;
    const posArr = fw.mesh.geometry.attributes.position.array;

    for (let j = 0; j < fw.velocities.length; j++) {
      posArr[j * 3] += fw.velocities[j].x;
      posArr[j * 3 + 1] += fw.velocities[j].y;
      posArr[j * 3 + 2] += fw.velocities[j].z;
    }
    fw.mesh.geometry.attributes.position.needsUpdate = true;
    fw.mesh.material.opacity = fw.life;

    if (fw.life <= 0) {
      scene.remove(fw.mesh);
      fw.mesh.geometry.dispose();
      fw.mesh.material.dispose();
      fireworks.splice(i, 1);
    }
  }

  islandGroup.rotation.y = Math.sin(time * 0.15) * 0.05;

  updateRabbits(time);

  if (targetCamPos && targetCamTarget) {
    camera.position.lerp(targetCamPos, 0.04);
    controls.target.lerp(targetCamTarget, 0.04);

    if (camera.position.distanceTo(targetCamPos) < 0.1) {
      targetCamPos = null;
      targetCamTarget = null;
    }
  }

  controls.update();
  renderer.render(scene, camera);
  animationFrameId = requestAnimationFrame(animate);
}

function startAnimation() {
  if (animationFrameId !== null || scenePaused || document.hidden) return;
  clock.getDelta();
  animationFrameId = requestAnimationFrame(animate);
}

function stopAnimation() {
  if (animationFrameId === null) return;
  cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopAnimation();
  } else {
    startAnimation();
  }
});

startAnimation();

window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.fov = width < 768 ? 60 : 45;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
});
