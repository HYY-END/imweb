// Lab 4: Cute Style - Persistent Items Edition

const videoElement = document.getElementById('input-video');
const canvasElement = document.getElementById('output-canvas');
const canvasCtx = canvasElement.getContext('2d');
const bgCanvas = document.getElementById('interactive-bg');
const bgCtx = bgCanvas.getContext('2d');
const handStatus = document.getElementById('hand-status');
const container = document.querySelector('.welcome-container');

let hands;
let camera;
let bgParticles = [];
let handPos = { x: -1000, y: -1000 };
let isPinching = false;
let persistentItems = []; // Paws and Hearts that stay

const cuteEmojis = ['🍭', '🌸', '⭐', '🌈', '✨'];

document.addEventListener('DOMContentLoaded', () => {
    initHandDetection();
    initBackground();
    animate();
});

function initBackground() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    window.addEventListener('resize', () => {
        bgCanvas.width = window.innerWidth;
        bgCanvas.height = window.innerHeight;
    });

    for (let i = 0; i < 20; i++) {
        bgParticles.push({
            x: Math.random() * bgCanvas.width,
            y: Math.random() * bgCanvas.height,
            size: Math.random() * 20 + 10,
            emoji: cuteEmojis[Math.floor(Math.random() * cuteEmojis.length)],
            vx: Math.random() * 0.5 - 0.25,
            vy: Math.random() * 0.5 - 0.25,
            rotation: Math.random() * 360,
            rv: Math.random() * 1 - 0.5
        });
    }
}

function animate() {
    drawBackground();
    updatePersistentItems();
    requestAnimationFrame(animate);
}

function drawBackground() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    
    // Draw drifting background items
    bgParticles.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.rotation += p.rv;
        if (p.x < -50) p.x = bgCanvas.width + 50;
        if (p.x > bgCanvas.width + 50) p.x = -50;
        if (p.y < -50) p.y = bgCanvas.height + 50;
        if (p.y > bgCanvas.height + 50) p.y = -50;

        bgCtx.save();
        bgCtx.translate(p.x, p.y);
        bgCtx.rotate(p.rotation * Math.PI / 180);
        bgCtx.font = `${p.size}px serif`;
        bgCtx.textAlign = 'center';
        bgCtx.textBaseline = 'middle';
        bgCtx.globalAlpha = 0.2;
        bgCtx.fillText(p.emoji, 0, 0);
        bgCtx.restore();
    });
}

function updatePersistentItems() {
    // If hand is detected, spawn trail
    if (handPos.x > 0) {
        if (isPinching) {
            // Spawn Hearts when pinching
            if (Math.random() > 0.5) spawnPersistentItem('💖', 40);
        } else {
            // Spawn Paws when moving
            if (Math.random() > 0.8) spawnPersistentItem('🐾', 30);
        }
    }

    // Limit the number of persistent items to prevent performance issues
    if (persistentItems.length > 500) {
        const oldItem = persistentItems.shift();
        document.body.removeChild(oldItem.el);
    }
}

function spawnPersistentItem(emoji, size) {
    const el = document.createElement('div');
    el.className = 'persistent-item';
    el.textContent = emoji;
    el.style.left = `${handPos.x + (Math.random() - 0.5) * 20}px`;
    el.style.top = `${handPos.y + (Math.random() - 0.5) * 20}px`;
    el.style.fontSize = `${size}px`;
    
    // Add a little bouncy entrance
    el.style.transform = 'scale(0) rotate(' + (Math.random() * 40 - 20) + 'deg)';
    document.body.appendChild(el);
    
    // Trigger animation
    setTimeout(() => {
        el.style.transform = 'scale(1) rotate(' + (Math.random() * 40 - 20) + 'deg)';
    }, 10);

    persistentItems.push({ el: el });
}

// 3. Initialize MediaPipe Hands
function initHandDetection() {
    hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    hands.onResults(onResults);
    camera = new Camera(videoElement, {
        onFrame: async () => { await hands.send({ image: videoElement }); },
        width: 640, height: 480
    });
    camera.start();
}

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        handStatus.textContent = "🐾 喵嗚~ 創作中！";
        const landmarks = results.multiHandLandmarks[0];
        
        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];
        handPos.x = (1 - indexTip.x) * window.innerWidth;
        handPos.y = indexTip.y * window.innerHeight;

        const distance = Math.sqrt(Math.pow(indexTip.x - thumbTip.x, 2) + Math.pow(indexTip.y - thumbTip.y, 2));
        isPinching = distance < 0.05;

        const tiltX = (indexTip.y - 0.5) * 20;
        const tiltY = (0.5 - indexTip.x) * 20;
        container.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
    } else {
        handStatus.textContent = "揮揮手來畫畫吧~";
        handPos.x = -1000;
        isPinching = false;
        container.style.transform = 'rotateX(0deg) rotateY(0deg)';
    }
    canvasCtx.restore();
}
