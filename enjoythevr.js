/**
 * ENJOY THE VR SCRIPT
 * Script tambahan untuk menghaluskan pergerakan sensor HP (Anti-Lag LERP) 
 * dan menambahkan fisika klik/cubit pada objek VR.
 */

document.addEventListener('DOMContentLoaded', () => {
    const cursor = document.getElementById('hand-cursor');
    const app1 = document.getElementById('app-1');
    const app2 = document.getElementById('app-2');
    
    // Variabel untuk Interpolasi Linear (LERP) agar gerakan kursor mulus
    let currentPos = { x: 0, y: 1.5, z: -2.5 };
    let targetPos = { x: 0, y: 1.5, z: -2.5 };
    
    // 1. Menerima data koordinat kasar dari reality-fusion-core
    window.addEventListener('hand-moved', (e) => {
        targetPos.x = e.detail.x;
        targetPos.y = e.detail.y;
    });

    // 2. Logika Interaksi Objek 3D saat Tangan Mencubit (Pinch)
    window.addEventListener('hand-pinched', (e) => {
        if(app1 && app2 && typeof THREE !== 'undefined') {
            // Deteksi tabrakan (Collision) menggunakan koordinat global (World Position)
            let worldPos1 = new THREE.Vector3();
            app1.object3D.getWorldPosition(worldPos1);
            let distApp1 = Math.hypot(targetPos.x - worldPos1.x, targetPos.y - worldPos1.y);
            
            let worldPos2 = new THREE.Vector3();
            app2.object3D.getWorldPosition(worldPos2);
            let distApp2 = Math.hypot(targetPos.x - worldPos2.x, targetPos.y - worldPos2.y);
            
            // Jarak < 0.6 berarti kursor berada di atas kotak
            if(distApp1 < 0.6) {
                app1.setAttribute('scale', '1.2 1.2 1.2'); // Efek membesar
                app1.setAttribute('material', 'color: #00FF00'); // Berubah hijau
                document.getElementById('status-text').innerText = "Status: Membuka App 1...";
            } else if(distApp2 < 0.6) {
                app2.setAttribute('scale', '1.2 1.2 1.2');
                app2.setAttribute('material', 'color: #00FF00');
                document.getElementById('status-text').innerText = "Status: Membuka App 2...";
            }
        }
    });

    // 3. Mengembalikan state saat cubitan dilepas
    window.addEventListener('hand-released', (e) => {
         if(app1) {
             app1.setAttribute('scale', '1 1 1');
             app1.setAttribute('material', 'color: #FF0055');
         }
         if(app2) {
             app2.setAttribute('scale', '1 1 1');
             app2.setAttribute('material', 'color: #4285F4');
         }
         document.getElementById('status-text').innerText = "Status: Aktif & Melacak";
    });

    // 4. ANIMASI LOOP 60FPS (Rahasia Kursor Tidak Lag)
    function animateSmoothCursor() {
        if (cursor && cursor.getAttribute('visible') === 'true') {
            // LERP mengalkulasi selisih jarak target dan posisi saat ini 
            // lalu menggerakkannya perlahan (0.15 kecepatan lerp)
            currentPos.x += (targetPos.x - currentPos.x) * 0.15; 
            currentPos.y += (targetPos.y - currentPos.y) * 0.15;
            
            cursor.object3D.position.set(currentPos.x, currentPos.y, -2.5);
        }
        requestAnimationFrame(animateSmoothCursor);
    }
    
    // Mulai animasi
    animateSmoothCursor();
});
