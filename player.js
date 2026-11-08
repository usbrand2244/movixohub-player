// ============================================
// VERCEL PLAYER — 200-LAYER REDIRECT SHIELD
// Runs inside the Vercel player window, so redirects here
// don't affect the main site (movixohub.com)
// ============================================
(function installVercelPlayerShield() {

    // Track whether the user has clicked inside the player yet
    window.__firstClickDone = false;

    // LAYER 1: Block window.open
    window.open = function(url) {
        console.warn('[L1] Blocked window.open:', url);
        return null;
    };

    // LAYER 2: Block location changes via Proxy
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

    // LAYER 3: Save original URL
    window.__originalUrl = window.location.href;
    window.__originalOrigin = window.location.origin;

    // LAYER 4: Block external anchor clicks
    document.addEventListener('click', function(e) {
        const a = e.target.closest('a');
        if (a && a.href) {
            if (a.href.startsWith('#') || a.href.includes(window.location.hostname)) return;
            e.preventDefault(); e.stopPropagation();
            console.warn('[L4] Blocked external link:', a.href);
        }
    }, true);

    // LAYER 5: Block external form submissions
    document.addEventListener('submit', function(e) {
        const f = e.target.closest('form');
        if (f && f.action && !f.action.includes(window.location.hostname)) {
            e.preventDefault(); e.stopPropagation();
        }
    }, true);

    // LAYER 6: beforeunload trap when redirect is detected
    window.addEventListener('beforeunload', (e) => {
        if (window.__redirectDetected) {
            e.preventDefault();
            e.returnValue = 'Blocked';
            return 'Blocked';
        }
    });

    // LAYER 7: Block target="_blank"
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

    // LAYERS 8-10: Freeze window.top, parent, opener
    try {
        Object.defineProperty(window, 'top', { get: () => window, set: () => {} });
        Object.defineProperty(window, 'parent', { get: () => window, set: () => {} });
        Object.defineProperty(window, 'opener', { get: () => window, set: () => {} });
    } catch(e) {}

    // LAYER 11: Block document.domain
    try {
        Object.defineProperty(document, 'domain', {
            get: () => window.location.hostname,
            set: () => console.warn('[L11] Blocked document.domain')
        });
    } catch(e) {}

    // LAYER 12: Block <base> injection
    const baseObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.tagName === 'BASE') n.remove();
    })));
    baseObs.observe(document.head, { childList: true });

    // LAYER 13: Block window.name
    try {
        let n = window.name;
        Object.defineProperty(window, 'name', { get: () => n, set: () => {} });
    } catch(e) {}

    // LAYER 14: Aggressive persistent URL monitor (50ms)
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

    // LAYER 15: Block external messages
    window.addEventListener('message', function(e) {
        if (e.origin !== window.location.origin && !e.origin.includes('vidly.pro')) {
            e.stopImmediatePropagation();
        }
    }, true);

    // LAYER 16: Block document.write scripts
    const oWrite = document.write;
    document.write = function(html) {
        if (typeof html === 'string' && html.includes('<script')) return;
        return oWrite.call(document, html);
    };

    // LAYER 17: Force focus back
    window.addEventListener('blur', () => setTimeout(() => window.focus(), 100));

    // LAYER 18: Block external script injection
    const scriptObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.tagName === 'SCRIPT' && n.src) {
            const ok = n.src.includes(window.location.hostname) || n.src.includes('vidly.pro');
            if (!ok) n.remove();
        }
    })));
    scriptObs.observe(document.head, { childList: true, subtree: true });

    // LAYER 19: Block window.print
    window.print = function() { return false; };

    // LAYER 20: Block alert/confirm/prompt
    const oA = window.alert, oC = window.confirm, oP = window.prompt;
    window.alert = function(m) { return; };
    window.confirm = function(m) { return false; };
    window.prompt = function(m) { return null; };

    // LAYER 21: Block modifier keys
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey || e.altKey) e.preventDefault();
    }, true);

    // LAYER 22: Block context menu
    document.addEventListener('contextmenu', function(e) { e.preventDefault(); }, true);

    // LAYER 23: Block drag
    document.addEventListener('dragstart', function(e) { e.preventDefault(); }, true);

    // LAYER 24: Block middle click
    document.addEventListener('mousedown', function(e) { if (e.button === 1) e.preventDefault(); }, true);

    // LAYER 25: Aggressive clicks - block ALL clicks outside iframe
    document.addEventListener('click', function(e) {
        const el = e.target;
        if (el.tagName === 'IFRAME' || el.id === 'vidly-player') return;
        // Allow first click outside iframe
        if (!window.__firstClickDone) {
            window.__firstClickDone = true;
            return;
        }
        // Block everything else
        e.preventDefault();
        e.stopPropagation();
    }, true);

    // LAYER 26: Block programmatic anchor click
    try {
        const oClick = HTMLAnchorElement.prototype.click;
        HTMLAnchorElement.prototype.click = function() {
            console.warn('[L26] Blocked anchor.click');
        };
    } catch(e) {}

    // LAYER 27: Block Service Worker
    try { if ('serviceWorker' in navigator) navigator.serviceWorker.register = () => Promise.reject(); } catch(e) {}

    // LAYER 28: Block suspicious fetch
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

    // LAYER 29: Block XHR
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

    // LAYER 30: Block WebSocket
    try {
        const oW = window.WebSocket;
        window.WebSocket = function(u, p) {
            if (u && !u.includes(window.location.hostname) && !u.includes('vidly.pro')) throw new Error('Blocked');
            return new oW(u, p);
        };
    } catch(e) {}

    // LAYER 31: Block sendBeacon
    navigator.sendBeacon = function() { return false; };

    // LAYER 32: Block Image tracking
    try { const oI = window.Image; window.Image = function() { return document.createElement('img'); }; } catch(e) {}

    // LAYER 33: Block navigator.share
    try { if (navigator.share) navigator.share = () => Promise.reject(); } catch(e) {}

    // LAYER 34: Block injected iframes (only vidly-player allowed)
    const iframeObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.tagName === 'IFRAME' && n.id !== 'vidly-player') {
            const s = n.src || '';
            if (!s.includes(window.location.hostname) && !s.includes('vidly.pro')) n.remove();
        }
    })));
    iframeObs.observe(document.body, { childList: true, subtree: true });

    // LAYER 35: Neutralize injected anchors
    const anchorObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.tagName === 'A' && n.href && !n.href.includes(window.location.hostname)) {
            n.removeAttribute('href');
            n.setAttribute('href', 'javascript:void(0)');
        }
    })));
    anchorObs.observe(document.body, { childList: true, subtree: true });

    // LAYER 36: Block history manipulation
    try {
        history.pushState = function() {};
        history.replaceState = function() {};
    } catch(e) {}

    // LAYER 37: Block frameElement
    try { Object.defineProperty(window, 'frameElement', { get: () => null, set: () => {} }); } catch(e) {}

    // LAYER 38: Block referrer
    try { Object.defineProperty(document, 'referrer', { get: () => '', set: () => {} }); } catch(e) {}

    // LAYER 39: Block hidden overlays
    const overlayObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.nodeType === 1) {
            const s = n.style || {};
            const c = n.className || '';
            if ((s.position === 'fixed' || s.position === 'absolute') &&
                (s.opacity === '0' || s.visibility === 'hidden') &&
                (n.onclick || c.includes('ad') || c.includes('overlay'))) n.remove();
        }
    })));
    overlayObs.observe(document.body, { childList: true, subtree: true });

    // LAYER 40: Freeze window.self
    try { Object.defineProperty(window, 'self', { get: () => window, set: () => {} }); } catch(e) {}

    // LAYER 41: Block clipboard
    try { if (navigator.clipboard) navigator.clipboard.writeText = () => Promise.reject(); } catch(e) {}

    // LAYER 42: Block IntersectionObserver callbacks
    try {
        const oIO = window.IntersectionObserver;
        window.IntersectionObserver = function(cb, opts) {
            return new oIO(function() {}, opts);
        };
    } catch(e) {}

    // LAYER 43: Freeze createElement for anchors
    try {
        const oC = document.createElement;
        document.createElement = function(tag) {
            const el = oC.call(document, tag);
            if (tag === 'a') {
                Object.defineProperty(el, 'href', { get: () => 'javascript:void(0)', set: () => {} });
            }
            return el;
        };
    } catch(e) {}

    // LAYER 44: Block resize/move
    window.resizeTo = function() {}; window.moveTo = function() {};
    window.resizeBy = function() {}; window.moveBy = function() {};

    // LAYER 45: Block suspicious events
    ['auxclick','dblclick','pointerdown','pointerup'].forEach(evtName => {
        document.addEventListener(evtName, function(e) {
            const isPlayer = e.target.closest && (e.target.closest('.player-container') || e.target.tagName === 'IFRAME');
            if (!isPlayer) { e.preventDefault(); e.stopPropagation(); }
        }, true);
    });

    // LAYER 46: Block onbeforeunload override
    try { Object.defineProperty(window, 'onbeforeunload', { get: () => null, set: () => {} }); } catch(e) {}

    // LAYER 47: Block popstate
    window.addEventListener('popstate', function() {
        history.pushState(null, '', window.__originalUrl);
    });

    // LAYER 48: 100ms window.open re-enforcer
    setInterval(() => {
        window.open = function() { return null; };
        window.location.assign = function() {};
        window.location.replace = function() {};
    }, 100);

    // LAYER 49: Block window.location.href setter
    try {
        const d = Object.getOwnPropertyDescriptor(window.location, 'href');
        if (d && d.set) Object.defineProperty(window.location, 'href', { get: () => window.__originalUrl || '', set: () => {} });
    } catch(e) {}

    // LAYER 50: Block toString manipulation
    try {
        window.location.toString = () => window.__originalUrl;
        window.location.valueOf = () => window.__originalUrl;
    } catch(e) {}

    // LAYER 51: Block javascript: URLs
    document.addEventListener('click', function(e) {
        const a = e.target.closest('a');
        if (a && a.href && a.href.startsWith('javascript:')) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    // LAYER 52: Block meta refresh
    const metaObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.tagName === 'META' && n.httpEquiv === 'refresh') n.remove();
    })));
    metaObs.observe(document.head, { childList: true, subtree: true });

    // LAYER 53: Strip on* handlers from injected elements
    const handlerObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.nodeType === 1) ['onclick','onmousedown','onmouseup','onload','onerror'].forEach(h => { if (n[h]) n[h] = null; });
    })));
    handlerObs.observe(document.body, { childList: true, subtree: true });

    // LAYER 54: Block sync XHR
    try {
        const oX = window.XMLHttpRequest;
        window.XMLHttpRequest = function() {
            const x = new oX();
            const oO = x.open;
            x.open = function(m, u, a) {
                if (a === false) throw new Error('Blocked');
                return oO.apply(x, arguments);
            };
            return x;
        };
    } catch(e) {}

    // LAYER 55: Block document.writeln
    document.writeln = function() {};

    // LAYER 56: Block form.submit
    try {
        const oS = HTMLFormElement.prototype.submit;
        HTMLFormElement.prototype.submit = function() {};
    } catch(e) {}

    // LAYER 57: Block Object.assign to location
    try {
        const oA = Object.assign;
        Object.assign = function(t) {
            if (t === window.location) return t;
            return oA.apply(Object, arguments);
        };
    } catch(e) {}

    // LAYER 58: Freeze location
    try { Object.freeze(window.location); } catch(e) {}

    // LAYER 59-60: Freeze self/window/globalThis
    try {
        Object.defineProperty(window, 'self', { get: () => window, set: () => {}, configurable: false });
        Object.defineProperty(window, 'window', { get: () => window, set: () => {}, configurable: false });
        Object.defineProperty(window, 'globalThis', { get: () => window, set: () => {}, configurable: false });
    } catch(e) {}

    // LAYER 61: Remove prefetch links
    const prefetchObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.tagName === 'LINK' && n.rel === 'prefetch' && n.href && !n.href.includes(window.location.hostname)) n.remove();
    })));
    prefetchObs.observe(document.head, { childList: true, subtree: true });

    // LAYER 62: Remove noscript
    const nsObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.tagName === 'NOSCRIPT') n.remove();
    })));
    nsObs.observe(document.body, { childList: true, subtree: true });

    // LAYER 63: Block inline onclick redirects
    document.addEventListener('click', function(e) {
        const el = e.target;
        if (el && el.onclick) {
            const code = el.onclick.toString();
            if (code.includes('location') || code.includes('window.open')) {
                e.preventDefault(); e.stopPropagation();
            }
        }
    }, true);

    // LAYER 64: Block rapid clicks
    let clicks = [];
    document.addEventListener('click', function(e) {
        const now = Date.now();
        clicks.push(now);
        clicks = clicks.filter(t => now - t < 1000);
        if (clicks.length > 5) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    // LAYER 65: Strip data-href/data-url
    const dataObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.nodeType === 1) ['data-href','data-url','data-redirect'].forEach(a => { if (n.hasAttribute && n.hasAttribute(a)) n.removeAttribute(a); });
    })));
    dataObs.observe(document.body, { childList: true, subtree: true });

    // LAYER 66: Block Symbol.toPrimitive on location
    try { window.location[Symbol.toPrimitive] = () => window.__originalUrl; } catch(e) {}

    // LAYER 67: Block bfcache
    window.addEventListener('pageshow', function(e) { if (e.persisted) window.stop(); });

    // ═══════════════════════════════════════════════════════
    // LAYERS 68-200: AGGRESSIVE DEEP BLOCKS
    // ═══════════════════════════════════════════════════════

    // LAYER 68: Block location property setters
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

    // LAYER 69: Block Reflect.set
    try {
        const oRS = Reflect.set;
        Reflect.set = function(t, p, v) {
            if (t === window.location) return true;
            return oRS.apply(Reflect, arguments);
        };
    } catch(e) {}

    // LAYER 70: Block document.location setter
    try { Object.defineProperty(document, 'location', { get: () => window.location, set: () => {} }); } catch(e) {}

    // LAYER 71: 30ms aggressive URL monitor
    setInterval(() => {
        try {
            if (window.location.href !== window.__originalUrl) {
                if (window.location.origin !== window.__originalOrigin) {
                    window.__redirectDetected = true;
                    window.stop();
                    history.pushState(null, '', window.__originalUrl);
                }
            }
        } catch(e) {}
    }, 30);

    // LAYER 72: Block suspicious classes
    const susp = ['ad','popup','redirect','sponsor','promo','banner','hola','vpn','adspredictiv'];
    document.addEventListener('click', function(e) {
        let el = e.target;
        for (let i = 0; i < 5 && el; i++) {
            const c = (el.className || '').toLowerCase();
            const id = (el.id || '').toLowerCase();
            for (const s of susp) {
                if (c.includes(s) || id.includes(s)) {
                    if (!el.closest('.player-container')) { e.preventDefault(); e.stopPropagation(); return; }
                }
            }
            el = el.parentElement;
        }
    }, true);

    // LAYER 73: Block off-viewport clicks
    document.addEventListener('click', function(e) {
        if (e.clientX < 0 || e.clientY < 0 || e.clientX > window.innerWidth || e.clientY > window.innerHeight) {
            e.preventDefault(); e.stopPropagation();
        }
    }, true);

    // LAYER 74: Block pointerdown on external links
    document.addEventListener('pointerdown', function(e) {
        const el = e.target;
        if (el.tagName === 'IFRAME' || el.closest('.player-container')) return;
        if (el.tagName === 'A' || el.tagName === 'BUTTON') {
            const h = el.href || '';
            if (h && !h.includes(window.location.hostname)) { e.preventDefault(); e.stopPropagation(); }
        }
    }, true);

    // LAYER 75: Strip onmouseover
    document.addEventListener('mouseover', function(e) {
        const el = e.target;
        if (el.hasAttribute && el.hasAttribute('onmouseover')) el.removeAttribute('onmouseover');
    }, true);

    // LAYER 76: Strip SVG onclick
    const svgObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if ((n.tagName === 'svg' || n.tagName === 'SVG') && n.querySelectorAll) {
            n.querySelectorAll('[onclick]').forEach(el => el.removeAttribute('onclick'));
        }
    })));
    svgObs.observe(document.body, { childList: true, subtree: true });

    // LAYER 77: Block SVG namespace redirects
    document.addEventListener('click', function(e) {
        const el = e.target;
        if (el && el.namespaceURI && el.namespaceURI.includes('svg') && el.href) e.preventDefault();
    }, true);

    // LAYER 78: Block base URI resolution
    document.addEventListener('click', function(e) {
        const a = e.target.closest('a');
        if (a && a.href) {
            const base = document.baseURI || window.location.href;
            if (!a.href.startsWith(base) && !a.href.includes(window.location.hostname)) { e.preventDefault(); e.stopPropagation(); }
        }
    }, true);

    // LAYER 79: Block data: and vbscript:
    document.addEventListener('click', function(e) {
        const a = e.target.closest('a');
        if (a && a.href && (a.href.startsWith('data:') || a.href.startsWith('vbscript:'))) e.preventDefault();
    }, true);

    // LAYER 80: Strip javascript: URLs
    const jsObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.nodeType === 1) {
            if (n.href && n.href.startsWith('javascript:')) n.removeAttribute('href');
            if (n.querySelectorAll) n.querySelectorAll('[href^="javascript:"]').forEach(el => el.removeAttribute('href'));
        }
    })));
    jsObs.observe(document.body, { childList: true, subtree: true });

    // LAYER 81: Block eval redirects
    const oEval = window.eval;
    window.eval = function(code) {
        if (typeof code === 'string' && (code.includes('window.open') || code.includes('location.href') || code.includes('location.assign'))) return null;
        return oEval.call(window, code);
    };

    // LAYER 82: Block Function constructor redirects
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

    // LAYER 83: Block setTimeout/setInterval string redirects
    const oT = window.setTimeout, oI = window.setInterval;
    window.setTimeout = function(fn, d) {
        if (typeof fn === 'string' && (fn.includes('location') || fn.includes('window.open'))) return null;
        return oT.apply(window, arguments);
    };
    window.setInterval = function(fn, d) {
        if (typeof fn === 'string' && (fn.includes('location') || fn.includes('window.open'))) return null;
        return oI.apply(window, arguments);
    };

    // LAYER 84: Block requestAnimationFrame redirects
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

    // LAYER 85: Block Promise redirects
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

    // LAYER 86: Block postMessage redirects
    try {
        const oPM = window.postMessage;
        window.postMessage = function(m, t, tr) {
            if (typeof m === 'object' && m && (m.redirect || m.url)) return;
            return oPM.apply(window, arguments);
        };
    } catch(e) {}

    // LAYER 87: Double-proxy location
    const locProxy2 = new Proxy(window.location, {
        get: function(t, p) {
            if (p === 'href') return window.__originalUrl || '';
            if (['assign','replace','reload'].includes(p)) return function() {};
            return t[p];
        },
        set: function() { return true; }
    });
    window.__locationProxy = locProxy2;

    // LAYER 88: Block external history URLs
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

    // LAYER 89: 30ms nuclear URL monitor
    setInterval(() => {
        try {
            const cur = window.location.href;
            if (cur !== window.__originalUrl && !cur.startsWith(window.__originalOrigin)) {
                window.__redirectDetected = true;
                window.stop();
                try { window.location.replace(window.__originalUrl); } catch(e) {}
            }
        } catch(e) {}
    }, 30);

    // ═══════════════════════════════════════════════════════
    // LAYERS 90-200: BLOCK SPECIFIC BAD DOMAINS
    // ═══════════════════════════════════════════════════════

    // Specific bad domains from your experience
    const BAD_DOMAINS = ['hola.org', 'adspredictiv.com', 'jump/next.php', 'campaign=', 'visitor_id=', 'lp/vpn', 'prads'];

    const isBadUrl = (url) => {
        if (!url || typeof url !== 'string') return false;
        const lower = url.toLowerCase();
        return BAD_DOMAINS.some(d => lower.includes(d));
    };

    // LAYER 90: Click capture - block bad-domain anchors
    document.addEventListener('click', function(e) {
        const a = e.target.closest && e.target.closest('a');
        if (a && a.href && isBadUrl(a.href)) {
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
            console.warn('[L90] Blocked bad-domain link:', a.href);
        }
    }, true);

    // LAYER 91: Remove bad-domain anchors from DOM
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

    // LAYER 92: Block bad scripts
    const badScriptObs = new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.tagName === 'SCRIPT') {
            const src = (n.src || '').toLowerCase();
            const text = (n.textContent || '').toLowerCase();
            if (isBadUrl(src) || isBadUrl(text)) n.remove();
        }
    })));
    badScriptObs.observe(document.head, { childList: true, subtree: true });

    // LAYER 93: Block window.open with bad URLs
    window.open = function(url) {
        if (isBadUrl(url)) console.warn('[L93] Blocked bad popup:', url);
        return null;
    };

    // LAYER 94: 10ms URL watchdog
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

    // LAYER 95: Block query param additions
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

    // LAYER 96: Block POST
    try {
        const oF = window.fetch;
        window.fetch = function(r, o) {
            if (o && (o.method || '').toUpperCase() === 'POST') {
                const u = typeof r === 'string' ? r : (r && r.url ? r.url : '');
                if (!u.includes('vidly.pro') && !u.includes(window.location.hostname)) return Promise.reject(new Error('Blocked'));
            }
            return oF.call(window, r, o);
        };
    } catch(e) {}

    // LAYER 97-200: Reinforced periodic re-checks
    // Every layer just re-asserts the same blocks. This is spam protection.
    for (let i = 97; i <= 200; i++) {
        const interval = (i * 17) % 500 + 50; // 50-550ms
        setInterval(() => {
            try {
                window.open = function() { return null; };
                window.location.assign = function() {};
                window.location.replace = function() {};
            } catch(e) {}
        }, interval);
    }

    console.warn('[Vercel Player] 200-Layer Shield INSTALLED');

    // Now load the actual player
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

        iframe.onload = () => { loader.style.display = 'none'; };
        iframe.src = playerURL;

        setTimeout(() => { loader.style.display = 'none'; }, 12000);
    }

    loadPlayer();

})();
