const APP_BASE_URL = new URL("./", import.meta.url);
const MODEL_URL = new URL("models/pose_landmarker_lite.task", APP_BASE_URL).href;
const WASM_URL = new URL("vendor/mediapipe/wasm", APP_BASE_URL).href.replace(/\/$/, "");
const MEDIAPIPE_MODULE_URL = new URL("vendor/mediapipe/vision_bundle.mjs", APP_BASE_URL).href;
const STORAGE_KEY = "namsan-unity-challenge-scores-v1";
const ROUNDS_PER_GAME = 5;
const ROUND_SECONDS = 15;
const HOLD_REQUIRED_MS = 950;
const PASS_SCORE = 74;
const MUSIC_PREVIEW_MS = 5200;
const MUSIC_BPM = 93.487;
const MUSIC_BEAT_OFFSET_SECONDS = 0.968;
const MUSIC_BEAT_MS = (60_000 / MUSIC_BPM) * 4;
const MUSIC_WINDOW_MS = 850;

const BGM_TRACKS = {
  sports: { src: "./assets/audio/sync-rush.mp3", volume: 0.34 },
  art: { src: "./assets/audio/living-canvas.mp3", volume: 0.29 },
  music: { src: "./assets/audio/neon-unity.mp3", volume: 0.28 },
};

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
  neutral: makePose(),
  victoryHigh: makePose({
    13: [0.75, 0.17], 15: [0.88, 0.05], 14: [0.25, 0.17], 16: [0.12, 0.05],
    25: [0.68, 0.74], 27: [0.82, 0.95], 26: [0.32, 0.74], 28: [0.18, 0.95],
  }),
  victoryLow: makePose({
    13: [0.75, 0.48], 15: [0.88, 0.60], 14: [0.25, 0.48], 16: [0.12, 0.60],
    23: [0.59, 0.60], 24: [0.41, 0.60], 25: [0.68, 0.78], 27: [0.78, 0.94],
    26: [0.32, 0.78], 28: [0.22, 0.94],
  }),
  balanceLeft: makePose({
    0: [0.42, 0.13], 11: [0.54, 0.28], 12: [0.30, 0.25],
    13: [0.78, 0.28], 15: [0.96, 0.28], 14: [0.12, 0.22], 16: [0.01, 0.16],
    23: [0.50, 0.55], 24: [0.34, 0.53], 25: [0.56, 0.76], 27: [0.58, 0.96],
    26: [0.26, 0.67], 28: [0.08, 0.60],
  }),
  balanceRight: makePose({
    0: [0.58, 0.13], 11: [0.70, 0.25], 12: [0.46, 0.28],
    13: [0.88, 0.22], 15: [0.99, 0.16], 14: [0.22, 0.28], 16: [0.04, 0.28],
    23: [0.66, 0.53], 24: [0.50, 0.55], 25: [0.74, 0.67], 27: [0.92, 0.60],
    26: [0.44, 0.76], 28: [0.42, 0.96],
  }),
  runnerLeft: makePose({
    13: [0.78, 0.35], 15: [0.62, 0.47], 14: [0.27, 0.17], 16: [0.13, 0.27],
    23: [0.60, 0.57], 24: [0.40, 0.54], 25: [0.69, 0.75], 27: [0.59, 0.93],
    26: [0.31, 0.68], 28: [0.20, 0.84],
  }),
  runnerRight: makePose({
    13: [0.73, 0.17], 15: [0.87, 0.27], 14: [0.22, 0.35], 16: [0.38, 0.47],
    23: [0.60, 0.54], 24: [0.40, 0.57], 25: [0.69, 0.68], 27: [0.80, 0.84],
    26: [0.31, 0.75], 28: [0.41, 0.93],
  }),
  goalkeeper: makePose({
    13: [0.82, 0.35], 15: [0.96, 0.31], 14: [0.18, 0.35], 16: [0.04, 0.31],
    23: [0.60, 0.58], 24: [0.40, 0.58], 25: [0.72, 0.75], 27: [0.80, 0.94],
    26: [0.28, 0.75], 28: [0.20, 0.94],
  }),
  basketballShot: makePose({
    13: [0.68, 0.14], 15: [0.54, 0.03], 14: [0.32, 0.14], 16: [0.46, 0.03],
    25: [0.66, 0.78], 27: [0.72, 0.96], 26: [0.34, 0.78], 28: [0.28, 0.96],
  }),
  passRight: makePose({
    13: [0.78, 0.36], 15: [0.94, 0.42], 14: [0.64, 0.38], 16: [0.90, 0.43],
  }),
  receiveLeft: makePose({
    13: [0.36, 0.38], 15: [0.10, 0.43], 14: [0.22, 0.36], 16: [0.06, 0.42],
  }),
  celebrate: makePose({
    13: [0.72, 0.18], 15: [0.82, 0.06], 14: [0.28, 0.42], 16: [0.42, 0.55],
  }),
  scream: makePose({
    13: [0.66, 0.30], 15: [0.58, 0.14], 14: [0.34, 0.30], 16: [0.42, 0.14],
    25: [0.64, 0.76], 27: [0.72, 0.96], 26: [0.36, 0.76], 28: [0.28, 0.96],
  }),
  waveBackdrop: makePose({
    13: [0.82, 0.18], 15: [0.96, 0.08], 14: [0.18, 0.42], 16: [0.04, 0.52],
    25: [0.68, 0.73], 27: [0.80, 0.94], 26: [0.32, 0.78], 28: [0.22, 0.96],
  }),
  gothicA: makePose({
    13: [0.62, 0.40], 15: [0.58, 0.66], 14: [0.38, 0.40], 16: [0.42, 0.66],
  }),
  gothicB: makePose({
    13: [0.72, 0.40], 15: [0.66, 0.62], 14: [0.28, 0.40], 16: [0.34, 0.62],
    25: [0.62, 0.77], 27: [0.64, 0.96], 26: [0.38, 0.77], 28: [0.36, 0.96],
  }),
  pointUp: makePose({
    13: [0.66, 0.12], 15: [0.60, 0.01], 14: [0.28, 0.42], 16: [0.42, 0.54],
  }),
  pointForward: makePose({
    13: [0.78, 0.32], 15: [0.96, 0.30], 14: [0.30, 0.42], 16: [0.44, 0.54],
  }),
  nightCaptain: makePose({
    13: [0.80, 0.30], 15: [0.96, 0.24], 14: [0.28, 0.40], 16: [0.38, 0.58],
    25: [0.68, 0.73], 27: [0.82, 0.94], 26: [0.33, 0.78], 28: [0.24, 0.96],
  }),
  nightGuard: makePose({
    13: [0.68, 0.40], 15: [0.58, 0.62], 14: [0.26, 0.18], 16: [0.12, 0.07],
  }),
  reachRight: makePose({
    13: [0.74, 0.32], 15: [0.98, 0.31], 14: [0.24, 0.44], 16: [0.38, 0.58],
  }),
  reachLeft: makePose({
    13: [0.76, 0.44], 15: [0.62, 0.58], 14: [0.26, 0.32], 16: [0.02, 0.31],
  }),
  beatCenter: makePose({
    13: [0.66, 0.36], 15: [0.54, 0.42], 14: [0.34, 0.36], 16: [0.46, 0.42],
  }),
  beatOpen: makePose({
    13: [0.80, 0.30], 15: [0.98, 0.30], 14: [0.20, 0.30], 16: [0.02, 0.30],
  }),
  beatUp: makePose({
    13: [0.72, 0.13], 15: [0.64, 0.02], 14: [0.28, 0.13], 16: [0.36, 0.02],
  }),
  beatDown: makePose({
    13: [0.70, 0.46], 15: [0.62, 0.64], 14: [0.30, 0.46], 16: [0.38, 0.64],
    23: [0.59, 0.62], 24: [0.41, 0.62], 25: [0.68, 0.78], 27: [0.76, 0.94],
    26: [0.32, 0.78], 28: [0.24, 0.94],
  }),
  crossRight: makePose({
    13: [0.78, 0.32], 15: [0.94, 0.23], 14: [0.32, 0.40], 16: [0.50, 0.48],
  }),
  crossLeft: makePose({
    13: [0.68, 0.40], 15: [0.50, 0.48], 14: [0.22, 0.32], 16: [0.06, 0.23],
  }),
  conductorLeft: makePose({
    13: [0.78, 0.22], 15: [0.94, 0.13], 14: [0.25, 0.40], 16: [0.42, 0.48],
  }),
  conductorRight: makePose({
    13: [0.75, 0.40], 15: [0.58, 0.48], 14: [0.22, 0.22], 16: [0.06, 0.13],
  }),
  guitarLeft: makePose({
    13: [0.72, 0.38], 15: [0.58, 0.48], 14: [0.28, 0.36], 16: [0.42, 0.45],
    25: [0.67, 0.74], 27: [0.80, 0.95], 26: [0.34, 0.73], 28: [0.23, 0.94],
  }),
  guitarRight: makePose({
    13: [0.72, 0.36], 15: [0.58, 0.45], 14: [0.28, 0.38], 16: [0.42, 0.48],
    25: [0.66, 0.73], 27: [0.77, 0.94], 26: [0.33, 0.74], 28: [0.20, 0.95],
  }),
};

const MISSIONS = {
  sports: [
    { title: "균형 듀오", hint: "서로 반대 방향으로 기울여 하나의 균형을 만들어요.", phases: [[POSES.balanceLeft, POSES.balanceRight]] },
    { title: "릴레이 터치", hint: "달리는 자세로 중앙에서 배턴을 주고받는 순간을 만들어요.", phases: [[POSES.runnerLeft, POSES.runnerRight]] },
    { title: "결정적 한 장면", hint: "슈터와 골키퍼 역할은 매번 무작위로 정해져요.", phases: [[POSES.basketballShot, POSES.goalkeeper]], randomSwap: true },
    {
      title: "패스 앤 슛",
      hint: "1단계 패스 뒤, 2단계 슛까지 연속으로 성공하세요.",
      phaseHints: ["1/2 중앙으로 공을 패스하고 받아요.", "2/2 PLAYER 2는 슛, PLAYER 1은 환호해요."],
      phases: [[POSES.passRight, POSES.receiveLeft], [POSES.celebrate, POSES.basketballShot]],
    },
    { title: "챔피언의 순간", hint: "낮은 승리 포즈와 높은 승리 포즈를 함께 완성해요.", phases: [[POSES.victoryLow, POSES.victoryHigh]] },
  ],
  art: [
    { title: "뭉크 〈절규〉", hint: "PLAYER 1은 절규, PLAYER 2는 흔들리는 배경이 되어 보세요.", phases: [[POSES.scream, POSES.waveBackdrop]] },
    { title: "그랜트 우드 〈아메리칸 고딕〉", hint: "두 사람이 나란히 서서 엄숙한 초상화를 완성해요.", phases: [[POSES.gothicA, POSES.gothicB]] },
    { title: "라파엘로 〈아테네 학당〉", hint: "한 명은 위를, 한 명은 앞을 가리켜요.", phases: [[POSES.pointUp, POSES.pointForward]] },
    { title: "렘브란트 〈야경〉", hint: "대장과 경비대원이 되어 역동적인 중심 장면을 만들어요.", phases: [[POSES.nightCaptain, POSES.nightGuard]] },
    { title: "미켈란젤로 〈아담의 창조〉", hint: "화면 중앙에서 두 손끝이 닿을 듯 가까워지게 해요.", phases: [[POSES.reachRight, POSES.reachLeft]] },
  ],
  music: [
    {
      title: "같은 박",
      hint: "다가오는 카드가 판정선에 닿을 때 같은 동작을 하세요.",
      steps: [[POSES.beatCenter, POSES.beatCenter], [POSES.beatOpen, POSES.beatOpen], [POSES.beatUp, POSES.beatUp], [POSES.beatCenter, POSES.beatCenter]],
    },
    {
      title: "주고받는 박",
      hint: "PLAYER 1과 PLAYER 2가 한 박씩 번갈아 움직여요.",
      steps: [[POSES.beatUp, POSES.neutral], [POSES.neutral, POSES.beatUp], [POSES.crossRight, POSES.neutral], [POSES.neutral, POSES.crossLeft]],
    },
    {
      title: "높고 낮은 멜로디",
      hint: "높은 동작과 낮은 동작의 흐름을 함께 표현해요.",
      steps: [[POSES.beatDown, POSES.beatDown], [POSES.beatUp, POSES.beatDown], [POSES.beatDown, POSES.beatUp], [POSES.beatUp, POSES.beatUp]],
    },
    {
      title: "지휘자와 연주자",
      hint: "PLAYER 1은 지휘하고 PLAYER 2는 리듬에 맞춰 연주해요.",
      steps: [[POSES.conductorLeft, POSES.guitarRight], [POSES.conductorRight, POSES.guitarLeft], [POSES.conductorLeft, POSES.guitarRight], [POSES.beatOpen, POSES.beatOpen]],
    },
    {
      title: "마지막 합주",
      hint: "8박의 동작을 이어 마지막 무대를 완성하세요.",
      steps: [
        [POSES.beatCenter, POSES.beatCenter], [POSES.crossRight, POSES.crossLeft],
        [POSES.beatDown, POSES.beatDown], [POSES.beatUp, POSES.beatUp],
        [POSES.conductorLeft, POSES.guitarRight], [POSES.conductorRight, POSES.guitarLeft],
        [POSES.beatOpen, POSES.beatOpen], [POSES.victoryHigh, POSES.victoryHigh],
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
const bgmAudio = $("#bgmAudio");

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
let phaseIndex = 0;
let phaseScores = [];
let bestPhaseScore = 0;
let musicState = null;
let judgementTimer = null;
let bgmMode = null;
let bgmDuckTimer = null;

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
  bgmAudio.muted = !soundEnabled;
  if (soundEnabled) {
    primeAudio();
    if (gameRunning) bgmAudio.play().catch(() => {});
    beep(620, 0.06);
  }
});

$("#startBtn").addEventListener("click", () => { primeAudio(); startGame(); });
$("#retryBtn").addEventListener("click", startCameraAndModel);
$("#replayBtn").addEventListener("click", () => { primeAudio(); startGame(); });
$("#changeModeBtn").addEventListener("click", goHome);
$("#homeBtn").addEventListener("click", goHome);
$("#rankingBtn").addEventListener("click", showRanking);
$("#rankingBackBtn").addEventListener("click", goHome);
$("#resetRankingBtn").addEventListener("click", resetRanking);

async function startGame() {
  stopCamera();
  primeBgm(selectedMode);
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
  let startupStage = "camera";
  try {
    stopCamera();
    $("#loadingTitle").textContent = "카메라 권한을 확인하는 중";
    $("#loadingText").textContent = "허용 창이 나타나면 카메라 사용을 허용해 주세요.";
    mediaStream = await requestCameraStream();
    video.srcObject = mediaStream;
    await video.play();
    await waitForVideoReady();

    if (!poseLandmarker) {
      startupStage = "model";
      $("#loadingTitle").textContent = "동작 인식 모델을 불러오는 중";
      $("#loadingText").textContent = "기기에 저장된 동작 인식 파일을 준비하고 있어요.";
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

    $("#cameraLoading").classList.add("is-hidden");
    gameRunning = true;
    activateBgm(selectedMode);
    prepareRound();
    detectLoop();
  } catch (error) {
    console.error(error);
    stopCamera();
    stopBgm();
    $("#loadingTitle").textContent = startupStage === "model"
      ? "동작 인식 모델을 준비할 수 없어요"
      : "카메라를 시작할 수 없어요";
    $("#loadingText").textContent = startupErrorMessage(error, startupStage);
    $("#retryBtn").hidden = false;
  }
}

async function requestCameraStream() {
  if (!window.isSecureContext) {
    const error = new Error("Secure context required");
    error.name = "SecurityError";
    throw error;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    const error = new Error("getUserMedia is unavailable");
    error.name = "UnsupportedError";
    throw error;
  }

  const attempts = [
    {
      audio: false,
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30, max: 30 },
      },
    },
    { audio: false, video: { facingMode: "user" } },
    { audio: false, video: true },
  ];

  let lastError;
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      lastError = error;
      if (["NotAllowedError", "SecurityError", "NotFoundError", "NotReadableError"].includes(error?.name)) throw error;
    }
  }
  throw lastError;
}

function waitForVideoReady() {
  if (video.readyState >= 2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(Object.assign(new Error("Camera timeout"), { name: "TimeoutError" })), 8000);
    video.addEventListener("loadeddata", () => {
      clearTimeout(timeout);
      resolve();
    }, { once: true });
  });
}

function startupErrorMessage(error, stage) {
  const code = `${stage === "model" ? "MODEL_INIT" : "CAMERA"} · ${error?.name || "Error"}`;
  if (stage === "model") {
    return `동작 인식 파일 초기화에 실패했습니다. 새로고침 후 다시 시도해 주세요. (오류 코드: ${code})`;
  }
  if (!window.isSecureContext || error?.name === "SecurityError") {
    return `GitHub Pages의 HTTPS 주소로 접속해 주세요. (오류 코드: ${code})`;
  }
  if (error?.name === "NotAllowedError") {
    return `주소창의 카메라 권한을 허용한 뒤 다시 시도해 주세요. (오류 코드: ${code})`;
  }
  if (error?.name === "NotFoundError") {
    return `사용 가능한 카메라를 찾지 못했습니다. (오류 코드: ${code})`;
  }
  if (["NotReadableError", "AbortError"].includes(error?.name)) {
    return `다른 앱이 카메라를 사용 중인지 확인해 주세요. (오류 코드: ${code})`;
  }
  if (error?.name === "UnsupportedError") {
    return `이 브라우저는 카메라 실행을 지원하지 않습니다. 최신 Chrome을 사용해 주세요. (오류 코드: ${code})`;
  }
  return `카메라 초기화에 실패했습니다. 브라우저를 닫았다가 다시 실행해 주세요. (오류 코드: ${code})`;
}

function prepareRound() {
  if (!gameRunning) return;
  clearTimeout(judgementTimer);
  $("#judgement").hidden = true;
  currentMission = resolveMission(MISSIONS[selectedMode][roundIndex % MISSIONS[selectedMode].length]);
  roundStartedAt = 0;
  holdStartedAt = null;
  bestRoundScore = 0;
  bestPhaseScore = 0;
  phaseIndex = 0;
  phaseScores = [];
  musicState = null;
  smoothedScores = [0, 0];
  resolvingRound = false;
  $("#roundLabel").textContent = `ROUND ${roundIndex + 1}`;
  $("#modeLabel").textContent = MODE_LABELS[selectedMode];
  $("#missionTitle").textContent = currentMission.title;
  $("#missionHint").textContent = currentMission.hint;
  $("#timerValue").textContent = selectedMode === "music" ? rhythmRoundSeconds(currentMission) : ROUND_SECONDS;
  $("#statusText").textContent = selectedMode === "music" ? "다가오는 동작 카드를 확인하세요" : "두 사람이 안내선 안에 서 주세요";
  $("#holdFill").style.width = "0%";
  $("#p1Score").textContent = "준비";
  $("#p2Score").textContent = "준비";
  $("#musicHud").hidden = selectedMode !== "music";
  $("#holdFill").parentElement.hidden = selectedMode === "music";
  $("#comboValue").textContent = "0";
  $("#unityValue").textContent = "0%";
  $("#unityFill").style.width = "0%";
  renderBeatProgress();
  countdown().then(() => {
    if (!gameRunning) return;
    roundStartedAt = performance.now();
    if (selectedMode === "music") initializeMusicRound(roundStartedAt);
  });
}

function resolveMission(mission) {
  const resolved = { ...mission };
  if (mission.phases) resolved.phases = mission.phases.map((pair) => [...pair]);
  if (mission.steps) resolved.steps = mission.steps.map((pair) => [...pair]);
  if (mission.randomSwap && Math.random() < 0.5) {
    resolved.phases = resolved.phases.map(([first, second]) => [second, first]);
    resolved.hint = "이번에는 PLAYER 1이 골키퍼, PLAYER 2가 슈터예요.";
  } else if (mission.randomSwap) {
    resolved.hint = "이번에는 PLAYER 1이 슈터, PLAYER 2가 골키퍼예요.";
  }
  return resolved;
}

function rhythmRoundSeconds(mission) {
  return Math.ceil((MUSIC_PREVIEW_MS + (mission.steps.length - 1) * MUSIC_BEAT_MS + MUSIC_WINDOW_MS) / 1000);
}

function initializeMusicRound(startedAt) {
  const intervalSeconds = MUSIC_BEAT_MS / 1000;
  const canUseAudioClock = bgmMode === "music" && !bgmAudio.paused && Number.isFinite(bgmAudio.currentTime);
  const audioNow = canUseAudioClock ? bgmAudio.currentTime : 0;
  const minimumFirstHit = audioNow + MUSIC_PREVIEW_MS / 1000;
  const gridSteps = Math.max(0, Math.ceil((minimumFirstHit - MUSIC_BEAT_OFFSET_SECONDS) / intervalSeconds));
  const firstAudioHit = MUSIC_BEAT_OFFSET_SECONDS + gridSteps * intervalSeconds;
  const audioTimes = canUseAudioClock
    ? currentMission.steps.map((_, index) => firstAudioHit + index * intervalSeconds)
    : null;
  const firstDelayMs = canUseAudioClock ? (firstAudioHit - audioNow) * 1000 : MUSIC_PREVIEW_MS;
  musicState = {
    index: 0,
    results: [],
    combo: 0,
    maxCombo: 0,
    bestScore: 0,
    bestOffset: Infinity,
    cueBeeped: false,
    hitBeeped: false,
    finishing: false,
    audioTimes,
    times: currentMission.steps.map((_, index) => startedAt + firstDelayMs + index * MUSIC_BEAT_MS),
  };
  renderBeatProgress();
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

  const sorted = detectedPoses
    .map(mirrorLandmarks)
    .filter(hasUsableBody)
    .sort((a, b) => bodyCenterX(a) - bodyCenterX(b));

  const playerPoses = [sorted[0] || null, sorted[1] || null];
  const targetPair = currentTargetPair();
  const rawScores = playerPoses.map((pose, index) => pose && targetPair ? scorePose(pose, targetPair[index]) : 0);
  const scores = rawScores.map((score, index) => {
    if (!playerPoses[index]) return 0;
    const previous = smoothedScores[index];
    smoothedScores[index] = previous > 0 ? Math.round(previous * 0.62 + score * 0.38) : score;
    return smoothedScores[index];
  });
  const colors = scores.map(scoreColor);

  drawZones(width, height);
  if (selectedMode === "music") drawRhythmLane(width, height);
  if (targetPair) {
    const targetColors = ["#2ee9ff", "#ff9d2e"];
    drawTarget(targetPair[0], 0, targetColors[0], width, height);
    drawTarget(targetPair[1], 1, targetColors[1], width, height);
  }
  playerPoses.forEach((pose, index) => {
    if (pose) drawDetected(pose, colors[index], width, height);
  });

  if (selectedMode === "music") updateMusicState(playerPoses, scores);
  else updateGameState(playerPoses, scores);
}

function currentTargetPair() {
  if (selectedMode === "music") {
    const index = musicState?.index ?? 0;
    return currentMission.steps[Math.min(index, currentMission.steps.length - 1)];
  }
  return currentMission.phases[Math.min(phaseIndex, currentMission.phases.length - 1)];
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
  if (resolvingRound || $("#countdown").hidden === false || !roundStartedAt) return;
  const now = performance.now();
  const remaining = Math.max(0, ROUND_SECONDS - Math.floor((now - roundStartedAt) / 1000));
  $("#timerValue").textContent = remaining;

  $("#p1Score").textContent = playerPoses[0] ? `${scores[0]}점` : "찾는 중";
  $("#p2Score").textContent = playerPoses[1] ? `${scores[1]}점` : "찾는 중";

  if (!playerPoses[0] || !playerPoses[1]) {
    holdStartedAt = null;
    $("#holdFill").style.width = "0%";
    $("#statusText").textContent = "두 사람의 전신이 모두 보이게 서 주세요";
  } else if (bodyCenterX(playerPoses[0]) > 0.5 || bodyCenterX(playerPoses[1]) < 0.5) {
    holdStartedAt = null;
    $("#holdFill").style.width = "0%";
    $("#statusText").textContent = "한 명씩 좌우 안내 영역에 나누어 서 주세요";
  } else {
    const roundScore = teamworkScore(scores[0], scores[1]);
    bestRoundScore = Math.max(bestRoundScore, roundScore);
    bestPhaseScore = Math.max(bestPhaseScore, roundScore);
    if (scores[0] >= PASS_SCORE && scores[1] >= PASS_SCORE) {
      if (!holdStartedAt) holdStartedAt = now;
      const progress = Math.min(1, (now - holdStartedAt) / HOLD_REQUIRED_MS);
      $("#holdFill").style.width = `${Math.round(progress * 100)}%`;
      $("#statusText").textContent = progress < 1 ? "좋아요! 그대로 멈춰 주세요" : "완벽한 순간!";
      if (progress >= 1) completeStaticPhase(roundScore);
    } else {
      holdStartedAt = null;
      $("#holdFill").style.width = "0%";
      $("#statusText").textContent = feedbackForScores(scores);
    }
  }

  if (remaining <= 0) {
    phaseScores.push(bestPhaseScore);
    finishRound(average(phaseScores));
  }
}

function completeStaticPhase(score) {
  phaseScores.push(score);
  if (phaseIndex >= currentMission.phases.length - 1) {
    finishRound(average(phaseScores));
    return;
  }
  phaseIndex += 1;
  holdStartedAt = null;
  bestPhaseScore = 0;
  smoothedScores = [0, 0];
  $("#holdFill").style.width = "0%";
  $("#missionHint").textContent = currentMission.phaseHints?.[phaseIndex] || `${phaseIndex + 1}단계 동작을 완성하세요.`;
  $("#statusText").textContent = `1단계 성공! ${phaseIndex + 1}단계를 준비하세요`;
  beep(760, 0.1);
}

function updateMusicState(playerPoses, scores) {
  if (resolvingRound || $("#countdown").hidden === false || !musicState || musicState.finishing) return;
  const now = performance.now();
  const usingAudioClock = musicState.audioTimes && bgmMode === "music" && !bgmAudio.paused;
  const offset = usingAudioClock
    ? (bgmAudio.currentTime - musicState.audioTimes[musicState.index]) * 1000
    : now - musicState.times[musicState.index];
  const remaining = usingAudioClock
    ? Math.max(0, Math.ceil(musicState.audioTimes.at(-1) + MUSIC_WINDOW_MS / 1000 - bgmAudio.currentTime))
    : Math.max(0, Math.ceil((musicState.times.at(-1) + MUSIC_WINDOW_MS - now) / 1000));
  $("#timerValue").textContent = remaining;
  $("#p1Score").textContent = playerPoses[0] ? `${scores[0]}점` : "찾는 중";
  $("#p2Score").textContent = playerPoses[1] ? `${scores[1]}점` : "찾는 중";

  if (!playerPoses[0] || !playerPoses[1]) {
    $("#statusText").textContent = "두 사람의 전신이 모두 보이게 서 주세요";
  } else if (bodyCenterX(playerPoses[0]) > 0.5 || bodyCenterX(playerPoses[1]) < 0.5) {
    $("#statusText").textContent = "한 명씩 좌우 안내 영역에 나누어 서 주세요";
  } else if (offset < -MUSIC_WINDOW_MS) {
    $("#statusText").textContent = "카드가 판정선에 닿는 순간 동작하세요";
  } else {
    $("#statusText").textContent = "NOW! 안내선에 몸을 맞추세요";
  }

  if (Math.abs(offset) <= MUSIC_WINDOW_MS && playerPoses[0] && playerPoses[1]) {
    const score = teamworkScore(scores[0], scores[1]);
    if (score > musicState.bestScore || (score === musicState.bestScore && Math.abs(offset) < musicState.bestOffset)) {
      musicState.bestScore = score;
      musicState.bestOffset = Math.abs(offset);
    }
  }

  if (offset >= -Math.min(700, MUSIC_BEAT_MS / 2) && !musicState.cueBeeped) {
    musicState.cueBeeped = true;
    beep(330, 0.045);
  }

  if (offset >= 0 && !musicState.hitBeeped) {
    musicState.hitBeeped = true;
    beep(880, 0.07);
  }

  if (offset > MUSIC_WINDOW_MS) finalizeMusicBeat();
}

function finalizeMusicBeat() {
  const score = musicState.bestScore;
  const offset = musicState.bestOffset;
  let judgement = "MISS";
  let points = 0;
  if (score >= 88 && offset <= 320) {
    judgement = "PERFECT";
    points = 100;
  } else if (score >= 68 && offset <= MUSIC_WINDOW_MS) {
    judgement = "GOOD";
    points = Math.max(70, Math.min(89, score));
  }

  if (judgement === "MISS") musicState.combo = 0;
  else musicState.combo += 1;
  musicState.maxCombo = Math.max(musicState.maxCombo, musicState.combo);
  musicState.results.push({ judgement, points });
  showJudgement(judgement, points);

  musicState.index += 1;
  musicState.bestScore = 0;
  musicState.bestOffset = Infinity;
  musicState.cueBeeped = false;
  musicState.hitBeeped = false;
  smoothedScores = [0, 0];
  updateMusicHud();

  if (musicState.index >= currentMission.steps.length) {
    musicState.finishing = true;
    const roundScore = average(musicState.results.map((result) => result.points));
    setTimeout(() => finishRound(roundScore), 850);
  }
}

function showJudgement(judgement, points) {
  const element = $("#judgement");
  clearTimeout(judgementTimer);
  duckBgm(620);
  element.className = `judgement is-${judgement.toLowerCase()}`;
  $("#judgementText").textContent = judgement;
  $("#judgementScore").textContent = points ? `+${points}` : "다음 포즈를 준비!";
  element.hidden = false;
  if (judgement === "PERFECT") successChime(95);
  else if (judgement === "GOOD") beep(620, 0.1);
  else beep(180, 0.16);
  judgementTimer = setTimeout(() => { element.hidden = true; }, 680);
}

function updateMusicHud() {
  const points = musicState.results.map((result) => result.points);
  const gauge = points.length ? average(points) : 0;
  $("#comboValue").textContent = musicState.combo;
  $("#unityValue").textContent = `${gauge}%`;
  $("#unityFill").style.width = `${gauge}%`;
  renderBeatProgress();
}

function renderBeatProgress() {
  if (selectedMode !== "music" || !currentMission?.steps) {
    $("#beatProgress").innerHTML = "";
    return;
  }
  const results = musicState?.results || [];
  const current = musicState?.index ?? 0;
  $("#beatProgress").innerHTML = currentMission.steps.map((_, index) => {
    const result = results[index];
    const state = result ? `is-${result.judgement.toLowerCase()}` : index === current ? "is-current" : "";
    return `<i class="${state}" title="${index + 1}번째 포즈"></i>`;
  }).join("");
}

function average(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function teamworkScore(a, b) {
  const average = (a + b) / 2;
  const balanceBonus = Math.max(0, 8 - Math.abs(a - b) * 0.35);
  return Math.max(0, Math.min(100, Math.round(average * 0.92 + balanceBonus)));
}

function feedbackForScores(scores) {
  if (scores[0] >= PASS_SCORE && scores[1] < PASS_SCORE) return "PLAYER 2가 안내선에 조금 더 맞춰 주세요";
  if (scores[1] >= PASS_SCORE && scores[0] < PASS_SCORE) return "PLAYER 1이 안내선에 조금 더 맞춰 주세요";
  if (Math.max(...scores) >= 60) return "거의 다 왔어요! 팔과 다리 각도를 확인하세요";
  return "반투명 안내선에 몸을 맞춰 보세요";
}

async function finishRound(score) {
  if (resolvingRound) return;
  resolvingRound = true;
  duckBgm(1200);
  score = Math.max(0, Math.round(score));
  roundScores.push(score);
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
  stopBgm();
  const total = roundScores.reduce((sum, value) => sum + value, 0);
  saveScore(total);
  const best = getScores()[0]?.score ?? total;
  $("#finalScore").textContent = total;
  $("#bestScore").textContent = `${best}점`;
  $("#resultMessage").textContent = resultMessage(total);
  $("#scoreSummary").innerHTML = roundScores
    .map((score, index) => `<span class="round-chip">ROUND ${index + 1} <b>${score}점</b></span>`)
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

function drawRhythmLane(width, height) {
  if (!musicState) return;
  const now = performance.now();
  const vanishingY = height * 0.08;
  const hitY = height * 0.72;

  ctx.save();
  const laneGradient = ctx.createLinearGradient(0, vanishingY, 0, height);
  laneGradient.addColorStop(0, "rgba(20, 231, 255, 0.02)");
  laneGradient.addColorStop(1, "rgba(46, 233, 255, 0.14)");
  ctx.fillStyle = laneGradient;
  ctx.beginPath();
  ctx.moveTo(width * 0.44, vanishingY);
  ctx.lineTo(width * 0.08, hitY + height * 0.12);
  ctx.lineTo(width * 0.92, hitY + height * 0.12);
  ctx.lineTo(width * 0.56, vanishingY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(46, 233, 255, .35)";
  ctx.lineWidth = 2;
  ctx.shadowColor = "#2ee9ff";
  ctx.shadowBlur = 10;
  drawLine({ x: width * 0.44, y: vanishingY }, { x: width * 0.08, y: hitY + height * 0.12 });
  drawLine({ x: width * 0.56, y: vanishingY }, { x: width * 0.92, y: hitY + height * 0.12 });

  ctx.strokeStyle = "rgba(184, 255, 54, .92)";
  ctx.lineWidth = 4;
  ctx.setLineDash([16, 8]);
  ctx.beginPath();
  ctx.moveTo(width * 0.12, hitY);
  ctx.lineTo(width * 0.88, hitY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#b8ff36";
  ctx.font = `900 ${Math.max(12, width * 0.012)}px system-ui`;
  ctx.textAlign = "center";
  ctx.fillText("HIT LINE", width * 0.5, hitY + 22);

  for (let index = musicState.index; index < currentMission.steps.length; index += 1) {
    const timeUntil = musicState.audioTimes && bgmMode === "music" && !bgmAudio.paused
      ? (musicState.audioTimes[index] - bgmAudio.currentTime) * 1000
      : musicState.times[index] - now;
    if (timeUntil > MUSIC_PREVIEW_MS || timeUntil < -MUSIC_WINDOW_MS) continue;
    const progress = Math.max(0, Math.min(1, 1 - timeUntil / MUSIC_PREVIEW_MS));
    const eased = progress * progress * (3 - 2 * progress);
    const y = vanishingY + (hitY - vanishingY) * eased;
    const scale = 0.34 + eased * 0.78;
    drawBeatCard(currentMission.steps[index], index, width * 0.5, y, scale, width, height);
  }
  ctx.restore();
}

function drawBeatCard(pair, index, centerX, centerY, scale, width, height) {
  const cardWidth = Math.min(width * 0.34, 360) * scale;
  const cardHeight = Math.min(height * 0.27, 178) * scale;
  const x = centerX - cardWidth / 2;
  const y = centerY - cardHeight / 2;
  ctx.save();
  ctx.shadowColor = index === musicState.index ? "#b8ff36" : "#2ee9ff";
  ctx.shadowBlur = 18 * scale;
  ctx.fillStyle = "rgba(3, 13, 31, .88)";
  ctx.strokeStyle = index === musicState.index ? "rgba(184, 255, 54, .95)" : "rgba(46, 233, 255, .7)";
  ctx.lineWidth = Math.max(1.5, 3 * scale);
  roundedRect(ctx, x, y, cardWidth, cardHeight, Math.max(5, 12 * scale));
  ctx.fill();
  ctx.stroke();
  drawMiniPose(pair[0], x + cardWidth * 0.28, y + cardHeight * 0.12, cardWidth * 0.31, cardHeight * 0.76, "#2ee9ff");
  drawMiniPose(pair[1], x + cardWidth * 0.72, y + cardHeight * 0.12, cardWidth * 0.31, cardHeight * 0.76, "#ff9d2e");
  ctx.fillStyle = "rgba(255,255,255,.88)";
  ctx.font = `900 ${Math.max(8, 13 * scale)}px system-ui`;
  ctx.textAlign = "center";
  ctx.fillText(`${index + 1} POSE`, centerX, y - Math.max(5, 8 * scale));
  ctx.restore();
}

function drawMiniPose(target, centerX, top, poseWidth, poseHeight, color) {
  const toCanvas = (coords) => ({
    x: centerX + (coords[0] - 0.5) * poseWidth,
    y: top + coords[1] * poseHeight,
  });
  drawPoseSilhouette(target, toCanvas, color, poseWidth, 0.72, 0.95);
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

  drawPoseSilhouette(target, toCanvas, color, guideWidth, 0.16, 0.88);
}

function drawDetected(pose, color, width, height) {
  const toCanvas = (landmark) => ({ x: landmark.x * width, y: landmark.y * height });
  drawPoseSilhouette(pose, toCanvas, color, width * 0.34, 0.07, 0.6);
}

function drawPoseSilhouette(pose, toCanvas, color, bodyScale, fillAlpha, outlineAlpha) {
  if (!pose?.[0] || !pose?.[11] || !pose?.[12] || !pose?.[23] || !pose?.[24]) return;
  const p = (index) => toCanvas(pose[index]);
  const shoulderSpan = distanceBetween(p(11), p(12));
  const limbWidth = Math.max(3, bodyScale * 0.055);
  const outlineWidth = Math.max(1.2, bodyScale * 0.008);
  const headRadius = Math.max(3.5, shoulderSpan * 0.23);
  const shoulderMid = midpoint(p(11), p(12));
  const hipMid = midpoint(p(23), p(24));

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = color;
  ctx.shadowBlur = Math.max(4, bodyScale * 0.025);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;

  ctx.globalAlpha = fillAlpha;
  ctx.beginPath();
  ctx.moveTo(p(11).x, p(11).y);
  ctx.lineTo(p(12).x, p(12).y);
  ctx.lineTo(p(24).x, p(24).y);
  ctx.lineTo(p(23).x, p(23).y);
  ctx.closePath();
  ctx.fill();

  ctx.lineWidth = limbWidth;
  [[11, 13, 15], [12, 14, 16], [23, 25, 27], [24, 26, 28]].forEach((indices) => {
    if (indices.every((index) => pose[index])) drawPosePath(indices.map(p));
  });
  ctx.lineWidth = Math.max(3, limbWidth * 0.72);
  drawPosePath([p(0), shoulderMid]);
  ctx.beginPath();
  ctx.arc(p(0).x, p(0).y, headRadius, 0, Math.PI * 2);
  ctx.fill();
  [15, 16, 27, 28].forEach((index) => {
    if (!pose[index]) return;
    ctx.beginPath();
    ctx.arc(p(index).x, p(index).y, limbWidth * 0.52, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = outlineAlpha;
  ctx.lineWidth = outlineWidth;
  ctx.beginPath();
  ctx.moveTo(p(11).x, p(11).y);
  ctx.lineTo(p(12).x, p(12).y);
  ctx.lineTo(p(24).x, p(24).y);
  ctx.lineTo(p(23).x, p(23).y);
  ctx.closePath();
  ctx.stroke();
  [[11, 13, 15], [12, 14, 16], [23, 25, 27], [24, 26, 28]].forEach((indices) => {
    if (indices.every((index) => pose[index])) drawPosePath(indices.map(p));
  });
  ctx.beginPath();
  ctx.arc(p(0).x, p(0).y, headRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = Math.min(0.42, fillAlpha * 1.6);
  ctx.lineWidth = Math.max(1, outlineWidth * 0.72);
  drawPosePath([shoulderMid, hipMid]);
  ctx.restore();
}

function drawPosePath(points) {
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((pointValue) => ctx.lineTo(pointValue.x, pointValue.y));
  ctx.stroke();
}

function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function drawLine(a, b) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
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
  stopBgm();
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

function setBgmSource(mode) {
  const track = BGM_TRACKS[mode];
  if (!track || bgmMode === mode) return track;
  bgmMode = mode;
  bgmAudio.src = track.src;
  bgmAudio.load();
  return track;
}

function primeBgm(mode) {
  const track = setBgmSource(mode);
  if (!track) return;
  bgmAudio.muted = !soundEnabled;
  bgmAudio.volume = 0;
  bgmAudio.currentTime = 0;
  bgmAudio.play().catch(() => {});
}

function activateBgm(mode) {
  const track = setBgmSource(mode);
  if (!track) return;
  clearTimeout(bgmDuckTimer);
  bgmAudio.currentTime = 0;
  bgmAudio.volume = track.volume;
  bgmAudio.muted = !soundEnabled;
  bgmAudio.play().catch(() => {});
}

function duckBgm(duration = 600) {
  const track = BGM_TRACKS[bgmMode];
  if (!track || bgmAudio.paused) return;
  clearTimeout(bgmDuckTimer);
  bgmAudio.volume = track.volume * 0.42;
  bgmDuckTimer = setTimeout(() => {
    if (BGM_TRACKS[bgmMode]) bgmAudio.volume = BGM_TRACKS[bgmMode].volume;
  }, duration);
}

function stopBgm() {
  clearTimeout(bgmDuckTimer);
  bgmAudio.pause();
  bgmAudio.currentTime = 0;
  bgmMode = null;
}

function primeAudio() {
  if (!soundEnabled) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
  } catch { /* 오디오 미지원 환경 */ }
}

function beep(frequency, duration) {
  if (!soundEnabled) return;
  try {
    primeAudio();
    if (!audioContext) return;
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
window.addEventListener("beforeunload", () => { stopCamera(); stopBgm(); });
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState === "visible" && "wakeLock" in navigator && gameRunning) {
    try { wakeLock = await navigator.wakeLock.request("screen"); } catch { /* ignore */ }
  }
  if (document.visibilityState === "visible" && gameRunning) bgmAudio.play().catch(() => {});
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}

