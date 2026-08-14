/**
 * REALITY FUSION CORE v1.0
 * Engine Penggabung Visi WebXR & MediaPipe Hand Tracking
 */

AFRAME.registerComponent('track-coordinates', {
    tick: function () {
        let position = this.el.object3D.position;
        let x = position.x.toFixed(2);
        let y = position.y.toFixed(2);
        let z = position.z.toFixed(2);

        let textElement = document.getElementById('coordinate-text');
        if (textElement) {
            textElement.innerText = `Posisi Panel -> X: ${x}, Y: ${y}, Z: ${z}`;
        }
    }
});

const videoElement = document.getElementById('webcam-video');
const canvasElement = document.getElementById('hand-canvas');
const canvasCtx = canvasElement.getContext('2d', { alpha: true });
const startBtn = document.getElementById('start-btn');
const statusText = document.getElementById('status-text');
const handCursor = document.getElementById('hand-cursor');

function resize() {
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

async function startCamera() {
    try {
        statusText.innerText = "Status: Memulai Kamera...";
        statusText.style.color = "#FFD700"; 

        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: "environment",
                width: { ideal: 640 },
                height: { ideal: 480 }
            } 
        });
        
        videoElement.srcObject = stream;
        
        videoElement.onloadedmetadata = () => {
            startBtn.style.display = 'none';
            statusText.innerText = "Status: Menyiapkan Sensor AI...";
            detectHands(); 
        };

    } catch (err) {
        statusText.innerText = "Status: Akses Kamera Gagal!";
        statusText.style.color = "red";
        alert("Gagal mengakses kamera: Pastikan izin kamera diberikan. " + err);
    }
}
startBtn.addEventListener('click', startCamera);

const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 0, 
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
});

const HAND_CONNECTIONS = [[0,1],[1,2],[2,3],[3,4], [0,5],[5,6],[6,7],[7,8], [5,9],[9,10],[10,11],[11,12], [9,13],[13,14],[14,15],[15,16], [13,17],[0,17],[17,18],[18,19],[19,20]];

let lastFrameTime = 0;
const targetFPS = 30;
const frameInterval = 1000 / targetFPS;

window.isPinched = false;

hands.onResults((results) => {
    statusText.innerText = "Status: Aktif & Melacak";
    statusText.style.color = "#00FF00"; 

    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = "rgba(0, 255, 255, 0.6)";
        HAND_CONNECTIONS.forEach(pair => {
            const p1 = { x: landmarks[pair[0]].x * window.innerWidth, y: landmarks[pair[0]].y * window.innerHeight };
            const p2 = { x: landmarks[pair[1]].x * window.innerWidth, y: landmarks[pair[1]].y * window.innerHeight };
            canvasCtx.beginPath(); canvasCtx.moveTo(p1.x, p1.y); canvasCtx.lineTo(p2.x, p2.y); canvasCtx.stroke();
        });

        landmarks.forEach(lm => {
            canvasCtx.fillStyle = "rgba(255, 255, 255, 0.8)";
            canvasCtx.beginPath();
            canvasCtx.arc(lm.x * window.innerWidth, lm.y * window.innerHeight, 3, 0, 2*Math.PI);
            canvasCtx.fill();
        });

        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];
        
        if (handCursor) {
            handCursor.setAttribute('visible', 'true');
            let x3D = -(indexTip.x - 0.5) * 5; 
            let y3D = -(indexTip.y - 0.5) * 5 + 1.5; 
            
            // Mengirim Event pergerakan ke script enjoythevr.js agar diproses secara mulus
            window.dispatchEvent(new CustomEvent('hand-moved', { detail: { x: x3D, y: y3D } }));
            
            const distance = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
            if (distance < 0.05) { 
                canvasCtx.fillStyle = "#FF0055"; 
                canvasCtx.beginPath();
                canvasCtx.arc(indexTip.x * window.innerWidth, indexTip.y * window.innerHeight, 12, 0, 2*Math.PI);
                canvasCtx.fill();
                
                handCursor.setAttribute('material', 'color: #FF0055; emissive: #FF0055');
                handCursor.setAttribute('scale', '1.5 1.5 1.5');
                
                if(!window.isPinched) {
                    window.isPinched = true;
                    window.dispatchEvent(new CustomEvent('hand-pinched', { detail: { x: x3D, y: y3D } }));
                }
            } else {
                handCursor.setAttribute('material', 'color: #00FFFF; emissive: #00FFFF');
                handCursor.setAttribute('scale', '1 1 1');
                
                if(window.isPinched) {
                    window.isPinched = false;
                    window.dispatchEvent(new CustomEvent('hand-released'));
                }
            }
        }
    } else {
        if (handCursor) handCursor.setAttribute('visible', 'false');
    }
});

async function detectHands(timestamp) {
    if (!lastFrameTime) lastFrameTime = timestamp;
    const elapsed = timestamp - lastFrameTime;

    if (videoElement.readyState >= 2 && !videoElement.paused) {
        if (elapsed > frameInterval) {
            lastFrameTime = timestamp;
            await hands.send({ image: videoElement });
        }
    }
    requestAnimationFrame(detectHands);
}
