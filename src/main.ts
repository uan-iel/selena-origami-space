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

type InfoEnvelopeRuntime = {
  data: FaceData;
  group: THREE.Group;
  body: THREE.Mesh;
  flap: THREE.Mesh;
  label: THREE.Mesh;
  outline: THREE.LineSegments;
  crease: THREE.LineSegments;
  basePosition: THREE.Vector3;
  baseRotation: THREE.Euler;
  hoverT: number;
  openT: number;
};

type PhotoEnvelopeRuntime = {
  group: THREE.Group;
  body: THREE.Mesh;
  photo: THREE.Mesh;
  flap: THREE.Mesh;
  outline: THREE.LineSegments;
  crease: THREE.LineSegments;
  photoUrl: string;
  index: number;
  baseAngle: number;
  depth: number;
};

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found");
}

app.innerHTML = `
  <main class="page-shell">
    <div class="grain"></div>
    <div class="hero-copy" id="heroCopy">
      <p class="eyebrow">Origami · 3D Interactive Portrait</p>
      <h1>Selena Yuan</h1>
      <div class="hint-row">
        <span>拖拽旋转</span>
        <span>点击信封</span>
        <span>展开信息</span>
      </div>
    </div>
    <section class="scene-frame">
      <div class="canvas-wrap">
        <canvas class="webgl"></canvas>
        <div class="card-layer"></div>
      </div>
    </section>
    <aside class="ambient-note" id="ambientNote">
      <p>Paper cranes, sealed letters, and a story still unfolding.</p>
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
    eyebrow: "Envelope 01",
    title: "关于我",
    shortLabel: "关于我",
    subtitle: "一个热爱尝试、永远好奇的 ENFP 女孩",
    angle: 0,
    accent: "#c9a88c",
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
    eyebrow: "Envelope 02",
    title: "性格与热爱",
    shortLabel: "热爱",
    subtitle: "擅长连接人、内容和新工具的表达者",
    angle: 0,
    accent: "#d7b79f",
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
    eyebrow: "Envelope 03",
    title: "实践轨迹",
    shortLabel: "实践",
    subtitle: "在内容、社群、采访与协同中积累真实能力",
    angle: 0,
    accent: "#c59a78",
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
    eyebrow: "Envelope 04",
    title: "未来方向",
    shortLabel: "未来",
    subtitle: "成为懂用户、懂技术、懂商业的产品人",
    angle: 0,
    accent: "#b78a68",
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
    eyebrow: "Envelope 05",
    title: "你想看看我吗！",
    shortLabel: "看看我",
    subtitle: "四封信，四张瞬间，等你来拆开",
    angle: 0,
    accent: "#d4a574",
    html: `
      <section class="panel-block">
        <p class="panel-kicker">Photo Gallery</p>
        <h2>你想看看我吗！</h2>
        <p class="panel-quote">四封信，四张瞬间，等你来拆开。</p>
      </section>
      <section class="panel-block">
        <p class="panel-mini-title">玩法</p>
        <p class="panel-text">点击下方的按钮进入照片信封空间，左右拖拽旋转，把任一信封移到最前，点击即可打开照片。</p>
      </section>
      <section class="panel-block gallery-enter-block">
        <button class="gallery-enter" data-enter-gallery>进入照片空间</button>
      </section>
    `
  },
  {
    id: "contact",
    eyebrow: "Envelope 06",
    title: "联系我",
    shortLabel: "联系",
    subtitle: "期待一起做出有温度的好产品",
    angle: 0,
    accent: "#c9a88c",
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
scene.background = new THREE.Color("#f7f4ef");
scene.fog = new THREE.Fog("#f7f4ef", 10, 22);

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

const camera = new THREE.PerspectiveCamera(42, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 0.4, 9.5);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(sizes.width, sizes.height);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = false;
controls.minPolarAngle = 0.05;
controls.maxPolarAngle = Math.PI - 0.05;
controls.rotateSpeed = 0.75;
controls.dampingFactor = 0.06;
controls.target.set(0, 0, 0);
controls.update();

const ambientLight = new THREE.HemisphereLight("#fffdfb", "#e8ddd0", 1.35);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight("#fff8f0", 2.2);
keyLight.position.set(5, 8, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 1024;
keyLight.shadow.mapSize.height = 1024;
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 25;
keyLight.shadow.bias = -0.0005;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight("#f0e6d8", 1.4);
rimLight.position.set(-6, 2, -5);
scene.add(rimLight);

const fillLight = new THREE.DirectionalLight("#f5efe6", 0.9);
fillLight.position.set(-3, -2, 7);
scene.add(fillLight);

const paperTexture = new THREE.CanvasTexture(createPaperCanvas());
paperTexture.wrapS = THREE.RepeatWrapping;
paperTexture.wrapT = THREE.RepeatWrapping;
paperTexture.repeat.set(2, 2);
paperTexture.colorSpace = THREE.SRGBColorSpace;

const paperBumpTexture = new THREE.CanvasTexture(createPaperBumpCanvas());
paperBumpTexture.wrapS = THREE.RepeatWrapping;
paperBumpTexture.wrapT = THREE.RepeatWrapping;
paperBumpTexture.repeat.set(3, 3);
paperBumpTexture.colorSpace = THREE.NoColorSpace;

const paperMaterial = new THREE.MeshStandardMaterial({
  color: "#faf8f4",
  roughness: 0.92,
  metalness: 0,
  side: THREE.DoubleSide,
  map: paperTexture,
  bumpMap: paperBumpTexture,
  bumpScale: 0.04
});

const envelopeInsideMaterial = new THREE.MeshStandardMaterial({
  color: "#f2ede4",
  roughness: 0.95,
  metalness: 0,
  side: THREE.DoubleSide,
  map: paperTexture,
  bumpMap: paperBumpTexture,
  bumpScale: 0.03
});

const threadMaterial = new THREE.MeshStandardMaterial({
  color: "#e8ddd0",
  roughness: 1,
  metalness: 0
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const mainGroup = new THREE.Group();
scene.add(mainGroup);

const craneGroup = createPaperCrane();
craneGroup.position.set(0, 0, 0);
mainGroup.add(craneGroup);

const infoEnvelopes: InfoEnvelopeRuntime[] = [];
const infoEnvelopeClickables: THREE.Object3D[] = [];

const envelopePositions = [
  new THREE.Vector3(2.6, 0.6, 1.1),
  new THREE.Vector3(-2.3, -0.4, 1.4),
  new THREE.Vector3(1.2, 1.4, -2.0),
  new THREE.Vector3(-1.6, 1.0, -1.8),
  new THREE.Vector3(0.4, -1.5, 2.2),
  new THREE.Vector3(-0.8, -1.2, -2.4)
];

faces.forEach((face, index) => {
  const runtime = createInfoEnvelope(face, index);
  const position = envelopePositions[index];
  runtime.group.position.copy(position);
  runtime.basePosition.copy(position);

  const lookTarget = position.clone().multiplyScalar(0.3).add(new THREE.Vector3(0, 0, 0));
  runtime.group.lookAt(lookTarget);
  runtime.baseRotation.copy(runtime.group.rotation);

  infoEnvelopes.push(runtime);
  infoEnvelopeClickables.push(runtime.body, runtime.flap);
  mainGroup.add(runtime.group);
});

const galleryGroup = new THREE.Group();
galleryGroup.visible = false;
scene.add(galleryGroup);

const galleryLight = new THREE.HemisphereLight("#fffdfb", "#e8ddd0", 1.3);
galleryGroup.add(galleryLight);

const galleryKeyLight = new THREE.DirectionalLight("#fff8f0", 1.7);
galleryKeyLight.position.set(3, 5, 6);
galleryGroup.add(galleryKeyLight);

const galleryRimLight = new THREE.DirectionalLight("#f0e6d8", 1.5);
galleryRimLight.position.set(-4, 2, -4);
galleryGroup.add(galleryRimLight);

const textureLoader = new THREE.TextureLoader();

const photoEnvelopes: PhotoEnvelopeRuntime[] = [];
const photoEnvelopeClickables: THREE.Object3D[] = [];

PHOTO_URLS.forEach((url, index) => {
  const envelope = createPhotoEnvelope(url, index);
  photoEnvelopes.push(envelope);
  photoEnvelopeClickables.push(envelope.body, envelope.photo, envelope.flap);
  galleryGroup.add(envelope.group);
});

let activeId: string | null = null;
let isDragging = false;
let galleryMode = false;
let galleryRotation = 0;
let galleryVelocity = 0;
let isGalleryDragging = false;
let lastGalleryPointerX = 0;
let galleryDragDistance = 0;
let hoveredPhotoIndex: number | null = null;
let openedPhotoIndex: number | null = null;
let activePointerId: number | null = null;
let hoveredInfoId: string | null = null;

function enterGallery(): void {
  galleryMode = true;
  galleryRotation = 0;
  galleryVelocity = 0;
  controls.enabled = false;

  gsap.to(camera.position, {
    x: 0,
    y: 0.4,
    z: 7.5,
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

  gsap.to(mainGroup.scale, {
    x: 0.001,
    y: 0.001,
    z: 0.001,
    duration: 0.7,
    ease: "power2.in"
  });

  setTimeout(() => {
    mainGroup.visible = false;
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
    mainGroup.visible = true;
    gsap.to(mainGroup.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.8,
      ease: "back.out(1.2)"
    });
  }, 450);

  gsap.to(camera.position, {
    x: 0,
    y: 0.4,
    z: 9.5,
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

  heroCopy!.classList.remove("hidden");
  ambientNote!.classList.remove("hidden");
  galleryView!.classList.remove("visible");

  setActiveFace(null);
}

function openLightbox(index: number): void {
  openedPhotoIndex = index;
  lightboxImg!.src = PHOTO_URLS[index];
  lightbox!.classList.add("visible");
}

function closeLightbox(): void {
  lightbox!.classList.remove("visible");
  openedPhotoIndex = null;
}

function updatePointer(clientX: number, clientY: number): void {
  pointer.x = (clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(clientY / window.innerHeight) * 2 + 1;
}

function pickInfoEnvelope(): THREE.Object3D | null {
  raycaster.setFromCamera(pointer, camera);
  const intersections = raycaster.intersectObjects(infoEnvelopeClickables, false);
  const hit = intersections[0]?.object ?? null;

  if (hit) {
    hoveredInfoId = hit.userData.faceId as string;
  } else {
    hoveredInfoId = null;
  }

  return hit;
}

function pickPhotoEnvelope(): THREE.Object3D | null {
  raycaster.setFromCamera(pointer, camera);
  const intersections = raycaster.intersectObjects(photoEnvelopeClickables, false);
  const hit = intersections[0]?.object ?? null;

  if (hit) {
    hoveredPhotoIndex = hit.userData.envelopeIndex as number;
  } else {
    hoveredPhotoIndex = null;
  }

  return hit;
}

function setActiveFace(id: string | null): void {
  activeId = id;

  infoEnvelopes.forEach((runtime) => {
    const isActive = runtime.data.id === id;
    const targetOpen = isActive ? 1 : 0;

    gsap.to(runtime, {
      openT: targetOpen,
      duration: 0.55,
      ease: "power2.out"
    });

    const base = runtime.basePosition;
    const pushTarget = base.clone().add(base.clone().normalize().multiplyScalar(isActive ? 0.5 : 0));
    gsap.to(runtime.group.position, {
      x: pushTarget.x,
      y: pushTarget.y,
      z: pushTarget.z,
      duration: 0.55,
      ease: "power2.out"
    });
  });

  const content = faces.find((face) => face.id === id) ?? null;

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

  const enterButton = activeCard.querySelector<HTMLButtonElement>("[data-enter-gallery]");
  if (enterButton) {
    enterButton.addEventListener("click", () => {
      enterGallery();
    });
  }

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

canvas.addEventListener("pointermove", (event) => {
  updatePointer(event.clientX, event.clientY);

  if (galleryMode && isGalleryDragging && event.pointerId === activePointerId) {
    const deltaX = event.clientX - lastGalleryPointerX;
    galleryRotation -= deltaX * 0.006;
    galleryVelocity = -deltaX * 0.006;
    lastGalleryPointerX = event.clientX;
    galleryDragDistance += Math.abs(deltaX);
    return;
  }

  if (galleryMode) {
    const hit = pickPhotoEnvelope();
    canvas.style.cursor = hit ? "pointer" : "grab";
    return;
  }

  const hit = pickInfoEnvelope();
  canvas.style.cursor = hit ? "pointer" : "grab";
});

canvas.addEventListener("pointerdown", (event) => {
  if (galleryMode) {
    isGalleryDragging = true;
    activePointerId = event.pointerId;
    hoveredPhotoIndex = null;
    lastGalleryPointerX = event.clientX;
    galleryDragDistance = 0;
    galleryVelocity = 0;
    canvas.style.cursor = "grabbing";
    canvas.setPointerCapture(event.pointerId);
    return;
  }

  isDragging = false;
  canvas.style.cursor = "grabbing";
});

canvas.addEventListener("pointerup", (event) => {
  updatePointer(event.clientX, event.clientY);

  if (galleryMode && event.pointerId === activePointerId) {
    isGalleryDragging = false;
    activePointerId = null;
    canvas.style.cursor = "grab";

    if (galleryDragDistance < 8) {
      const hit = pickPhotoEnvelope();
      if (hit) {
        const index = hit.userData.envelopeIndex as number;
        openLightbox(index);
      }
    }
    return;
  }

  if (!isDragging) {
    const hit = pickInfoEnvelope();

    if (hit) {
      const nextId = hit.userData.faceId as string;
      setActiveFace(activeId === nextId ? null : nextId);
    } else if (activeId) {
      setActiveFace(null);
    }
  }

  canvas.style.cursor = hoveredInfoId ? "pointer" : "grab";
});

window.addEventListener("pointerup", (event) => {
  if (galleryMode && isGalleryDragging && event.pointerId === activePointerId) {
    isGalleryDragging = false;
    activePointerId = null;
    canvas.style.cursor = "grab";
  }
});

window.addEventListener("pointercancel", (event) => {
  if (galleryMode && isGalleryDragging && event.pointerId === activePointerId) {
    isGalleryDragging = false;
    activePointerId = null;
    canvas.style.cursor = "grab";
  }
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

const clock = new THREE.Clock();

function tick(): void {
  const elapsed = clock.getElapsedTime();
  const floatY = Math.sin(elapsed * 0.8) * 0.04;

  if (!galleryMode || mainGroup.visible) {
    craneGroup.position.y = floatY;
    craneGroup.rotation.y = Math.sin(elapsed * 0.15) * 0.08;
    craneGroup.rotation.z = Math.sin(elapsed * 0.12) * 0.03;

    infoEnvelopes.forEach((runtime, index) => {
      const phase = index * 1.2;
      const individualFloat = Math.sin(elapsed * 0.9 + phase) * 0.035;
      const targetY = runtime.basePosition.y + floatY * 0.6 + individualFloat;

      runtime.group.position.y += (targetY - runtime.group.position.y) * 0.04;

      const baseRotX = runtime.baseRotation.x + Math.sin(elapsed * 0.5 + phase) * 0.03;
      const baseRotY = runtime.baseRotation.y + Math.cos(elapsed * 0.35 + phase) * 0.04;
      const baseRotZ = runtime.baseRotation.z + Math.sin(elapsed * 0.25 + phase) * 0.02;

      runtime.group.rotation.x += (baseRotX - runtime.group.rotation.x) * 0.04;
      runtime.group.rotation.y += (baseRotY - runtime.group.rotation.y) * 0.04;
      runtime.group.rotation.z += (baseRotZ - runtime.group.rotation.z) * 0.04;

      const isHovered = runtime.data.id === hoveredInfoId;
      const targetHover = isHovered ? 1 : 0;
      runtime.hoverT += (targetHover - runtime.hoverT) * 0.12;

      const flapTarget = -runtime.openT * Math.PI * 0.75 - runtime.hoverT * Math.PI * 0.25;
      runtime.flap.rotation.x += (flapTarget - runtime.flap.rotation.x) * 0.1;

      const scaleBase = 1 + runtime.hoverT * 0.04 + runtime.openT * 0.06;
      runtime.group.scale.setScalar(scaleBase);

      const labelOpacity = 0.55 + runtime.hoverT * 0.25 + runtime.openT * 0.2;
      (runtime.label.material as THREE.MeshBasicMaterial).opacity = labelOpacity;
    });
  }

  if (galleryMode || galleryGroup.visible) {
    galleryRotation += galleryVelocity;
    galleryVelocity *= 0.94;

    const snapSpeed = 0.04;
    const segment = (Math.PI * 2) / photoEnvelopes.length;
    const nearest = Math.round(galleryRotation / segment) * segment;
    if (Math.abs(galleryVelocity) < 0.002) {
      galleryRotation += (nearest - galleryRotation) * snapSpeed;
    }

    galleryGroup.position.y = Math.sin(elapsed * 1.2) * 0.08;

    photoEnvelopes.forEach((envelope, index) => {
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

      const isHovered = hoveredPhotoIndex === index;
      const isOpened = openedPhotoIndex === index;
      const isFront = frontFactor > 0.85;

      let targetFlapRot = 0;
      let targetPhotoOpacity = 0;
      let targetPhotoY = -0.12;
      let targetPhotoZ = envelope.depth / 2 + 0.01;
      let targetPhotoScale = 0.88;

      if (isOpened) {
        targetFlapRot = -Math.PI * 0.82;
        targetPhotoOpacity = 1;
        targetPhotoY = 0.2;
        targetPhotoZ = envelope.depth / 2 + 0.14;
        targetPhotoScale = 1;
      } else if (isHovered && isFront) {
        targetFlapRot = -Math.PI * 0.38;
        targetPhotoOpacity = 0.35;
        targetPhotoY = -0.04;
        targetPhotoZ = envelope.depth / 2 + 0.04;
        targetPhotoScale = 0.92;
      }

      envelope.flap.rotation.x += (targetFlapRot - envelope.flap.rotation.x) * 0.1;

      const photoMaterial = envelope.photo.material as THREE.MeshBasicMaterial;
      photoMaterial.opacity += (targetPhotoOpacity - photoMaterial.opacity) * 0.1;
      envelope.photo.position.y += (targetPhotoY - envelope.photo.position.y) * 0.1;
      envelope.photo.position.z += (targetPhotoZ - envelope.photo.position.z) * 0.1;
      const currentScale = envelope.photo.scale.x;
      const nextScale = currentScale + (targetPhotoScale - currentScale) * 0.1;
      envelope.photo.scale.setScalar(nextScale);
    });
  }

  positionCard();
  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
}

tick();

function createInfoEnvelope(data: FaceData, index: number): InfoEnvelopeRuntime {
  const group = new THREE.Group();
  group.userData.faceId = data.id;

  const width = 1.35;
  const height = 0.9;
  const depth = 0.1;

  const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
  const body = new THREE.Mesh(bodyGeometry, paperMaterial.clone());
  body.userData.faceId = data.id;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const insideGeometry = new THREE.PlaneGeometry(width * 0.9, height * 0.9);
  const inside = new THREE.Mesh(insideGeometry, envelopeInsideMaterial.clone());
  inside.position.set(0, 0, -depth / 2 - 0.001);
  group.add(inside);

  const flapShape = new THREE.Shape();
  flapShape.moveTo(-width / 2, 0);
  flapShape.lineTo(width / 2, 0);
  flapShape.lineTo(0, height * 0.55);
  flapShape.lineTo(-width / 2, 0);
  const flapGeometry = new THREE.ShapeGeometry(flapShape);
  const flap = new THREE.Mesh(flapGeometry, paperMaterial.clone());
  flap.position.set(0, height / 2, depth / 2 + 0.012);
  flap.userData.faceId = data.id;
  flap.castShadow = true;
  group.add(flap);

  const labelTexture = new THREE.CanvasTexture(createEnvelopeLabelCanvas(data.shortLabel));
  labelTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  const labelGeometry = new THREE.PlaneGeometry(width * 0.62, height * 0.28);
  const labelMaterial = new THREE.MeshBasicMaterial({
    map: labelTexture,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide
  });
  const label = new THREE.Mesh(labelGeometry, labelMaterial);
  label.position.set(0, -0.02, depth / 2 + 0.018);
  label.userData.faceId = data.id;
  group.add(label);

  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(bodyGeometry),
    new THREE.LineBasicMaterial({
      color: "#d9cfc0",
      transparent: true,
      opacity: 0.55
    })
  );
  group.add(outline);

  const crease = new THREE.LineSegments(
    new THREE.WireframeGeometry(bodyGeometry),
    new THREE.LineBasicMaterial({
      color: "#cdc2b2",
      transparent: true,
      opacity: 0.18
    })
  );
  crease.scale.setScalar(0.99);
  group.add(crease);

  const flapOutline = new THREE.LineSegments(
    new THREE.EdgesGeometry(flapGeometry),
    new THREE.LineBasicMaterial({
      color: "#d9cfc0",
      transparent: true,
      opacity: 0.55
    })
  );
  flap.add(flapOutline);

  if (index % 2 === 0) {
    const thread = createEnvelopeThread(width);
    thread.position.set(0, 0, depth / 2 + 0.025);
    group.add(thread);
  }

  return {
    data,
    group,
    body,
    flap,
    label,
    outline,
    crease,
    basePosition: new THREE.Vector3(),
    baseRotation: new THREE.Euler(),
    hoverT: 0,
    openT: 0
  };
}

function createEnvelopeThread(width: number): THREE.Group {
  const group = new THREE.Group();

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-width * 0.22, -0.08, 0),
    new THREE.Vector3(-width * 0.05, 0.04, 0.01),
    new THREE.Vector3(width * 0.05, -0.05, 0.01),
    new THREE.Vector3(width * 0.22, 0.06, 0)
  ]);

  const geometry = new THREE.TubeGeometry(curve, 24, 0.014, 6, false);
  const mesh = new THREE.Mesh(geometry, threadMaterial);
  group.add(mesh);

  const bowGeometry = new THREE.TorusGeometry(0.055, 0.012, 6, 16, Math.PI * 1.6);
  const bow = new THREE.Mesh(bowGeometry, threadMaterial);
  bow.position.set(0, 0, 0.012);
  bow.rotation.z = 0.4;
  group.add(bow);

  return group;
}

function createPhotoEnvelope(photoUrl: string, index: number): PhotoEnvelopeRuntime {
  const group = new THREE.Group();
  const baseAngle = index * (Math.PI / 2);

  const width = 1.5;
  const height = 1.0;
  const depth = 0.12;

  const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
  const body = new THREE.Mesh(bodyGeometry, paperMaterial.clone());
  body.userData.envelopeIndex = index;
  group.add(body);

  const photoTexture = textureLoader.load(photoUrl, (texture) => {
    const img = texture.image;
    if (!img || !img.width || !img.height) {
      return;
    }

    const aspect = img.width / img.height;
    const maxW = width * 0.78;
    const maxH = height * 0.78;

    let pW: number;
    let pH: number;
    if (aspect > maxW / maxH) {
      pW = maxW;
      pH = maxW / aspect;
    } else {
      pH = maxH;
      pW = maxH * aspect;
    }

    photo.geometry.dispose();
    photo.geometry = new THREE.PlaneGeometry(pW, pH);
  });
  photoTexture.colorSpace = THREE.SRGBColorSpace;
  photoTexture.minFilter = THREE.LinearFilter;
  photoTexture.magFilter = THREE.LinearFilter;

  const photoGeometry = new THREE.PlaneGeometry(width * 0.78, height * 0.78);
  const photoMaterial = new THREE.MeshBasicMaterial({
    map: photoTexture,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide
  });
  const photo = new THREE.Mesh(photoGeometry, photoMaterial);
  photo.position.set(0, -0.12, depth / 2 + 0.01);
  photo.scale.setScalar(0.88);
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
      color: "#d9cfc0",
      transparent: true,
      opacity: 0.55
    })
  );
  group.add(outline);

  const crease = new THREE.LineSegments(
    new THREE.WireframeGeometry(bodyGeometry),
    new THREE.LineBasicMaterial({
      color: "#cdc2b2",
      transparent: true,
      opacity: 0.18
    })
  );
  crease.scale.setScalar(0.99);
  group.add(crease);

  const flapOutline = new THREE.LineSegments(
    new THREE.EdgesGeometry(flapGeometry),
    new THREE.LineBasicMaterial({
      color: "#d9cfc0",
      transparent: true,
      opacity: 0.55
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
    baseAngle,
    depth
  };
}

function createPaperCrane(): THREE.Group {
  const crane = new THREE.Group();
  const mat = paperMaterial.clone();
  mat.color = new THREE.Color("#faf8f4");
  mat.roughness = 0.88;

  const bodyGeo = new THREE.ConeGeometry(0.35, 0.9, 4);
  const body = new THREE.Mesh(bodyGeo, mat);
  body.rotation.x = Math.PI / 2;
  body.rotation.z = Math.PI / 4;
  body.scale.set(1, 1, 0.45);
  body.castShadow = true;
  crane.add(body);

  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(1.6, 0.15);
  wingShape.lineTo(1.9, 0.55);
  wingShape.lineTo(0.4, 0.45);
  wingShape.lineTo(0, 0);
  const wingGeo = new THREE.ShapeGeometry(wingShape);

  const leftWing = new THREE.Mesh(wingGeo, mat);
  leftWing.position.set(-0.05, 0.12, 0);
  leftWing.rotation.x = -Math.PI / 2;
  leftWing.rotation.z = -0.18;
  leftWing.castShadow = true;
  crane.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeo, mat);
  rightWing.position.set(0.05, 0.12, 0);
  rightWing.rotation.x = -Math.PI / 2;
  rightWing.rotation.z = Math.PI + 0.18;
  rightWing.castShadow = true;
  crane.add(rightWing);

  const neckGeo = new THREE.ConeGeometry(0.08, 0.7, 4);
  const neck = new THREE.Mesh(neckGeo, mat);
  neck.position.set(0, 0.45, 0.35);
  neck.rotation.x = -0.6;
  neck.castShadow = true;
  crane.add(neck);

  const headGeo = new THREE.ConeGeometry(0.09, 0.28, 4);
  const head = new THREE.Mesh(headGeo, mat);
  head.position.set(0, 0.72, 0.54);
  head.rotation.x = -1.1;
  head.castShadow = true;
  crane.add(head);

  const tailGeo = new THREE.ConeGeometry(0.12, 0.9, 4);
  const tail = new THREE.Mesh(tailGeo, mat);
  tail.position.set(0, -0.1, -0.55);
  tail.rotation.x = 2.4;
  tail.scale.set(1, 1, 0.35);
  tail.castShadow = true;
  crane.add(tail);

  return crane;
}

function createPaperCanvas(): HTMLCanvasElement {
  const canvasElement = document.createElement("canvas");
  canvasElement.width = 1024;
  canvasElement.height = 1024;
  const context = canvasElement.getContext("2d");

  if (!context) {
    return canvasElement;
  }

  context.fillStyle = "#faf8f4";
  context.fillRect(0, 0, 1024, 1024);

  for (let index = 0; index < 1800; index += 1) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const width = 4 + Math.random() * 18;
    const height = 0.4 + Math.random() * 1.1;
    const alpha = 0.012 + Math.random() * 0.035;
    context.save();
    context.translate(x, y);
    context.rotate((Math.random() - 0.5) * 0.9);
    context.fillStyle = `rgba(120, 105, 88, ${alpha})`;
    context.fillRect(-width / 2, -height / 2, width, height);
    context.restore();
  }

  for (let index = 0; index < 160; index += 1) {
    const startX = Math.random() * 1024;
    const startY = Math.random() * 1024;
    const length = 24 + Math.random() * 80;
    const bend = (Math.random() - 0.5) * 22;
    const alpha = 0.01 + Math.random() * 0.022;
    context.strokeStyle = `rgba(100, 88, 74, ${alpha})`;
    context.lineWidth = 0.6 + Math.random() * 1.1;
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

  for (let index = 0; index < 800; index += 1) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const radius = 0.6 + Math.random() * 2;
    const alpha = 0.015 + Math.random() * 0.03;
    context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  return canvasElement;
}

function createPaperBumpCanvas(): HTMLCanvasElement {
  const canvasElement = document.createElement("canvas");
  canvasElement.width = 1024;
  canvasElement.height = 1024;
  const context = canvasElement.getContext("2d");

  if (!context) {
    return canvasElement;
  }

  context.fillStyle = "rgb(128,128,128)";
  context.fillRect(0, 0, 1024, 1024);

  for (let index = 0; index < 2800; index += 1) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const alpha = 0.008 + Math.random() * 0.024;
    const shade = 118 + Math.floor(Math.random() * 36);
    context.fillStyle = `rgba(${shade},${shade},${shade},${alpha})`;
    context.fillRect(x, y, 1.5 + Math.random() * 2.5, 1.5 + Math.random() * 2.5);
  }

  for (let index = 0; index < 80; index += 1) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const width = 30 + Math.random() * 100;
    const alpha = 0.012 + Math.random() * 0.024;
    context.save();
    context.translate(x, y);
    context.rotate((Math.random() - 0.5) * 1.2);
    context.fillStyle = `rgba(255,255,255,${alpha})`;
    context.fillRect(-width / 2, -1, width, 2);
    context.restore();
  }

  return canvasElement;
}

function createEnvelopeLabelCanvas(label: string): HTMLCanvasElement {
  const canvasElement = document.createElement("canvas");
  canvasElement.width = 512;
  canvasElement.height = 256;
  const context = canvasElement.getContext("2d");

  if (!context) {
    return canvasElement;
  }

  context.clearRect(0, 0, 512, 256);

  context.font = "600 52px STSong, 'Songti SC', 'SimSun', 'Noto Serif SC', serif";
  context.fillStyle = "#6b5a48";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, 256, 128);

  return canvasElement;
}
