import "./styles.css";

import gsap from "gsap";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type FaceData = {
  id: string;
  parentId?: string;
  eyebrow: string;
  title: string;
  shortLabel: string;
  subtitle: string;
  angle: number;
  accent: string;
  html: string;
  subEnvelopes?: FaceData[];
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
  "photos/photo1.jpg",
  "photos/photo2.jpg",
  "photos/photo3.jpg",
  "photos/photo4.jpg"
];
const canLoadPhotoTextures = window.location.protocol !== "file:";

const faces: FaceData[] = [
  {
    id: "about",
    eyebrow: "Envelope 01",
    title: "关于我",
    shortLabel: "关于我",
    subtitle: "Personal Background",
    angle: 0,
    accent: "#c9a88c",
    html: `
      <section class="panel-block">
        <p class="panel-kicker">Personal Background</p>
        <h2>Selena Yuan</h2>
        <p class="panel-text">Selena Yuan，2006年1月11日出生在深圳。在一个温暖的四口之家长大，爸爸、妈妈和妹妹是她最亲近的人。</p>
        <p class="panel-translation">Selena Yuan was born in Shenzhen on January 11, 2006. She grew up in a warm family of four, with her parents and younger sister as the people closest to her heart.</p>
      </section>
      <section class="panel-block">
        <p class="panel-text">目前就读于深圳大学，网络与新媒体专业。主修课程包括传播学理论、媒体与社会、管理学基础、导演基础、新媒体概论。大学期间GPA为3.6。</p>
        <p class="panel-translation">She is currently studying Network and New Media at Shenzhen University. Her major courses include Communication Theory, Media and Society, Fundamentals of Management, Directing, and Introduction to New Media. Her university GPA is 3.6.</p>
      </section>
      <section class="panel-block">
        <p class="panel-quote">我是一个天生好奇的人，一直相信世界有无数种可能等待被打开。</p>
        <p class="panel-translation">I am naturally curious, and I have always believed that the world holds countless possibilities waiting to be opened.</p>
      </section>
    `
  },
  {
    id: "self",
    eyebrow: "Envelope 02",
    title: "性格与自我",
    shortLabel: "性格",
    subtitle: "Personality and Self",
    angle: 0,
    accent: "#d7b79f",
    html: "",
    subEnvelopes: [
      {
        id: "self-mbti",
        parentId: "self",
        eyebrow: "Sub Envelope 01",
        title: "性格与MBTI",
        shortLabel: "MBTI",
        subtitle: "Personality and MBTI",
        angle: 0,
        accent: "#d7b79f",
        html: `
          <section class="panel-block">
            <p class="panel-kicker">Personality and MBTI</p>
            <h2>ENFP</h2>
            <p class="panel-text">ENFP。热情、外向、充满好奇心。擅长与人沟通，享受连接人与人的过程。共情能力强，总能理解不同人的立场和情绪。</p>
            <p class="panel-translation">ENFP. Warm, outgoing, and full of curiosity. She is good at communicating with people and enjoys the process of connecting them. With strong empathy, she can understand different perspectives and emotions.</p>
          </section>
          <section class="panel-block">
            <p class="panel-quote">一个永远在尝试新事物的人，不怕试错，只怕原地不动。</p>
            <p class="panel-translation">A person who is always trying new things, unafraid of trial and error, and more afraid of standing still.</p>
          </section>
        `
      },
      {
        id: "self-hobbies",
        parentId: "self",
        eyebrow: "Sub Envelope 02",
        title: "我的爱好",
        shortLabel: "爱好",
        subtitle: "Hobbies",
        angle: 0,
        accent: "#d7b79f",
        html: `
          <section class="panel-block">
            <p class="panel-kicker">Hobbies</p>
            <h2>旅游 · 摄影 · 阅读 · 写作 · 攀岩</h2>
            <p class="panel-text">目前持续在做的：旅游 · 摄影 · 阅读 · 写作。最近刚刚开始尝试：攀岩。</p>
            <p class="panel-translation">Her ongoing hobbies include travel, photography, reading, and writing. Recently, she has just started trying rock climbing.</p>
          </section>
          <section class="panel-block">
            <p class="panel-text">旅游的时候喜欢用照片记录每个地方的细节，写作的时候喜欢把感受变成文字。阅读偏好非虚构和人物故事。攀岩是想挑战身体和心智的平衡，刚刚开始学。</p>
            <p class="panel-translation">When traveling, she likes using photos to capture the details of each place. When writing, she turns feelings into words. She prefers nonfiction and human stories. Rock climbing is her new way to challenge the balance between body and mind.</p>
          </section>
          <section class="panel-block">
            <p class="panel-quote">每一段旅程、每一本书、每一次攀爬，都在悄悄塑造我。</p>
            <p class="panel-translation">Every journey, every book, and every climb is quietly shaping who I am.</p>
          </section>
        `
      },
      {
        id: "self-skills",
        parentId: "self",
        eyebrow: "Sub Envelope 03",
        title: "技能与个人项目",
        shortLabel: "技能",
        subtitle: "Skills and Personal Projects",
        angle: 0,
        accent: "#d7b79f",
        html: `
          <section class="panel-block">
            <p class="panel-kicker">Skills and Projects</p>
            <h2>内容感知与工具实践</h2>
            <p class="panel-text">软件技能：Photoshop · 剪映 · Canva · WPS。</p>
            <p class="panel-translation">Software skills: Photoshop, Jianying, Canva, and WPS.</p>
          </section>
          <section class="panel-block">
            <p class="panel-text">网感强，高强度冲浪海外社媒：Instagram · YouTube · TikTok · Reddit。了解不同平台的调性和内容逻辑。</p>
            <p class="panel-translation">She has a strong sense of online culture and actively follows overseas social media platforms including Instagram, YouTube, TikTok, and Reddit. She understands the tone and content logic of different platforms.</p>
          </section>
          <section class="panel-block">
            <p class="panel-text">小红书单篇帖子曾获得1w+浏览、600+点赞。</p>
            <p class="panel-translation">One of her Xiaohongshu posts received over 10,000 views and more than 600 likes.</p>
          </section>
          <section class="panel-block">
            <p class="panel-text">擅长用Agent工具进行Vibe Coding，包括Codex、Claude等。有两个个人项目：</p>
            <p class="panel-translation">She is skilled at using agent tools for vibe coding, including Codex and Claude. She has two personal projects:</p>
            <p class="panel-link"><a href="https://github.com/uan-iel/wechat-moments-ai" target="_blank" rel="noreferrer">朋友圈及小红书运营工具</a></p>
            <p class="panel-link"><a href="https://github.com/uan-iel/obsidian-museum-desk" target="_blank" rel="noreferrer">Obsidian仪表盘插件</a></p>
          </section>
        `
      }
    ]
  },
  {
    id: "internships",
    eyebrow: "Envelope 03",
    title: "实习足迹",
    shortLabel: "实习",
    subtitle: "Internship Footprints",
    angle: 0,
    accent: "#c59a78",
    html: "",
    subEnvelopes: [
      {
        id: "intern-leyadoll",
        parentId: "internships",
        eyebrow: "Sub Envelope 01",
        title: "Leyadoll · 独立站运营",
        shortLabel: "Leyadoll",
        subtitle: "Independent Site Operations",
        angle: 0,
        accent: "#c59a78",
        html: `
          <section class="panel-block">
            <p class="panel-kicker">2025年11月 - 2026年1月</p>
            <h2>Leyadoll · 独立站运营</h2>
            <p class="panel-text">负责海外社媒视频与海报的独立制作。通过创意设计提升内容吸引力，实现浏览量超过3w，购买转化效果显著。优化视频及海报内容后精准触达目标受众，购买转化率显著增长，成绩超出预期目标。</p>
            <p class="panel-translation">She independently produced overseas social media videos and posters. Through creative design, she increased content appeal, achieved over 30,000 views, and significantly improved purchase conversion beyond expectations.</p>
          </section>
          <section class="panel-block">
            <p class="panel-text">独立完成30+本土竞品营销策略深度调研，涵盖邮件营销、社媒运营、促销节点等多方面，全面掌握海外运营风格。将调研结果运用到自身产品素材制作中，精准调整素材风格与文案撰写，提升产品市场竞争力。</p>
            <p class="panel-translation">She completed more than 30 in-depth local competitor marketing studies covering email marketing, social media operations, and promotional timing. She applied the insights to product materials, refining visual style and copy to strengthen market competitiveness.</p>
          </section>
        `
      },
      {
        id: "intern-nandu",
        parentId: "internships",
        eyebrow: "Sub Envelope 02",
        title: "南方都市报 · 新媒体运营&实习记者",
        shortLabel: "南都",
        subtitle: "New Media Operations and Intern Reporter",
        angle: 0,
        accent: "#c59a78",
        html: `
          <section class="panel-block">
            <p class="panel-kicker">2024年7月 - 2024年8月</p>
            <h2>南方都市报 · 新媒体运营&实习记者</h2>
            <p class="panel-text">负责新闻发布会及采访素材的精准切片与深度剪辑。通过提炼事件核心信息、强化关键观点，增强新闻内容的传播吸引力。</p>
            <p class="panel-translation">She handled precise clipping and in-depth editing of press conference and interview materials, extracting core information and strengthening key viewpoints to improve the communicative appeal of news content.</p>
          </section>
          <section class="panel-block">
            <p class="panel-text">持续追踪国际校园新闻动态，独立开展全英文远程深度采访，完成多份高质量新闻稿件撰写。其中一篇稿件浏览量达1w+，扩大了媒体在国际校园领域的内容影响力。</p>
            <p class="panel-translation">She continuously tracked international campus news, independently conducted in-depth remote interviews in English, and wrote multiple high-quality news articles. One article reached over 10,000 views, expanding the outlet's influence in international campus coverage.</p>
          </section>
        `
      },
      {
        id: "intern-hainan",
        parentId: "internships",
        eyebrow: "Sub Envelope 03",
        title: "海南省广播电视台 · 实习记者",
        shortLabel: "海南台",
        subtitle: "Intern Reporter",
        angle: 0,
        accent: "#c59a78",
        html: `
          <section class="panel-block">
            <p class="panel-kicker">2025年1月 - 2025年2月</p>
            <h2>海南省广播电视台 · 实习记者</h2>
            <p class="panel-text">参与多次采编项目，牵头主持人与被采访方的全流程对接。建立需求同步机制与时间节点管控表，提前化解信息偏差、行程冲突等问题，保障项目启动准时率100%。</p>
            <p class="panel-translation">She participated in multiple reporting and editing projects, leading full-process coordination between hosts and interviewees. By building demand synchronization and timeline tracking, she prevented information gaps and scheduling conflicts, ensuring a 100% on-time project launch rate.</p>
          </section>
          <section class="panel-block">
            <p class="panel-text">协助拍摄团队完成设备调试、场景布置、流程衔接等工作，及时协调突发需求。全程跟进成片剪辑环节，参与素材筛选、叙事逻辑梳理、字幕校对，累计保障20+条视频精准传达核心信息，成片通过率100%。</p>
            <p class="panel-translation">She supported filming teams with equipment setup, scene arrangement, and workflow coordination. She followed post-production throughout, helping with material selection, narrative structure, and subtitle proofreading, ensuring more than 20 videos communicated key messages accurately with a 100% approval rate.</p>
          </section>
        `
      },
      {
        id: "intern-meila",
        parentId: "internships",
        eyebrow: "Sub Envelope 04",
        title: "莓辣 · 社群运营&小红书运营",
        shortLabel: "莓辣",
        subtitle: "Community and Xiaohongshu Operations",
        angle: 0,
        accent: "#c59a78",
        html: `
          <section class="panel-block">
            <p class="panel-kicker">2024年9月 - 2024年12月</p>
            <h2>莓辣 · 社群运营&小红书运营</h2>
            <p class="panel-text">管理100+社群，负责社群日常维护、内容发布与用户互动。撰写小红书内容，商品点击率达12%，阅读下单率2%。</p>
            <p class="panel-translation">She managed over 100 communities, handling daily maintenance, content publishing, and user interaction. She also wrote Xiaohongshu content, achieving a 12% product click-through rate and a 2% read-to-order conversion rate.</p>
          </section>
        `
      }
    ]
  },
  {
    id: "activities",
    eyebrow: "Envelope 04",
    title: "组织与活动",
    shortLabel: "活动",
    subtitle: "Organizations and Activities",
    angle: 0,
    accent: "#b78a68",
    html: "",
    subEnvelopes: [
      {
        id: "activity-ai-study",
        parentId: "activities",
        eyebrow: "Sub Envelope 01",
        title: "X世代AI使用研究",
        shortLabel: "AI研究",
        subtitle: "Gen X AI Usage Research",
        angle: 0,
        accent: "#b78a68",
        html: `
          <section class="panel-block">
            <p class="panel-kicker">2025年9月 - 2025年12月</p>
            <h2>X世代AI使用研究</h2>
            <p class="panel-text">设计制作高吸引力被试招募海报，成功招募60余位中老年人被试，组织一对一的深入沟通及线上会议。</p>
            <p class="panel-translation">She designed engaging recruitment posters and successfully recruited more than 60 middle-aged and older participants, organizing one-on-one in-depth communication and online meetings.</p>
          </section>
          <section class="panel-block">
            <p class="panel-text">长期跟进被试状态：收集百余份AI使用日志，系统整合数据，为研究提供详实基础资料。对每位被试开展深度访谈，挖掘需求痛点。进行为期两个月的日志社群维护，发布60+条文案，与被试积极互动，获得良好反馈。</p>
            <p class="panel-translation">She followed participants over time, collected more than 100 AI usage logs, organized data systematically, and conducted in-depth interviews to uncover needs and pain points. During two months of community maintenance, she published over 60 posts and received positive feedback through active interaction.</p>
          </section>
        `
      },
      {
        id: "activity-welcome-gala",
        parentId: "activities",
        eyebrow: "Sub Envelope 02",
        title: "传播学院迎新晚会",
        shortLabel: "迎新",
        subtitle: "School of Communication Welcome Gala",
        angle: 0,
        accent: "#b78a68",
        html: `
          <section class="panel-block">
            <p class="panel-kicker">2024年10月 - 2024年11月</p>
            <h2>传播学院迎新晚会</h2>
            <p class="panel-text">前期宣传片拍摄执行制片：负责与导演沟通，把握取景内容需求，搜索并筛选合适的拍摄场地。积极参与场地布置工作，优化拍摄环境。现场拍摄过程中全面记录重要细节，协助团队高效推进拍摄进度。</p>
            <p class="panel-translation">As executive producer for the promotional video, she communicated with the director, clarified location needs, searched for suitable filming sites, helped arrange scenes, and documented key details on set to keep filming moving efficiently.</p>
          </section>
          <section class="panel-block">
            <p class="panel-text">前期统筹：从零开始推进迎新晚会筹备工作，联系3家赞助商、对接10+表演团队、拍摄完整采访视频、安排现场人员。</p>
            <p class="panel-translation">In early coordination, she helped build the gala from scratch by contacting three sponsors, coordinating with over ten performance teams, filming a complete interview video, and arranging on-site staff.</p>
          </section>
          <section class="panel-block">
            <p class="panel-text">现场执行：协调各表演社团，全程跟进晚会动态，确保每个节目有序进行。</p>
            <p class="panel-translation">During the event, she coordinated performing groups and followed the live flow to ensure each program ran smoothly.</p>
          </section>
        `
      },
      {
        id: "activity-anniversary",
        parentId: "activities",
        eyebrow: "Sub Envelope 03",
        title: "网络与新媒体系庆",
        shortLabel: "系庆",
        subtitle: "Network and New Media Anniversary",
        angle: 0,
        accent: "#b78a68",
        html: `
          <section class="panel-block">
            <p class="panel-kicker">2025年11月 - 2025年12月</p>
            <h2>网络与新媒体系庆</h2>
            <p class="panel-text">搭建交流平台，收集同学与校友问答，获得50+份问题、600+份答案。运用分类法筛选整合，最终产出20组优质问答内容。</p>
            <p class="panel-translation">She built a communication platform for students and alumni, collecting over 50 questions and more than 600 answers. Through classification and curation, she produced 20 sets of high-quality Q&A content.</p>
          </section>
          <section class="panel-block">
            <p class="panel-text">布置创意互动摊位：制作精美海报吸引观展人目光。设计融入知识元素的趣味互动游戏，吸引超200名观展人主动参与互动。</p>
            <p class="panel-translation">She designed a creative interactive booth with polished posters and knowledge-based games, attracting more than 200 visitors to participate actively.</p>
          </section>
        `
      }
    ]
  },
  {
    id: "highlights",
    eyebrow: "Envelope 05",
    title: "高光集锦",
    shortLabel: "高光",
    subtitle: "Highlights",
    angle: 0,
    accent: "#d4a574",
    html: "",
    subEnvelopes: [
      {
        id: "highlight-social",
        parentId: "highlights",
        eyebrow: "Sub Envelope 01",
        title: "社媒影响力",
        shortLabel: "社媒",
        subtitle: "Social Media Influence",
        angle: 0,
        accent: "#d4a574",
        html: `
          <section class="stats-row compact">
            <div><strong>1w+</strong><span>小红书单篇帖子浏览</span><em>Views on a single Xiaohongshu post</em></div>
            <div><strong>600+</strong><span>小红书单篇点赞</span><em>Likes on a single Xiaohongshu post</em></div>
            <div><strong>3w+</strong><span>Leyadoll海外社媒浏览</span><em>Overseas social media views for Leyadoll</em></div>
            <div><strong>12%</strong><span>小红书商品点击率</span><em>Xiaohongshu product click-through rate</em></div>
          </section>
          <section class="panel-block">
            <p class="panel-text">南方都市报采编稿件浏览量1w+，小红书阅读下单率2%。</p>
            <p class="panel-translation">A Southern Metropolis Daily article she worked on reached over 10,000 views, and Xiaohongshu content achieved a 2% read-to-order conversion rate.</p>
          </section>
        `
      },
      {
        id: "highlight-management",
        parentId: "highlights",
        eyebrow: "Sub Envelope 02",
        title: "项目管理与组织",
        shortLabel: "组织",
        subtitle: "Project Management and Organization",
        angle: 0,
        accent: "#d4a574",
        html: `
          <section class="panel-block">
            <p class="panel-text">X世代研究招募60+被试，收集100+份日志，发布60+条社群文案。</p>
            <p class="panel-translation">For the Gen X research project, she recruited over 60 participants, collected more than 100 logs, and published over 60 community posts.</p>
          </section>
          <section class="panel-block">
            <p class="panel-text">传播学院迎新晚会联系3家赞助商，对接10+表演团队。</p>
            <p class="panel-translation">For the School of Communication Welcome Gala, she contacted three sponsors and coordinated with more than ten performance teams.</p>
          </section>
          <section class="panel-block">
            <p class="panel-text">系庆活动收集50+问题600+答案，筛选20组优质问答，吸引200+人参与互动。海南台保障20+条视频成片通过率100%。</p>
            <p class="panel-translation">For the anniversary event, she collected over 50 questions and 600 answers, curated 20 high-quality Q&A sets, and attracted more than 200 participants. At Hainan Broadcasting, she helped ensure a 100% approval rate for over 20 videos.</p>
          </section>
        `
      },
      {
        id: "highlight-projects",
        parentId: "highlights",
        eyebrow: "Sub Envelope 03",
        title: "个人项目",
        shortLabel: "项目",
        subtitle: "Personal Projects",
        angle: 0,
        accent: "#d4a574",
        html: `
          <section class="panel-block">
            <p class="panel-kicker">Personal Projects</p>
            <h2>用工具把灵感落地</h2>
            <p class="panel-translation">Turning ideas into practical tools through hands-on building.</p>
            <p class="panel-link"><a href="https://github.com/uan-iel/wechat-moments-ai" target="_blank" rel="noreferrer">朋友圈及小红书运营工具</a></p>
            <p class="panel-translation">A tool for WeChat Moments and Xiaohongshu content operations.</p>
            <p class="panel-link"><a href="https://github.com/uan-iel/obsidian-museum-desk" target="_blank" rel="noreferrer">Obsidian仪表盘插件</a></p>
            <p class="panel-translation">An Obsidian dashboard plugin for personal knowledge display.</p>
          </section>
        `
      }
    ]
  },
  {
    id: "future",
    eyebrow: "Envelope 06",
    title: "未来方向",
    shortLabel: "未来",
    subtitle: "Future Direction",
    angle: 0,
    accent: "#c9a88c",
    html: `
      <section class="panel-block">
        <p class="panel-kicker">Future Direction</p>
        <h2>产品经理</h2>
        <p class="panel-text">理想职业是产品经理——可以是实体产品，也可以是互联网产品。正在为此持续学习，系统积累产品方法论、用户研究和数据分析的能力。</p>
        <p class="panel-translation">Her ideal career is product manager, either for physical products or internet products. She is continuously learning product methodology, user research, and data analysis to prepare for this direction.</p>
      </section>
      <section class="panel-block">
        <p class="panel-text">对产品经理这个职业的理解是：做产品的本质是理解用户、定义需求、推动落地。关注从0到1搭建产品的全过程，也关注如何将AI能力融入产品设计，真正提升用户体验。</p>
        <p class="panel-translation">Her understanding of product management is that building products means understanding users, defining needs, and driving execution. She cares about the entire process from zero to one, as well as how AI can be integrated into product design to genuinely improve user experience.</p>
      </section>
      <section class="panel-block">
        <p class="panel-quote">成为懂用户、懂技术、懂商业的产品人，做出有温度的好产品。</p>
        <p class="panel-translation">To become a product person who understands users, technology, and business, and to create thoughtful products with warmth.</p>
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
scene.background = new THREE.Color("#f8f3eb");
scene.fog = new THREE.Fog("#f8f3eb", 8, 20);

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

const camera = new THREE.PerspectiveCamera(38, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 0.45, 8.6);
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

const ambientLight = new THREE.HemisphereLight("#fffaf2", "#e3d5c4", 1.18);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight("#fff3dd", 2.55);
keyLight.position.set(-4, 7, 7);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 1024;
keyLight.shadow.mapSize.height = 1024;
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 25;
keyLight.shadow.bias = -0.0005;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight("#f9e8c8", 1.65);
rimLight.position.set(6, 2.4, -4);
scene.add(rimLight);

const fillLight = new THREE.DirectionalLight("#efe4d5", 0.72);
fillLight.position.set(3, -2, 5);
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
  color: "#f3eadb",
  roughness: 0.98,
  metalness: 0,
  side: THREE.DoubleSide,
  map: paperTexture,
  bumpMap: paperBumpTexture,
  bumpScale: 0.075
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const mainGroup = new THREE.Group();
scene.add(mainGroup);

const craneGroup = createOrigamiCrane();
craneGroup.position.set(0.05, -0.03, 0);
craneGroup.rotation.set(-0.08, -0.1, -0.02);
craneGroup.scale.setScalar(1.12);
mainGroup.add(craneGroup);

const infoEnvelopes: InfoEnvelopeRuntime[] = [];
const infoEnvelopeClickables: THREE.Object3D[] = [];

const envelopePositions = [
  new THREE.Vector3(-2.45, 1.35, -1.1),
  new THREE.Vector3(2.65, 0.45, -0.75),
  new THREE.Vector3(-2.75, -1.15, 0.55),
  new THREE.Vector3(1.35, -1.55, 0.7),
  new THREE.Vector3(0.9, 1.72, -1.7),
  new THREE.Vector3(-3.28, 0.05, -1.9)
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

const childEnvelopeGroup = new THREE.Group();
childEnvelopeGroup.visible = false;
mainGroup.add(childEnvelopeGroup);

const childEnvelopes: InfoEnvelopeRuntime[] = [];
const childEnvelopeClickables: THREE.Object3D[] = [];

faces.forEach((parent) => {
  const children = parent.subEnvelopes ?? [];
  children.forEach((child, childIndex) => {
    const runtime = createInfoEnvelope(child, childIndex);
    const angle = -Math.PI / 2 + (Math.PI * 2 * childIndex) / Math.max(children.length, 1);
    const radius = children.length === 4 ? 1.95 : 1.75;
    const position = new THREE.Vector3(
      Math.cos(angle) * radius,
      Math.sin(angle) * 0.72,
      Math.sin(angle) * radius
    );

    runtime.group.position.copy(position);
    runtime.basePosition.copy(position);
    runtime.group.lookAt(new THREE.Vector3(0, 0.05, 0));
    runtime.baseRotation.copy(runtime.group.rotation);
    runtime.group.visible = false;
    runtime.group.scale.setScalar(0.001);
    runtime.group.userData.parentId = parent.id;
    runtime.body.userData.parentId = parent.id;
    runtime.flap.userData.parentId = parent.id;

    childEnvelopes.push(runtime);
    childEnvelopeClickables.push(runtime.body, runtime.flap);
    childEnvelopeGroup.add(runtime.group);
  });
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

if (canLoadPhotoTextures) {
  PHOTO_URLS.forEach((url, index) => {
    const envelope = createPhotoEnvelope(url, index);
    photoEnvelopes.push(envelope);
    photoEnvelopeClickables.push(envelope.body, envelope.photo, envelope.flap);
    galleryGroup.add(envelope.group);
  });
}

let activeId: string | null = null;
let activeParentId: string | null = null;
let isDragging = false;
let galleryMode = false;
let galleryRotation = 0;
let galleryVelocity = 0;
let isGalleryDragging = false;
let lastGalleryPointerX = 0;
let galleryDragDistance = 0;
let hoveredPhotoIndex: number | null = null;
let openedPhotoIndex: number | null = null;
let hoveredInfoId: string | null = null;

function enterGallery(): void {
  if (!photoEnvelopes.length) {
    return;
  }

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
  if (!PHOTO_URLS[index]) {
    return;
  }

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
  const targets = activeParentId ? childEnvelopeClickables : infoEnvelopeClickables;
  const intersections = raycaster.intersectObjects(targets, false);
  const hit = intersections[0]?.object ?? null;

  if (hit) {
    hoveredInfoId = hit.userData.faceId as string;
  } else {
    hoveredInfoId = null;
  }

  return hit;
}

function findFaceById(id: string | null): FaceData | null {
  if (!id) {
    return null;
  }

  for (const face of faces) {
    if (face.id === id) {
      return face;
    }

    const child = face.subEnvelopes?.find((item) => item.id === id);
    if (child) {
      return child;
    }
  }

  return null;
}

function setChildEnvelopeLayer(parentId: string | null): void {
  activeParentId = parentId;
  childEnvelopeGroup.visible = Boolean(parentId);

  childEnvelopes.forEach((runtime, index) => {
    const isVisible = runtime.data.parentId === parentId;
    runtime.group.visible = isVisible;
    runtime.openT = 0;
    runtime.hoverT = 0;
    runtime.group.position.copy(runtime.basePosition);

    gsap.to(runtime.group.scale, {
      x: isVisible ? 0.9 : 0.001,
      y: isVisible ? 0.9 : 0.001,
      z: isVisible ? 0.9 : 0.001,
      duration: isVisible ? 0.6 : 0.3,
      delay: isVisible ? index * 0.04 : 0,
      ease: isVisible ? "back.out(1.4)" : "power2.in"
    });
  });
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
  const content = findFaceById(id);
  const selectedMain = faces.find((face) => face.id === id) ?? null;
  const selectedParentId = selectedMain?.subEnvelopes?.length ? selectedMain.id : content?.parentId ?? null;
  setChildEnvelopeLayer(selectedParentId);

  infoEnvelopes.forEach((runtime) => {
    const isActive = runtime.data.id === id || runtime.data.id === selectedParentId;
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

  childEnvelopes.forEach((runtime) => {
    const isActive = runtime.data.id === id;
    gsap.to(runtime, {
      openT: isActive ? 1 : 0,
      duration: 0.5,
      ease: "power2.out"
    });
  });

  if (!content) {
    activeCard.classList.remove("visible");
    activeCard.innerHTML = "";
    return;
  }

  const isParentOverview = Boolean(content.subEnvelopes?.length);
  const bodyHtml = isParentOverview
    ? `
      <section class="panel-block">
        <p class="panel-kicker">Choose a Sub Envelope</p>
        <h2>${content.title}</h2>
        <p class="panel-translation">Click one of the sub envelopes in the scene to read the full detailed story.</p>
        <p class="panel-text">点击场景中出现的子信封，查看更完整的细节内容。</p>
      </section>
      <section class="sub-envelope-list">
        ${content.subEnvelopes!.map((item) => `
          <button class="sub-envelope-chip" data-open-sub="${item.id}">
            <span>${item.title}</span>
            <em>${item.subtitle}</em>
          </button>
        `).join("")}
      </section>
    `
    : content.html;

  activeCard.innerHTML = `
    <div class="card-shell">
      ${content.parentId ? `<button class="panel-back" data-back-parent="${content.parentId}">返回子信封</button>` : ""}
      <p class="card-eyebrow">${content.eyebrow}</p>
      <p class="card-subtitle type-target">${content.subtitle}</p>
      <h3>${content.title}</h3>
      <div class="card-body">${bodyHtml}</div>
    </div>
  `;

  reorderBilingualContent(activeCard);
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

  activeCard.querySelectorAll<HTMLButtonElement>("[data-open-sub]").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveFace(button.dataset.openSub ?? null);
    });
  });

  const backButton = activeCard.querySelector<HTMLButtonElement>("[data-back-parent]");
  if (backButton) {
    backButton.addEventListener("click", () => {
      setActiveFace(backButton.dataset.backParent ?? null);
    });
  }

  runTypewriterAnimation();
}

function reorderBilingualContent(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>(".panel-block").forEach((block) => {
    block.querySelectorAll<HTMLElement>(".panel-translation").forEach((translation) => {
      const previous = translation.previousElementSibling;

      if (previous?.matches(".panel-text, .panel-quote, .panel-link")) {
        block.insertBefore(translation, previous);
      }
    });
  });

  root.querySelectorAll<HTMLElement>(".stats-row div").forEach((item) => {
    const chinese = item.querySelector("span");
    const english = item.querySelector("em");

    if (chinese && english && (chinese.compareDocumentPosition(english) & Node.DOCUMENT_POSITION_FOLLOWING)) {
      item.insertBefore(english, chinese);
    }
  });
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

function handleGalleryDragMove(clientX: number): void {
  if (!galleryMode || !isGalleryDragging) {
    return;
  }

  const deltaX = clientX - lastGalleryPointerX;
  galleryRotation -= deltaX * 0.008;
  galleryVelocity = -deltaX * 0.008;
  lastGalleryPointerX = clientX;
  galleryDragDistance += Math.abs(deltaX);
}

function handleGalleryDragEnd(clientX: number): void {
  if (!galleryMode || !isGalleryDragging) {
    return;
  }

  isGalleryDragging = false;
  canvas!.style.cursor = "grab";

  if (galleryDragDistance < 8) {
    updatePointer(clientX, window.innerHeight / 2);
    const hit = pickPhotoEnvelope();
    if (hit) {
      const index = hit.userData.envelopeIndex as number;
      openLightbox(index);
    }
  }
}

canvas.addEventListener("pointermove", (event) => {
  updatePointer(event.clientX, event.clientY);

  if (galleryMode && isGalleryDragging) {
    handleGalleryDragMove(event.clientX);
    return;
  }

  if (galleryMode) {
    const hit = pickPhotoEnvelope();
    canvas.style.cursor = hit ? "pointer" : "grab";
    return;
  }

  pickInfoEnvelope();
  canvas.style.cursor = hoveredInfoId ? "pointer" : "grab";
});

canvas.addEventListener("pointerdown", (event) => {
  if (galleryMode) {
    event.preventDefault();
    isGalleryDragging = true;
    hoveredPhotoIndex = null;
    lastGalleryPointerX = event.clientX;
    galleryDragDistance = 0;
    galleryVelocity = 0;
    canvas.style.cursor = "grabbing";
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // Some browsers/synthetic events don't support setPointerCapture.
    }
    return;
  }

  isDragging = false;
  canvas.style.cursor = "grabbing";
});

canvas.addEventListener("pointerup", (event) => {
  updatePointer(event.clientX, event.clientY);

  if (galleryMode) {
    handleGalleryDragEnd(event.clientX);
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

window.addEventListener("pointermove", (event) => {
  if (galleryMode && isGalleryDragging) {
    handleGalleryDragMove(event.clientX);
  }
});

window.addEventListener("pointerup", (event) => {
  if (galleryMode && isGalleryDragging) {
    handleGalleryDragEnd(event.clientX);
  }
});

window.addEventListener("pointercancel", (event) => {
  if (galleryMode && isGalleryDragging) {
    handleGalleryDragEnd(event.clientX);
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

    childEnvelopes.forEach((runtime, index) => {
      if (!runtime.group.visible) {
        return;
      }

      const phase = index * 1.15;
      const individualFloat = Math.sin(elapsed * 1.05 + phase) * 0.045;
      const targetY = runtime.basePosition.y + floatY * 0.4 + individualFloat;
      runtime.group.position.y += (targetY - runtime.group.position.y) * 0.06;

      const baseRotX = runtime.baseRotation.x + Math.sin(elapsed * 0.5 + phase) * 0.04;
      const baseRotY = runtime.baseRotation.y + Math.cos(elapsed * 0.38 + phase) * 0.05;
      const baseRotZ = runtime.baseRotation.z + Math.sin(elapsed * 0.3 + phase) * 0.03;
      runtime.group.rotation.x += (baseRotX - runtime.group.rotation.x) * 0.05;
      runtime.group.rotation.y += (baseRotY - runtime.group.rotation.y) * 0.05;
      runtime.group.rotation.z += (baseRotZ - runtime.group.rotation.z) * 0.05;

      const isHovered = runtime.data.id === hoveredInfoId;
      const targetHover = isHovered ? 1 : 0;
      runtime.hoverT += (targetHover - runtime.hoverT) * 0.14;

      const flapTarget = -runtime.openT * Math.PI * 0.76 - runtime.hoverT * Math.PI * 0.2;
      runtime.flap.rotation.x += (flapTarget - runtime.flap.rotation.x) * 0.12;

      const labelOpacity = 0.62 + runtime.hoverT * 0.24 + runtime.openT * 0.14;
      (runtime.label.material as THREE.MeshBasicMaterial).opacity = labelOpacity;
    });
  }

  if (galleryMode || galleryGroup.visible) {
    galleryRotation += galleryVelocity;
    galleryVelocity *= 0.94;

    if (!photoEnvelopes.length) {
      controls.update();
      renderer.render(scene, camera);
      window.requestAnimationFrame(tick);
      return;
    }

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

function createEnvelopeStringAndBow(width: number): THREE.Group {
  const group = new THREE.Group();
  const stringMat = new THREE.MeshStandardMaterial({
    color: "#d7c9b8",
    roughness: 1,
    metalness: 0
  });

  const bandGeometry = new THREE.BoxGeometry(width + 0.08, 0.055, 0.16);
  const band = new THREE.Mesh(bandGeometry, stringMat);
  group.add(band);

  const loopGeometry = new THREE.TorusGeometry(0.075, 0.014, 6, 16, Math.PI * 1.7);

  const leftLoop = new THREE.Mesh(loopGeometry, stringMat);
  leftLoop.position.set(-0.055, 0, 0.055);
  leftLoop.rotation.z = 0.4;
  group.add(leftLoop);

  const rightLoop = new THREE.Mesh(loopGeometry, stringMat);
  rightLoop.position.set(0.055, 0, 0.055);
  rightLoop.rotation.z = -0.4;
  group.add(rightLoop);

  const tailCurve1 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.07, 0, 0.055),
    new THREE.Vector3(0.13, -0.05, 0.06),
    new THREE.Vector3(0.16, -0.13, 0.04)
  ]);
  const tail1 = new THREE.Mesh(new THREE.TubeGeometry(tailCurve1, 12, 0.011, 6, false), stringMat);
  group.add(tail1);

  const tailCurve2 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.07, 0, 0.055),
    new THREE.Vector3(-0.13, -0.05, 0.06),
    new THREE.Vector3(-0.16, -0.13, 0.04)
  ]);
  const tail2 = new THREE.Mesh(new THREE.TubeGeometry(tailCurve2, 12, 0.011, 6, false), stringMat);
  group.add(tail2);

  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), stringMat);
  knot.position.set(0, 0, 0.065);
  group.add(knot);

  return group;
}

function createRealisticEnvelope(width: number, height: number, depth: number): {
  group: THREE.Group;
  body: THREE.Mesh;
  flap: THREE.Mesh;
  outline: THREE.LineSegments;
  crease: THREE.LineSegments;
} {
  const group = new THREE.Group();
  const mat = paperMaterial.clone();
  mat.color = new THREE.Color("#efe4d2");
  mat.flatShading = true;

  const flapMat = paperMaterial.clone();
  flapMat.color = new THREE.Color("#f6eddf");
  flapMat.flatShading = true;

  // Back panel
  const backGeometry = new THREE.PlaneGeometry(width, height);
  const back = new THREE.Mesh(backGeometry, mat);
  back.position.z = -depth / 2;
  back.rotation.y = Math.PI;
  back.castShadow = true;
  back.receiveShadow = true;
  group.add(back);

  // Bottom triangular flap folded up
  const bottomFlap = createPaperPanel([
    new THREE.Vector3(-width / 2, -height / 2, -depth / 2),
    new THREE.Vector3(width / 2, -height / 2, -depth / 2),
    new THREE.Vector3(0, 0, depth / 2 + 0.004)
  ], mat);
  group.add(bottomFlap);

  // Left triangular flap folded in
  const leftFlap = createPaperPanel([
    new THREE.Vector3(-width / 2, -height / 2, -depth / 2),
    new THREE.Vector3(-width / 2, height / 2, -depth / 2),
    new THREE.Vector3(0, 0, depth / 2 + 0.002)
  ], mat);
  group.add(leftFlap);

  // Right triangular flap folded in
  const rightFlap = createPaperPanel([
    new THREE.Vector3(width / 2, -height / 2, -depth / 2),
    new THREE.Vector3(0, 0, depth / 2 + 0.002),
    new THREE.Vector3(width / 2, height / 2, -depth / 2)
  ], mat);
  group.add(rightFlap);

  // Top triangular flap folded down (the movable flap)
  const flapGeometry = new THREE.BufferGeometry();
  const flapPositions = [
    -width / 2, 0, 0,
    width / 2, 0, 0,
    0, -height * 0.55, 0.02
  ];
  const flapNormals = [0, 0, 1, 0, 0, 1, 0, 0, 1];
  const flapUvs = [0, 0, 1, 0, 0.5, 1];
  flapGeometry.setAttribute("position", new THREE.Float32BufferAttribute(flapPositions, 3));
  flapGeometry.setAttribute("normal", new THREE.Float32BufferAttribute(flapNormals, 3));
  flapGeometry.setAttribute("uv", new THREE.Float32BufferAttribute(flapUvs, 2));

  const flap = new THREE.Mesh(flapGeometry, flapMat);
  flap.position.set(0, height / 2, depth / 2 + 0.014);
  flap.castShadow = true;
  flap.receiveShadow = true;
  group.add(flap);

  // Invisible hit box for reliable clicking
  const hitBoxGeometry = new THREE.BoxGeometry(width * 1.05, height * 1.05, depth * 2);
  const hitBoxMaterial = new THREE.MeshBasicMaterial({ visible: false });
  const body = new THREE.Mesh(hitBoxGeometry, hitBoxMaterial);
  group.add(body);

  // Crease lines: diagonals from corners to center and flap base
  const creasePoints = [
    new THREE.Vector3(-width / 2, -height / 2, depth / 2 + 0.001),
    new THREE.Vector3(0, 0, depth / 2 + 0.001),
    new THREE.Vector3(width / 2, -height / 2, depth / 2 + 0.001),
    new THREE.Vector3(0, 0, depth / 2 + 0.001),
    new THREE.Vector3(-width / 2, height / 2, depth / 2 + 0.001),
    new THREE.Vector3(0, 0, depth / 2 + 0.001),
    new THREE.Vector3(width / 2, height / 2, depth / 2 + 0.001),
    new THREE.Vector3(0, 0, depth / 2 + 0.001),
    new THREE.Vector3(-width / 2, height / 2, depth / 2 + 0.001),
    new THREE.Vector3(width / 2, height / 2, depth / 2 + 0.001)
  ];
  const creaseGeometry = new THREE.BufferGeometry().setFromPoints(creasePoints);
  const crease = new THREE.LineSegments(
    creaseGeometry,
    new THREE.LineBasicMaterial({
      color: "#b9aa98",
      transparent: true,
      opacity: 0.56
    })
  );
  group.add(crease);

  // Outer outline
  const outlineGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, depth));
  const outline = new THREE.LineSegments(
    outlineGeometry,
    new THREE.LineBasicMaterial({
      color: "#d8c4a5",
      transparent: true,
      opacity: 0.72
    })
  );
  group.add(outline);

  // String and bow
  const stringGroup = createEnvelopeStringAndBow(width);
  stringGroup.position.set(0, 0, depth / 2 + 0.028);
  group.add(stringGroup);

  return { group, body, flap, outline, crease };
}

function createInfoEnvelope(data: FaceData, _index: number): InfoEnvelopeRuntime {
  const width = 1.42;
  const height = 0.94;
  const depth = 0.16;

  const envelope = createRealisticEnvelope(width, height, depth);
  const group = envelope.group;
  group.userData.faceId = data.id;

  envelope.body.userData.faceId = data.id;
  envelope.flap.userData.faceId = data.id;

  const labelTexture = new THREE.CanvasTexture(createEnvelopeLabelCanvas(data.shortLabel));
  labelTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  const labelGeometry = new THREE.PlaneGeometry(width * 0.58, height * 0.26);
  const labelMaterial = new THREE.MeshBasicMaterial({
    map: labelTexture,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
  });
  const label = new THREE.Mesh(labelGeometry, labelMaterial);
  label.position.set(0, 0.08, depth / 2 + 0.055);
  label.userData.faceId = data.id;
  group.add(label);

  return {
    data,
    group,
    body: envelope.body,
    flap: envelope.flap,
    label,
    outline: envelope.outline,
    crease: envelope.crease,
    basePosition: new THREE.Vector3(),
    baseRotation: new THREE.Euler(),
    hoverT: 0,
    openT: 0
  };
}

function createPhotoEnvelope(photoUrl: string, index: number): PhotoEnvelopeRuntime {
  const baseAngle = index * (Math.PI / 2);

  const width = 1.5;
  const height = 1.0;
  const depth = 0.18;

  const envelope = createRealisticEnvelope(width, height, depth);
  const group = envelope.group;

  envelope.body.userData.envelopeIndex = index;
  envelope.flap.userData.envelopeIndex = index;

  const photoTexture = textureLoader.load(photoUrl, (texture) => {
    const img = texture.image;
    if (!img || !img.width || !img.height) {
      return;
    }

    const aspect = img.width / img.height;
    const maxW = width * 0.72;
    const maxH = height * 0.72;

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

  const photoGeometry = new THREE.PlaneGeometry(width * 0.72, height * 0.72);
  const photoMaterial = new THREE.MeshBasicMaterial({
    map: photoTexture,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide
  });
  const photo = new THREE.Mesh(photoGeometry, photoMaterial);
  photo.position.set(0, -0.12, -depth / 2 + 0.03);
  photo.scale.setScalar(0.88);
  photo.userData.envelopeIndex = index;
  group.add(photo);

  return {
    group,
    body: envelope.body,
    photo,
    flap: envelope.flap,
    outline: envelope.outline,
    crease: envelope.crease,
    photoUrl,
    index,
    baseAngle,
    depth
  };
}

function createPaperPanel(points: THREE.Vector3[], material: THREE.Material): THREE.Mesh {
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];

  let indices: number[];
  if (points.length === 3) {
    indices = [0, 1, 2];
  } else {
    indices = [0, 1, 2, 0, 2, 3];
  }

  const normal = new THREE.Vector3();
  const edgeA = new THREE.Vector3().subVectors(points[1], points[0]);
  const edgeB = new THREE.Vector3().subVectors(points[points.length === 3 ? 2 : 3], points[0]);
  normal.crossVectors(edgeA, edgeB).normalize();

  for (const index of indices) {
    const point = points[index];
    positions.push(point.x, point.y, point.z);
    normals.push(normal.x, normal.y, normal.z);
    uvs.push(index % 2, Math.floor(index / 2));
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createOrigamiCrane(): THREE.Group {
  const crane = new THREE.Group();
  const mat = paperMaterial.clone();
  mat.color = new THREE.Color("#f4ead9");
  mat.roughness = 0.98;
  mat.metalness = 0;
  mat.side = THREE.DoubleSide;
  mat.flatShading = true;

  const creaseMat = new THREE.LineBasicMaterial({
    color: "#bda98e",
    transparent: true,
    opacity: 0.58
  });

  // Body ridge and key points
  const bodyTop = new THREE.Vector3(0, 0.5, 0.04);
  const bodyBottom = new THREE.Vector3(0.04, -0.54, 0);
  const bodyFront = new THREE.Vector3(0.12, -0.02, 0.42);
  const bodyBack = new THREE.Vector3(-0.08, 0.02, -0.34);

  // Wing roots (slightly wider for a fuller body)
  const leftRootTop = new THREE.Vector3(-0.24, 0.42, 0.08);
  const leftRootBottom = new THREE.Vector3(-0.22, -0.32, 0.06);
  const rightRootTop = new THREE.Vector3(0.24, 0.46, 0.08);
  const rightRootBottom = new THREE.Vector3(0.24, -0.26, 0.04);

  // Wing tips
  const leftWingTip = new THREE.Vector3(-2.35, 0.02, -0.08);
  const rightWingTip = new THREE.Vector3(2.18, 1.1, -0.16);

  // Neck and head
  const neckBase = new THREE.Vector3(-0.08, 0.48, 0.1);
  const neckMid = new THREE.Vector3(-0.38, 1.03, 0.36);
  const headBase = new THREE.Vector3(-0.54, 1.14, 0.5);
  const headTip = new THREE.Vector3(-0.88, 1.05, 0.68);
  const headBack = new THREE.Vector3(-0.5, 1.2, 0.34);

  // Tail
  const tailBase = new THREE.Vector3(0.05, -0.35, -0.12);
  const tailMid = new THREE.Vector3(0.72, -0.28, -0.88);
  const tailTip = new THREE.Vector3(1.42, -0.18, -1.46);

  // Body panels (split into triangles to stay planar)
  crane.add(createPaperPanel([bodyTop, bodyFront, rightRootTop], mat));
  crane.add(createPaperPanel([bodyTop, leftRootTop, bodyFront], mat));
  crane.add(createPaperPanel([bodyFront, leftRootBottom, bodyBottom], mat));
  crane.add(createPaperPanel([bodyFront, bodyBottom, rightRootBottom], mat));
  crane.add(createPaperPanel([bodyTop, rightRootTop, bodyBack], mat));
  crane.add(createPaperPanel([bodyTop, bodyBack, leftRootTop], mat));
  crane.add(createPaperPanel([bodyBottom, leftRootBottom, bodyBack], mat));
  crane.add(createPaperPanel([bodyBottom, bodyBack, rightRootBottom], mat));

  // Wings: three triangular panels per side, all meeting at wing tip
  crane.add(createPaperPanel([bodyTop, leftRootTop, leftWingTip], mat));
  crane.add(createPaperPanel([leftRootTop, leftRootBottom, leftWingTip], mat));
  crane.add(createPaperPanel([leftRootBottom, bodyBottom, leftWingTip], mat));

  crane.add(createPaperPanel([bodyTop, rightWingTip, rightRootTop], mat));
  crane.add(createPaperPanel([rightRootTop, rightWingTip, rightRootBottom], mat));
  crane.add(createPaperPanel([rightRootBottom, rightWingTip, bodyBottom], mat));

  // Neck as a slightly tapered flat panel
  crane.add(createPaperPanel([neckBase, bodyTop, neckMid], mat));

  // Head: small beak pyramid
  crane.add(createPaperPanel([neckMid, headBase, headTip], mat));
  crane.add(createPaperPanel([neckMid, headBack, headBase], mat));
  crane.add(createPaperPanel([headBack, headTip, headBase], mat));

  // Tail: two triangular panels
  crane.add(createPaperPanel([tailBase, tailTip, bodyBottom], mat));
  crane.add(createPaperPanel([tailBase, tailMid, tailTip], mat));
  crane.add(createPaperPanel([tailBase, bodyBottom, tailMid], mat));

  // Crease lines along major folds
  const creasePoints = [
    bodyTop, bodyBottom,
    leftRootTop, leftWingTip,
    leftRootBottom, leftWingTip,
    rightRootTop, rightWingTip,
    rightRootBottom, rightWingTip,
    neckBase, neckMid, headBase, headTip,
    tailBase, tailMid, tailTip
  ];
  const creaseGeometry = new THREE.BufferGeometry().setFromPoints(creasePoints);
  const creases = new THREE.LineSegments(creaseGeometry, creaseMat);
  crane.add(creases);

  // Center the crane visually
  crane.position.y = -0.05;

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

  context.fillStyle = "#f3eadb";
  context.fillRect(0, 0, 1024, 1024);

  const warmWash = context.createRadialGradient(260, 170, 80, 520, 520, 780);
  warmWash.addColorStop(0, "rgba(255,255,250,0.52)");
  warmWash.addColorStop(0.52, "rgba(238,224,203,0.22)");
  warmWash.addColorStop(1, "rgba(190,164,130,0.1)");
  context.fillStyle = warmWash;
  context.fillRect(0, 0, 1024, 1024);

  for (let index = 0; index < 3400; index += 1) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const width = 6 + Math.random() * 34;
    const height = 0.35 + Math.random() * 1.2;
    const alpha = 0.018 + Math.random() * 0.052;
    context.save();
    context.translate(x, y);
    context.rotate((Math.random() - 0.5) * 0.75);
    context.fillStyle = `rgba(118, 96, 66, ${alpha})`;
    context.fillRect(-width / 2, -height / 2, width, height);
    context.restore();
  }

  for (let index = 0; index < 260; index += 1) {
    const startX = Math.random() * 1024;
    const startY = Math.random() * 1024;
    const length = 40 + Math.random() * 130;
    const bend = (Math.random() - 0.5) * 38;
    const alpha = 0.018 + Math.random() * 0.034;
    context.strokeStyle = `rgba(92, 75, 52, ${alpha})`;
    context.lineWidth = 0.45 + Math.random() * 1.25;
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

  for (let index = 0; index < 90; index += 1) {
    const startX = Math.random() * 1024;
    const startY = Math.random() * 1024;
    const length = 80 + Math.random() * 260;
    const alpha = 0.014 + Math.random() * 0.028;
    context.save();
    context.translate(startX, startY);
    context.rotate((Math.random() - 0.5) * Math.PI);
    const wrinkle = context.createLinearGradient(-length / 2, 0, length / 2, 0);
    wrinkle.addColorStop(0, "rgba(255,255,255,0)");
    wrinkle.addColorStop(0.42, `rgba(255,255,255,${alpha})`);
    wrinkle.addColorStop(0.52, `rgba(92,75,52,${alpha * 0.75})`);
    wrinkle.addColorStop(1, "rgba(255,255,255,0)");
    context.strokeStyle = wrinkle;
    context.lineWidth = 1 + Math.random() * 2.2;
    context.beginPath();
    context.moveTo(-length / 2, 0);
    context.quadraticCurveTo(0, (Math.random() - 0.5) * 16, length / 2, (Math.random() - 0.5) * 10);
    context.stroke();
    context.restore();
  }

  for (let index = 0; index < 1100; index += 1) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const radius = 0.5 + Math.random() * 2.4;
    const alpha = 0.018 + Math.random() * 0.034;
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

  for (let index = 0; index < 4200; index += 1) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const alpha = 0.012 + Math.random() * 0.036;
    const shade = 108 + Math.floor(Math.random() * 54);
    context.fillStyle = `rgba(${shade},${shade},${shade},${alpha})`;
    context.fillRect(x, y, 1.5 + Math.random() * 2.5, 1.5 + Math.random() * 2.5);
  }

  for (let index = 0; index < 160; index += 1) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const width = 50 + Math.random() * 180;
    const alpha = 0.016 + Math.random() * 0.036;
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
