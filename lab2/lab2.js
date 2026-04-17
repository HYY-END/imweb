document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video-feed');
    const captureCanvas = document.getElementById('capture-canvas');
    const combineCanvas = document.getElementById('combine-canvas');
    const flashEffect = document.getElementById('flash-effect');
    const countdownOverlay = document.getElementById('countdown-overlay');
    const photoWall = document.getElementById('photo-wall');
    
    const btnCamera = document.getElementById('btn-camera');
    const btnShoot = document.getElementById('btn-shoot');
    const btnDownload = document.getElementById('btn-download');
    const layoutSelect = document.getElementById('download-layout');
    const filterSelect = document.getElementById('filter-select');
    const frameSelect = document.getElementById('frame-select');
    const frameOverlay = document.getElementById('frame-overlay');

    let stream = null;
    let capturedPhotos = []; // Store base64 data strings of 4 photos

    // --- 0. Effect Handlers ---
    filterSelect.addEventListener('change', () => {
        video.className = ''; // Reset
        if (filterSelect.value !== 'none') {
            video.classList.add(`filter-${filterSelect.value}`);
        }
    });

    frameSelect.addEventListener('change', () => {
        frameOverlay.className = 'frame-overlay'; // Reset
        frameOverlay.classList.add(frameSelect.value);
    });

    // --- 1. Detect & Start Camera ---
    btnCamera.addEventListener('click', async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, 
                audio: false 
            });
            video.srcObject = stream;
            
            btnCamera.innerHTML = "鏡頭已開啟 ✅";
            btnCamera.disabled = true;
            btnShoot.disabled = false;
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("哎呀！無法開啟相機，請確認您已給予鏡頭權限～ 😢");
        }
    });

    // --- 2. 4-Shot Burst Functionality ---
    btnShoot.addEventListener('click', async () => {
        btnShoot.disabled = true;
        capturedPhotos = []; // Reset photos
        
        // Remove placeholder text if it exists
        const placeholder = photoWall.querySelector('.placeholder-text');
        if (placeholder) placeholder.remove();

        // Sequential 4 shots
        for (let i = 0; i < 4; i++) {
            await performCountdown(3);
            takeSnap(i + 1);
            // Brief pause between snaps to let the flash finish and prepare for next
            await new Promise(r => setTimeout(r, 500));
        }

        btnShoot.disabled = false;
        btnDownload.disabled = false;
        btnShoot.innerHTML = "重新四連拍 🔄";
    });

    async function performCountdown(seconds) {
        countdownOverlay.classList.remove('hidden');
        for (let s = seconds; s > 0; s--) {
            countdownOverlay.textContent = s;
            await new Promise(r => setTimeout(r, 1000));
        }
        countdownOverlay.classList.add('hidden');
    }

    function takeSnap(shotNumber) {
        // Trigger Flash
        flashEffect.classList.remove('active');
        void flashEffect.offsetWidth; // Trigger reflow
        flashEffect.classList.add('active');

        // Capture Frame
        const ctx = captureCanvas.getContext('2d');
        captureCanvas.width = video.videoWidth;
        captureCanvas.height = video.videoHeight;
        
        // Apply Filter to Canvas
        if (filterSelect.value === 'pink') {
            ctx.filter = 'sepia(0.3) saturate(1.4) hue-rotate(-15deg) brightness(1.1)';
        } else if (filterSelect.value === 'retro') {
            ctx.filter = 'sepia(0.8) contrast(1.1) brightness(0.9)';
        } else if (filterSelect.value === 'dreamy') {
            ctx.filter = 'brightness(1.1) contrast(0.9) saturate(1.2) blur(1px)';
        } else if (filterSelect.value === 'bw') {
            ctx.filter = 'grayscale(1)';
        } else if (filterSelect.value === 'warm') {
            ctx.filter = 'sepia(0.4) saturate(1.5) brightness(1.1)';
        } else if (filterSelect.value === 'cool') {
            ctx.filter = 'hue-rotate(180deg) saturate(0.8) brightness(1.1)';
        } else if (filterSelect.value === 'vibrant') {
            ctx.filter = 'saturate(2) contrast(1.2)';
        }

        // Flip horizontal for mirroring effect
        ctx.translate(captureCanvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
        
        // Reset transform and filter for Frame drawing
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.filter = 'none';

        // Draw Frame onto Canvas
        drawFrameToCanvas(ctx, frameSelect.value, captureCanvas.width, captureCanvas.height);

        const dataUrl = captureCanvas.toDataURL('image/png');
        capturedPhotos.push(dataUrl);

        // Add to Photo Wall
        addToWall(dataUrl, shotNumber);
    }

    function drawFrameToCanvas(ctx, frameType, w, h) {
        ctx.fillStyle = "white";
        ctx.font = "bold 60px Arial";
        ctx.textAlign = "center";
        
        if (frameType === 'cloud') {
            ctx.fillText("☁️ ☁️ ☁️ ☁️ ☁️", w / 2, 80);
        } else if (frameType === 'heart') {
            ctx.fillText("💖 🌸 💖 🌸", w / 2, h - 40);
        } else if (frameType === 'star') {
            ctx.font = "bold 80px Arial";
            ctx.fillText("✨", w - 100, 100);
            ctx.fillText("⭐", w - 100, 200);
            ctx.fillText("✨", w - 100, 300);
        } else if (frameType === 'flower') {
            ctx.fillText("🌸 🌼 🌸 🌼", w / 2, 80);
        } else if (frameType === 'bear') {
            ctx.fillText("🧸 🧸 🧸", w - 150, h - 80);
        } else if (frameType === 'music') {
            ctx.fillText("🎵 🎶 🎵", 150, 100);
        } else if (frameType === 'glow') {
            ctx.strokeStyle = "rgba(255, 133, 161, 0.5)";
            ctx.lineWidth = 40;
            ctx.strokeRect(0, 0, w, h);
        }
    }

    function addToWall(dataUrl, num) {
        const div = document.createElement('div');
        div.className = 'captured-photo';
        // Give it a random rotation for the "scrapbook" look
        const rot = (Math.random() * 6 - 3).toFixed(1);
        div.style.setProperty('--rot', `${rot}deg`);
        
        div.innerHTML = `
            <img src="${dataUrl}" alt="Shot ${num}">
            <p>#${num}</p>
        `;
        photoWall.appendChild(div);
    }

    // --- 3. Download Layout Combine ---
    btnDownload.addEventListener('click', () => {
        if (capturedPhotos.length < 4) {
            alert("還沒拍滿 4 張照片喔！📸");
            return;
        }

        const layout = layoutSelect.value;
        combineImages(layout);
    });

    function combineImages(layout) {
        const ctx = combineCanvas.getContext('2d');
        const imgW = 800; // Widescreen width
        const imgH = 450; // Widescreen height (16:9)
        const padding = 50;
        const polaroidPadding = 20;
        const polaroidBottom = 60;

        if (layout === 'vertical') {
            // 1x4 Strip
            combineCanvas.width = imgW + (padding * 2) + (polaroidPadding * 2);
            combineCanvas.height = ((imgH + polaroidPadding + polaroidBottom) * 4) + (padding * 5);
        } else {
            // 2x2 Grid
            combineCanvas.width = (imgW * 2) + (padding * 3) + (polaroidPadding * 4);
            combineCanvas.height = ((imgH + polaroidPadding + polaroidBottom) * 2) + (padding * 3);
        }

        // Background Color (Cute Pastel Pink)
        ctx.fillStyle = "#fff0f3"; 
        ctx.fillRect(0, 0, combineCanvas.width, combineCanvas.height);

        let loadedCount = 0;
        const imgs = [];

        capturedPhotos.forEach((src, index) => {
            const img = new Image();
            img.onload = () => {
                imgs[index] = img;
                loadedCount++;
                if (loadedCount === 4) {
                    drawLayout(ctx, imgs, layout, imgW, imgH, padding, polaroidPadding, polaroidBottom);
                    downloadCanvas();
                }
            };
            img.src = src;
        });
    }

    function drawLayout(ctx, imgs, layout, w, h, p, pp, pb) {
        const drawPolaroid = (img, x, y) => {
            // White background for Polaroid
            ctx.fillStyle = "white";
            ctx.shadowColor = "rgba(0,0,0,0.1)";
            ctx.shadowBlur = 15;
            ctx.fillRect(x, y, w + pp * 2, h + pp + pb);
            ctx.shadowBlur = 0;

            // Draw image (16:9 ratio)
            ctx.drawImage(img, x + pp, y + pp, w, h);
            
            // Text placeholder/Decoration on Polaroid
            ctx.fillStyle = "#ff85a1";
            ctx.font = "italic bold 28px Comfortaa, cursive";
            ctx.textAlign = "center";
            ctx.fillText("✨ Dreamy Moment ✨", x + (w + pp * 2) / 2, y + h + pp + (pb * 0.7));
        };

        if (layout === 'vertical') {
            imgs.forEach((img, i) => {
                const x = p;
                const y = p + i * (h + pp + pb + p);
                drawPolaroid(img, x, y);
            });
        } else {
            // 2x2 Grid
            const itemW = w + pp * 2;
            const itemH = h + pp + pb;
            drawPolaroid(imgs[0], p, p);
            drawPolaroid(imgs[1], p * 2 + itemW, p);
            drawPolaroid(imgs[2], p, p * 2 + itemH);
            drawPolaroid(imgs[3], p * 2 + itemW, p * 2 + itemH);
        }
        
        // Watermark at the very bottom
        ctx.fillStyle = "#ff85a1";
        ctx.font = "bold 20px Comfortaa, cursive";
        ctx.textAlign = "center";
        ctx.fillText("Created by Dreamy Booth - Widescreen Edition", combineCanvas.width / 2, combineCanvas.height - 15);
    }

    function downloadCanvas() {
        const link = document.createElement('a');
        const now = new Date();
        const timestamp = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
        link.download = `PhotoBooth_${timestamp}.png`;
        link.href = combineCanvas.toDataURL('image/png');
        link.click();
    }
});
