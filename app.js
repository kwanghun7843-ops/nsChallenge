const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const MEDIAPIPE_MODULE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/+esm";
const STORAGE_KEY = "namsan-unity-challenge-scores-v1";
const ROUNDS_PER_GAME = 3;
const ROUND_SECONDS = 15;
const HOLD_REQUIRED_MS = 950;
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
  victory: makePose({
    13: [0.75, 0.17], 15: [0.88, 0.05],
    14: [0.25, 0.17], 16: [0.12, 0.05],
    25: [0.68, 0.74], 27: [0.82, 0.95],
    26: [0.32, 0.74], 28: [0.18, 0.95],
  }),
  championLeft: makePose({
    13: [0.70, 0.12], 15: [0.66, 0.01],
    14: [0.24, 0.35], 16: [0.42, 0.51],
    25: [0.66, 0.73], 27: [0.78, 0.95],
    26: [0.34, 0.73], 28: [0.22, 0.95],
  }),
  championRight: makePose({
    13: [0.76, 0.35], 15: [0.58, 0.51],
    14: [0.30, 0.12], 16: [0.34, 0.01],
    25: [0.66, 0.73], 27: [0.78, 0.95],
    26: [0.34, 0.73], 28: [0.22, 0.95],
  }),
  runnerLeft: makePose({
    13: [0.78, 0.35], 15: [0.62, 0.47],
    14: [0.27, 0.17], 16: [0.13, 0.27],
    23: [0.60, 0.57], 24: [0.40, 0.54],
    25: [0.69, 0.75], 27: [0.59, 0.93],
    26: [0.31, 0.68], 28: [0.20, 0.84],
  }),
  runnerRight: makePose({
    13: [0.73, 0.17], 15: [0.87, 0.27],
    14: [0.22, 0.35], 16: [0.38, 0.47],
    23: [0.60, 0.54], 24: [0.40, 0.57],
    25: [0.69, 0.68], 27: [0.80, 0.84],
    26: [0.31, 0.75], 28: [0.41, 0.93],
  }),
  thinkerLeft: makePose({
    13: [0.72, 0.42], 15: [0.54, 0.20],
    14: [0.30, 0.45], 16: [0.42, 0.54],
  }),
  thinkerRight: makePose({
    13: [0.70, 0.45], 15: [0.58, 0.54],
    14: [0.28, 0.42], 16: [0.46, 0.20],
  }),
  statueLeft: makePose({
    13: [0.82, 0.26], 15: [0.94, 0.16],
    14: [0.26, 0.39], 16: [0.42, 0.55],
    25: [0.66, 0.74], 27: [0.79, 0.94],
    26: [0.36, 0.74], 28: [0.24, 0.94],
  }),
  statueRight: makePose({
    13: [0.74, 0.39], 15: [0.58, 0.55],
    14: [0.18, 0.26], 16: [0.06, 0.16],
    25: [0.64, 0.74], 27: [0.76, 0.94],
    26: [0.34, 0.74], 28: [0.21, 0.94],
  }),
  frame: makePose({
    13: [0.74, 0.26], 15: [0.60, 0.12],
    14: [0.26, 0.26], 16: [0.40, 0.12],
    25: [0.64, 0.77], 27: [0.76, 0.95],
    26: [0.36, 0.77], 28: [0.24, 0.95],
  }),
  idolLeft: makePose({
    13: [0.75, 0.14], 15: [0.58, 0.04],
    14: [0.20, 0.30], 16: [0.06, 0.23],
    25: [0.66, 0.75], 27: [0.78, 0.95],
    26: [0.35, 0.70], 28: [0.28, 0.91],
  }),
  idolRight: makePose({
    13: [0.80, 0.30], 15: [0.94, 0.23],
    14: [0.25, 0.14], 16: [0.42, 0.04],
    25: [0.65, 0.70], 27: [0.72, 0.91],
    26: [0.34, 0.75], 28: [0.22, 0.95],
  }),
};

const MISSIONS = {
  sports: [
    { title: "승리의 V", hint: "두 팔을 높이 들고 다리를 힘차게 벌려요.", poses: [POSES.victory, POSES.victory] },
    { title: "챔피언 미러", hint: "서로 반대쪽 팔을 들고 우승 포즈를 완성해요.", poses: [POSES.championLeft, POSES.championRight] },
    { title: "스피드 듀오", hint: "두 사람이 반대 방향으로 달리는 순간을 만들어요.", poses: [POSES.runnerLeft, POSES.runnerRight] },
  ],
  art: [
    { title: "거울 조각상", hint: "서로 마주 보는 대칭 조각상이 되어 보세요.", poses: [POSES.statueLeft, POSES.statueRight] },
    { title: "생각하는 두 사람", hint: "한 손은 얼굴 가까이, 다른 손은 중심을 잡아요.", poses: [POSES.thinkerLeft, POSES.thinkerRight] },
    { title: "인간 액자", hint: "머리 위로 액자를 만들고 한 장면이 되어 보세요.", poses: [POSES.frame, POSES.frame] },
  ],
  music: [
    { title: "아이돌 엔딩 포즈", hint: "서로 반대 방향으로 무대를 장식하세요.", poses: [POSES.idolLeft, POSES.idolRight] },
    { title: "하트 비트", hint: "두 팔을 머리 위로 모아 같은 박자를 만들어요.", poses: [POSES.frame, POSES.frame] },
    { title: "디스코 미러", hint: "반대쪽 팔을 들어 완벽한 대칭을 완성하세요.", poses: [POSES.championLeft, POSES.championRight] },
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
  currentMission = MISSIONS[selectedMode][roundIndex % MISSIONS[selectedMode].length];
  roundStartedAt = performance.now();
  holdStartedAt = null;
  bestRoundScore = 0;
  smoothedScores = [0, 0];
  resolvingRound = false;
  $("#roundLabel").textContent = `ROUND ${roundIndex + 1}`;
  $("#modeLabel").textContent = MODE_LABELS[selectedMode];
  $("#missionTitle").textContent = currentMission.title;
  $("#missionHint").textContent = currentMission.hint;
  $("#timerValue").textContent = ROUND_SECONDS;
  $("#statusText").textContent = "두 사람이 안내선 안에 서 주세요";
  $("#holdFill").style.width = "0%";
  $("#p1Score").textContent = "준비";
  $("#p2Score").textContent = "준비";
  countdown().then(() => {
    roundStartedAt = performance.now();
  });
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

  const sorted = detectedPoses
    .map(mirrorLandmarks)
    .filter(hasUsableBody)
    .sort((a, b) => bodyCenterX(a) - bodyCenterX(b));

  const playerPoses = [sorted[0] || null, sorted[1] || null];
  const rawScores = playerPoses.map((pose, index) => pose ? scorePose(pose, currentMission.poses[index]) : 0);
  const scores = rawScores.map((score, index) => {
    if (!playerPoses[index]) return 0;
    const previous = smoothedScores[index];
    smoothedScores[index] = previous > 0 ? Math.round(previous * 0.62 + score * 0.38) : score;
    return smoothedScores[index];
  });
  const colors = scores.map(scoreColor);

  drawZones(width, height);
  drawTarget(currentMission.poses[0], 0, colors[0], width, height);
  drawTarget(currentMission.poses[1], 1, colors[1], width, height);
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
    if (scores[0] >= PASS_SCORE && scores[1] >= PASS_SCORE) {
      if (!holdStartedAt) holdStartedAt = now;
      const progress = Math.min(1, (now - holdStartedAt) / HOLD_REQUIRED_MS);
      $("#holdFill").style.width = `${Math.round(progress * 100)}%`;
      $("#statusText").textContent = progress < 1 ? "좋아요! 그대로 멈춰 주세요" : "완벽한 순간!";
      if (progress >= 1) finishRound(roundScore);
    } else {
      holdStartedAt = null;
      $("#holdFill").style.width = "0%";
      $("#statusText").textContent = feedbackForScores(scores);
    }
  }

  if (remaining <= 0) finishRound(bestRoundScore);
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
    .map((score, index) => `<span class="round-chip">ROUND ${index + 1} <b>${score}점</b></span>`)
    .join("");
  showScreen("resultScreen");
  successChime(Math.round(total / ROUNDS_PER_GAME));
}

function resultMessage(total) {
  if (total >= 270) return "말하지 않아도 통하는 환상의 듀오!";
  if (total >= 225) return "두 사람의 호흡이 거의 완벽해요!";
  if (total >= 180) return "제법 잘 통하는 사이군요!";
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

