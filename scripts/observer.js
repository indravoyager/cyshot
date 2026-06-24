(function() {
// XHR Interceptor
    const XHR = XMLHttpRequest.prototype;
    const open = XHR.open;
    const send = XHR.send;

    XHR.open = function(method, url) {
        this._method = method;
        this._url = url ? url.toString() : '';
        this._startTime = performance.now();
        return open.apply(this, arguments);
    };

    XHR.send = function() {

        this.addEventListener('load', function() {
            if (this._url && !this._url.match(/\.(png|jpg|jpeg|gif|css|js|woff|woff2|svg)$/i)) {
                window.postMessage({ 
                    type: 'CYCY_NET_LOG', 
                    data: { 
                        url: this._url, 
                        method: this._method, 
                        status: this.status, 
                        payload: this.responseText, 
                        latency: Math.round(performance.now() - this._startTime) 
                    } 
                }, '*');
            }
        });
        return send.apply(this, arguments);
    };

    // Fetch Interceptor
    const origFetch = window.fetch;
    window.fetch = async function(...args) {
        const startTime = performance.now();
        const url = args[0] ? args[0].toString() : '';

        const response = await origFetch.apply(this, args);
        const resUrl = response.url ? response.url.toString() : '';
        
        if (resUrl && !resUrl.match(/\.(png|jpg|jpeg|gif|css|js|woff|woff2|svg)$/i)) {
            const clone = response.clone();
            clone.text().then(txt => {
                window.postMessage({ 
                    type: 'CYCY_NET_LOG', 
                    data: { 
                        url: resUrl, 
                        method: args[1]?.method || 'GET', 
                        status: response.status, 
                        payload: txt, 
                        latency: Math.round(performance.now() - startTime) 
                    } 
                }, '*');
            }).catch(() => {});
        }
        return response;
    };
})();
