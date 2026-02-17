
import * as THREE from 'three';
import { FaceTracker } from './faceTracker.js';
import { RingSystem } from './ringSystem.js';
import { SpinLogic } from './spinLogic.js';
import { ConfettiSystem } from './confettiSystem.js';
import { OccluderSystem } from './occluderSystem.js';

// ---- CONFIG ----
const CAMERA_Z = 10;
const FOV = 50;

// ---- STATE ----
let isActive = false;
let isSpinning = false;
let currentHeadMatrix = new THREE.Matrix4();
let hasFace = false;

// ---- DOM ELEMENTS ----
const videoElement = document.getElementById('input-video');
const canvasElement = document.getElementById('output-canvas');
const startScreen = document.getElementById('start-screen');
const gameUI = document.getElementById('game-ui');
const resultUI = document.getElementById('result-ui');
const loadingOverlay = document.getElementById('loading-overlay');
const btnStart = document.getElementById('btn-start');
const btnSpin = document.getElementById('btn-spin');
const btnCapture = document.getElementById('btn-capture');
const btnRetry = document.getElementById('btn-retry');

// ---- THREE.JS SETUP ----
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, CAMERA_Z);

const renderer = new THREE.WebGLRenderer({
    canvas: canvasElement,
    alpha: true,
    preserveDrawingBuffer: true,
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ---- LIGHTS ----
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(0, 5, 5);
scene.add(dirLight);

// ---- SYSTEMS ----
const ringSystem = new RingSystem(scene);
const spinLogic = new SpinLogic(4); // 4 images
const confettiSystem = new ConfettiSystem(scene);
const occluderSystem = new OccluderSystem(scene);
const faceTracker = new FaceTracker(videoElement);

// ---- HELPERS ----
function getVisibleHeightAtZ(depth) {
    const vFOV = camera.fov * Math.PI / 180;
    const distance = Math.abs(camera.position.z - depth);
    return 2 * Math.tan(vFOV / 2) * distance;
}

function getVisibleWidthAtZ(depth) {
    const height = getVisibleHeightAtZ(depth);
    return height * camera.aspect;
}

function updateHeadMatrix(landmarks) {
    if (!landmarks) {
        hasFace = false;
        return;
    }
    hasFace = true;

    // Z plane matches ringSystem expectation (0 + offset)
    const ringZ = 0;
    const visibleHeight = getVisibleHeightAtZ(ringZ);
    const visibleWidth = visibleHeight * camera.aspect;

    // Use landmark 168 (mid between eyes)
    const p = landmarks[168];

    // Map 0..1 to World Coords
    // MediaPipe x: 0 (left) -> 1 (right)
    // CSS mirrors video, so we invert X calculation
    const x = -(p.x - 0.5) * visibleWidth;
    const y = -(p.y - 0.5) * visibleHeight; // Invert Y
    const z = ringZ;

    const position = new THREE.Vector3(x, y, z);

    // Roll calculation
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];

    const dx = rightEye.x - leftEye.x;
    const dy = rightEye.y - leftEye.y;

    const angle = Math.atan2(
        dy * videoElement.videoHeight,
        dx * videoElement.videoWidth
    );

    const q = new THREE.Quaternion();
    q.setFromEuler(new THREE.Euler(0, 0, angle));

    currentHeadMatrix.compose(position, q, new THREE.Vector3(1, 1, 1));
}

function onRoundComplete(index) {
    gameUI.classList.add('hidden');
    resultUI.classList.remove('hidden');
    ringSystem.highlight(index);

    // Trigger confetti burst with the winning index
    // Confetti System now handles loading the correct texture based on index
    confettiSystem.burst(index, currentHeadMatrix);
}

// ---- UI HANDLERS ----
btnStart.addEventListener('click', async () => {
    startScreen.classList.add('hidden');
    loadingOverlay.classList.remove('hidden');

    const loadingText = loadingOverlay.querySelector('p');
    if (loadingText) loadingText.innerText = "Requesting Camera...";

    try {
        await faceTracker.start((msg) => {
            if (loadingText) loadingText.innerText = msg;
        });

        if (loadingText) loadingText.innerText = "Waiting for Face...";

        setTimeout(() => {
            if (!isActive) {
                loadingOverlay.classList.add('hidden');
                gameUI.classList.remove('hidden');
                isActive = true;
            }
        }, 5000);

    } catch (e) {
        if (loadingText) loadingText.innerText = "Error: " + e.message;
        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
            startScreen.classList.remove('hidden');
        }, 3000);
        return;
    }

    initLoop();
});

btnSpin.addEventListener('click', () => {
    if (isSpinning) return;
    isSpinning = true;
    gameUI.classList.add('hidden');

    spinLogic.startSpin();

    // Spin for 2 seconds then trigger stop sequence
    setTimeout(() => {
        // Random 0-3
        const target = Math.floor(Math.random() * 4);
        console.log("Stopping at index:", target);
        spinLogic.triggerStop(target);
    }, 2000); // 2 seconds spin
});

btnRetry.addEventListener('click', () => {
    resultUI.classList.add('hidden');
    gameUI.classList.remove('hidden');
    isSpinning = false;
    spinLogic.reset();
    ringSystem.highlight(-1);
});

btnCapture.addEventListener('click', () => {
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = canvasElement.width;
    captureCanvas.height = canvasElement.height;
    const ctx = captureCanvas.getContext('2d');

    // Draw Video (Mirrored)
    ctx.translate(captureCanvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoElement, 0, 0, captureCanvas.width, captureCanvas.height);
    // Reset
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Draw 3D
    ctx.drawImage(canvasElement, 0, 0);

    // Draw UI Text
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillText("WebAR Face Roulette", captureCanvas.width / 2, 50);

    const link = document.createElement('a');
    link.download = `face-roulette-${Date.now()}.png`;
    link.href = captureCanvas.toDataURL('image/png');
    link.click();
});

// ---- CALLBACKS ----
faceTracker.onFaceFound = (landmarks) => {
    if (!isActive && !loadingOverlay.classList.contains('hidden')) {
        loadingOverlay.classList.add('hidden');
        gameUI.classList.remove('hidden');
        isActive = true;
    }

    updateHeadMatrix(landmarks);
    if (!isSpinning && spinLogic.state === 'IDLE') {
        btnSpin.disabled = false;
        btnSpin.innerText = "SPIN";
    }
};

faceTracker.onFaceLost = () => {
    hasFace = false;
    btnSpin.disabled = true;
    btnSpin.innerText = "No Face detected";
};

// ---- LOOP ----
const clock = new THREE.Clock();

function initLoop() {
    renderer.setAnimationLoop(() => {
        const dt = clock.getDelta();

        // Update Physics (swaps index)
        const currentIndex = spinLogic.update(dt);

        // Update Confetti
        confettiSystem.update(dt);

        // Update Overlay & Occluder
        if (hasFace) {
            ringSystem.update(currentIndex, currentHeadMatrix);
            occluderSystem.update(currentHeadMatrix);
        } else {
            ringSystem.update(-1, null);
            occluderSystem.update(null);
        }

        // Check if stopped
        if (isSpinning && spinLogic.state === 'STOPPED') {
            isSpinning = false;
            onRoundComplete(spinLogic.currentIndex);
        }

        renderer.render(scene, camera);

        if (window.innerHeight !== canvasElement.height || window.innerWidth !== canvasElement.width) {
            const width = window.innerWidth;
            const height = window.innerHeight;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        }
    });
}

// Initial state
loadingOverlay.classList.add('hidden');
startScreen.classList.remove('hidden');
