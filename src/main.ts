import "./styles.css";

import gsap from "gsap";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type FaceData = {
  id: string;
  eyebrow: string;
  title: string;
  shortLabel: string;
  subtitle: string;
  angle: number;
  accent: string;
  html: string;
};

type FaceRuntime = {
  data: FaceData;
  pivot: THREE.Group;
  faceMesh: THREE.Mesh;
  faceOutline: THREE.LineSegments;
  panelHinge: THREE.Group;
  panelMesh: THREE.Mesh;
  panelOutline: THREE.LineLoop;
  panelAnchor: THREE.Object3D;
  basePosition: THREE.Vector3;
  normal: THREE.Vector3;
  pulseOffset: number;
};

type DecorativeShard = {
  mesh: THREE.Mesh;
  outline: THREE.LineSegments;
  crease: THREE.LineSegments;
  basePosition: THREE.Vector3;
  phase: number;
  drift: number;
};

type EnvelopeRuntime = {
  group: THREE.Group;
  body: THREE.Mesh;
  photo: THREE.Mesh;
  flap: THREE.Mesh;
  outline: THREE.LineSegments;
  crease: THREE.LineSegments;
  photoUrl: string;
  index: number;
  baseAngle: number;
};

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found");
}

app.innerHTML = `
  <main class="page-shell">
    <div class="grain"></div>
    <div class="hero-copy" id="heroCopy">
      <p class="eyebrow">Origami Space · 3D Interactive Portrait</p>
      <h1>Selena Yuan</h1>
      <div class="hint-row">
        <span>拖拽旋转</span>
        <span>悬停高亮</span>
        <span>点击翻折展开</span>
      </div>
    </div>
    <section class="scene-frame">
      <div class="canvas-wrap">
        <canvas class="webgl"></canvas>
        <div class="card-layer"></div>
      </div>
    </section>
    <aside class="ambient-note" id="ambientNote">
      <p>Warm paper, soft shadows, and a life still unfolding.</p>
    </aside>
    <div class="gallery-view" id="galleryView">
      <button class="gallery-back" id="galleryBack" aria-label="返回主界面">
        <span>←</span>
        <span>返回</span>
      </button>
      <div class="gallery-title">你想看看我吗！</div>
      <div class="gallery-hint">左右拖拽旋转 · 点击信封打开照片</div>
    </div>
    <div class="lightbox" id="lightbox">
      <button class="lightbox-close" id="lightboxClose" aria-label="关闭">×</button>
      <img src="" alt="" id="lightboxImg">
    </div>
  </main>
`;

const PHOTO_URLS = [
  "/photos/photo1.jpg",
  "/photos/photo2.jpg",
  "/photos/photo3.jpg",
  "/photos/photo4.jpg"
];

const faces: FaceData[] = [
  {
    id: "about",
    eyebrow: "Face 01",
    title: "关于我",
    shortLabel: "关于我",
    subtitle: "一个热爱尝试、永远好奇的 ENFP 女孩",
    angle: 0.3,
    accent: "#C9A88C",
    html: `
      <section class="panel-block">
        <p class="panel-kicker">Personal Background</p>
        <h2>Selena Yuan</h2>
        <p class="panel-quote">一个热爱尝试、永远好奇的 ENFP 女孩。</p>
      </section>
      <section class="panel-grid">
        <div><span>生日</span><strong>2006.01.11 · 20岁</strong></div>
        <div><span>MBTI</span><strong>ENFP 竞选者</strong></div>
        <div><span>家庭</span><strong>爸爸妈妈 + 妹妹</strong></div>
        <div><span>学校</span><strong>深圳大学</strong></div>
      </section>
      <section class="panel-block">
        <p class="panel-mini-title">专业</p>
        <p class="panel-text">
          网络与新媒体，主修智能体产品设计、人机传播导论、媒体与社会、
          AIGC 与文本计算、大语言模型与 AI 内容生成、新媒体用户研究。
        </p>
      </section>
    `
  },
  {
    id: "traits",
    eyebrow: "Face 02",
    title: "性格与热爱",
    shortLabel: "热爱",
    subtitle: "擅长连接人、内容和新工具的表达者",
    angle: 1.9,
    accent: "#D7B79F",
    html: `
      <section class="panel-block">
        <p class="panel-kicker">Traits & Strengths</p>
        <h2>热情外向，强共情，网感在线</h2>
        <p class="panel-text">
          ENFP 气质让我天然喜欢沟通、共情与探索，也让我持续关注
          社媒趋势、用户情绪和内容表达方式。
        </p>
      </section>
      <section class="tag-row">
        <span>旅游</span><span>摄影</span><span>阅读</span><span>写作</span><span>攀岩 Soon</span>
      </section>
      <section class="stats-row">
        <div><strong>1w+</strong><span>小红书单篇浏览</span></div>
        <div><strong>600+</strong><span>小红书点赞</span></div>
        <div><strong>24/7</strong><span>海外社媒冲浪</span></div>
      </section>
      <section class="panel-block">
        <p class="panel-mini-title">技能栈</p>
        <p class="panel-text">Photoshop / 剪映 / Canva / WPS / Codex / Claude / Vibe Coding</p>
      </section>
      <section class="panel-block">
        <p class="panel-mini-title">个人项目</p>
        <p class="panel-link"><a href="https://github.com/uan-iel/wechat-moments-ai" target="_blank" rel="noreferrer">朋友圈及小红书运营工具</a></p>
        <p class="panel-link"><a href="https://github.com/uan-iel/obsidian-museum-desk" target="_blank" rel="noreferrer">Obsidian 仪表盘插件</a></p>
      </section>
    `
  },
  {
    id: "journey",
    eyebrow: "Face 03",
    title: "实践轨迹",
    shortLabel: "实践",
    subtitle: "在内容、社群、采访与协同中积累真实能力",
    angle: 3.5,
    accent: "#C59A78",
    html: `
      <section class="panel-block">
        <p class="panel-kicker">Internships & Activities</p>
        <h2>一边做内容，一边做组织者</h2>
      </section>
      <section class="timeline">
        <article>
          <p class="timeline-date">2025.11 - 2026.01 · Leyadoll</p>
          <p>独立站运营，社媒视频/海报浏览量 <strong>3w+</strong>，完成 <strong>30+</strong> 竞品调研。</p>
        </article>
        <article>
          <p class="timeline-date">2024.07 - 2024.08 · 南方都市报</p>
          <p>新媒体运营 & 实习记者，采编稿件浏览量 <strong>1w+</strong>，完成全英文远程深度采访。</p>
        </article>
        <article>
          <p class="timeline-date">2025.01 - 2025.02 · 海南省广播电视台</p>
          <p>实习记者，跨方协同准时率 <strong>100%</strong>，保障 <strong>20+</strong> 条视频成片通过率 <strong>100%</strong>。</p>
        </article>
        <article>
          <p class="timeline-date">2024.09 - 2024.12 · 莓辣</p>
          <p>社群运营 & 小红书运营，管理 <strong>100+</strong> 社群，内容商品点击率 <strong>12%</strong>，阅读下单率 <strong>2%</strong>。</p>
        </article>
      </section>
      <section class="stats-row compact">
        <div><strong>60+</strong><span>AI 研究被试招募</span></div>
        <div><strong>100+</strong><span>AI 使用日志</span></div>
        <div><strong>200+</strong><span>系庆互动参与</span></div>
      </section>
    `
  },
  {
    id: "future",
    eyebrow: "Face 04",
    title: "未来方向",
    shortLabel: "未来",
    subtitle: "成为懂用户、懂技术、懂商业的产品人",
    angle: 5.1,
    accent: "#B78A68",
    html: `
      <section class="panel-block">
        <p class="panel-kicker">Future Direction</p>
        <h2>实体产品经理 / 互联网产品经理</h2>
        <p class="panel-text">
          正在系统学习产品方法论、用户研究、数据分析，并持续关注行业动态与 AI 产品趋势。
        </p>
      </section>
      <section class="panel-list">
        <p>从 0 到 1 搭建产品，定义需求与 MVP</p>
        <p>用户洞察与行为分析，用数据驱动决策</p>
        <p>把 AI 融入产品设计，提升用户体验</p>
        <p>近期开始尝试攀岩，训练身体与心智的平衡</p>
      </section>
      <section class="panel-block">
        <p class="panel-quote">
          成为懂用户、懂技术、懂商业的产品人，做出有温度的好产品。
        </p>
      </section>
    `
  },
  {
    id: "gallery",
    eyebrow: "Face 05",
    title: "你想看看我吗！",
    shortLabel: "看看我",
    subtitle: "四封信，四张瞬间，等你来拆开",
    angle: 4.7,
    accent: "#D4A574",
    html: `
      <section class="panel-block">
        <p class="panel-kicker">Photo Gallery</p>
        <h2>你想看看我吗！</h2>
        <p class="panel-quote">四封信，四张瞬间，等你来拆开。</p>
      </section>
      <section class="panel-block">
        <p class="panel-mini-title">玩法</p>
        <p class="panel-text">点击这个折纸面进入照片信封空间，左右拖拽旋转，把任一信封移到最前，点击即可打开照片。</p>
      </section>
    `
  },
  {
    id: "contact",
    eyebrow: "Face 06",
    title: "联系我",
    shortLabel: "联系",
    subtitle: "期待一起做出有温度的好产品",
    angle: 0.8,
    accent: "#C9A88C",
    html: `
      <section class="panel-block">
        <p class="panel-kicker">Contact</p>
        <h2>保持联系</h2>
        <p class="panel-quote">期待一起做出有温度的好产品。</p>
      </section>
      <section class="panel-grid">
        <div><span>手机</span><strong>16620063787</strong></div>
        <div><span>邮箱</span><strong>2114214896@qq.com</strong></div>
      </section>
      <section class="panel-block">
        <p class="panel-mini-title">社交平台</p>
        <p class="panel-link"><a href="https://github.com/uan-iel" target="_blank" rel="noreferrer">GitHub: uan-iel</a></p>
        <p class="panel-link"><a href="https://www.xiaohongshu.com/user/profile/1022725683" target="_blank" rel="noreferrer">小红书: 1022725683</a></p>
      </section>
    `
  }
];

const canvas = document.querySelector<HTMLCanvasElement>(".webgl");
const cardLayer = document.querySelector<HTMLDivElement>(".card-layer");
const heroCopy = document.querySelector<HTMLElement>("#heroCopy");
const ambientNote = document.querySelector<HTMLElement>("#ambientNote");
const galleryView = document.querySelector<HTMLElement>("#galleryView");
const galleryBack = document.querySelector<HTMLElement>("#galleryBack");
const lightbox = document.querySelector<HTMLElement>("#lightbox");
const lightboxImg = document.querySelector<HTMLImageElement>("#lightboxImg");
const lightboxClose = document.querySelector<HTMLElement>("#lightboxClose");

if (!canvas || !cardLayer || !heroCopy || !ambientNote || !galleryView || !galleryBack || !lightbox || !lightboxImg || !lightboxClose) {
  throw new Error("Scene mount points not found");
}

const activeCard = document.createElement("article");
activeCard.className = "detail-card";
cardLayer.appendChild(activeCard);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog("#faf6f0", 8, 18);

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

const camera = new THREE.PerspectiveCamera(36, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 0.8, 8.8);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(sizes.width, sizes.height);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = false;
controls.minPolarAngle = 0.2;
controls.maxPolarAngle = Math.PI - 0.2;
controls.rotateSpeed = 0.9;
controls.target.set(0, 0.2, 0);
controls.update();

const ambientLight = new THREE.HemisphereLight("#fff7ef", "#d9b89c", 1.4);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight("#fff1dd", 1.7);
keyLight.position.set(4, 6, 5);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight("#f7d7bd", 2.1);
rimLight.position.set(-6, 2, -5);
scene.add(rimLight);

const fillLight = new THREE.PointLight("#ead5c5", 1.3, 18);
fillLight.position.set(0, -3, 6);
scene.add(fillLight);

const origamiGroup = new THREE.Group();
scene.add(origamiGroup);

const floatGroup = new THREE.Group();
origamiGroup.add(floatGroup);

const galleryGroup = new THREE.Group();
galleryGroup.visible = false;
scene.add(galleryGroup);

const galleryLight = new THREE.HemisphereLight("#fff7ef", "#d9b89c", 1.5);
galleryGroup.add(galleryLight);

const galleryKeyLight = new THREE.DirectionalLight("#fff1dd", 1.6);
galleryKeyLight.position.set(3, 5, 6);
galleryGroup.add(galleryKeyLight);

const galleryRimLight = new THREE.DirectionalLight("#f7d7bd", 1.8);
galleryRimLight.position.set(-4, 2, -4);
galleryGroup.add(galleryRimLight);

const kraftPaperTexture = new THREE.CanvasTexture(createKraftPaperCanvas());
kraftPaperTexture.wrapS = THREE.RepeatWrapping;
kraftPaperTexture.wrapT = THREE.RepeatWrapping;
kraftPaperTexture.repeat.set(2.2, 2.2);
kraftPaperTexture.colorSpace = THREE.SRGBColorSpace;

const paperReliefTexture = new THREE.CanvasTexture(createPaperReliefCanvas());
paperReliefTexture.wrapS = THREE.RepeatWrapping;
paperReliefTexture.wrapT = THREE.RepeatWrapping;
paperReliefTexture.repeat.set(2.4, 2.4);
paperReliefTexture.colorSpace = THREE.NoColorSpace;

const paperMaterial = new THREE.MeshStandardMaterial({
  color: "#d2b08e",
  roughness: 1,
  metalness: 0,
  side: THREE.DoubleSide,
  map: kraftPaperTexture,
  bumpMap: paperReliefTexture,
  bumpScale: 0.16
});

const panelMaterial = new THREE.MeshStandardMaterial({
  color: "#cfab88",
  roughness: 1,
  metalness: 0,
  side: THREE.DoubleSide,
  transparent: true,
  map: kraftPaperTexture,
  bumpMap: paperReliefTexture,
  bumpScale: 0.13
});

const coreGeometry = new THREE.OctahedronGeometry(0.72, 0);
const coreMaterial = new THREE.MeshStandardMaterial({
  color: "#d8b896",
  roughness: 1,
  metalness: 0,
  emissive: "#c6a17d",
  emissiveIntensity: 0.006,
  flatShading: true,
  map: kraftPaperTexture,
  bumpMap: paperReliefTexture,
  bumpScale: 0.1
});
const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
floatGroup.add(coreMesh);

const coreEdges = new THREE.LineSegments(
  new THREE.EdgesGeometry(coreGeometry),
  new THREE.LineBasicMaterial({
    color: "#c49b74",
    transparent: true,
    opacity: 0.9
  })
);
coreMesh.add(coreEdges);

const coreCreaseMaterial = new THREE.LineBasicMaterial({
  color: "#b38863",
  transparent: true,
  opacity: 0.45
});
const coreCrease = new THREE.LineSegments(
  new THREE.WireframeGeometry(coreGeometry),
  coreCreaseMaterial
);
coreCrease.scale.setScalar(0.995);
coreMesh.add(coreCrease);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const faceGeometry = createOrigamiCrystalGeometry(0.62, 0.95);
const faceFrames: FaceRuntime[] = [];
const clickableMeshes: THREE.Object3D[] = [];
const decorativeShards: DecorativeShard[] = [];
const envelopes: EnvelopeRuntime[] = [];
const envelopeClickables: THREE.Object3D[] = [];

const normals = [
  new THREE.Vector3(0.65, 0.5, 0.58),
  new THREE.Vector3(-0.72, 0.42, 0.55),
  new THREE.Vector3(0.18, -0.82, 0.54),
  new THREE.Vector3(0.78, -0.18, 0.6),
  new THREE.Vector3(-0.15, 0.75, 0.62),
  new THREE.Vector3(0.22, 0.82, 0.52)
].map((vector) => vector.normalize());

const shardNormals = generateEvenSphereNormals(8, 1.3);

faces.forEach((face, index) => {
  const runtime = createFaceRuntime(face, normals[index], index);
  faceFrames.push(runtime);
  clickableMeshes.push(runtime.faceMesh);
  floatGroup.add(runtime.pivot);
});

shardNormals.forEach((normal, index) => {
  const shard = createDecorativeShard(normal, index);
  decorativeShards.push(shard);
  floatGroup.add(shard.mesh);
  floatGroup.add(shard.outline);
  floatGroup.add(shard.crease);
});

const textureLoader = new THREE.TextureLoader();

PHOTO_URLS.forEach((url, index) => {
  const envelope = createEnvelope(url, index);
  envelopes.push(envelope);
  envelopeClickables.push(envelope.body, envelope.photo, envelope.flap);
  galleryGroup.add(envelope.group);
});

let hoveredId: string | null = null;
let activeId: string | null = null;
let isDragging = false;
let galleryMode = false;
let galleryRotation = 0;
let galleryVelocity = 0;
let isGalleryDragging = false;
let lastGalleryPointerX = 0;
let galleryDragDistance = 0;
let hoveredEnvelopeIndex: number | null = null;
let openedEnvelopeIndex: number | null = null;

function enterGallery(): void {
  galleryMode = true;
  galleryRotation = 0;
  galleryVelocity = 0;
  controls.enabled = false;

  gsap.to(camera.position, {
    x: 0,
    y: 0.6,
    z: 7.2,
    duration: 1,
    ease: "power2.inOut"
  });
  gsap.to(controls.target, {
    x: 0,
    y: 0,
    z: 0,
    duration: 1,
    ease: "power2.inOut"
  });

  gsap.to(origamiGroup.scale, {
    x: 0.001,
    y: 0.001,
    z: 0.001,
    duration: 0.7,
    ease: "power2.in"
  });

  setTimeout(() => {
    origamiGroup.visible = false;
    galleryGroup.visible = true;
    galleryGroup.scale.setScalar(0.001);
    gsap.to(galleryGroup.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.8,
      ease: "back.out(1.4)"
    });
  }, 500);

  heroCopy!.classList.add("hidden");
  ambientNote!.classList.add("hidden");
  activeCard.classList.remove("visible");
  galleryView!.classList.add("visible");
}

function exitGallery(): void {
  galleryMode = false;
  controls.enabled = true;
  lightbox!.classList.remove("visible");

  gsap.to(galleryGroup.scale, {
    x: 0.001,
    y: 0.001,
    z: 0.001,
    duration: 0.6,
    ease: "power2.in"
  });

  setTimeout(() => {
    galleryGroup.visible = false;
    origamiGroup.visible = true;
    gsap.to(origamiGroup.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.8,
      ease: "back.out(1.2)"
    });
  }, 450);

  gsap.to(camera.position, {
    x: 0,
    y: 0.8,
    z: 8.8,
    duration: 1,
    ease: "power2.inOut"
  });
  gsap.to(controls.target, {
    x: 0,
    y: 0.2,
    z: 0,
    duration: 1,
    ease: "power2.inOut"
  });

  heroCopy!.classList.remove("hidden");
  ambientNote!.classList.remove("hidden");
  galleryView!.classList.remove("visible");

  setActiveFace(null);
}

function openLightbox(index: number): void {
  openedEnvelopeIndex = index;
  lightboxImg!.src = PHOTO_URLS[index];
  lightbox!.classList.add("visible");
}

function closeLightbox(): void {
  lightbox!.classList.remove("visible");
  openedEnvelopeIndex = null;
}

canvas.addEventListener("pointermove", (event) => {
  updatePointer(event.clientX, event.clientY);

  if (galleryMode && isGalleryDragging) {
    const deltaX = event.clientX - lastGalleryPointerX;
    galleryRotation -= deltaX * 0.005;
    galleryVelocity = -deltaX * 0.005;
    lastGalleryPointerX = event.clientX;
    galleryDragDistance += Math.abs(deltaX);
    return;
  }

  if (galleryMode) {
    const hit = pickEnvelope();
    canvas.style.cursor = hit ? "pointer" : "grab";
    return;
  }

  const hit = pickFace();
  hoveredId = hit?.userData.faceId ?? null;
  canvas.style.cursor = hoveredId ? "pointer" : "grab";
});

canvas.addEventListener("pointerdown", (event) => {
  if (galleryMode) {
    isGalleryDragging = true;
    lastGalleryPointerX = event.clientX;
    galleryDragDistance = 0;
    galleryVelocity = 0;
    canvas.style.cursor = "grabbing";
    return;
  }

  isDragging = false;
  canvas.style.cursor = "grabbing";
});

canvas.addEventListener("pointerup", (event) => {
  updatePointer(event.clientX, event.clientY);

  if (galleryMode) {
    isGalleryDragging = false;
    canvas.style.cursor = "grab";

    if (galleryDragDistance < 8) {
      const hit = pickEnvelope();
      if (hit) {
        const index = hit.userData.envelopeIndex as number;
        openLightbox(index);
      }
    }
    return;
  }

  const hit = pickFace();

  if (!isDragging && hit) {
    const nextId = hit.userData.faceId as string;
    if (nextId === "gallery") {
      enterGallery();
    } else {
      setActiveFace(activeId === nextId ? null : nextId);
    }
  }

  canvas.style.cursor = hoveredId ? "pointer" : "grab";
});

controls.addEventListener("start", () => {
  if (!galleryMode) {
    isDragging = true;
  }
});

controls.addEventListener("end", () => {
  isDragging = false;
});

galleryBack.addEventListener("click", exitGallery);
lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

setActiveFace("about");

const clock = new THREE.Clock();

function tick(): void {
  const elapsed = clock.getElapsedTime();
  const pulse = (Math.sin(elapsed * 1.6) + 1) * 0.5;

  if (!galleryMode || origamiGroup.visible) {
    floatGroup.position.y = Math.sin(elapsed * 2.1) * 0.06;
    coreMaterial.emissiveIntensity = 0.004 + pulse * 0.006;
    coreMesh.rotation.y = elapsed * 0.1;
    coreMesh.rotation.x = Math.sin(elapsed * 0.35) * 0.08;

    decorativeShards.forEach((shard) => {
      const outlineMaterial = shard.outline.material as THREE.LineBasicMaterial;
      shard.mesh.position.copy(shard.basePosition);
      shard.outline.position.copy(shard.basePosition);
      shard.crease.position.copy(shard.basePosition);
      const drift = Math.sin(elapsed * 1.2 + shard.phase) * shard.drift;
      shard.mesh.position.addScaledVector(shard.basePosition.clone().normalize(), drift);
      shard.outline.position.copy(shard.mesh.position);
      shard.crease.position.copy(shard.mesh.position);
      shard.mesh.rotation.z += 0.0015;
      shard.mesh.rotation.x = Math.sin(elapsed * 0.8 + shard.phase) * 0.18;
      shard.outline.quaternion.copy(shard.mesh.quaternion);
      shard.crease.quaternion.copy(shard.mesh.quaternion);
      outlineMaterial.opacity = 0.24 + (Math.sin(elapsed * 1.4 + shard.phase) + 1) * 0.16;
    });

    faceFrames.forEach((runtime) => {
      const isHovered = runtime.data.id === hoveredId;
      const isActive = runtime.data.id === activeId;
      const glowStrength = isActive ? 1 : isHovered ? 0.74 : 0.36;
      const targetZ = isActive ? 0.28 : isHovered ? 0.12 : 0;
      const faceOutlineMaterial = runtime.faceOutline.material as THREE.LineBasicMaterial;
      const panelOutlineMaterial = runtime.panelOutline.material as THREE.LineBasicMaterial;
      runtime.faceMesh.position.z += (targetZ - runtime.faceMesh.position.z) * 0.12;
      faceOutlineMaterial.opacity = 0.4 + glowStrength * 0.55;
      panelOutlineMaterial.opacity = 0.22 + glowStrength * 0.35;
      runtime.faceMesh.rotation.z = Math.sin(elapsed * 1.1 + runtime.pulseOffset) * 0.015;
      runtime.faceMesh.scale.setScalar(1 + (isHovered ? 0.03 : 0));
    });
  }

  if (galleryMode || galleryGroup.visible) {
    galleryRotation += galleryVelocity;
    galleryVelocity *= 0.94;

    const snapSpeed = 0.04;
    const segment = (Math.PI * 2) / envelopes.length;
    const nearest = Math.round(galleryRotation / segment) * segment;
    if (Math.abs(galleryVelocity) < 0.002) {
      galleryRotation += (nearest - galleryRotation) * snapSpeed;
    }

    galleryGroup.position.y = Math.sin(elapsed * 1.2) * 0.08;

    envelopes.forEach((envelope, index) => {
      const angle = envelope.baseAngle + galleryRotation;
      const radius = 3.1;
      envelope.group.position.x = Math.sin(angle) * radius;
      envelope.group.position.z = Math.cos(angle) * radius;
      envelope.group.rotation.y = -angle;

      const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const frontDelta = normalizedAngle > Math.PI
        ? Math.PI * 2 - normalizedAngle
        : normalizedAngle;
      const frontFactor = 1 - Math.min(frontDelta / 1.2, 1);
      const targetScale = 1 + frontFactor * 0.18;
      envelope.group.scale.setScalar(
        envelope.group.scale.x + (targetScale - envelope.group.scale.x) * 0.08
      );

      const isHovered = hoveredEnvelopeIndex === index;
      const isOpened = openedEnvelopeIndex === index;
      const targetFlapRot = isHovered || isOpened ? -Math.PI * 0.75 : 0;
      envelope.flap.rotation.x += (targetFlapRot - envelope.flap.rotation.x) * 0.1;

      const photoMaterial = envelope.photo.material as THREE.MeshBasicMaterial;
      photoMaterial.opacity = 0.85 + frontFactor * 0.15;
    });
  }

  positionCard();
  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
}

tick();

function createFaceRuntime(data: FaceData, normal: THREE.Vector3, index: number): FaceRuntime {
  const pivot = new THREE.Group();
  const basePosition = normal.clone().multiplyScalar(1.78);
  pivot.position.copy(basePosition);
  pivot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);

  const faceMesh = new THREE.Mesh(faceGeometry, buildPaperMaterial(data.shortLabel));
  faceMesh.userData.faceId = data.id;
  faceMesh.rotation.z = data.angle;
  pivot.add(faceMesh);

  const faceOutline = new THREE.LineSegments(
    new THREE.EdgesGeometry(faceGeometry),
    new THREE.LineBasicMaterial({
      color: "#c49b74",
      transparent: true,
      opacity: 0.72
    })
  );
  faceOutline.scale.setScalar(1.005);
  faceMesh.add(faceOutline);

  const faceCrease = new THREE.LineSegments(
    new THREE.WireframeGeometry(faceGeometry),
    new THREE.LineBasicMaterial({
      color: "#b38863",
      transparent: true,
      opacity: 0.32
    })
  );
  faceCrease.scale.setScalar(0.99);
  faceMesh.add(faceCrease);

  const panelHinge = new THREE.Group();
  panelHinge.position.set(0, 0.44, -0.04);
  panelHinge.rotation.x = -Math.PI * 0.98;
  panelHinge.rotation.z = data.angle * 0.12;
  pivot.add(panelHinge);

  const panelShape = createPanelGeometry(1.7, 2.0, 0.12);
  const panelMesh = new THREE.Mesh(panelShape, panelMaterial.clone());
  panelMesh.position.set(0, -1.06, 0);
  panelMesh.rotation.z = data.angle * -0.06;
  panelMesh.rotation.x = 0.04;
  panelHinge.add(panelMesh);

  const panelOutline = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(extractRoundedRectPoints(0.8, 0.96, 0.12)),
    new THREE.LineBasicMaterial({
      color: data.accent,
      transparent: true,
      opacity: 0.35
    })
  );
  panelOutline.position.copy(panelMesh.position);
  panelHinge.add(panelOutline);

  const panelFold = new THREE.LineSegments(
    new THREE.EdgesGeometry(panelShape),
    new THREE.LineBasicMaterial({
      color: "#e1c2a9",
      transparent: true,
      opacity: 0.36
    })
  );
  panelFold.position.copy(panelMesh.position);
  panelFold.rotation.copy(panelMesh.rotation);
  panelHinge.add(panelFold);

  const panelAnchor = new THREE.Object3D();
  panelAnchor.position.set(0, -0.96, 0.04);
  panelMesh.add(panelAnchor);

  return {
    data,
    pivot,
    faceMesh,
    faceOutline,
    panelHinge,
    panelMesh,
    panelOutline,
    panelAnchor,
    basePosition,
    normal,
    pulseOffset: index * 0.7
  };
}

function createDecorativeShard(normal: THREE.Vector3, index: number): DecorativeShard {
  const type = index % 4;
  let shardGeometry: THREE.BufferGeometry;
  const size = 0.28 + (index % 3) * 0.05;

  if (type === 0) {
    shardGeometry = new THREE.TetrahedronGeometry(size * 1.1, 0);
  } else if (type === 1) {
    shardGeometry = new THREE.ConeGeometry(size, size * 1.6, 4, 1);
  } else if (type === 2) {
    shardGeometry = new THREE.OctahedronGeometry(size * 0.9, 0);
  } else {
    shardGeometry = new THREE.ConeGeometry(size * 0.85, size * 1.4, 3, 1);
  }

  const shardMaterial = paperMaterial.clone();
  shardMaterial.color = new THREE.Color(index % 2 === 0 ? "#d7b38e" : "#caa57f");
  shardMaterial.emissive = new THREE.Color("#bc936d");
  shardMaterial.emissiveIntensity = 0.015;
  shardMaterial.flatShading = true;

  const mesh = new THREE.Mesh(shardGeometry, shardMaterial);
  const basePosition = normal.clone().multiplyScalar(2.55 + (index % 3) * 0.22);
  mesh.position.copy(basePosition);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  mesh.rotation.z = index * 0.62;

  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(shardGeometry),
    new THREE.LineBasicMaterial({
      color: "#c49b74",
      transparent: true,
      opacity: 0.55
    })
  );
  outline.position.copy(basePosition);
  outline.quaternion.copy(mesh.quaternion);
  outline.rotation.z = mesh.rotation.z;

  const crease = new THREE.LineSegments(
    new THREE.WireframeGeometry(shardGeometry),
    new THREE.LineBasicMaterial({
      color: "#b38863",
      transparent: true,
      opacity: 0.22
    })
  );
  crease.position.copy(basePosition);
  crease.quaternion.copy(mesh.quaternion);
  crease.rotation.z = mesh.rotation.z;
  crease.scale.setScalar(0.99);

  return {
    mesh,
    outline,
    crease,
    basePosition,
    phase: index * 0.78,
    drift: 0.04 + (index % 3) * 0.01
  };
}

function createEnvelope(photoUrl: string, index: number): EnvelopeRuntime {
  const group = new THREE.Group();
  const baseAngle = index * (Math.PI / 2);

  const width = 1.5;
  const height = 1.0;
  const depth = 0.12;

  const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
  const body = new THREE.Mesh(bodyGeometry, paperMaterial.clone());
  body.userData.envelopeIndex = index;
  group.add(body);

  const photoTexture = textureLoader.load(photoUrl);
  photoTexture.colorSpace = THREE.SRGBColorSpace;
  photoTexture.minFilter = THREE.LinearFilter;
  photoTexture.magFilter = THREE.LinearFilter;

  const photoGeometry = new THREE.PlaneGeometry(width * 0.82, height * 0.64);
  const photoMaterial = new THREE.MeshBasicMaterial({
    map: photoTexture,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide
  });
  const photo = new THREE.Mesh(photoGeometry, photoMaterial);
  photo.position.set(0, -0.04, depth / 2 + 0.01);
  photo.userData.envelopeIndex = index;
  group.add(photo);

  const flapShape = new THREE.Shape();
  flapShape.moveTo(-width / 2, 0);
  flapShape.lineTo(width / 2, 0);
  flapShape.lineTo(0, height * 0.55);
  flapShape.lineTo(-width / 2, 0);
  const flapGeometry = new THREE.ShapeGeometry(flapShape);
  const flap = new THREE.Mesh(flapGeometry, paperMaterial.clone());
  flap.position.set(0, height / 2, depth / 2 + 0.015);
  flap.userData.envelopeIndex = index;
  group.add(flap);

  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(bodyGeometry),
    new THREE.LineBasicMaterial({
      color: "#b88a64",
      transparent: true,
      opacity: 0.7
    })
  );
  group.add(outline);

  const crease = new THREE.LineSegments(
    new THREE.WireframeGeometry(bodyGeometry),
    new THREE.LineBasicMaterial({
      color: "#a67c52",
      transparent: true,
      opacity: 0.28
    })
  );
  crease.scale.setScalar(0.99);
  group.add(crease);

  const flapOutline = new THREE.LineSegments(
    new THREE.EdgesGeometry(flapGeometry),
    new THREE.LineBasicMaterial({
      color: "#b88a64",
      transparent: true,
      opacity: 0.7
    })
  );
  flap.add(flapOutline);

  return {
    group,
    body,
    photo,
    flap,
    outline,
    crease,
    photoUrl,
    index,
    baseAngle
  };
}

function generateEvenSphereNormals(count: number, offset: number): THREE.Vector3[] {
  const vectors: THREE.Vector3[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / (count - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = phi * i + offset;
    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;
    vectors.push(new THREE.Vector3(x, y, z).normalize());
  }

  return vectors;
}

function createOrigamiCrystalGeometry(radius: number, height: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const r = radius;
  const depth = height * 0.6;

  const vertices = new Float32Array([
    // Front face (two triangles) - carries the label
    -r, -r, 0,   r, -r, 0,   r,  r, 0,
    -r, -r, 0,   r,  r, 0,  -r,  r, 0,
    // Side faces (front edge to apex)
    -r, -r, 0,  -r,  r, 0,   0,  0, -depth,
    -r,  r, 0,   r,  r, 0,   0,  0, -depth,
     r,  r, 0,   r, -r, 0,   0,  0, -depth,
     r, -r, 0,  -r, -r, 0,   0,  0, -depth
  ]);

  const uvs = new Float32Array([
    // Front face UVs
    0, 0,   1, 0,   1, 1,
    0, 0,   1, 1,   0, 1,
    // Side face UVs
    0, 0,   1, 0,   0.5, 1,
    0, 0,   1, 0,   0.5, 1,
    0, 0,   1, 0,   0.5, 1,
    0, 0,   1, 0,   0.5, 1
  ]);

  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  return geometry;
}

function createPanelGeometry(width: number, height: number, radius: number): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2 + radius, height / 2);
  shape.lineTo(width / 2 - radius, height / 2);
  shape.quadraticCurveTo(width / 2, height / 2, width / 2, height / 2 - radius);
  shape.lineTo(width / 2, -height / 2 + radius);
  shape.quadraticCurveTo(width / 2, -height / 2, width / 2 - radius, -height / 2);
  shape.lineTo(-width / 2 + radius, -height / 2);
  shape.quadraticCurveTo(-width / 2, -height / 2, -width / 2, -height / 2 + radius);
  shape.lineTo(-width / 2, height / 2 - radius);
  shape.quadraticCurveTo(-width / 2, height / 2, -width / 2 + radius, height / 2);
  return new THREE.ShapeGeometry(shape, 28);
}

function extractRoundedRectPoints(halfWidth: number, halfHeight: number, radius: number): THREE.Vector3[] {
  const pts = [
    [-halfWidth + radius, halfHeight],
    [halfWidth - radius, halfHeight],
    [halfWidth, halfHeight - radius],
    [halfWidth, -halfHeight + radius],
    [halfWidth - radius, -halfHeight],
    [-halfWidth + radius, -halfHeight],
    [-halfWidth, -halfHeight + radius],
    [-halfWidth, halfHeight - radius]
  ];
  return pts.map(([x, y]) => new THREE.Vector3(x, y, 0.02));
}

function buildPaperMaterial(label: string): THREE.MeshStandardMaterial {
  const texture = new THREE.CanvasTexture(createFaceLabelCanvas(label));
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.colorSpace = THREE.SRGBColorSpace;

  const material = paperMaterial.clone();
  material.map = texture;
  material.emissive = new THREE.Color("#c29672");
  material.emissiveIntensity = 0.008;
  material.transparent = true;
  material.flatShading = true;
  return material;
}

function createKraftPaperCanvas(): HTMLCanvasElement {
  const canvasElement = document.createElement("canvas");
  canvasElement.width = 1024;
  canvasElement.height = 1024;
  const context = canvasElement.getContext("2d");

  if (!context) {
    return canvasElement;
  }

  const gradient = context.createLinearGradient(0, 0, 1024, 1024);
  gradient.addColorStop(0, "#d7b089");
  gradient.addColorStop(0.5, "#c79d73");
  gradient.addColorStop(1, "#b98963");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1024, 1024);

  for (let index = 0; index < 2400; index += 1) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const width = 6 + Math.random() * 22;
    const height = 0.5 + Math.random() * 1.4;
    const alpha = 0.018 + Math.random() * 0.05;
    context.save();
    context.translate(x, y);
    context.rotate((Math.random() - 0.5) * 0.9);
    context.fillStyle = `rgba(92, 58, 34, ${alpha})`;
    context.fillRect(-width / 2, -height / 2, width, height);
    context.restore();
  }

  for (let index = 0; index < 260; index += 1) {
    const startX = Math.random() * 1024;
    const startY = Math.random() * 1024;
    const length = 28 + Math.random() * 92;
    const bend = (Math.random() - 0.5) * 26;
    const alpha = 0.014 + Math.random() * 0.026;
    context.strokeStyle = `rgba(72, 46, 26, ${alpha})`;
    context.lineWidth = 0.7 + Math.random() * 1.3;
    context.beginPath();
    context.moveTo(startX, startY);
    context.quadraticCurveTo(
      startX + length * 0.45,
      startY + bend,
      startX + length,
      startY + bend * 0.3
    );
    context.stroke();
  }

  for (let index = 0; index < 1100; index += 1) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const radius = 0.8 + Math.random() * 2.4;
    const alpha = 0.02 + Math.random() * 0.04;
    context.fillStyle = `rgba(255, 244, 225, ${alpha})`;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  const edgeShade = context.createRadialGradient(512, 512, 220, 512, 512, 680);
  edgeShade.addColorStop(0, "rgba(255,255,255,0)");
  edgeShade.addColorStop(1, "rgba(92,58,34,0.24)");
  context.fillStyle = edgeShade;
  context.fillRect(0, 0, 1024, 1024);

  return canvasElement;
}

function createPaperReliefCanvas(): HTMLCanvasElement {
  const canvasElement = document.createElement("canvas");
  canvasElement.width = 1024;
  canvasElement.height = 1024;
  const context = canvasElement.getContext("2d");

  if (!context) {
    return canvasElement;
  }

  context.fillStyle = "rgb(128,128,128)";
  context.fillRect(0, 0, 1024, 1024);

  const gradient = context.createLinearGradient(0, 0, 1024, 1024);
  gradient.addColorStop(0, "rgb(148,148,148)");
  gradient.addColorStop(1, "rgb(108,108,108)");
  context.strokeStyle = gradient;
  context.lineWidth = 4;

  const wrinkleLines = [
    [120, 180, 840, 760],
    [180, 820, 920, 220],
    [90, 470, 980, 610],
    [310, 70, 520, 970],
    [680, 90, 350, 980]
  ];

  wrinkleLines.forEach(([x1, y1, x2, y2], index) => {
    context.beginPath();
    context.moveTo(x1, y1);
    context.quadraticCurveTo(
      (x1 + x2) / 2 + (index % 2 === 0 ? 60 : -70),
      (y1 + y2) / 2 + (index % 2 === 0 ? -35 : 55),
      x2,
      y2
    );
    context.stroke();
  });

  context.strokeStyle = "rgba(88,88,88,0.28)";
  context.lineWidth = 1.2;
  for (let index = 0; index < 22; index += 1) {
    const x = 60 + Math.random() * 900;
    const y = 60 + Math.random() * 900;
    const length = 120 + Math.random() * 240;
    const bend = (Math.random() - 0.5) * 90;
    context.beginPath();
    context.moveTo(x, y);
    context.quadraticCurveTo(x + length * 0.5, y + bend, x + length, y + bend * 0.45);
    context.stroke();
  }

  for (let index = 0; index < 3200; index += 1) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const alpha = 0.012 + Math.random() * 0.03;
    const shade = 112 + Math.floor(Math.random() * 40);
    context.fillStyle = `rgba(${shade},${shade},${shade},${alpha})`;
    context.fillRect(x, y, 1.5 + Math.random() * 2.5, 1.5 + Math.random() * 2.5);
  }

  for (let index = 0; index < 120; index += 1) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const width = 40 + Math.random() * 120;
    const alpha = 0.015 + Math.random() * 0.03;
    context.save();
    context.translate(x, y);
    context.rotate((Math.random() - 0.5) * 1.2);
    context.fillStyle = `rgba(255,255,255,${alpha})`;
    context.fillRect(-width / 2, -1.2, width, 2.4);
    context.restore();
  }

  return canvasElement;
}

function createFaceLabelCanvas(label: string): HTMLCanvasElement {
  const canvasElement = document.createElement("canvas");
  canvasElement.width = 512;
  canvasElement.height = 512;
  const context = canvasElement.getContext("2d");

  if (!context) {
    return canvasElement;
  }

  const baseTexture = createKraftPaperCanvas();
  context.drawImage(baseTexture, 0, 0, 512, 512);

  const veil = context.createLinearGradient(0, 0, 512, 512);
  veil.addColorStop(0, "rgba(255,250,239,0.1)");
  veil.addColorStop(1, "rgba(91,62,38,0.08)");
  context.fillStyle = veil;
  context.fillRect(0, 0, 512, 512);

  context.strokeStyle = "rgba(111,74,45,0.34)";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(110, 160);
  context.lineTo(402, 352);
  context.stroke();

  context.font = "500 28px STSong, 'Songti SC', 'SimSun', serif";
  context.fillStyle = "#6d4a2f";
  context.textAlign = "center";
  context.fillText("Selena Yuan", 256, 190);

  context.font = "600 54px STSong, 'Songti SC', 'SimSun', serif";
  context.fillStyle = "#402b1a";
  context.fillText(label, 256, 278);

  context.font = "400 18px 'Snell Roundhand', 'Apple Chancery', cursive";
  context.fillStyle = "#8d6443";
  context.fillText("CLICK TO UNFOLD", 256, 336);

  return canvasElement;
}

function updatePointer(clientX: number, clientY: number): void {
  pointer.x = (clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(clientY / window.innerHeight) * 2 + 1;
}

function pickFace(): THREE.Object3D | null {
  raycaster.setFromCamera(pointer, camera);
  const intersections = raycaster.intersectObjects(clickableMeshes, false);
  return intersections[0]?.object ?? null;
}

function pickEnvelope(): THREE.Object3D | null {
  raycaster.setFromCamera(pointer, camera);
  const intersections = raycaster.intersectObjects(envelopeClickables, false);
  const hit = intersections[0]?.object ?? null;

  if (hit) {
    hoveredEnvelopeIndex = hit.userData.envelopeIndex as number;
  } else {
    hoveredEnvelopeIndex = null;
  }

  return hit;
}

function setActiveFace(id: string | null): void {
  activeId = id;

  faceFrames.forEach((runtime) => {
    const isActive = runtime.data.id === id;
    const positionTarget = isActive
      ? runtime.basePosition.clone().add(runtime.normal.clone().multiplyScalar(0.32))
      : runtime.basePosition;

    gsap.to(runtime.pivot.position, {
      x: positionTarget.x,
      y: positionTarget.y,
      z: positionTarget.z,
      duration: 0.6,
      ease: "power2.inOut"
    });

    gsap.to(runtime.panelHinge.rotation, {
      x: isActive ? -0.14 : -Math.PI * 0.98,
      z: isActive ? runtime.data.angle * 0.08 : runtime.data.angle * 0.18,
      duration: 0.6,
      ease: "power2.inOut"
    });

    gsap.to(runtime.panelMesh.material as THREE.MeshStandardMaterial, {
      opacity: isActive ? 1 : 0.94,
      duration: 0.4,
      ease: "sine.out"
    });

    gsap.to(runtime.faceMesh.material as THREE.MeshStandardMaterial, {
      emissiveIntensity: isActive ? 0.14 : 0.06,
      duration: 0.45,
      ease: "sine.out"
    });
  });

  const content = faceFrames.find((runtime) => runtime.data.id === id)?.data ?? null;

  if (!content) {
    activeCard.classList.remove("visible");
    activeCard.innerHTML = "";
    return;
  }

  activeCard.innerHTML = `
    <div class="card-shell">
      <p class="card-eyebrow">${content.eyebrow}</p>
      <h3>${content.title}</h3>
      <p class="card-subtitle type-target">${content.subtitle}</p>
      <div class="card-body">${content.html}</div>
    </div>
  `;

  activeCard.classList.add("visible");

  activeCard.querySelectorAll<HTMLElement>(".panel-block, .panel-grid, .tag-row, .stats-row, .timeline, .panel-list").forEach((item, index) => {
    item.style.animationDelay = `${index * 80}ms`;
  });

  runTypewriterAnimation();
}

function positionCard(): void {
  if (!activeCard.classList.contains("visible")) {
    return;
  }

  activeCard.style.setProperty("--card-scale", "1");
}

function runTypewriterAnimation(): void {
  const textTargets = activeCard.querySelectorAll<HTMLElement>(".type-target, .panel-quote, .panel-text, .panel-list p");

  textTargets.forEach((element, index) => {
    if (element.querySelector("*")) {
      return;
    }

    const fullText = element.textContent?.replace(/\s+/g, " ").trim();

    if (!fullText) {
      return;
    }

    element.classList.add("is-typing");
    element.textContent = "";

    const state = { count: 0 };
    gsap.to(state, {
      count: fullText.length,
      duration: Math.min(2.8, Math.max(0.9, fullText.length * 0.045)),
      delay: 0.12 + index * 0.12,
      ease: "none",
      snap: "count",
      onUpdate: () => {
        element.textContent = fullText.slice(0, state.count);
      },
      onComplete: () => {
        element.classList.remove("is-typing");
      }
    });
  });
}
