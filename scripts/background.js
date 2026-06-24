// Single Message Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "AMBIL_GAMBAR_LAYAR") {
        chrome.tabs.captureVisibleTab(null, {format: "png"}, (dataUrl) => {
            sendResponse({imgSrc: dataUrl});
        });
        return true; 
    }
});
