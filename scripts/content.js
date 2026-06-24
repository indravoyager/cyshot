
// ✦ SCREEN RECORDING FUNCTION ✦
window.isCycyRecording = false;
window.cycyMediaRecorder = null;
window.cycyRecordChunks = [];

window.toggleScreenRecord = async function() {
    if (!window.isCycyRecording) {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            window.cycyMediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            window.cycyRecordChunks = [];

            window.cycyMediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) window.cycyRecordChunks.push(e.data);
            };

            window.cycyMediaRecorder.onstop = () => {
                const blob = new Blob(window.cycyRecordChunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const domain = window.location.hostname.replace('www.', '') || "web";
                const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                const rand = Math.random().toString(36).substring(2, 6);
                a.download = `cyshotvid_${domain}_${dateStr}_${rand}.webm`;
                a.click();
                URL.revokeObjectURL(url);
                window.isCycyRecording = false;
            };

            stream.getVideoTracks()[0].onended = () => {
                if (window.isCycyRecording) {
                    window.cycyMediaRecorder.stop();
                }
            };

            window.cycyMediaRecorder.start();
            window.isCycyRecording = true;

        } catch (err) {
            console.log("Screen recording cancelled or failed", err);
        }
    } else {
        if (window.cycyMediaRecorder && window.cycyMediaRecorder.state !== 'inactive') {
            window.cycyMediaRecorder.stop();
            window.cycyMediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    }
};

// ✦ KEYBOARD SHORTCUT LISTENER (Q, S) ✦
document.addEventListener('keydown', (e) => {
    const isTyping = ['input', 'textarea'].includes(document.activeElement.tagName.toLowerCase());
    if (isTyping) return;
    
    if (modeSeleksiSelesai && panelTombol && panelTombol.style.display !== 'none') {
        if (e.key === 'q' || e.key === 'Q') {
            e.preventDefault();
            e.stopImmediatePropagation();
            const btnJepret = panelTombol.querySelectorAll('button')[0];
            if (btnJepret) btnJepret.click();
        } else if (e.key === 's' || e.key === 'S') {
            e.preventDefault();
            e.stopImmediatePropagation();
            const btnReset = panelTombol.querySelectorAll('button')[1];
            if (btnReset) btnReset.click();
        }
    }
}, true);

// ✦ CAMERA & SELECTION OVERLAY ✦
let lapisanGelap = null;
let kotakSeleksi = null;
let panelTombol = null;
let titikMulaiX = 0, titikMulaiY = 0;
let sedangMenarik = false;
let modeSeleksiSelesai = false;

function panggilLapisanKamera() {
    if (lapisanGelap) {
        if (document.documentElement.contains(lapisanGelap)) return; 
        try { lapisanGelap.remove(); } catch(e) {}
        try { panelTombol.remove(); } catch(e) {}
    }
    
    modeSeleksiSelesai = false;
    
    lapisanGelap = document.createElement('div');
    lapisanGelap.id = 'cycy-lapisan-gelap';
    lapisanGelap.style.cssText = 'position:fixed !important; top:0 !important; left:0 !important; width:100vw !important; height:100vh !important; background:rgba(0,0,0,0.2) !important; z-index:2147483646 !important; cursor:crosshair !important; user-select:none !important; -webkit-user-select:none !important; touch-action:none !important;';
    
    kotakSeleksi = document.createElement('div');
    kotakSeleksi.id = 'cycy-kotak-seleksi';
    kotakSeleksi.style.cssText = 'position:absolute !important; border:1px solid #ffffff !important; background:rgba(255,255,255,0.1) !important; pointer-events:none !important; display:none; z-index:2147483647 !important;';
    
    panelTombol = document.createElement('div');
    panelTombol.id = 'cycy-panel-tombol';
    panelTombol.style.cssText = 'position:fixed !important; display:none; pointer-events:auto !important; gap:4px !important; z-index:2147483647 !important;';
    
    const btnJepret = document.createElement('button');
    btnJepret.innerText = 'Capture (Q)';
    btnJepret.style.cssText = 'background:#121212 !important; color:#ffffff !important; border:1px solid #ffffff !important; padding:4px 8px !important; cursor:pointer !important; font-size:12px !important; border-radius:2px !important; transition: background 0.2s !important;';

    const btnReset = document.createElement('button');
    btnReset.innerText = 'Reset (S)';
    btnReset.style.cssText = 'background:#121212 !important; color:#ffffff !important; border:1px solid #ffffff !important; padding:4px 8px !important; cursor:pointer !important; font-size:12px !important; border-radius:2px !important; transition: background 0.2s !important;';

    const btnTutup = document.createElement('button');
    btnTutup.innerText = 'Close';
    btnTutup.style.cssText = 'background:#121212 !important; color:#ffffff !important; border:1px solid #ffffff !important; padding:4px 8px !important; cursor:pointer !important; font-size:12px !important; border-radius:2px !important; transition: background 0.2s !important;';
    
    btnReset.addEventListener('click', () => {
        kotakSeleksi.style.display = 'none';
        panelTombol.style.display = 'none';
        lapisanGelap.style.background = 'rgba(0,0,0,0.2)';
        lapisanGelap.style.pointerEvents = 'auto';
        lapisanGelap.style.cursor = 'crosshair';
        modeSeleksiSelesai = false;
        sedangMenarik = false;
    });

    panelTombol.appendChild(btnJepret);
    panelTombol.appendChild(btnReset);
    panelTombol.appendChild(btnTutup);
    
    lapisanGelap.appendChild(kotakSeleksi);

    const lekatkan = () => {
        const wadah = document.documentElement; 
        if (wadah) {
            wadah.appendChild(lapisanGelap);
            wadah.appendChild(panelTombol);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', lekatkan);
    } else {
        lekatkan();
    }

    lapisanGelap.addEventListener('mousedown', (e) => {
        if (modeSeleksiSelesai) return; 
        e.preventDefault(); 
        sedangMenarik = true;
        titikMulaiX = e.clientX; titikMulaiY = e.clientY;
        kotakSeleksi.style.left = titikMulaiX + 'px'; kotakSeleksi.style.top = titikMulaiY + 'px';
        kotakSeleksi.style.width = '0px'; kotakSeleksi.style.height = '0px';
        kotakSeleksi.style.display = 'block';
        panelTombol.style.display = 'none';
    });

    lapisanGelap.addEventListener('mousemove', (e) => {
        if (!sedangMenarik) return;
        e.preventDefault();
        const xSekarang = e.clientX, ySekarang = e.clientY;
        const lebar = Math.abs(xSekarang - titikMulaiX), tinggi = Math.abs(ySekarang - titikMulaiY);
        const kiri = Math.min(xSekarang, titikMulaiX), atas = Math.min(ySekarang, titikMulaiY);
        
        kotakSeleksi.style.left = kiri + 'px'; kotakSeleksi.style.top = atas + 'px';
        kotakSeleksi.style.width = lebar + 'px'; kotakSeleksi.style.height = tinggi + 'px';
    });

    lapisanGelap.addEventListener('mouseup', (e) => {
        if (!sedangMenarik) return;
        sedangMenarik = false;
        const ukuranBatas = kotakSeleksi.getBoundingClientRect();
        
        if (ukuranBatas.width > 20 && ukuranBatas.height > 20) {
            modeSeleksiSelesai = true;
            lapisanGelap.style.background = 'transparent';
            lapisanGelap.style.pointerEvents = 'none'; 
            lapisanGelap.style.cursor = 'default';
            
            kotakSeleksi.style.background = 'transparent';
            kotakSeleksi.style.border = '1px solid #ffffff';
            
            panelTombol.style.display = 'flex';
            const panelWidth = panelTombol.offsetWidth || 230;
            let letakLeft = ukuranBatas.left + (ukuranBatas.width / 2) - (panelWidth / 2);
            if (letakLeft < 4) letakLeft = 4;
            if (letakLeft + panelWidth > window.innerWidth - 4) {
                letakLeft = window.innerWidth - panelWidth - 4;
            }
            panelTombol.style.left = letakLeft + 'px';
            
            let letakTop = ukuranBatas.bottom + 4;
            if (letakTop + 30 > window.innerHeight) letakTop = ukuranBatas.bottom - 30;
            panelTombol.style.top = letakTop + 'px';
        } else {
            kotakSeleksi.style.display = 'none';
        }
    });
    
    btnJepret.addEventListener('click', () => {
        const ukuranBatas = kotakSeleksi.getBoundingClientRect();
        kotakSeleksi.style.display = 'none'; panelTombol.style.display = 'none';
        setTimeout(() => {
            prosesPemotonganGambar(ukuranBatas, () => {
                kotakSeleksi.style.display = 'block'; panelTombol.style.display = 'flex';
            });
        }, 100); 
    });

    btnTutup.addEventListener('click', () => {
        buangLapisanKamera();
        chrome.storage.local.set({ kameraAktif: false }); 
    });
}

function buangLapisanKamera() {
    if (lapisanGelap) { lapisanGelap.remove(); lapisanGelap = null; }
    if (panelTombol) { panelTombol.remove(); panelTombol = null; }
    modeSeleksiSelesai = false;
}

function prosesPemotonganGambar(batas, aksiLanjutan) {
    chrome.runtime.sendMessage({action: "AMBIL_GAMBAR_LAYAR"}, (respons) => {
        if (!respons || !respons.imgSrc) { if (aksiLanjutan) aksiLanjutan(); return; }
        
        const gambarUtuh = new Image();
        gambarUtuh.onload = () => {
            const ketajaman = window.devicePixelRatio || 1;
            const kanvas = document.createElement('canvas');
            kanvas.width = batas.width * ketajaman; 
            kanvas.height = batas.height * ketajaman;
            
            const pena = kanvas.getContext('2d');
            pena.imageSmoothingEnabled = true;
            pena.imageSmoothingQuality = 'high';

            pena.drawImage(
                gambarUtuh, 
                batas.left * ketajaman, batas.top * ketajaman, 
                batas.width * ketajaman, batas.height * ketajaman, 
                0, 0, kanvas.width, kanvas.height
            );
            
            const pemicuUnduh = document.createElement('a');
            pemicuUnduh.href = kanvas.toDataURL('image/png', 1.0);
            const domain = window.location.hostname.replace('www.', '') || "web";
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const rand = Math.random().toString(36).substring(2, 6);
            pemicuUnduh.download = `cyshotcap_${domain}_${dateStr}_${rand}.png`;
            pemicuUnduh.click();
            
            if (aksiLanjutan) aksiLanjutan();
        };
        gambarUtuh.src = respons.imgSrc;
    });
}

let networkLogs = [];

window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'CYCY_NET_LOG') {
        const logData = e.data.data;
        const isDuplicate = networkLogs.some(log => log.payload === logData.payload);
        
        if (!isDuplicate) {
            networkLogs.push({
                timestamp: new Date().toISOString(),
                ...logData
            });
            chrome.storage.local.set({ cycyNetTrace: networkLogs });
        }
    }
});

const observerScript = document.createElement('script');
observerScript.src = chrome.runtime.getURL('scripts/observer.js');
(document.head || document.documentElement).appendChild(observerScript);
observerScript.onload = () => observerScript.remove();

if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['kameraAktif'], (result) => {
        if (result.kameraAktif) panggilLapisanKamera();
    });

    chrome.storage.onChanged.addListener((perubahan) => {
        if (perubahan.kameraAktif) {
            if (perubahan.kameraAktif.newValue) panggilLapisanKamera();
            else buangLapisanKamera();
        }
    });
}
