// --- STATUS MANAGEMENT (TOGGLE) ---

const toggleKamera = document.getElementById('toggleKamera');
if (toggleKamera && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['kameraAktif'], (result) => {
        toggleKamera.checked = result.kameraAktif || false;
    });
    toggleKamera.addEventListener('change', (e) => {
        chrome.storage.local.set({ kameraAktif: e.target.checked });
    });
}

async function getFileName(type, extension) {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    let domain = "web";
    if (tab && tab.url) {
        try {
            let url = new URL(tab.url);
            domain = url.hostname.replace('www.', '');
        } catch (e) {}
    }
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 6);
    return `cyshot${type}_${domain}_${dateStr}_${rand}.${extension}`;
}

// --- EXECUTION MANAGEMENT (BUTTONS) ---

const btnRekam = document.getElementById('recordBtn');
if (btnRekam) {
    btnRekam.addEventListener('click', async () => {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: extractPageData
        }, (hasil) => {
            if (chrome.runtime.lastError || !hasil || !hasil[0]) {
                alert("Extraction failed. Target invalid.");
                return;
            }
            const dataString = JSON.stringify(hasil[0].result, null, 2);
            const blob = new Blob([dataString], {type: "application/json"});
            const url = URL.createObjectURL(blob);
            getFileName("dom", "json").then(filename => {
                chrome.downloads.download({ url: url, filename: filename, saveAs: true });
            });
        });
    });
}

function extractPageData() {
    return {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        title: document.title,
        canvasCount: document.querySelectorAll('canvas').length,
        images: Array.from(document.querySelectorAll('img')).map(img => img.src).filter(src => src.length > 0),
        html: document.body.innerHTML 
    };
}

const btnNetTrace = document.getElementById('netTraceBtn');
if (btnNetTrace) {
    btnNetTrace.addEventListener('click', () => {
        chrome.storage.local.get(['cycyNetTrace'], (res) => {
            const data = res.cycyNetTrace || [];
            if (data.length === 0) {
                alert("No network traces intercepted yet.");
                return;
            }
            const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
            getFileName("net", "json").then(filename => {
                chrome.downloads.download({ url: URL.createObjectURL(blob), filename: filename, saveAs: true });
            });
        });
    });
}

// ✦ SCREEN CAPTURE FUNCTION (VISIBLE AREA ONLY) ✦
const btnScreenCapture = document.getElementById('screenCaptureBtn');
if (btnScreenCapture) {
    btnScreenCapture.addEventListener('click', () => {
        chrome.runtime.sendMessage({action: "AMBIL_GAMBAR_LAYAR"}, (respons) => {
            if (respons && respons.imgSrc) {
                getFileName("cap", "png").then(filename => {
                    const a = document.createElement('a');
                    a.href = respons.imgSrc;
                    a.download = filename;
                    a.click();
                });
            } else {
                alert("Failed to capture screenshot from this page.");
            }
        });
    });
}

// ✦ SCREEN RECORD FUNCTION (FROM POPUP) ✦
const btnRecordScreen = document.getElementById('recordScreenBtn');
if (btnRecordScreen) {
    btnRecordScreen.addEventListener('click', async () => {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                if (window.toggleScreenRecord) {
                    window.toggleScreenRecord();
                } else {
                    alert("Script is not ready. Please refresh the page!");
                }
            }
        });
    });
}

const btnExport = document.getElementById('exportCookieBtn');
if (btnExport) {
    btnExport.addEventListener('click', async () => {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        let url = new URL(tab.url);
        
        // Get base domain (e.g., from www.bilibili.com to bilibili.com)
        let parts = url.hostname.split('.');
        let baseDomain = parts.length > 2 ? parts.slice(-2).join('.') : url.hostname;
        
        chrome.cookies.getAll({ domain: baseDomain }, (cookies) => {
            if (cookies.length === 0) {
                alert("No cookies found for this dimension.");
                return;
            }
            const blob = new Blob([JSON.stringify(cookies, null, 2)], {type: "application/json"});
            getFileName("cookie", "json").then(filename => {
                chrome.downloads.download({ url: URL.createObjectURL(blob), filename: filename, saveAs: true });
            });
        });
    });
}

const btnImport = document.getElementById('importCookieBtn');
const fileInput = document.getElementById('cookieFile');
if (btnImport && fileInput) {
    btnImport.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const cookies = JSON.parse(event.target.result);
                let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                let url = new URL(tab.url);
                let baseDomain = url.protocol + "//" + url.hostname;
                for (let c of cookies) {
                    chrome.cookies.set({
                        url: baseDomain, name: c.name, value: c.value, path: c.path || "/",
                        secure: c.secure, httpOnly: c.httpOnly, sameSite: c.sameSite
                    });
                }
                alert("Identity seals injected successfully. Reload the page.");
            } catch (err) {
                alert("Invalid cookie grimoire format.");
            }
        };
        reader.readAsText(file);
    });
}

const btnImg = document.getElementById('imgExtractBtn');
if (btnImg) {
    btnImg.addEventListener('click', async () => {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                const imgs = Array.from(document.images)
                    .map(img => img.src)
                    .filter(src => src.startsWith('http') || src.startsWith('data:image'));
                return [...new Set(imgs)];
            }
        }, (hasil) => {
            if (!hasil || !hasil[0] || !hasil[0].result) return;
            const urls = hasil[0].result;
            if (urls.length === 0) { alert("No images found."); return; }
            const blob = new Blob([JSON.stringify(urls, null, 2)], {type: "application/json"});
            getFileName("img", "json").then(filename => {
                chrome.downloads.download({ url: URL.createObjectURL(blob), filename: filename, saveAs: true });
            });
        });
    });
}

const btnVid = document.getElementById('vidExtractBtn');
if (btnVid) {
    btnVid.addEventListener('click', async () => {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                const vids = new Set();
                document.querySelectorAll('video, source').forEach(el => {
                    if (el.src && (el.tagName.toLowerCase() === 'video' || (el.type && el.type.includes('video')) || el.src.includes('.mp4') || el.src.includes('.mkv'))) {
                        vids.add(el.src);
                    }
                });
                return Array.from(vids).filter(src => src.startsWith('http') || src.startsWith('data:'));
            }
        }, (hasil) => {
            if (!hasil || !hasil[0] || !hasil[0].result) return;
            const urls = hasil[0].result;
            if (urls.length === 0) { alert("No videos found on this page."); return; }
            const blob = new Blob([JSON.stringify(urls, null, 2)], {type: "application/json"});
            getFileName("video", "json").then(filename => {
                chrome.downloads.download({ url: URL.createObjectURL(blob), filename: filename, saveAs: true });
            });
        });
    });
}

const btnExtractAll = document.getElementById('extractAllBtn');
if (btnExtractAll) {
    btnExtractAll.addEventListener('click', async () => {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                const semuaLink = new Set();
                
                const elemenMedia = document.querySelectorAll('img, video, audio, iframe, source');
                elemenMedia.forEach(el => {
                    if (el.src) semuaLink.add(el.src);
                });
                
                const elemenTautan = document.querySelectorAll('a');
                elemenTautan.forEach(a => {
                    if (a.href) semuaLink.add(a.href);
                });
                
                return Array.from(semuaLink).filter(link => 
                    link.startsWith('http') || link.startsWith('data:')
                );
            }
        }, (hasil) => {
            if (!hasil || !hasil[0] || !hasil[0].result) return;
            const urls = hasil[0].result;
            
            if (urls.length === 0) { 
                alert("No links found on this page."); 
                return; 
            }
            
            const blob = new Blob([JSON.stringify(urls, null, 2)], {type: "application/json"});
            getFileName("all", "json").then(filename => {
                chrome.downloads.download({ 
                    url: URL.createObjectURL(blob), 
                    filename: filename, 
                    saveAs: true 
                });
            });
        });
    });
}
