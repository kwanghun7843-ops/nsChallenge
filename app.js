const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const MEDIAPIPE_MODULE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/+esm";
const STORAGE_KEY = "namsan-unity-challenge-scores-v1";
const ROUNDS_PER_GAME = 5;
const ROUND_SECONDS = 15;
const HOLD_REQUIRED_MS = 950;
const SEQUENCE_HOLD_MS = 650;
const MUSIC_BEAT_MS = 800;
const MUSIC_TRANSITION_MS = 1200;
const PASS_SCORE = 74;

const LANDMARK = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
};

const GUIDE_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28],
  [0, 11], [0, 12],
];

const ANGLES = [
  [11, 13, 15], [12, 14, 16],
  [13, 11, 23], [14, 12, 24],
  [11, 23, 25], [12, 24, 26],
  [23, 25, 27], [24, 26, 28],
];

// 좌우가 반전된 거울 화면 기준입니다. 해부학적 왼쪽 관절은 화면 오른쪽에 표시됩니다.
const BASE = {
  0: [0.50, 0.11],
  11: [0.62, 0.27], 12: [0.38, 0.27],
  13: [0.68, 0.43], 14: [0.32, 0.43],
  15: [0.70, 0.58], 16: [0.30, 0.58],
  23: [0.58, 0.55], 24: [0.42, 0.55],
  25: [0.62, 0.75], 26: [0.38, 0.75],
  27: [0.68, 0.96], 28: [0.32, 0.96],
};

function makePose(overrides = {}) {
  const pose = {};
  Object.entries(BASE).forEach(([key, value]) => { pose[key] = [...value]; });
  Object.entries(overrides).forEach(([key, value]) => { pose[key] = [...value]; });
  return pose;
}

const POSES = {
  ready: makePose(),
  armsUp: makePose({
    13: [0.75, 0.16], 15: [0.82, 0.04], 14: [0.25, 0.16], 16: [0.18, 0.04],
  }),
  rightArmUp: makePose({
    13: [0.76, 0.15], 15: [0.82, 0.03], 14: [0.26, 0.42], 16: [0.38, 0.56],
  }),
  leftArmUp: makePose({
    13: [0.74, 0.42], 15: [0.62, 0.56], 14: [0.24, 0.15], 16: [0.18, 0.03],
  }),
  crouch: makePose({
    0: [0.50, 0.25], 11: [0.62, 0.38], 12: [0.38, 0.38],
    13: [0.76, 0.47], 15: [0.88, 0.42], 14: [0.24, 0.47], 16: [0.12, 0.42],
    23: [0.59, 0.63], 24: [0.41, 0.63], 25: [0.72, 0.78], 27: [0.78, 0.94],
    26: [0.28, 0.78], 28: [0.22, 0.94],
  }),

  balanceA: makePose({
    0: [0.42, 0.12], 11: [0.54, 0.28], 12: [0.30, 0.24],
    13: [0.72, 0.28], 15: [0.91, 0.28], 14: [0.13, 0.24], 16: [0.01, 0.24],
    25: [0.58, 0.76], 27: [0.60, 0.96], 26: [0.32, 0.69], 28: [0.13, 0.63],
  }),
  balanceB: makePose({
    0: [0.58, 0.12], 11: [0.70, 0.24], 12: [0.46, 0.28],
    13: [0.87, 0.24], 15: [0.99, 0.24], 14: [0.28, 0.28], 16: [0.09, 0.28],
    25: [0.68, 0.69], 27: [0.87, 0.63], 26: [0.42, 0.76], 28: [0.40, 0.96],
  }),
  relayA: makePose({
    13: [0.73, 0.35], 15: [0.95, 0.41], 14: [0.24, 0.19], 16: [0.08, 0.27],
    23: [0.59, 0.57], 24: [0.40, 0.54], 25: [0.68, 0.75], 27: [0.57, 0.94],
    26: [0.31, 0.68], 28: [0.18, 0.84],
  }),
  relayB: makePose({
    13: [0.76, 0.19], 15: [0.92, 0.27], 14: [0.27, 0.35], 16: [0.05, 0.41],
    23: [0.60, 0.54], 24: [0.41, 0.57], 25: [0.69, 0.68], 27: [0.82, 0.84],
    26: [0.32, 0.75], 28: [0.43, 0.94],
  }),
  kickLeft: makePose({
    13: [0.74, 0.30], 15: [0.88, 0.42], 14: [0.26, 0.30], 16: [0.12, 0.18],
    25: [0.64, 0.76], 27: [0.65, 0.96], 26: [0.33, 0.65], 28: [0.06, 0.58],
  }),
  kickRight: makePose({
    13: [0.74, 0.30], 15: [0.88, 0.18], 14: [0.26, 0.30], 16: [0.12, 0.42],
    25: [0.67, 0.65], 27: [0.94, 0.58], 26: [0.36, 0.76], 28: [0.35, 0.96],
  }),
  keeperLeft: makePose({
    0: [0.38, 0.15], 11: [0.50, 0.30], 12: [0.27, 0.27],
    13: [0.31, 0.19], 15: [0.09, 0.12], 14: [0.16, 0.37], 16: [0.02, 0.32],
    25: [0.56, 0.74], 27: [0.70, 0.93], 26: [0.27, 0.72], 28: [0.11, 0.91],
  }),
  keeperRight: makePose({
    0: [0.62, 0.15], 11: [0.73, 0.27], 12: [0.50, 0.30],
    13: [0.84, 0.37], 15: [0.98, 0.32], 14: [0.69, 0.19], 16: [0.91, 0.12],
    25: [0.73, 0.72], 27: [0.89, 0.91], 26: [0.44, 0.74], 28: [0.30, 0.93],
  }),
  passA: makePose({
    13: [0.68, 0.39], 15: [0.55, 0.44], 14: [0.32, 0.39], 16: [0.45, 0.44],
    25: [0.66, 0.75], 27: [0.78, 0.95], 26: [0.34, 0.75], 28: [0.22, 0.95],
  }),
  receiveB: makePose({
    13: [0.74, 0.38], 15: [0.58, 0.44], 14: [0.26, 0.38], 16: [0.42, 0.44],
    25: [0.69, 0.76], 27: [0.78, 0.95], 26: [0.31, 0.76], 28: [0.22, 0.95],
  }),
  followA: makePose({
    13: [0.78, 0.31], 15: [0.94, 0.31], 14: [0.22, 0.31], 16: [0.06, 0.31],
  }),
  shootB: makePose({
    13: [0.68, 0.13], 15: [0.55, 0.02], 14: [0.32, 0.13], 16: [0.45, 0.02],
    25: [0.67, 0.72], 27: [0.77, 0.94], 26: [0.33, 0.72], 28: [0.23, 0.94],
  }),
  championLow: makePose({
    0: [0.50, 0.24], 11: [0.62, 0.38], 12: [0.38, 0.38],
    13: [0.74, 0.18], 15: [0.68, 0.05], 14: [0.26, 0.48], 16: [0.40, 0.57],
    23: [0.59, 0.63], 24: [0.41, 0.63], 25: [0.69, 0.80], 27: [0.77, 0.95],
    26: [0.34, 0.82], 28: [0.32, 0.96],
  }),
  championHigh: makePose({
    13: [0.77, 0.15], 15: [0.91, 0.03], 14: [0.23, 0.15], 16: [0.09, 0.03],
    25: [0.68, 0.74], 27: [0.82, 0.95], 26: [0.32, 0.74], 28: [0.18, 0.95],
  }),

  screamA: makePose({
    13: [0.69, 0.34], 15: [0.57, 0.18], 14: [0.31, 0.34], 16: [0.43, 0.18],
  }),
  screamWave: makePose({
    0: [0.58, 0.12], 11: [0.71, 0.24], 12: [0.47, 0.28],
    13: [0.87, 0.17], 15: [0.98, 0.26], 14: [0.30, 0.37], 16: [0.13, 0.30],
    25: [0.70, 0.72], 27: [0.83, 0.94], 26: [0.39, 0.75], 28: [0.29, 0.95],
  }),
  gothicA: makePose({
    13: [0.68, 0.41], 15: [0.55, 0.54], 14: [0.32, 0.41], 16: [0.45, 0.54],
  }),
  gothicB: makePose({
    13: [0.72, 0.38], 15: [0.55, 0.50], 14: [0.28, 0.47], 16: [0.39, 0.58],
  }),
  athensUp: makePose({
    13: [0.70, 0.13], 15: [0.64, 0.01], 14: [0.27, 0.42], 16: [0.42, 0.53],
  }),
  athensForward: makePose({
    13: [0.76, 0.34], 15: [0.94, 0.34], 14: [0.26, 0.43], 16: [0.42, 0.53],
  }),
  nightCaptain: makePose({
    13: [0.74, 0.36], 15: [0.94, 0.31], 14: [0.27, 0.44], 16: [0.41, 0.55],
    25: [0.67, 0.74], 27: [0.78, 0.95], 26: [0.33, 0.74], 28: [0.24, 0.95],
  }),
  nightLieutenant: makePose({
    13: [0.76, 0.19], 15: [0.86, 0.08], 14: [0.28, 0.39], 16: [0.40, 0.55],
    25: [0.69, 0.73], 27: [0.82, 0.94], 26: [0.34, 0.76], 28: [0.24, 0.96],
  }),
  creationA: makePose({
    13: [0.77, 0.35], 15: [0.98, 0.28], 14: [0.26, 0.46], 16: [0.39, 0.56],
    25: [0.69, 0.74], 27: [0.80, 0.94], 26: [0.34, 0.76], 28: [0.24, 0.96],
  }),
  creationB: makePose({
    13: [0.74, 0.46], 15: [0.61, 0.56], 14: [0.23, 0.35], 16: [0.02, 0.28],
    25: [0.66, 0.76], 27: [0.76, 0.96], 26: [0.31, 0.74], 28: [0.20, 0.94],
  }),

  conductorLeft: makePose({
    13: [0.68, 0.34], 15: [0.51, 0.30], 14: [0.30, 0.34], 16: [0.07, 0.30],
  }),
  conductorRight: makePose({
    13: [0.70, 0.34], 15: [0.93, 0.30], 14: [0.32, 0.34], 16: [0.49, 0.30],
  }),
  leanLeft: makePose({
    0: [0.40, 0.12], 11: [0.53, 0.27], 12: [0.29, 0.24],
    13: [0.70, 0.33], 15: [0.82, 0.42], 14: [0.15, 0.31], 16: [0.03, 0.40],
  }),
  leanRight: makePose({
    0: [0.60, 0.12], 11: [0.71, 0.24], 12: [0.47, 0.27],
    13: [0.85, 0.31], 15: [0.97, 0.40], 14: [0.30, 0.33], 16: [0.18, 0.42],
  }),
  outerA: makePose({
    13: [0.72, 0.42], 15: [0.58, 0.55], 14: [0.23, 0.28], 16: [0.03, 0.28],
  }),
  outerB: makePose({
    13: [0.77, 0.28], 15: [0.97, 0.28], 14: [0.28, 0.42], 16: [0.42, 0.55],
  }),
  innerA: makePose({
    13: [0.78, 0.30], 15: [0.98, 0.30], 14: [0.28, 0.44], 16: [0.42, 0.55],
  }),
  innerB: makePose({
    13: [0.72, 0.44], 15: [0.58, 0.55], 14: [0.22, 0.30], 16: [0.02, 0.30],
  }),
};

const MISSIONS = {
  sports: [
    {
      title: "균형 듀오", type: "hold",
      hint: "서로 반대 방향으로 기울여 좌우 대칭의 균형 장면을 완성하세요.",
      roles: ["왼쪽으로 기울여 한쪽 다리 들기", "오른쪽으로 기울여 한쪽 다리 들기"],
      poses: [POSES.balanceA, POSES.balanceB],
    },
    {
      title: "릴레이 터치", type: "hold", pairRule: "handsNear",
      hint: "달리는 자세를 유지하며 중앙에서 배턴을 건네는 순간을 만드세요.",
      roles: ["앞 주자 · 팔을 뒤로 뻗기", "뒤 주자 · 팔을 앞으로 뻗기"],
      poses: [POSES.relayA, POSES.relayB],
    },
    {
      title: "결정적 한 장면", type: "hold",
      hint: "슈터와 골키퍼가 같은 방향에 반응해 결정적인 순간을 완성하세요.",
      variants: [
        { direction: "왼쪽", roles: ["슈터 · 왼쪽으로 슈팅", "골키퍼 · 왼쪽으로 선방"], poses: [POSES.kickLeft, POSES.keeperLeft] },
        { direction: "오른쪽", roles: ["슈터 · 오른쪽으로 슈팅", "골키퍼 · 오른쪽으로 선방"], poses: [POSES.kickRight, POSES.keeperRight] },
      ],
    },
    {
      title: "패스 앤 슛", type: "sequence",
      hint: "패스와 농구 슛을 순서대로 이어 완성하세요.",
      roles: ["패스 담당", "받아서 슛 담당"],
      steps: [
        { label: "1단계 · 패스", roles: ["가슴 앞에서 패스", "가슴 앞에서 공 받기"], poses: [POSES.passA, POSES.receiveB] },
        { label: "2단계 · 슛", roles: ["양팔을 펼쳐 패스 마무리", "양팔을 머리 위로 올려 슛"], poses: [POSES.followA, POSES.shootB] },
      ],
    },
    {
      title: "챔피언의 순간", type: "hold",
      hint: "서로 다른 높이에서 하나의 우승 세리머니를 완성하세요.",
      roles: ["한쪽 무릎을 낮추고 주먹 들기", "서서 양팔을 V자로 올리기"],
      poses: [POSES.championLow, POSES.championHigh],
    },
  ],
  art: [
    {
      title: "절규", type: "hold", artist: "에드바르 뭉크",
      hint: "절규하는 인물과 흔들리는 배경이 되어 한 장면을 완성하세요.",
      roles: ["양손을 얼굴 가까이에 둔 절규 자세", "몸과 팔을 기울여 흔들리는 배경 표현"],
      poses: [POSES.screamA, POSES.screamWave],
    },
    {
      title: "아메리칸 고딕", type: "hold", artist: "그랜트 우드",
      hint: "나란히 서서 서로 다른 손 위치의 엄숙한 2인 초상을 완성하세요.",
      roles: ["양손을 몸 중앙에 모으기", "한 손은 앞, 다른 손은 몸 가까이"],
      poses: [POSES.gothicA, POSES.gothicB],
    },
    {
      title: "아테네 학당", type: "hold", artist: "라파엘로",
      hint: "위와 앞을 가리키는 두 철학자의 대비되는 동작을 재현하세요.",
      roles: ["한쪽 팔로 하늘을 가리키기", "한쪽 팔을 앞으로 뻗기"],
      poses: [POSES.athensUp, POSES.athensForward],
    },
    {
      title: "야경", type: "hold", artist: "렘브란트",
      hint: "앞쪽 두 인물의 서로 다른 팔 방향과 걸음 자세를 재현하세요.",
      roles: ["팔을 앞으로 뻗은 대장", "몸을 돌려 팔을 세운 부관"],
      poses: [POSES.nightCaptain, POSES.nightLieutenant],
    },
    {
      title: "아담의 창조", type: "hold", artist: "미켈란젤로", pairRule: "handsNear",
      hint: "서로를 향해 팔을 뻗어 두 손끝이 가까워지는 순간을 완성하세요.",
      roles: ["오른쪽을 향해 팔 뻗기", "왼쪽을 향해 팔 뻗기"],
      poses: [POSES.creationA, POSES.creationB],
    },
  ],
  music: [
    {
      title: "같은 박", type: "beat", hint: "1·3박에 함께 팔을 올리고 2·4박에 내리세요.",
      roles: ["1·3박에 양팔 올리기", "1·3박에 양팔 올리기"],
      beats: [
        [POSES.armsUp, POSES.armsUp], [POSES.ready, POSES.ready],
        [POSES.armsUp, POSES.armsUp], [POSES.ready, POSES.ready],
      ],
    },
    {
      title: "주고받는 박", type: "beat", hint: "A는 홀수 박, B는 짝수 박에 팔을 들어 리듬을 주고받으세요.",
      roles: ["1·3박에 팔 들기", "2·4박에 팔 들기"],
      beats: [
        [POSES.rightArmUp, POSES.ready], [POSES.ready, POSES.leftArmUp],
        [POSES.leftArmUp, POSES.ready], [POSES.ready, POSES.rightArmUp],
      ],
    },
    {
      title: "높고 낮은 멜로디", type: "beat", hint: "높은 자세와 낮은 자세를 3박째에 서로 바꾸세요.",
      roles: ["높게 시작해 3박에 낮추기", "낮게 시작해 3박에 높이기"],
      beats: [
        [POSES.armsUp, POSES.crouch], [POSES.armsUp, POSES.crouch],
        [POSES.crouch, POSES.armsUp], [POSES.crouch, POSES.armsUp],
      ],
    },
    {
      title: "지휘자와 연주자", type: "beat", hint: "지휘 방향을 따라 왼쪽·오른쪽·아래·위로 움직이세요.",
      roles: ["박자마다 방향을 제시하는 지휘자", "지휘 방향에 몸으로 반응하는 연주자"],
      beats: [
        [POSES.conductorLeft, POSES.leanLeft], [POSES.conductorRight, POSES.leanRight],
        [POSES.ready, POSES.crouch], [POSES.armsUp, POSES.armsUp],
      ],
    },
    {
      title: "마지막 합주", type: "beat", hint: "8박 동안 동작을 주고받고 마지막 박에 함께 피날레를 완성하세요.",
      roles: ["홀수 박을 이끌고 피날레", "짝수 박을 이어받고 피날레"],
      beats: [
        [POSES.rightArmUp, POSES.ready], [POSES.ready, POSES.leftArmUp],
        [POSES.crouch, POSES.armsUp], [POSES.armsUp, POSES.crouch],
        [POSES.outerA, POSES.outerB], [POSES.innerA, POSES.innerB],
        [POSES.ready, POSES.ready], [POSES.armsUp, POSES.armsUp],
      ],
    },
  ],
};

const MODE_LABELS = { sports: "체육 모드", art: "미술 모드", music: "음악 모드" };

const $ = (selector) => document.querySelector(selector);
const screens = [...document.querySelectorAll(".screen")];
const video = $("#cameraVideo");
const canvas = $("#poseCanvas");
const ctx = canvas.getContext("2d");

let selectedMode = "sports";
let poseLandmarker = null;
let FilesetResolver = null;
let PoseLandmarker = null;
let mediaStream = null;
let rafId = null;
let lastVideoTime = -1;
let lastLandmarks = [];
let roundIndex = 0;
let roundScores = [];
let currentMission = null;
let roundStartedAt = 0;
let holdStartedAt = null;
let bestRoundScore = 0;
let resolvingRound = false;
let gameRunning = false;
let soundEnabled = true;
let audioContext = null;
let wakeLock = null;
let smoothedScores = [0, 0];
let activeStepIndex = 0;
let completedStepScores = [];
let bestStepScore = 0;
let beatStartedAt = 0;
let beatBestScores = [];
let currentBeatIndex = 0;
let currentBeatPhase = "waiting";
let lastBeatMarker = "";

function showScreen(id) {
  screens.forEach((screen) => screen.classList.toggle("is-active", screen.id === id));
  $("#homeBtn").hidden = id === "introScreen";
}

document.querySelectorAll(".mode-card").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".mode-card").forEach((item) => item.classList.remove("is-selected"));
    button.classList.add("is-selected");
    selectedMode = button.dataset.mode;
    beep(520, 0.06);
  });
});

$("#soundBtn").addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  $("#soundBtn").textContent = soundEnabled ? "🔊" : "🔇";
  if (soundEnabled) beep(620, 0.06);
});

$("#startBtn").addEventListener("click", startGame);
$("#retryBtn").addEventListener("click", startCameraAndModel);
$("#replayBtn").addEventListener("click", startGame);
$("#changeModeBtn").addEventListener("click", goHome);
$("#homeBtn").addEventListener("click", goHome);
$("#rankingBtn").addEventListener("click", showRanking);
$("#rankingBackBtn").addEventListener("click", goHome);
$("#resetRankingBtn").addEventListener("click", resetRanking);

async function startGame() {
  stopCamera();
  showScreen("gameScreen");
  roundIndex = 0;
  roundScores = [];
  resolvingRound = false;
  gameRunning = false;
  $("#cameraLoading").classList.remove("is-hidden");
  $("#retryBtn").hidden = true;
  $("#loadingTitle").textContent = "카메라를 준비하고 있어요";
  $("#loadingText").textContent = "처음 실행할 때는 모델을 불러오는 데 시간이 걸릴 수 있어요.";
  await enterImmersiveMode();
  await startCameraAndModel();
}

async function startCameraAndModel() {
  $("#retryBtn").hidden = true;
  $("#cameraLoading").classList.remove("is-hidden");
  try {
    if (!poseLandmarker) {
      $("#loadingTitle").textContent = "동작 인식 모델을 불러오는 중";
      if (!FilesetResolver || !PoseLandmarker) {
        const visionModule = await import(MEDIAPIPE_MODULE_URL);
        FilesetResolver = visionModule.FilesetResolver;
        PoseLandmarker = visionModule.PoseLandmarker;
      }
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      const options = {
        runningMode: "VIDEO",
        numPoses: 2,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      };
      try {
        poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          ...options,
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        });
      } catch (gpuError) {
        console.warn("GPU 가속을 사용할 수 없어 CPU 모드로 전환합니다.", gpuError);
        poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          ...options,
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
        });
      }
    }

    $("#loadingTitle").textContent = "카메라 권한을 확인하는 중";
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30, max: 30 },
      },
    });
    video.srcObject = mediaStream;
    await video.play();
    await new Promise((resolve) => {
      if (video.readyState >= 2) resolve();
      else video.addEventListener("loadeddata", resolve, { once: true });
    });

    $("#cameraLoading").classList.add("is-hidden");
    gameRunning = true;
    prepareRound();
    detectLoop();
  } catch (error) {
    console.error(error);
    $("#loadingTitle").textContent = "카메라를 시작할 수 없어요";
    $("#loadingText").textContent = cameraErrorMessage(error);
    $("#retryBtn").hidden = false;
  }
}

function cameraErrorMessage(error) {
  if (!window.isSecureContext) return "GitHub Pages의 HTTPS 주소로 접속했는지 확인해 주세요.";
  if (error?.name === "NotAllowedError") return "주소창의 카메라 권한을 허용한 뒤 다시 시도해 주세요.";
  if (error?.name === "NotFoundError") return "사용 가능한 전면 카메라를 찾지 못했습니다.";
  return "인터넷 연결과 카메라 권한을 확인한 뒤 다시 시도해 주세요.";
}

function prepareRound() {
  if (!gameRunning) return;
  const baseMission = MISSIONS[selectedMode][roundIndex % MISSIONS[selectedMode].length];
  currentMission = resolveMission(baseMission);
  roundStartedAt = performance.now();
  holdStartedAt = null;
  bestRoundScore = 0;
  smoothedScores = [0, 0];
  activeStepIndex = 0;
  completedStepScores = [];
  bestStepScore = 0;
  beatStartedAt = 0;
  beatBestScores = Array(currentMission.beats?.length || 0).fill(0);
  currentBeatIndex = 0;
  currentBeatPhase = "waiting";
  lastBeatMarker = "";
  resolvingRound = false;
  $("#roundLabel").textContent = `ROUND ${roundIndex + 1}`;
  $("#modeLabel").textContent = currentMission.artist
    ? `${MODE_LABELS[selectedMode]} · ${currentMission.artist}`
    : MODE_LABELS[selectedMode];
  $("#missionTitle").textContent = currentMission.title;
  $("#missionHint").textContent = currentMission.hint;
  $("#timerValue").textContent = missionDurationSeconds(currentMission);
  $("#statusText").textContent = currentMission.type === "beat"
    ? "먼저 한 번 연습한 뒤 같은 순서로 도전합니다"
    : "두 사람이 안내선 안에 서 주세요";
  $("#holdFill").style.width = "0%";
  $("#p1Score").textContent = "준비";
  $("#p2Score").textContent = "준비";
  updateRoleLabels();
  setupBeatPanel();
  countdown().then(() => {
    if (!gameRunning || resolvingRound) return;
    roundStartedAt = performance.now();
    if (currentMission.type === "beat") {
      beatStartedAt = roundStartedAt;
      currentBeatPhase = "practice";
      setBeatDisplay(0, "practice");
    }
  });
}

function resolveMission(baseMission) {
  if (!baseMission.variants?.length) return { ...baseMission };
  const variant = baseMission.variants[Math.floor(Math.random() * baseMission.variants.length)];
  return {
    ...baseMission,
    ...variant,
    hint: `${baseMission.hint} · 방향: ${variant.direction}`,
  };
}

function missionDurationSeconds(mission) {
  if (mission.type !== "beat") return ROUND_SECONDS;
  const totalMs = mission.beats.length * MUSIC_BEAT_MS * 2 + MUSIC_TRANSITION_MS;
  return Math.ceil(totalMs / 1000);
}

function activeMissionStep() {
  if (!currentMission) return null;
  if (currentMission.type === "sequence") return currentMission.steps[activeStepIndex];
  if (currentMission.type === "beat") return { poses: currentMission.beats[currentBeatIndex] || currentMission.beats[0] };
  return currentMission;
}

function activeTargetPoses() {
  return activeMissionStep()?.poses || [POSES.ready, POSES.ready];
}

function updateRoleLabels() {
  const step = activeMissionStep();
  const roles = step?.roles || currentMission?.roles || ["왼쪽 역할", "오른쪽 역할"];
  $("#p1Role").textContent = roles[0];
  $("#p2Role").textContent = roles[1];
}

function setupBeatPanel() {
  const panel = $("#beatPanel");
  panel.hidden = currentMission.type !== "beat";
  if (panel.hidden) return;
  $("#beatPhase").textContent = "연습 준비";
  $("#beatDots").innerHTML = currentMission.beats
    .map((_, index) => `<span class="beat-dot${index === 0 ? " is-downbeat" : ""}">${index + 1}</span>`)
    .join("");
}

function setBeatDisplay(index, phase) {
  currentBeatIndex = Math.max(0, Math.min(index, currentMission.beats.length - 1));
  currentBeatPhase = phase;
  const labels = { practice: "연습", transition: "도전 준비", challenge: "도전" };
  $("#beatPhase").textContent = labels[phase] || "준비";
  [...$("#beatDots").children].forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", phase !== "transition" && dotIndex === currentBeatIndex);
  });
  updateRoleLabels();

  const marker = `${phase}-${currentBeatIndex}`;
  if (marker !== lastBeatMarker && phase !== "transition") {
    beep(currentBeatIndex === 0 ? 760 : 560, currentBeatIndex === 0 ? 0.12 : 0.07);
    lastBeatMarker = marker;
  }
}

async function countdown() {
  const element = $("#countdown");
  element.hidden = false;
  for (const value of [3, 2, 1]) {
    element.textContent = value;
    beep(440 + (3 - value) * 100, 0.09);
    await wait(650);
  }
  element.textContent = "START!";
  beep(820, 0.12);
  await wait(500);
  element.hidden = true;
}

function detectLoop() {
  if (!gameRunning || !poseLandmarker) return;
  resizeCanvas();
  if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    try {
      const results = poseLandmarker.detectForVideo(video, performance.now());
      lastLandmarks = results.landmarks || [];
    } catch (error) {
      console.warn("Pose detection skipped", error);
    }
  }
  renderFrame(lastLandmarks);
  rafId = requestAnimationFrame(detectLoop);
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(rect.width * dpr);
  const height = Math.round(rect.height * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function renderFrame(detectedPoses) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  ctx.clearRect(0, 0, width, height);

  if (!currentMission) return;
  if (currentMission.type === "beat" && $("#countdown").hidden && beatStartedAt) {
    syncBeatClock(performance.now());
  }

  const sorted = detectedPoses
    .map(mirrorLandmarks)
    .filter(hasUsableBody)
    .sort((a, b) => bodyCenterX(a) - bodyCenterX(b));

  const playerPoses = [sorted[0] || null, sorted[1] || null];
  const targetPoses = activeTargetPoses();
  const rawScores = playerPoses.map((pose, index) => pose ? scorePose(pose, targetPoses[index]) : 0);
  const scores = rawScores.map((score, index) => {
    if (!playerPoses[index]) return 0;
    const previous = smoothedScores[index];
    smoothedScores[index] = previous > 0 ? Math.round(previous * 0.62 + score * 0.38) : score;
    return smoothedScores[index];
  });
  const colors = scores.map(scoreColor);

  drawZones(width, height);
  drawTarget(targetPoses[0], 0, colors[0], width, height);
  drawTarget(targetPoses[1], 1, colors[1], width, height);
  playerPoses.forEach((pose, index) => {
    if (pose) drawDetected(pose, colors[index], width, height);
  });

  updateGameState(playerPoses, scores);
}

function mirrorLandmarks(landmarks) {
  return landmarks.map((point) => ({ ...point, x: 1 - point.x }));
}

function hasUsableBody(pose) {
  const required = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
  return required.filter((index) => (pose[index]?.visibility ?? 1) > 0.42).length >= 9;
}

function bodyCenterX(pose) {
  return ((pose[23]?.x ?? 0) + (pose[24]?.x ?? 0)) / 2;
}

function updateGameState(playerPoses, scores) {
  if (resolvingRound || $("#countdown").hidden === false) return;
  if (currentMission.type === "beat") {
    updateBeatGame(playerPoses, scores);
    return;
  }
  if (currentMission.type === "sequence") {
    updateSequenceGame(playerPoses, scores);
    return;
  }
  updateHoldGame(playerPoses, scores);
}

function updateHoldGame(playerPoses, scores) {
  const now = performance.now();
  const remaining = Math.max(0, ROUND_SECONDS - Math.floor((now - roundStartedAt) / 1000));
  $("#timerValue").textContent = remaining;
  updateLiveScoreLabels(playerPoses, scores);

  const readiness = playerReadinessMessage(playerPoses);
  if (readiness) {
    holdStartedAt = null;
    $("#holdFill").style.width = "0%";
    $("#statusText").textContent = readiness;
  } else {
    const pairScore = currentMission.pairRule === "handsNear" ? handConnectionScore(playerPoses) : null;
    const roundScore = combinedRoundScore(scores, pairScore);
    bestRoundScore = Math.max(bestRoundScore, roundScore);
    const pairReady = pairScore === null || pairScore >= 55;
    if (scores[0] >= PASS_SCORE && scores[1] >= PASS_SCORE && pairReady) {
      if (!holdStartedAt) holdStartedAt = now;
      const progress = Math.min(1, (now - holdStartedAt) / HOLD_REQUIRED_MS);
      $("#holdFill").style.width = `${Math.round(progress * 100)}%`;
      $("#statusText").textContent = progress < 1 ? "좋아요! 그대로 멈춰 주세요" : "완벽한 순간!";
      if (progress >= 1) finishRound(roundScore);
    } else {
      holdStartedAt = null;
      $("#holdFill").style.width = "0%";
      $("#statusText").textContent = !pairReady
        ? "두 사람의 뻗은 손을 화면 중앙에서 더 가까이 맞춰 주세요"
        : feedbackForScores(scores);
    }
  }

  if (remaining <= 0) finishRound(bestRoundScore);
}

function updateSequenceGame(playerPoses, scores) {
  const now = performance.now();
  const remaining = Math.max(0, ROUND_SECONDS - Math.floor((now - roundStartedAt) / 1000));
  $("#timerValue").textContent = remaining;
  updateLiveScoreLabels(playerPoses, scores);

  const step = currentMission.steps[activeStepIndex];
  const readiness = playerReadinessMessage(playerPoses);
  if (readiness) {
    holdStartedAt = null;
    $("#holdFill").style.width = "0%";
    $("#statusText").textContent = readiness;
  } else {
    const stepScore = teamworkScore(scores[0], scores[1]);
    bestStepScore = Math.max(bestStepScore, stepScore);
    if (scores[0] >= PASS_SCORE && scores[1] >= PASS_SCORE) {
      if (!holdStartedAt) holdStartedAt = now;
      const progress = Math.min(1, (now - holdStartedAt) / SEQUENCE_HOLD_MS);
      $("#holdFill").style.width = `${Math.round(progress * 100)}%`;
      $("#statusText").textContent = `${step.label} · 그대로 유지하세요`;
      if (progress >= 1) completeSequenceStep(stepScore);
    } else {
      holdStartedAt = null;
      $("#holdFill").style.width = "0%";
      $("#statusText").textContent = `${step.label} · ${feedbackForScores(scores)}`;
    }
  }

  if (remaining <= 0) {
    const captured = [...completedStepScores, bestStepScore];
    const score = Math.round(captured.reduce((sum, value) => sum + value, 0) / currentMission.steps.length);
    finishRound(score);
  }
}

function completeSequenceStep(score) {
  completedStepScores.push(score);
  activeStepIndex += 1;
  holdStartedAt = null;
  bestStepScore = 0;
  smoothedScores = [0, 0];
  $("#holdFill").style.width = "0%";
  beep(760, 0.1);

  if (activeStepIndex >= currentMission.steps.length) {
    const total = completedStepScores.reduce((sum, value) => sum + value, 0);
    finishRound(Math.round(total / completedStepScores.length));
    return;
  }

  updateRoleLabels();
  const nextStep = currentMission.steps[activeStepIndex];
  $("#statusText").textContent = `${nextStep.label} 준비!`;
}

function syncBeatClock(now) {
  if (!beatStartedAt || currentMission.type !== "beat") return;
  const practiceDuration = currentMission.beats.length * MUSIC_BEAT_MS;
  const elapsed = now - beatStartedAt;

  if (elapsed < practiceDuration) {
    setBeatDisplay(Math.floor(elapsed / MUSIC_BEAT_MS), "practice");
    return;
  }
  if (elapsed < practiceDuration + MUSIC_TRANSITION_MS) {
    setBeatDisplay(0, "transition");
    return;
  }

  const challengeElapsed = elapsed - practiceDuration - MUSIC_TRANSITION_MS;
  if (challengeElapsed < practiceDuration) {
    setBeatDisplay(Math.floor(challengeElapsed / MUSIC_BEAT_MS), "challenge");
    return;
  }

  currentBeatPhase = "finished";
}

function updateBeatGame(playerPoses, scores) {
  const now = performance.now();
  syncBeatClock(now);
  const durationMs = currentMission.beats.length * MUSIC_BEAT_MS * 2 + MUSIC_TRANSITION_MS;
  const remaining = Math.max(0, Math.ceil((durationMs - (now - beatStartedAt)) / 1000));
  $("#timerValue").textContent = remaining;
  updateLiveScoreLabels(playerPoses, scores);

  if (currentBeatPhase === "finished") {
    const score = Math.round(beatBestScores.reduce((sum, value) => sum + value, 0) / beatBestScores.length);
    finishRound(score);
    return;
  }
  if (currentBeatPhase === "transition") {
    $("#statusText").textContent = "연습 완료! 이제 실제 도전이 시작됩니다";
    $("#holdFill").style.width = "0%";
    return;
  }

  const readiness = playerReadinessMessage(playerPoses);
  if (readiness) {
    $("#statusText").textContent = readiness;
  } else if (currentBeatPhase === "practice") {
    $("#statusText").textContent = `연습 ${currentBeatIndex + 1}박 · 안내선의 변화를 익히세요`;
  } else {
    const beatScore = teamworkScore(scores[0], scores[1]);
    beatBestScores[currentBeatIndex] = Math.max(beatBestScores[currentBeatIndex], beatScore);
    $("#statusText").textContent = `도전 ${currentBeatIndex + 1}박 · 박자와 동작을 함께 맞추세요`;
  }

  const phaseStart = currentBeatPhase === "practice"
    ? beatStartedAt
    : beatStartedAt + currentMission.beats.length * MUSIC_BEAT_MS + MUSIC_TRANSITION_MS;
  const beatProgress = ((now - phaseStart) % MUSIC_BEAT_MS) / MUSIC_BEAT_MS;
  $("#holdFill").style.width = `${Math.round(beatProgress * 100)}%`;
}

function updateLiveScoreLabels(playerPoses, scores) {
  $("#p1Score").textContent = playerPoses[0] ? `${scores[0]}점` : "찾는 중";
  $("#p2Score").textContent = playerPoses[1] ? `${scores[1]}점` : "찾는 중";
}

function playerReadinessMessage(playerPoses) {
  if (!playerPoses[0] || !playerPoses[1]) return "두 사람의 전신이 모두 보이게 서 주세요";
  if (bodyCenterX(playerPoses[0]) > 0.5 || bodyCenterX(playerPoses[1]) < 0.5) {
    return "한 명씩 좌우 안내 영역에 나누어 서 주세요";
  }
  return "";
}

function combinedRoundScore(scores, pairScore) {
  const poseScore = teamworkScore(scores[0], scores[1]);
  if (pairScore === null) return poseScore;
  return Math.round(poseScore * 0.85 + pairScore * 0.15);
}

function handConnectionScore(playerPoses) {
  const leftWrists = [playerPoses[0][15], playerPoses[0][16]].filter(Boolean);
  const rightWrists = [playerPoses[1][15], playerPoses[1][16]].filter(Boolean);
  let minimum = Infinity;
  leftWrists.forEach((left) => rightWrists.forEach((right) => {
    minimum = Math.min(minimum, Math.hypot(left.x - right.x, left.y - right.y));
  }));
  if (!Number.isFinite(minimum)) return 0;
  return Math.round(Math.max(0, Math.min(100, (0.28 - minimum) / 0.22 * 100)));
}

function teamworkScore(a, b) {
  const average = (a + b) / 2;
  const balanceBonus = Math.max(0, 8 - Math.abs(a - b) * 0.35);
  return Math.max(0, Math.min(100, Math.round(average * 0.92 + balanceBonus)));
}

function feedbackForScores(scores) {
  if (scores[0] >= PASS_SCORE && scores[1] < PASS_SCORE) return "PLAYER B가 안내선에 조금 더 맞춰 주세요";
  if (scores[1] >= PASS_SCORE && scores[0] < PASS_SCORE) return "PLAYER A가 안내선에 조금 더 맞춰 주세요";
  if (Math.max(...scores) >= 60) return "거의 다 왔어요! 팔과 다리 각도를 확인하세요";
  return "반투명 안내선에 몸을 맞춰 보세요";
}

async function finishRound(score) {
  if (resolvingRound) return;
  resolvingRound = true;
  roundScores.push(Math.max(0, score));
  const flash = $("#roundFlash");
  $("#roundScore").textContent = score;
  flash.querySelector("span").textContent = score >= 90 ? "환상의 호흡!" : score >= 75 ? "일심동체 성공!" : "도전 완료!";
  flash.hidden = false;
  successChime(score);
  await wait(1500);
  flash.hidden = true;
  roundIndex += 1;
  if (roundIndex >= ROUNDS_PER_GAME) showResults();
  else prepareRound();
}

function showResults() {
  gameRunning = false;
  stopCamera();
  const total = roundScores.reduce((sum, value) => sum + value, 0);
  saveScore(total);
  const best = getScores()[0]?.score ?? total;
  $("#finalScore").textContent = total;
  $("#bestScore").textContent = `${best}점`;
  $("#resultMessage").textContent = resultMessage(total);
  $("#scoreSummary").innerHTML = roundScores
    .map((score, index) => {
      const title = MISSIONS[selectedMode][index]?.title || `ROUND ${index + 1}`;
      return `<span class="round-chip">${index + 1}. ${title} <b>${score}점</b></span>`;
    })
    .join("");
  showScreen("resultScreen");
  successChime(Math.round(total / ROUNDS_PER_GAME));
}

function resultMessage(total) {
  if (total >= 450) return "말하지 않아도 통하는 환상의 듀오!";
  if (total >= 375) return "두 사람의 호흡이 거의 완벽해요!";
  if (total >= 300) return "제법 잘 통하는 사이군요!";
  return "한 번 더 도전하면 훨씬 잘 맞을 거예요!";
}

function scorePose(actual, target) {
  const similarities = ANGLES.map(([a, b, c]) => {
    const actualAngle = angle(actual[a], actual[b], actual[c]);
    const targetAngle = angle(point(target[a]), point(target[b]), point(target[c]));
    if (!Number.isFinite(actualAngle) || !Number.isFinite(targetAngle)) return 0;
    const difference = Math.abs(actualAngle - targetAngle);
    return Math.max(0, 100 - difference * 1.35);
  });

  const torsoActual = angle(actual[11], midpoint(actual[11], actual[12]), actual[12]);
  const visible = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]
    .filter((index) => (actual[index]?.visibility ?? 1) > 0.45).length;
  const visibilityFactor = Math.min(1, visible / 10);
  const raw = similarities.reduce((sum, value) => sum + value, 0) / similarities.length;
  return Math.round(Math.max(0, Math.min(100, raw * visibilityFactor + (Number.isFinite(torsoActual) ? 3 : 0))));
}

function point(coords) { return { x: coords[0], y: coords[1] }; }
function midpoint(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
function angle(a, b, c) {
  if (!a || !b || !c) return NaN;
  const ab = Math.atan2(a.y - b.y, a.x - b.x);
  const cb = Math.atan2(c.y - b.y, c.x - b.x);
  let degrees = Math.abs((ab - cb) * 180 / Math.PI);
  if (degrees > 180) degrees = 360 - degrees;
  return degrees;
}

function scoreColor(score) {
  if (score >= PASS_SCORE) return "#65ff8e";
  if (score >= 55) return "#ffd53f";
  return "#ff5b6e";
}

function drawZones(width, height) {
  ctx.save();
  ctx.setLineDash([9, 9]);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(76, 226, 255, .25)";
  [0.05, 0.52].forEach((x) => {
    roundedRect(ctx, width * x, height * 0.08, width * 0.43, height * 0.82, 20);
    ctx.stroke();
  });
  ctx.restore();
}

function drawTarget(target, playerIndex, color, width, height) {
  const centerX = width * (playerIndex === 0 ? 0.265 : 0.735);
  const guideWidth = width * 0.34;
  const guideHeight = height * 0.86;
  const top = height * 0.06;
  const toCanvas = (coords) => ({
    x: centerX + (coords[0] - 0.5) * guideWidth,
    y: top + coords[1] * guideHeight,
  });

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = Math.max(15, width * 0.014);
  ctx.strokeStyle = color;
  GUIDE_CONNECTIONS.forEach(([a, b]) => drawLine(toCanvas(target[a]), toCanvas(target[b])));

  ctx.globalAlpha = 0.88;
  ctx.setLineDash([10, 7]);
  ctx.lineWidth = Math.max(3, width * 0.003);
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  GUIDE_CONNECTIONS.forEach(([a, b]) => drawLine(toCanvas(target[a]), toCanvas(target[b])));
  Object.values(target).forEach((coords) => drawNode(toCanvas(coords), color, Math.max(4, width * 0.004)));
  ctx.restore();
}

function drawDetected(pose, color, width, height) {
  const toCanvas = (landmark) => ({ x: landmark.x * width, y: landmark.y * height });
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = 0.94;
  ctx.lineWidth = Math.max(3, width * 0.0024);
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  GUIDE_CONNECTIONS.forEach(([a, b]) => {
    if ((pose[a]?.visibility ?? 1) > 0.4 && (pose[b]?.visibility ?? 1) > 0.4) {
      drawLine(toCanvas(pose[a]), toCanvas(pose[b]));
    }
  });
  [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].forEach((index) => {
    if ((pose[index]?.visibility ?? 1) > 0.4) drawNode(toCanvas(pose[index]), color, Math.max(3, width * 0.003));
  });
  ctx.restore();
}

function drawLine(a, b) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function drawNode(pointValue, color, radius) {
  ctx.beginPath();
  ctx.arc(pointValue.x, pointValue.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function saveScore(score) {
  const scores = getScores();
  scores.push({ score, mode: selectedMode, at: new Date().toISOString() });
  scores.sort((a, b) => b.score - a.score || new Date(b.at) - new Date(a.at));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores.slice(0, 10)));
}

function getScores() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => Number.isFinite(item.score)) : [];
  } catch {
    return [];
  }
}

function showRanking() {
  renderRanking();
  showScreen("rankingScreen");
}

function renderRanking() {
  const scores = getScores();
  $("#rankingList").innerHTML = scores.length
    ? scores.map((item, index) => {
        const date = new Date(item.at);
        const displayDate = `${date.getMonth() + 1}.${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
        return `<li><span class="rank">${index + 1}</span><span><b>${MODE_LABELS[item.mode] || "랜덤 모드"}</b><br><small class="date">${displayDate}</small></span><strong class="score">${item.score}점</strong></li>`;
      }).join("")
    : '<li class="empty">아직 기록이 없습니다. 첫 번째 기록을 만들어 보세요!</li>';
}

function resetRanking() {
  if (!confirm("이 태블릿에 저장된 TOP 10 기록을 모두 지울까요?")) return;
  localStorage.removeItem(STORAGE_KEY);
  renderRanking();
}

function goHome() {
  gameRunning = false;
  stopCamera();
  showScreen("introScreen");
}

function stopCamera() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  lastVideoTime = -1;
  lastLandmarks = [];
  if (mediaStream) mediaStream.getTracks().forEach((track) => track.stop());
  mediaStream = null;
  video.srcObject = null;
}

async function enterImmersiveMode() {
  try {
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
  } catch { /* 전체 화면이 막혀도 게임은 계속됩니다. */ }
  try {
    if (screen.orientation?.lock) await screen.orientation.lock("landscape");
  } catch { /* 미지원 기기는 CSS 회전 안내를 사용합니다. */ }
  try {
    if ("wakeLock" in navigator) wakeLock = await navigator.wakeLock.request("screen");
  } catch { /* 화면 꺼짐 방지 미지원 */ }
}

function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

function beep(frequency, duration) {
  if (!soundEnabled) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration + 0.02);
  } catch { /* 효과음 실패는 게임 진행에 영향 없음 */ }
}

function successChime(score) {
  if (!soundEnabled) return;
  [0, 110, 220].forEach((delay, index) => setTimeout(() => beep((score >= 90 ? 660 : 540) + index * 120, 0.16), delay));
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("beforeunload", stopCamera);
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState === "visible" && "wakeLock" in navigator && gameRunning) {
    try { wakeLock = await navigator.wakeLock.request("screen"); } catch { /* ignore */ }
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}

