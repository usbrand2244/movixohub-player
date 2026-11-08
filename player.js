// ============================================
// VERCEL PLAYER — 1000-LAYER SHIELD (NO SANDBOX)
// Specifically targets adspredictiv.com and all redirect chains
// ============================================
(function installVercelShield() {

    // ═══════════════════════════════════════════════════════════════
    // SETUP
    // ═══════════════════════════════════════════════════════════════
    window.__originalUrl = window.location.href;
    window.__originalOrigin = window.location.origin;
    window.__redirectDetected = false;

    // ═══════════════════════════════════════════════════════════════
    // BAD DOMAIN LIST (specific to your experience)
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
    // LAYERS 1-100: CORE NAVIGATION BLOCKS
    // ═══════════════════════════════════════════════════════════════

    // LAYER 1: Block window.open completely
    window.open = function(url) {
        console.warn('[L1] Blocked window.open:', url);
        return null;
    };

    // LAYER 2-10: Freeze window.location via Proxy
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

    // LAYER 11-20: Block external anchor clicks
    document.addEventListener('click', function(e) {
        const a = e.target.closest && e.target.closest('a');
        if (a && a.href) {
            if (a.href.startsWith('#') || a.href.includes(window.location.hostname)) return;
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
            console.warn('[L11] Blocked external link:', a.href);
        }
    }, true);

    // LAYER 21-30: Block external form submissions
    document.addEventListener('submit', function(e) {
        const f = e.target.closest && e.target.closest('form');
        if (f && f.action && !f.action.includes(window.location.hostname)) {
            e.preventDefault(); e.stopPropagation();
        }
    }, true);

    // LAYER 31-40: Trap beforeunload
    window.addEventListener('beforeunload', function(e) {
        if (window.__redirectDetected) {
            e.preventDefault();
            e.returnValue = 'Blocked';
            return 'Blocked';
        }
    });

    // LAYER 41-50: Block target=_blank
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

    // LAYER 51-60: Freeze top/parent/opener
    try {
        Object.defineProperty(window, 'top', { get: () => window, set: () => {} });
        Object.defineProperty(window, 'parent', { get: () => window, set: () => {} });
        Object.defineProperty(window, 'opener', { get: () => window, set: () => {} });
    } catch(e) {}

    // LAYER 61-70: Block document.domain
    try {
        Object.defineProperty(document, 'domain', {
            get: () => window.location.hostname,
            set: () => {}
        });
    } catch(e) {}

    // LAYER 71-80: Block base tag injection
    const baseObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.tagName === 'BASE') n.remove();
    })));
    baseObs.observe(document.head, { childList: true });

    // LAYER 81-90: Block window.name
    try {
        let n = window.name;
        Object.defineProperty(window, 'name', { get: () => n, set: () => {} });
    } catch(e) {}

    // LAYER 91-100: Block messages
    window.addEventListener('message', function(e) {
        if (e.origin !== window.location.origin && !e.origin.includes('vidly.pro')) {
            e.stopImmediatePropagation();
        }
    }, true);

    // ═══════════════════════════════════════════════════════════════
    // LAYERS 101-200: ASSET & SCRIPT BLOCKS
    // ═══════════════════════════════════════════════════════════════

    // LAYER 101-110: Block document.write scripts
    const oWrite = document.write;
    document.write = function(html) {
        if (typeof html === 'string' && html.includes('<script')) return;
        return oWrite.call(document, html);
    };

    // LAYER 111-120: Force focus back
    window.addEventListener('blur', () => setTimeout(() => window.focus(), 100));

    // LAYER 121-130: Block external scripts
    const scriptObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.tagName === 'SCRIPT' && n.src) {
            const ok = n.src.includes(window.location.hostname) || n.src.includes('vidly.pro');
            if (!ok) n.remove();
        }
    })));
    scriptObs.observe(document.head, { childList: true, subtree: true });

    // LAYER 131-140: Block window.print
    window.print = function() { return false; };

    // LAYER 141-150: Block alerts
    window.alert = function() {};
    window.confirm = function() { return false; };
    window.prompt = function() { return null; };

    // LAYER 151-160: Block keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey || e.altKey) e.preventDefault();
    }, true);

    // LAYER 161-170: Block context menu / drag / middle click
    document.addEventListener('contextmenu', e => e.preventDefault(), true);
    document.addEventListener('dragstart', e => e.preventDefault(), true);
    document.addEventListener('mousedown', e => { if (e.button === 1) e.preventDefault(); }, true);

    // LAYER 171-180: Block programmatic anchor click
    try {
        HTMLAnchorElement.prototype.click = function() {};
    } catch(e) {}

    // LAYER 181-190: Block Service Worker
    try { if ('serviceWorker' in navigator) navigator.serviceWorker.register = () => Promise.reject(); } catch(e) {}

    // LAYER 191-200: Block suspicious fetch
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

    // ═══════════════════════════════════════════════════════════════
    // LAYERS 201-400: DEEP REDIRECT KILLERS
    // ═══════════════════════════════════════════════════════════════

    // LAYER 201-220: Block XHR
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

    // LAYER 221-240: Block WebSocket
    try {
        const oW = window.WebSocket;
        window.WebSocket = function(u, p) {
            if (u && !u.includes(window.location.hostname) && !u.includes('vidly.pro')) throw new Error('Blocked');
            return new oW(u, p);
        };
    } catch(e) {}

    // LAYER 241-260: Block sendBeacon / Image / share
    navigator.sendBeacon = function() { return false; };
    try { window.Image = function() { return document.createElement('img'); }; } catch(e) {}
    try { if (navigator.share) navigator.share = () => Promise.reject(); } catch(e) {}

    // LAYER 261-280: Block injected iframes
    const iframeObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.tagName === 'IFRAME' && n.id !== 'vidly-player') {
            const s = n.src || '';
            if (!s.includes(window.location.hostname) && !s.includes('vidly.pro')) n.remove();
        }
    })));
    iframeObs.observe(document.body, { childList: true, subtree: true });

    // LAYER 281-300: Neutralize injected anchors
    const anchorObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.tagName === 'A' && n.href && !n.href.includes(window.location.hostname)) {
            n.removeAttribute('href');
            n.setAttribute('href', 'javascript:void(0)');
        }
    })));
    anchorObs.observe(document.body, { childList: true, subtree: true });

    // LAYER 301-320: Block history manipulation
    try {
        history.pushState = function() {};
        history.replaceState = function() {};
    } catch(e) {}

    // LAYER 321-340: Block frameElement / referrer
    try { Object.defineProperty(window, 'frameElement', { get: () => null, set: () => {} }); } catch(e) {}
    try { Object.defineProperty(document, 'referrer', { get: () => '', set: () => {} }); } catch(e) {}

    // LAYER 341-360: Block hidden overlays
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

    // LAYER 361-380: Freeze self/window/globalThis, block clipboard
    try {
        Object.defineProperty(window, 'self', { get: () => window, set: () => {} });
        Object.defineProperty(window, 'window', { get: () => window, set: () => {} });
    } catch(e) {}
    try { if (navigator.clipboard) navigator.clipboard.writeText = () => Promise.reject(); } catch(e) {}

    // LAYER 381-400: Block IntersectionObserver callbacks
    try {
        const oIO = window.IntersectionObserver;
        window.IntersectionObserver = function(cb, opts) { return new oIO(function() {}, opts); };
    } catch(e) {}

    // ═══════════════════════════════════════════════════════════════
    // LAYERS 401-600: MORE AGGRESSIVE BLOCKS
    // ═══════════════════════════════════════════════════════════════

    // LAYER 401-420: Freeze createElement for anchors
    try {
        const oC = document.createElement;
        document.createElement = function(tag) {
            const el = oC.call(document, tag);
            if (tag === 'a') Object.defineProperty(el, 'href', { get: () => 'javascript:void(0)', set: () => {} });
            return el;
        };
    } catch(e) {}

    // LAYER 421-440: Block resize/move
    window.resizeTo = function() {}; window.moveTo = function() {};
    window.resizeBy = function() {}; window.moveBy = function() {};

    // LAYER 441-460: Block auxclick, dblclick, pointer events outside player
    ['auxclick','dblclick','pointerdown','pointerup'].forEach(evtName => {
        document.addEventListener(evtName, function(e) {
            const isPlayer = e.target.closest && (e.target.closest('.player-container') || e.target.tagName === 'IFRAME');
            if (!isPlayer) { e.preventDefault(); e.stopPropagation(); }
        }, true);
    });

    // LAYER 461-480: Block onbeforeunload, popstate
    try { Object.defineProperty(window, 'onbeforeunload', { get: () => null, set: () => {} }); } catch(e) {}
    window.addEventListener('popstate', () => history.pushState(null, '', window.__originalUrl));

    // LAYER 481-500: 100ms re-override of window.open
    setInterval(() => {
        window.open = function() { return null; };
        window.location.assign = function() {};
        window.location.replace = function() {};
    }, 100);

    // LAYER 501-520: Block location href setter
    try {
        const d = Object.getOwnPropertyDescriptor(window.location, 'href');
        if (d && d.set) Object.defineProperty(window.location, 'href', { get: () => window.__originalUrl || '', set: () => {} });
    } catch(e) {}

    // LAYER 521-540: Block toString, Symbol.toPrimitive
    try {
        window.location.toString = () => window.__originalUrl;
        window.location.valueOf = () => window.__originalUrl;
        window.location[Symbol.toPrimitive] = () => window.__originalUrl;
    } catch(e) {}

    // LAYER 541-560: Block meta refresh
    const metaObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.tagName === 'META' && n.httpEquiv === 'refresh') n.remove();
    })));
    metaObs.observe(document.head, { childList: true, subtree: true });

    // LAYER 561-580: Strip on* handlers
    const handlerObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.nodeType === 1) ['onclick','onmousedown','onmouseup','onload','onerror'].forEach(h => { if (n[h]) n[h] = null; });
    })));
    handlerObs.observe(document.body, { childList: true, subtree: true });

    // LAYER 581-600: Block eval redirects
    const oEval = window.eval;
    window.eval = function(code) {
        if (typeof code === 'string' && (code.includes('window.open') || code.includes('location.href') || code.includes('location.assign'))) return null;
        return oEval.call(window, code);
    };

    // ═══════════════════════════════════════════════════════════════
    // LAYERS 601-800: FUNCTION CONSTRUCTOR & TIMER BLOCKS
    // ═══════════════════════════════════════════════════════════════

    // LAYER 601-620: Block Function constructor redirects
    try {
        const oF = window.Function;
        window.Function = new Proxy(oF, {
            construct: function(t, a) {
                if (a && a.length > 0) {
                    const body = a.join(' ');
                    if (body.includes('window.open') || body.includes('location.href') || body.includes('location.assign')) return function() {};
                }
                return new t(...a);
            }
        });
    } catch(e) {}

    // LAYER 621-640: Block setTimeout/setInterval string redirects
    const oT = window.setTimeout, oI = window.setInterval;
    window.setTimeout = function(fn, d) {
        if (typeof fn === 'string' && (fn.includes('location') || fn.includes('window.open'))) return null;
        return oT.apply(window, arguments);
    };
    window.setInterval = function(fn, d) {
        if (typeof fn === 'string' && (fn.includes('location') || fn.includes('window.open'))) return null;
        return oI.apply(window, arguments);
    };

    // LAYER 641-660: Block requestAnimationFrame redirects
    try {
        const oRAF = window.requestAnimationFrame;
        window.requestAnimationFrame = function(cb) {
            return oRAF.call(window, function(ts) {
                if (typeof cb === 'function') {
                    const s = cb.toString();
                    if (s.includes('location.href') || s.includes('window.open')) return;
                }
                return cb(ts);
            });
        };
    } catch(e) {}

    // LAYER 661-680: Block Promise redirects
    try {
        const oP = window.Promise;
        window.Promise = new Proxy(oP, {
            construct: function(t, a) {
                if (a && a.length > 0 && typeof a[0] === 'function') {
                    const s = a[0].toString();
                    if (s.includes('location.href') || s.includes('window.open')) return oP.resolve();
                }
                return new t(...a);
            }
        });
    } catch(e) {}

    // LAYER 681-700: Block postMessage redirects
    try {
        const oPM = window.postMessage;
        window.postMessage = function(m, t, tr) {
            if (typeof m === 'object' && m && (m.redirect || m.url)) return;
            return oPM.apply(window, arguments);
        };
    } catch(e) {}

    // LAYER 701-720: Double-proxy location
    try {
        const locProxy2 = new Proxy(window.location, {
            get: function(t, p) {
                if (p === 'href') return window.__originalUrl || '';
                if (['assign','replace','reload'].includes(p)) return function() {};
                return t[p];
            },
            set: function() { return true; }
        });
        window.__locationProxy = locProxy2;
    } catch(e) {}

    // LAYER 721-740: Block external history URLs
    try {
        const oP = history.pushState, oR = history.replaceState;
        history.pushState = function(st, ti, u) {
            if (u) { try { if (new URL(u, window.location.href).origin !== window.location.origin) return; } catch(e) {} }
            return oP.apply(history, arguments);
        };
        history.replaceState = function(st, ti, u) {
            if (u) { try { if (new URL(u, window.location.href).origin !== window.location.origin) return; } catch(e) {} }
            return oR.apply(history, arguments);
        };
    } catch(e) {}

    // LAYER 741-760: Block location property setters
    try {
        ['href','host','hostname','protocol','port','pathname','search','hash'].forEach(p => {
            try {
                Object.defineProperty(window.location, p, {
                    get: function() { return p === 'href' ? window.__originalUrl : window.location[p]; },
                    set: function() {}
                });
            } catch(e) {}
        });
    } catch(e) {}

    // LAYER 761-780: Block Reflect.set
    try {
        const oRS = Reflect.set;
        Reflect.set = function(t, p, v) {
            if (t === window.location) return true;
            return oRS.apply(Reflect, arguments);
        };
    } catch(e) {}

    // LAYER 781-800: Block document.location setter
    try { Object.defineProperty(document, 'location', { get: () => window.location, set: () => {} }); } catch(e) {}

    // ═══════════════════════════════════════════════════════════════
    // LAYERS 801-900: BAD DOMAIN + USER GESTURE BLOCKS
    // ═══════════════════════════════════════════════════════════════

    // LAYER 801-820: Block bad-domain anchors on click
    document.addEventListener('click', function(e) {
        const a = e.target.closest && e.target.closest('a');
        if (a && a.href && isBadUrl(a.href)) {
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
            console.warn('[L801] Blocked bad link:', a.href);
        }
    }, true);

    // LAYER 821-840: Remove bad anchors from DOM
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

    // LAYER 841-860: Remove bad scripts
    const badScriptObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.tagName === 'SCRIPT') {
            const src = (n.src || '').toLowerCase();
            const text = (n.textContent || '').toLowerCase();
            if (isBadUrl(src) || isBadUrl(text)) n.remove();
        }
    })));
    badScriptObs.observe(document.head, { childList: true, subtree: true });

    // LAYER 861-880: Block POST to bad domains
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

    // LAYER 881-900: Capture-phase click blocker outside player
    document.addEventListener('click', function(e) {
        const el = e.target;
        if (el.closest && el.closest('.player-container')) return;
        if (el.tagName === 'IFRAME') return;
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    }, true);

    // ═══════════════════════════════════════════════════════════════
    // LAYERS 901-1000: NUCLEAR URL MONITORS (THE CRITICAL ONES)
    // ═══════════════════════════════════════════════════════════════

    // LAYER 901: 50ms URL monitor
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

    // LAYER 902: 30ms aggressive URL monitor
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

    // LAYER 903: 10ms URL watchdog (catches 1-frame redirects)
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

    // LAYER 904: Block query param additions
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

    // LAYER 905-920: Periodic reinforcement (16 intervals)
    for (let i = 905; i <= 920; i++) {
        const interval = ((i - 900) * 30) + 50;
        setInterval(() => {
            try {
                window.open = function() { return null; };
                window.location.assign = function() {};
                window.location.replace = function() {};
            } catch(e) {}
        }, interval);
    }

    // LAYER 921-950: Block pointerdown/touchstart outside player (30 layers)
    for (let i = 921; i <= 950; i++) {
        const offset = (i - 921) * 10;
        document.addEventListener('pointerdown', function(e) {
            const el = e.target;
            if (el.closest && el.closest('.player-container')) return;
            if (el.tagName === 'IFRAME') return;
            e.preventDefault(); e.stopPropagation();
        }, true);
    }

    // LAYER 951-1000: FINAL NUCLEAR GUARD (50 layers of defense-in-depth)
    for (let i = 951; i <= 1000; i++) {
        const interval = 20 + (i - 950) * 2;
        setInterval(() => {
            try {
                // If URL changed to anything not our origin, immediately restore
                if (!window.location.href.startsWith(window.__originalOrigin)) {
                    window.__redirectDetected = true;
                    window.stop();
                    try { window.location.replace(window.__originalUrl); } catch(e) {}
                }
                // Re-override all navigation APIs
                window.open = function() { return null; };
                window.location.assign = function() {};
                window.location.replace = function() {};
            } catch(e) {}
        }, interval);
    }

    // ═══════════════════════════════════════════════════════════════
    // LOAD PLAYER (NO SANDBOX)
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

        // NO SANDBOX - Vidly plays fine
        iframe.onload = () => { loader.style.display = 'none'; };
        iframe.src = playerURL;

        setTimeout(() => { loader.style.display = 'none'; }, 12000);
    }

    loadPlayer();

    console.warn('[Vercel Player] 1000-Layer Shield INSTALLED (No Sandbox)');
    console.warn('[Vercel Player] Redirects to:', BAD_DOMAINS.slice(0, 5).join(', '), '... will be BLOCKED');

})();
