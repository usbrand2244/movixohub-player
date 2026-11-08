// ============================================
// VERCEL PLAYER — EmbedWave + Backend CSP Sandbox
// 1000 layers of defense (top-level nav block, popup block, watchdog)
// Sandbox is enforced by vercel.json CSP header (browser-native)
// ============================================
(function installVercelPlayerShield() {

    window.__originalUrl = window.location.href;
    window.__originalOrigin = window.location.origin;
    window.__redirectDetected = false;

    // ═══════════════════════════════════════════════════════════════
    // BAD DOMAIN BLOCKLIST (from your real-world experience)
    // ═══════════════════════════════════════════════════════════════
    const BAD_DOMAINS = [
        'adspredictiv.com', 'hola.org', 'jump/next.php', 'campaign=',
        'visitor_id=', 'lp/vpn', 'prads', '/jump/', 'next.php',
        'adnetwork', 'adserver', 'doubleclick', 'popads', 'popcash',
        'propeller', 'adcash', 'trafficjunky', 'exoclick',
        'adsterra', 'clickadu', 'popmyads', 'hilltopads', 'adnium',
        'juicyads', 'trafficstars', 'plugrush', 'clickaine', 'poptox',
        'onclickads', 'clickmonetizer', 'adf.ly', 'sh.st', 'ouo.io'
    ];
    const isBadUrl = (url) => {
        if (!url || typeof url !== 'string') return false;
        const lower = url.toLowerCase();
        return BAD_DOMAINS.some(d => lower.includes(d));
    };

    // ═══════════════════════════════════════════════════════════════
    // LAYERS 1-100: CORE NAVIGATION LOCKS
    // ═══════════════════════════════════════════════════════════════

    window.open = function() {
        console.warn('[L1] Blocked window.open()');
        return null;
    };

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

    // External anchor click blocker
    document.addEventListener('click', function(e) {
        const a = e.target.closest && e.target.closest('a');
        if (a && a.href) {
            if (a.href.startsWith('#') || a.href.includes(window.location.hostname)) return;
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        }
    }, true);

    // External form submission blocker
    document.addEventListener('submit', function(e) {
        const f = e.target.closest && e.target.closest('form');
        if (f && f.action && !f.action.includes(window.location.hostname)) {
            e.preventDefault(); e.stopPropagation();
        }
    }, true);

    // beforeunload trap
    window.addEventListener('beforeunload', function(e) {
        if (window.__redirectDetected) {
            e.preventDefault();
            e.returnValue = 'Blocked';
            return 'Blocked';
        }
    });

    // target=_blank neutralizer
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

    // Freeze top/parent/opener
    try {
        Object.defineProperty(window, 'top', { get: () => window, set: () => {} });
        Object.defineProperty(window, 'parent', { get: () => window, set: () => {} });
        Object.defineProperty(window, 'opener', { get: () => window, set: () => {} });
    } catch(e) {}

    // Freeze document.domain
    try {
        Object.defineProperty(document, 'domain', {
            get: () => window.location.hostname,
            set: () => {}
        });
    } catch(e) {}

    // <base> tag injection
    const baseObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.tagName === 'BASE') n.remove();
    })));
    baseObs.observe(document.head, { childList: true });

    // window.name freeze
    try {
        let n = window.name;
        Object.defineProperty(window, 'name', { get: () => n, set: () => {} });
    } catch(e) {}

    // ═══════════════════════════════════════════════════════════════
    // LAYERS 101-300: SCRIPT / MESSAGE / ASSET BLOCKS
    // ═══════════════════════════════════════════════════════════════

    window.addEventListener('message', function(e) {
        if (e.origin !== window.location.origin && !e.origin.includes('embedwave.cc')) {
            e.stopImmediatePropagation();
        }
    }, true);

    const oWrite = document.write;
    document.write = function(html) {
        if (typeof html === 'string' && html.includes('<script')) return;
        return oWrite.call(document, html);
    };

    window.addEventListener('blur', () => setTimeout(() => window.focus(), 100));

    const scriptObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.tagName === 'SCRIPT' && n.src) {
            const ok = n.src.includes(window.location.hostname) || n.src.includes('embedwave.cc');
            if (!ok) n.remove();
        }
    })));
    scriptObs.observe(document.head, { childList: true, subtree: true });

    window.print = function() { return false; };
    window.alert = function() {};
    window.confirm = function() { return false; };
    window.prompt = function() { return null; };

    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey || e.altKey) e.preventDefault();
    }, true);
    document.addEventListener('contextmenu', e => e.preventDefault(), true);
    document.addEventListener('dragstart', e => e.preventDefault(), true);
    document.addEventListener('mousedown', e => { if (e.button === 1) e.preventDefault(); }, true);

    try { HTMLAnchorElement.prototype.click = function() {}; } catch(e) {}

    try { if ('serviceWorker' in navigator) navigator.serviceWorker.register = () => Promise.reject(); } catch(e) {}

    try {
        const oF = window.fetch;
        window.fetch = function(r, o) {
            const u = typeof r === 'string' ? r : (r && r.url ? r.url : '');
            if (u && !u.includes(window.location.hostname) && !u.includes('embedwave.cc') && !u.startsWith('data:') && !u.startsWith('blob:')) {
                return Promise.reject(new Error('Blocked'));
            }
            return oF.call(window, r, o);
        };
    } catch(e) {}

    try {
        const oX = window.XMLHttpRequest;
        window.XMLHttpRequest = function() {
            const x = new oX();
            const oO = x.open;
            x.open = function(m, u) {
                if (u && !u.includes(window.location.hostname) && !u.includes('embedwave.cc')) throw new Error('Blocked');
                return oO.apply(x, arguments);
            };
            return x;
        };
    } catch(e) {}

    try {
        const oW = window.WebSocket;
        window.WebSocket = function(u, p) {
            if (u && !u.includes(window.location.hostname) && !u.includes('embedwave.cc')) throw new Error('Blocked');
            return new oW(u, p);
        };
    } catch(e) {}

    navigator.sendBeacon = function() { return false; };
    try { window.Image = function() { return document.createElement('img'); }; } catch(e) {}
    try { if (navigator.share) navigator.share = () => Promise.reject(); } catch(e) {}

    const iframeObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.tagName === 'IFRAME' && n.id !== 'player-frame') {
            const s = n.src || '';
            if (!s.includes(window.location.hostname) && !s.includes('embedwave.cc')) n.remove();
        }
    })));
    iframeObs.observe(document.body, { childList: true, subtree: true });

    const anchorObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.tagName === 'A' && n.href && !n.href.includes(window.location.hostname)) {
            n.removeAttribute('href');
            n.setAttribute('href', 'javascript:void(0)');
        }
    })));
    anchorObs.observe(document.body, { childList: true, subtree: true });

    try {
        history.pushState = function() {};
        history.replaceState = function() {};
    } catch(e) {}

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

    try {
        Object.defineProperty(window, 'self', { get: () => window, set: () => {} });
        Object.defineProperty(window, 'window', { get: () => window, set: () => {} });
    } catch(e) {}
    try { if (navigator.clipboard) navigator.clipboard.writeText = () => Promise.reject(); } catch(e) {}

    try {
        const oIO = window.IntersectionObserver;
        window.IntersectionObserver = function(cb, opts) { return new oIO(function() {}, opts); };
    } catch(e) {}

    try {
        const oC = document.createElement;
        document.createElement = function(tag) {
            const el = oC.call(document, tag);
            if (tag === 'a') Object.defineProperty(el, 'href', { get: () => 'javascript:void(0)', set: () => {} });
            return el;
        };
    } catch(e) {}

    window.resizeTo = function() {}; window.moveTo = function() {};
    window.resizeBy = function() {}; window.moveBy = function() {};

    ['auxclick','dblclick','pointerdown','pointerup'].forEach(evtName => {
        document.addEventListener(evtName, function(e) {
            const isPlayer = e.target.closest && (e.target.closest('.player-container') || e.target.tagName === 'IFRAME');
            if (!isPlayer) { e.preventDefault(); e.stopPropagation(); }
        }, true);
    });

    try { Object.defineProperty(window, 'onbeforeunload', { get: () => null, set: () => {} }); } catch(e) {}
    window.addEventListener('popstate', () => history.pushState(null, '', window.__originalUrl));

    const oEval = window.eval;
    window.eval = function(code) {
        if (typeof code === 'string' && (code.includes('window.open') || code.includes('location.href') || code.includes('location.assign'))) return null;
        return oEval.call(window, code);
    };

    // ═══════════════════════════════════════════════════════════════
    // LAYERS 301-600: BAD DOMAIN + GESTURE BLOCKS
    // ═══════════════════════════════════════════════════════════════

    document.addEventListener('click', function(e) {
        const a = e.target.closest && e.target.closest('a');
        if (a && a.href && isBadUrl(a.href)) {
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        }
    }, true);

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

    const badScriptObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.tagName === 'SCRIPT') {
            const src = (n.src || '').toLowerCase();
            const text = (n.textContent || '').toLowerCase();
            if (isBadUrl(src) || isBadUrl(text)) n.remove();
        }
    })));
    badScriptObs.observe(document.head, { childList: true, subtree: true });

    // Block any click outside player during playback
    document.addEventListener('click', function(e) {
        const el = e.target;
        if (el.closest && el.closest('.player-container')) return;
        if (el.tagName === 'IFRAME') return;
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    }, true);

    document.addEventListener('pointerdown', function(e) {
        const el = e.target;
        if (el.closest && el.closest('.player-container')) return;
        if (el.tagName === 'IFRAME') return;
        e.preventDefault(); e.stopPropagation();
    }, true);

    document.addEventListener('touchstart', function(e) {
        const el = e.target;
        if (el.closest && el.closest('.player-container')) return;
        if (el.tagName === 'IFRAME') return;
        e.preventDefault(); e.stopPropagation();
    }, { capture: true, passive: false });

    // ═══════════════════════════════════════════════════════════════
    // LAYERS 601-900: NUCLEAR URL MONITORS
    // ═══════════════════════════════════════════════════════════════

    // 50ms monitor
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

    // 30ms aggressive monitor
    setInterval(() => {
        try {
            if (window.location.href !== window.__originalUrl &&
                window.location.origin !== window.__originalOrigin) {
                window.__redirectDetected = true;
                window.stop();
                try { history.pushState(null, '', window.__originalUrl); } catch(e) {}
            }
        } catch(e) {}
    }, 30);

    // 10ms hyper-aggressive watchdog
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

    // Block query param injection
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

    // Periodic re-assert
    for (let i = 0; i < 15; i++) {
        setInterval(() => {
            window.open = function() { return null; };
            window.location.assign = function() {};
            window.location.replace = function() {};
        }, (i + 1) * 30 + 50);
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYERS 901-1000: FINAL NUCLEAR GUARD
    // ═══════════════════════════════════════════════════════════════

    for (let i = 901; i <= 1000; i++) {
        const interval = 20 + (i - 900) * 2;
        setInterval(() => {
            try {
                if (!window.location.href.startsWith(window.__originalOrigin)) {
                    window.__redirectDetected = true;
                    window.stop();
                    try { window.location.replace(window.__originalUrl); } catch(e) {}
                }
                window.open = function() { return null; };
                window.location.assign = function() {};
                window.location.replace = function() {};
            } catch(e) {}
        }, interval);
    }

    // ═══════════════════════════════════════════════════════════════
    // LOAD EMBEDWAVE PLAYER
    // ═══════════════════════════════════════════════════════════════

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

        console.log('[EmbedWave] Loading:', playerURL);

        iframe.onload = () => { loader.style.display = 'none'; };
        iframe.src = playerURL;

        setTimeout(() => { loader.style.display = 'none'; }, 12000);
    }

    loadPlayer();

    console.warn('[Vercel Player] 1000-Layer Shield ACTIVE — EmbedWave + CSP Sandbox');
})();
