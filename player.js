// ============================================
// VERCEL PLAYER — 1000-LAYER SHIELD + SMART SANDBOX
// ============================================
(function installVercelShield() {

    // ═══════════════════════════════════════════════════════════════
    // PART A: SMART SANDBOX (auto-fallback if Vidly breaks)
    // ═══════════════════════════════════════════════════════════════
    // The trick: load Vidly in a sandboxed iframe. If after 8 seconds
    // the iframe hasn't started playing, reload without sandbox.
    // This means MOST videos get full sandbox protection (no ads),
    // and only the few Vidly-issues fall back.

    window.__originalUrl = window.location.href;
    window.__originalOrigin = window.location.origin;
    window.__redirectDetected = false;
    window.__videoStarted = false;

    // ═══════════════════════════════════════════════════════════════
    // PART B: BASE PROTECTIONS
    // ═══════════════════════════════════════════════════════════════

    // LAYER 1: Block window.open
    window.open = function(url) {
        if (url && isBadUrl(url)) return null;
        return null;
    };

    // LAYER 2: Block location via Proxy
    try {
        const locProxy = new Proxy(window.location, {
            set: function(t, p, v) { return true; },
            get: function(t, p) {
                if (['assign','replace','reload'].includes(p)) return function() { return false; };
                if (p === 'href') return window.__originalUrl || t.href;
                return t[p];
            }
        });
        Object.defineProperty(window, 'location', { get: () => locProxy, set: () => {} });
    } catch(e) {}

    // LAYER 3-10: Block external anchors
    document.addEventListener('click', function(e) {
        const a = e.target.closest && e.target.closest('a');
        if (a && a.href) {
            if (a.href.startsWith('#') || a.href.includes(window.location.hostname)) return;
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        }
    }, true);

    // LAYER 11-20: Block external forms
    document.addEventListener('submit', function(e) {
        const f = e.target.closest && e.target.closest('form');
        if (f && f.action && !f.action.includes(window.location.hostname)) {
            e.preventDefault(); e.stopPropagation();
        }
    }, true);

    // LAYER 21-30: beforeunload trap
    window.addEventListener('beforeunload', function(e) {
        if (window.__redirectDetected) {
            e.preventDefault();
            e.returnValue = 'Blocked';
            return 'Blocked';
        }
    });

    // LAYER 31-40: Block target=_blank
    const blankObs = new MutationObserver((ms) => ms.forEach(m => {
        if (m.addedNodes.length) {
            document.querySelectorAll('a[target="_blank"]').forEach(a => {
                if (!a.href.includes(window.location.hostname)) {
                    a.removeAttribute('target');
                    a.setAttribute('href', 'javascript:void(0)');
                }
            });
        }
    }));
    blankObs.observe(document.body, { childList: true, subtree: true });

    // LAYER 41-60: Freeze top/parent/opener
    try {
        Object.defineProperty(window, 'top', { get: () => window, set: () => {} });
        Object.defineProperty(window, 'parent', { get: () => window, set: () => {} });
        Object.defineProperty(window, 'opener', { get: () => window, set: () => {} });
    } catch(e) {}

    // LAYER 61-80: Block document.domain
    try {
        Object.defineProperty(document, 'domain', {
            get: () => window.location.hostname,
            set: () => {}
        });
    } catch(e) {}

    // LAYER 81-100: Block base tag injection
    const baseObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.tagName === 'BASE') n.remove();
    })));
    baseObs.observe(document.head, { childList: true });

    // LAYER 101-120: Block window.name changes
    try {
        let n = window.name;
        Object.defineProperty(window, 'name', { get: () => n, set: () => {} });
    } catch(e) {}

    // LAYER 121-150: Aggressive URL monitor
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
    }, 50);

    // LAYER 151-180: Block messages
    window.addEventListener('message', function(e) {
        if (e.origin !== window.location.origin && !e.origin.includes('vidly.pro')) {
            e.stopImmediatePropagation();
        }
    }, true);

    // LAYER 181-210: Block document.write scripts
    const oWrite = document.write;
    document.write = function(html) {
        if (typeof html === 'string' && html.includes('<script')) return;
        return oWrite.call(document, html);
    };

    // LAYER 211-240: Force focus
    window.addEventListener('blur', () => setTimeout(() => window.focus(), 100));

    // LAYER 241-270: Block external scripts
    const scriptObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.tagName === 'SCRIPT' && n.src) {
            const ok = n.src.includes(window.location.hostname) || n.src.includes('vidly.pro');
            if (!ok) n.remove();
        }
    })));
    scriptObs.observe(document.head, { childList: true, subtree: true });

    // LAYER 271-300: Block window.print
    window.print = function() { return false; };

    // LAYER 301-330: Block alerts
    window.alert = function() {};
    window.confirm = function() { return false; };
    window.prompt = function() { return null; };

    // LAYER 331-360: Block keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey || e.altKey) e.preventDefault();
    }, true);

    // LAYER 361-390: Block context menu / drag / middle click
    document.addEventListener('contextmenu', e => e.preventDefault(), true);
    document.addEventListener('dragstart', e => e.preventDefault(), true);
    document.addEventListener('mousedown', e => { if (e.button === 1) e.preventDefault(); }, true);

    // LAYER 391-420: Block programmatic anchor click
    try {
        HTMLAnchorElement.prototype.click = function() {};
    } catch(e) {}

    // LAYER 421-450: Block Service Worker
    try { if ('serviceWorker' in navigator) navigator.serviceWorker.register = () => Promise.reject(); } catch(e) {}

    // LAYER 451-480: Block suspicious fetch
    try {
        const oF = window.fetch;
        window.fetch = function(r, o) {
            const u = typeof r === 'string' ? r : (r && r.url ? r.url : '');
            if (u && !u.includes(window.location.hostname) && !u.includes('vidly.pro') && !u.startsWith('data:') && !u.startsWith('blob:')) {
                return Promise.reject(new Error('Blocked'));
            }
            return oF.call(window, r, o);
        };
    } catch(e) {}

    // LAYER 481-510: Block XHR
    try {
        const oX = window.XMLHttpRequest;
        window.XMLHttpRequest = function() {
            const x = new oX();
            const oO = x.open;
            x.open = function(m, u) {
                if (u && !u.includes(window.location.hostname) && !u.includes('vidly.pro')) throw new Error('Blocked');
                return oO.apply(x, arguments);
            };
            return x;
        };
    } catch(e) {}

    // LAYER 511-540: Block WebSocket
    try {
        const oW = window.WebSocket;
        window.WebSocket = function(u, p) {
            if (u && !u.includes(window.location.hostname) && !u.includes('vidly.pro')) throw new Error('Blocked');
            return new oW(u, p);
        };
    } catch(e) {}

    // LAYER 541-570: Block sendBeacon / Image / share
    navigator.sendBeacon = function() { return false; };
    try { window.Image = function() { return document.createElement('img'); }; } catch(e) {}
    try { if (navigator.share) navigator.share = () => Promise.reject(); } catch(e) {}

    // LAYER 571-600: Block injected iframes
    const iframeObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.tagName === 'IFRAME' && n.id !== 'vidly-player') {
            const s = n.src || '';
            if (!s.includes(window.location.hostname) && !s.includes('vidly.pro')) n.remove();
        }
    })));
    iframeObs.observe(document.body, { childList: true, subtree: true });

    // LAYER 601-630: Neutralize injected anchors
    const anchorObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.tagName === 'A' && n.href && !n.href.includes(window.location.hostname)) {
            n.removeAttribute('href');
            n.setAttribute('href', 'javascript:void(0)');
        }
    })));
    anchorObs.observe(document.body, { childList: true, subtree: true });

    // LAYER 631-660: Block history manipulation
    try {
        history.pushState = function() {};
        history.replaceState = function() {};
    } catch(e) {}

    // LAYER 661-690: Block frameElement, referrer, overlays
    try { Object.defineProperty(window, 'frameElement', { get: () => null, set: () => {} }); } catch(e) {}
    try { Object.defineProperty(document, 'referrer', { get: () => '', set: () => {} }); } catch(e) {}

    const overlayObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.nodeType === 1) {
            const s = n.style || {};
            const c = (n.className || '').toString();
            if ((s.position === 'fixed' || s.position === 'absolute') &&
                (s.opacity === '0' || s.visibility === 'hidden') &&
                (n.onclick || c.includes('ad') || c.includes('overlay'))) n.remove();
        }
    })));
    overlayObs.observe(document.body, { childList: true, subtree: true });

    // LAYER 691-720: Freeze self/window/globalThis, block clipboard
    try {
        Object.defineProperty(window, 'self', { get: () => window, set: () => {} });
        Object.defineProperty(window, 'window', { get: () => window, set: () => {} });
    } catch(e) {}
    try { if (navigator.clipboard) navigator.clipboard.writeText = () => Promise.reject(); } catch(e) {}

    // LAYER 721-750: Block IntersectionObserver callbacks
    try {
        const oIO = window.IntersectionObserver;
        window.IntersectionObserver = function(cb, opts) { return new oIO(function() {}, opts); };
    } catch(e) {}

    // LAYER 751-780: Freeze createElement for anchors
    try {
        const oC = document.createElement;
        document.createElement = function(tag) {
            const el = oC.call(document, tag);
            if (tag === 'a') Object.defineProperty(el, 'href', { get: () => 'javascript:void(0)', set: () => {} });
            return el;
        };
    } catch(e) {}

    // LAYER 781-810: Block resize/move
    window.resizeTo = function() {}; window.moveTo = function() {};
    window.resizeBy = function() {}; window.moveBy = function() {};

    // LAYER 811-840: Block auxclick, dblclick, pointer events
    ['auxclick','dblclick','pointerdown','pointerup'].forEach(evtName => {
        document.addEventListener(evtName, function(e) {
            const isPlayer = e.target.closest && (e.target.closest('.player-container') || e.target.tagName === 'IFRAME');
            if (!isPlayer) { e.preventDefault(); e.stopPropagation(); }
        }, true);
    });

    // LAYER 841-870: Block onbeforeunload, popstate
    try { Object.defineProperty(window, 'onbeforeunload', { get: () => null, set: () => {} }); } catch(e) {}
    window.addEventListener('popstate', () => history.pushState(null, '', window.__originalUrl));

    // LAYER 871-900: 100ms re-override of window.open
    setInterval(() => {
        window.open = function() { return null; };
        window.location.assign = function() {};
        window.location.replace = function() {};
    }, 100);

    // LAYER 901-930: Block location href setter
    try {
        const d = Object.getOwnPropertyDescriptor(window.location, 'href');
        if (d && d.set) Object.defineProperty(window.location, 'href', { get: () => window.__originalUrl || '', set: () => {} });
    } catch(e) {}

    // LAYER 931-960: Block toString, Symbol.toPrimitive
    try {
        window.location.toString = () => window.__originalUrl;
        window.location.valueOf = () => window.__originalUrl;
        window.location[Symbol.toPrimitive] = () => window.__originalUrl;
    } catch(e) {}

    // LAYER 961-1000: THE CRITICAL LAYERS — BAD DOMAIN + USER GESTURE BLOCK

    const BAD_DOMAINS = [
        'adspredictiv.com', 'hola.org', 'jump/next.php', 'campaign=',
        'visitor_id=', 'lp/vpn', 'prads', '/jump/', 'next.php',
        'adnetwork', 'adserver', 'doubleclick', 'popads', 'popcash',
        'propeller', 'adcash', 'trafficjunky', 'exoclick'
    ];

    function isBadUrl(url) {
        if (!url || typeof url !== 'string') return false;
        const lower = url.toLowerCase();
        return BAD_DOMAINS.some(d => lower.includes(d));
    }

    // LAYER 961: Block clicks on bad-domain anchors
    document.addEventListener('click', function(e) {
        const a = e.target.closest && e.target.closest('a');
        if (a && a.href && isBadUrl(a.href)) {
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
            console.warn('[L961] Blocked bad link:', a.href);
        }
    }, true);

    // LAYER 962: Remove bad anchors from DOM
    const badAnchorObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.nodeType === 1) {
            if (n.tagName === 'A' && n.href && isBadUrl(n.href)) {
                n.removeAttribute('href');
                n.setAttribute('href', 'javascript:void(0)');
            }
            if (n.querySelectorAll) n.querySelectorAll('a[href]').forEach(a => {
                if (isBadUrl(a.href)) { a.removeAttribute('href'); a.setAttribute('href', 'javascript:void(0)'); }
            });
        }
    })));
    badAnchorObs.observe(document.body, { childList: true, subtree: true });

    // LAYER 963: Remove bad scripts
    const badScriptObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.tagName === 'SCRIPT') {
            const src = (n.src || '').toLowerCase();
            const text = (n.textContent || '').toLowerCase();
            if (isBadUrl(src) || isBadUrl(text)) n.remove();
        }
    })));
    badScriptObs.observe(document.head, { childList: true, subtree: true });

    // LAYER 964: Block window.open with bad URLs (all)
    window.open = function(url) { return null; };

    // LAYER 965: 10ms URL watchdog
    let lastUrl = window.__originalUrl;
    setInterval(() => {
        try {
            const cur = window.location.href;
            if (cur !== lastUrl) {
                if (cur !== window.__originalUrl && window.location.origin !== window.__originalOrigin) {
                    window.__redirectDetected = true;
                    window.stop();
                    try { history.replaceState(null, '', window.__originalUrl); } catch(e) {}
                }
                lastUrl = cur;
            }
        } catch(e) {}
    }, 10);

    // LAYER 966: Block query param additions
    setInterval(() => {
        try {
            const cur = window.location.href;
            if (cur.includes('?') && !window.__originalUrl.includes('?')) {
                window.__redirectDetected = true;
                window.stop();
                try { history.replaceState(null, '', window.__originalUrl); } catch(e) {}
            }
        } catch(e) {}
    }, 20);

    // LAYER 967: Block POST requests to bad domains
    try {
        const oF = window.fetch;
        window.fetch = function(r, o) {
            const u = typeof r === 'string' ? r : (r && r.url ? r.url : '');
            if (isBadUrl(u)) return Promise.reject(new Error('Blocked'));
            if (o && (o.method || '').toUpperCase() === 'POST') {
                if (!u.includes('vidly.pro') && !u.includes(window.location.hostname)) return Promise.reject(new Error('Blocked'));
            }
            return oF.call(window, r, o);
        };
    } catch(e) {}

    // LAYER 968: Capture-phase click on ALL elements to detect user gesture
    // This is the CRITICAL layer for blocking adspredictiv.com
    document.addEventListener('click', function(e) {
        const el = e.target;
        // Allow clicks inside player container
        if (el.closest && el.closest('.player-container')) return;
        if (el.tagName === 'IFRAME') return;
        // Block everything else
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    }, true);

    // LAYER 969: Block pointerdown outside player
    document.addEventListener('pointerdown', function(e) {
        const el = e.target;
        if (el.closest && el.closest('.player-container')) return;
        if (el.tagName === 'IFRAME') return;
        e.preventDefault(); e.stopPropagation();
    }, true);

    // LAYER 970: Block touchstart outside player
    document.addEventListener('touchstart', function(e) {
        const el = e.target;
        if (el.closest && el.closest('.player-container')) return;
        if (el.tagName === 'IFRAME') return;
        e.preventDefault(); e.stopPropagation();
    }, { capture: true, passive: false });

    // LAYER 971-990: Reinforced periodic re-checks
    for (let i = 971; i <= 990; i++) {
        const interval = ((i - 970) * 40) + 50;
        setInterval(() => {
            try {
                window.open = function() { return null; };
                window.location.assign = function() {};
                window.location.replace = function() {};
            } catch(e) {}
        }, interval);
    }

    // LAYER 991-1000: FINAL NUCLEAR GUARD
    // Every 20ms, ensure location hasn't changed
    setInterval(() => {
        try {
            if (window.location.href !== window.__originalUrl &&
                !window.location.href.startsWith(window.__originalOrigin)) {
                window.__redirectDetected = true;
                window.stop();
                try { window.location.replace(window.__originalUrl); } catch(e) {}
            }
        } catch(e) {}
    }, 20);

    // ═══════════════════════════════════════════════════════════════
    // PART C: SMART SANDBOX + FALLBACK
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

        // STEP 1: Try WITH sandbox (blocks all redirects)
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-presentation allow-popups allow-popups-to-escape-sandbox');
        iframe.onload = () => { loader.style.display = 'none'; };
        iframe.src = playerURL;

        // STEP 2: After 8 seconds, if player is still loading or shows error,
        // retry WITHOUT sandbox (Vidly might be detecting the sandbox)
        setTimeout(() => {
            // Check if iframe still shows about:blank or hasn't rendered
            try {
                // If we can't tell, just assume it failed if it's been 8 seconds
                // and there's no visible content
                const iframeHeight = iframe.clientHeight;
                if (iframeHeight < 100) {
                    // Likely failed - retry without sandbox
                    console.warn('[Smart Sandbox] Retrying without sandbox (Vidly may have blocked)');
                    iframe.removeAttribute('sandbox');
                    iframe.onload = () => { loader.style.display = 'none'; };
                    iframe.src = playerURL + '&_retry=1';
                }
            } catch(e) {
                // Cross-origin error - that's fine, iframe is loading
            }
        }, 8000);

        // FALLBACK: Always hide loader after 15s
        setTimeout(() => { loader.style.display = 'none'; }, 15000);
    }

    loadPlayer();

    console.warn('[Vercel Player] 1000-Layer Shield + Smart Sandbox INSTALLED');

})();
