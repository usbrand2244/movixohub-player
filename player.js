// ============================================
// VERCEL PLAYER — EmbedWave + Backend CSP Sandbox
// ============================================
(function installVercelShield() {

    window.__originalUrl = window.location.href;
    window.__originalOrigin = window.location.origin;
    window.__redirectDetected = false;

    const BAD_DOMAINS = [
        'adspredictiv.com', 'hola.org', 'jump/next.php', 'campaign=',
        'visitor_id=', 'lp/vpn', 'prads', '/jump/', 'next.php',
        'adnetwork', 'adserver', 'doubleclick', 'popads', 'popcash',
        'propeller', 'adcash', 'trafficjunky', 'exoclick'
    ];
    const isBadUrl = (url) => {
        if (!url || typeof url !== 'string') return false;
        const lower = url.toLowerCase();
        return BAD_DOMAINS.some(d => lower.includes(d));
    };

    // --- SHIELD LAYERS ---
    window.open = function() { return null; };

    try {
        const locProxy = new Proxy(window.location, {
            set: function() { return true; },
            get: function(t, p) {
                if (['assign','replace','reload'].includes(p)) return function() {};
                if (p === 'href') return window.__originalUrl || t.href;
                return t[p];
            }
        });
        Object.defineProperty(window, 'location', { get: () => locProxy, set: () => {} });
    } catch(e) {}

    document.addEventListener('click', function(e) {
        const a = e.target.closest && e.target.closest('a');
        if (a && a.href) {
            if (a.href.startsWith('#') || a.href.includes(window.location.hostname)) return;
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        }
    }, true);

    window.addEventListener('beforeunload', function(e) {
        if (window.__redirectDetected) { e.preventDefault(); e.returnValue = 'Blocked'; }
    });

    try {
        Object.defineProperty(window, 'top', { get: () => window, set: () => {} });
        Object.defineProperty(window, 'parent', { get: () => window, set: () => {} });
        Object.defineProperty(window, 'opener', { get: () => window, set: () => {} });
    } catch(e) {}

    try {
        history.pushState = function() {};
        history.replaceState = function() {};
    } catch(e) {}

    setInterval(() => {
        try {
            if (window.location.href !== window.__originalUrl) {
                const origin = new URL(window.location.href).origin;
                if (origin !== window.__originalOrigin) {
                    window.__redirectDetected = true;
                    window.stop();
                    try { history.replaceState(null, '', window.__originalUrl); } catch(e) {}
                }
            }
        } catch(e) {}
    }, 30);

    document.addEventListener('click', function(e) {
        const el = e.target;
        if (el.closest && el.closest('.player-container')) return;
        if (el.tagName === 'IFRAME') return;
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    }, true);

    // Block bad scripts
    const badScriptObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.tagName === 'SCRIPT') {
            const src = (n.src || '').toLowerCase();
            const text = (n.textContent || '').toLowerCase();
            if (isBadUrl(src) || isBadUrl(text)) n.remove();
        }
    })));
    badScriptObs.observe(document.head, { childList: true, subtree: true });

    for (let i = 0; i < 50; i++) {
        setInterval(() => {
            window.open = function() { return null; };
            window.location.assign = function() {};
            window.location.replace = function() {};
        }, (i * 40) + 50);
    }

    // --- LOAD PLAYER ---
    const params = new URLSearchParams(window.location.search);
    const type = (params.get('type') || 'movie').toLowerCase();
    const id = params.get('id');
    const season = params.get('season') || '1';
    const episode = params.get('episode') || '1';

    const iframe = document.getElementById('player-frame');
    const loader = document.getElementById('loader');
    const errorBox = document.getElementById('error');

    function showError(message) {
        loader.style.display = 'none';
        errorBox.style.display = 'flex';
        errorBox.textContent = message;
    }

    function loadPlayer() {
        if (!id || !/^\d+$/.test(id)) { showError('Invalid or missing ID.'); return; }

        let playerURL = '';
        if (type === 'movie') {
            playerURL = `https://embedwave.cc/embed/movie/${id}`;
        } else if (type === 'tv' || type === 'anime') {
            if (!/^\d+$/.test(season) || !/^\d+$/.test(episode)) { showError('Invalid season or episode.'); return; }
            playerURL = `https://embedwave.cc/embed/tv/${id}/${season}/${episode}`;
        } else {
            showError('Unsupported media type.');
            return;
        }

        // Force iframe to take up full size
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.position = 'absolute';
        iframe.style.top = '0';
        iframe.style.left = '0';

        iframe.onload = () => { loader.style.display = 'none'; };
        iframe.src = playerURL;

        setTimeout(() => { loader.style.display = 'none'; }, 12000);
    }

    loadPlayer();
})();
