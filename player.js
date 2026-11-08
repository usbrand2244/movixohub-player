// ============================================
// VERCEL PLAYER — SANDBOX + STORAGE CLEANER
// Prevents Vidly from remembering the sandbox detection
// ============================================
(function installVercelShield() {

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: CLEAR VIDLY'S MEMORY EVERY TIME THE PLAYER LOADS
    // This makes Vidly think it's always the first video
    // ═══════════════════════════════════════════════════════════════
    
    // Clear all localStorage
    try { localStorage.clear(); } catch(e) {}
    
    // Clear all sessionStorage
    try { sessionStorage.clear(); } catch(e) {}
    
    // Clear IndexedDB (some ad networks use this)
    try {
        if (window.indexedDB && indexedDB.databases) {
            indexedDB.databases().then(dbs => {
                dbs.forEach(db => { try { indexedDB.deleteDatabase(db.name); } catch(e) {} });
            });
        }
    } catch(e) {}
    
    // Clear cookies for the current domain
    try {
        document.cookie.split(";").forEach(c => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
    } catch(e) {}
    
    // Tell the browser it's a "first visit" to Vidly
    window.__originalUrl = window.location.href;
    window.__originalOrigin = window.location.origin;
    window.__redirectDetected = false;
    window.__freshLoad = true;

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: BAD DOMAIN LIST
    // ═══════════════════════════════════════════════════════════════
    const BAD_DOMAINS = [
        'adspredictiv.com', 'hola.org', 'jump/next.php', 'campaign=',
        'visitor_id=', 'lp/vpn', 'prads', '/jump/', 'next.php',
        'adnetwork', 'adserver', 'doubleclick', 'popads', 'popcash',
        'propeller', 'adcash', 'trafficjunky', 'exoclick',
        'adsterra', 'clickadu', 'popmyads', 'hilltopads', 'adnium',
        'juicyads', 'trafficstars', 'plugrush', 'clickaine', 'poptox'
    ];

    function isBadUrl(url) {
        if (!url || typeof url !== 'string') return false;
        const lower = url.toLowerCase();
        return BAD_DOMAINS.some(d => lower.includes(d));
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: BASIC SHIELD (blocks popups/redirects at parent level)
    // ═══════════════════════════════════════════════════════════════

    window.open = function() { return null; };

    try {
        const locProxy = new Proxy(window.location, {
            set: function(t, p, v) { return true; },
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

    window.addEventListener('message', function(e) {
        if (e.origin !== window.location.origin && !e.origin.includes('vidly.pro')) {
            e.stopImmediatePropagation();
        }
    }, true);

    // URL watchdog - catches any external redirect
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

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: LOAD VIDLY WITH SANDBOX (again, fresh every time)
    // ═══════════════════════════════════════════════════════════════

    const params = new URLSearchParams(window.location.search);
    const type = (params.get('type') || 'movie').toLowerCase();
    const id = params.get('id');
    const season = params.get('season') || '1';
    const episode = params.get('episode') || '1';

    const iframe = document.getElementById('vidly-player');
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
            playerURL = `https://vidly.pro/movie/${id}`;
        } else if (type === 'tv') {
            if (!/^\d+$/.test(season) || !/^\d+$/.test(episode)) { showError('Invalid season or episode.'); return; }
            playerURL = `https://vidly.pro/tv/${id}/${season}/${episode}`;
        } else if (type === 'anime') {
            if (!/^\d+$/.test(episode)) { showError('Invalid episode.'); return; }
            playerURL = `https://vidly.pro/anime/${id}/${episode}/sub`;
        } else {
            showError('Unsupported media type.');
            return;
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 5: ADD SANDBOX ATTRIBUTE (blocks redirects natively)
        // ═══════════════════════════════════════════════════════════
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-presentation allow-popups allow-popups-to-escape-sandbox');

        iframe.onload = () => { loader.style.display = 'none'; };
        iframe.src = playerURL;

        // ═══════════════════════════════════════════════════════════
        // STEP 6: POST-LOAD CLEANUP (removes any storage Vidly set)
        // This runs 2 seconds after load to clear Vidly's memory
        // ═══════════════════════════════════════════════════════════
        setTimeout(() => {
            try { localStorage.clear(); } catch(e) {}
            try { sessionStorage.clear(); } catch(e) {}
            console.warn('[Vercel] Post-load storage cleared');
        }, 2000);

        // ═══════════════════════════════════════════════════════════
        // STEP 7: FALLBACK — if sandbox breaks, remove it and retry
        // This handles the "second video" case where Vidly remembers
        // ═══════════════════════════════════════════════════════════
        setTimeout(() => {
            // Check if the iframe is actually showing content
            try {
                const iframeHeight = iframe.clientHeight;
                const iframeWidth = iframe.clientWidth;
                
                // If iframe is tiny or zero, it failed to load
                if (iframeHeight < 100 || iframeWidth < 100) {
                    console.warn('[Vercel] Sandbox broke the player — retrying without sandbox');
                    iframe.removeAttribute('sandbox');
                    iframe.onload = () => { loader.style.display = 'none'; };
                    iframe.src = playerURL + '&_retry=' + Date.now();
                }
            } catch(e) {
                // Cross-origin error means iframe is loading properly — leave it alone
            }
        }, 10000);

        setTimeout(() => { loader.style.display = 'none'; }, 15000);
    }

    loadPlayer();

    // ═══════════════════════════════════════════════════════════════
    // STEP 8: CLEANUP ON UNLOAD (for next video load)
    // ═══════════════════════════════════════════════════════════════
    window.addEventListener('beforeunload', function() {
        try { localStorage.clear(); } catch(e) {}
        try { sessionStorage.clear(); } catch(e) {}
    });

    console.warn('[Vercel] Sandbox + Storage Clear installed');

})();
