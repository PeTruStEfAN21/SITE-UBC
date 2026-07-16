/**
 * public/js/analytics.js
 * ══════════════════════════════════════════════════════════
 * Modul Analytics Local UBC — complet offline, fără cookies
 *   - Sesiuni și vizite unice
 *   - Timp petrecut pe fiecare pagină SPA
 *   - Engagement calculator (utilizări, volume calculate)
 *   - Click-uri CTA (telefon, email)
 *   - Bounce rate estimat
 *   - Exportă API global: window.UBC_Analytics
 * ══════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ─── Constante ────────────────────────────────────────
    const STORAGE_KEY    = 'ubc_analytics';
    const SESSION_KEY    = 'ubc_session_analytics';
    const VISITOR_KEY    = 'ubc_visitor_id';

    // ─── Helpers ──────────────────────────────────────────

    function readData() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        } catch (_) { return {}; }
    }

    function writeData(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (_) {}
    }

    function readSession() {
        try {
            return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}');
        } catch (_) { return {}; }
    }

    function writeSession(data) {
        try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
        } catch (_) {}
    }

    /** Obține sau creează un ID vizitator persistent (localStorage = durabil) */
    function getVisitorId() {
        let vid = localStorage.getItem(VISITOR_KEY);
        if (!vid) {
            vid = 'vis_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
            localStorage.setItem(VISITOR_KEY, vid);
        }
        return vid;
    }

    /** Data curentă ca string YYYY-MM-DD */
    function today() {
        return new Date().toISOString().slice(0, 10);
    }

    // ─── Inițializare structură date ──────────────────────

    function initData() {
        const data = readData();

        if (!data.meta) {
            data.meta = {
                created:      new Date().toISOString(),
                visitorId:    getVisitorId(),
                version:      '1.0',
            };
        }

        if (!data.sessions)        data.sessions = [];
        if (!data.pageTime)        data.pageTime = {};        // { pagina: secunde_total }
        if (!data.pageViews)       data.pageViews = {};       // { pagina: numar_vizite }
        if (!data.ctaClicks)       data.ctaClicks = { phone: 0, email: 0, calculator: 0 };
        if (!data.calculator)      data.calculator = { uses: 0, volumes: [] };
        if (!data.dailyVisits)     data.dailyVisits = {};     // { YYYY-MM-DD: nr }
        if (!data.performance)     data.performance = { loadTimes: [] };

        writeData(data);
        return data;
    }

    // ─── Tracking Sesiune ─────────────────────────────────

    function startSession() {
        const session = readSession();
        if (session.active) return; // sesiunea deja pornită

        const data = readData();
        const sessionId = 'ses_' + Date.now();

        // Înregistrează sesiunea nouă
        const newSession = {
            id:        sessionId,
            start:     new Date().toISOString(),
            end:       null,
            pages:     [],
            isBounce:  true, // până nu vizitează a 2-a pagină
            referrer:  document.referrer || 'direct',
            device:    getDeviceType(),
        };

        data.sessions.push(newSession);

        // Vizite zilnice
        const d = today();
        data.dailyVisits[d] = (data.dailyVisits[d] || 0) + 1;

        writeData(data);
        writeSession({ active: true, id: sessionId, currentPage: null, pageStart: null });

        // Salvează end sesiune când utilizatorul pleacă
        window.addEventListener('beforeunload', endSession);
    }

    function endSession() {
        const session = readSession();
        if (!session.active || !session.id) return;

        const data = readData();
        const idx  = data.sessions.findIndex(s => s.id === session.id);
        if (idx !== -1) {
            data.sessions[idx].end = new Date().toISOString();
            // Salvăm și timpul ultimei pagini
            if (session.currentPage && session.pageStart) {
                const elapsed = Math.floor((Date.now() - session.pageStart) / 1000);
                data.pageTime[session.currentPage] = (data.pageTime[session.currentPage] || 0) + elapsed;
            }
        }
        writeData(data);
    }

    // ─── Tracking Pagini ──────────────────────────────────

    function trackPageView(pageName) {
        const data    = readData();
        const session = readSession();

        // Salvăm timpul pe pagina anterioară
        if (session.currentPage && session.pageStart) {
            const elapsed = Math.floor((Date.now() - session.pageStart) / 1000);
            data.pageTime[session.currentPage] = (data.pageTime[session.currentPage] || 0) + elapsed;
        }

        // Actualizăm pageViews
        data.pageViews[pageName] = (data.pageViews[pageName] || 0) + 1;

        // Marcăm că nu mai este bounce dacă a navigat
        if (session.currentPage && session.currentPage !== pageName) {
            const sesIdx = data.sessions.findIndex(s => s.id === session.id);
            if (sesIdx !== -1) {
                data.sessions[sesIdx].isBounce = false;
                if (!data.sessions[sesIdx].pages.includes(pageName)) {
                    data.sessions[sesIdx].pages.push(pageName);
                }
            }
        } else if (!session.currentPage) {
            // Prima pagină a sesiunii
            const sesIdx = data.sessions.findIndex(s => s.id === session.id);
            if (sesIdx !== -1 && !data.sessions[sesIdx].pages.includes(pageName)) {
                data.sessions[sesIdx].pages.push(pageName);
            }
        }

        writeData(data);
        writeSession({
            ...session,
            currentPage: pageName,
            pageStart:   Date.now(),
        });
    }

    // ─── Tracking CTA ─────────────────────────────────────

    function trackCTA(type) {
        // type: 'phone' | 'email' | 'calculator'
        const data = readData();
        if (data.ctaClicks[type] !== undefined) {
            data.ctaClicks[type]++;
        }
        writeData(data);
    }

    // ─── Tracking Calculator ──────────────────────────────

    function trackCalculator(volumeM3) {
        const data = readData();
        data.calculator.uses++;
        if (volumeM3 > 0) {
            data.calculator.volumes.push({
                vol:  parseFloat(volumeM3.toFixed(2)),
                time: new Date().toISOString(),
            });
            // Păstrăm max 200 înregistrări
            if (data.calculator.volumes.length > 200) {
                data.calculator.volumes = data.calculator.volumes.slice(-200);
            }
        }
        writeData(data);
    }

    // ─── Tracking Performance ─────────────────────────────

    function trackPerformance() {
        window.addEventListener('load', function () {
            setTimeout(function () {
                try {
                    const nav   = performance.getEntriesByType('navigation')[0];
                    const paint = performance.getEntriesByType('paint');

                    if (!nav) return;

                    const data = readData();
                    const entry = {
                        date:          new Date().toISOString(),
                        domLoad:       Math.round(nav.domContentLoadedEventEnd - nav.startTime),
                        fullLoad:      Math.round(nav.loadEventEnd - nav.startTime),
                        ttfb:          Math.round(nav.responseStart - nav.requestStart),
                        fcp:           paint.find(p => p.name === 'first-contentful-paint')
                                            ? Math.round(paint.find(p => p.name === 'first-contentful-paint').startTime)
                                            : null,
                        connection:    navigator.connection ? navigator.connection.effectiveType : 'unknown',
                    };

                    data.performance.loadTimes.push(entry);
                    // Păstrăm max 50 de măsurători
                    if (data.performance.loadTimes.length > 50) {
                        data.performance.loadTimes = data.performance.loadTimes.slice(-50);
                    }
                    writeData(data);
                } catch (_) {}
            }, 0);
        });
    }

    /** Tip de dispozitiv simplu */
    function getDeviceType() {
        const ua = navigator.userAgent;
        if (/Mobi|Android|iPhone|iPad/i.test(ua)) return 'mobile';
        if (/Tablet|iPad/i.test(ua)) return 'tablet';
        return 'desktop';
    }

    // ─── Statistici Agregate ──────────────────────────────

    function getStats() {
        const data = readData();
        const sessions  = data.sessions || [];
        const pageViews = data.pageViews || {};
        const pageTime  = data.pageTime  || {};

        const totalSessions    = sessions.length;
        const bouncedSessions  = sessions.filter(s => s.isBounce).length;
        const bounceRate       = totalSessions > 0
            ? Math.round((bouncedSessions / totalSessions) * 100)
            : 0;

        const avgLoadTime = (() => {
            const times = (data.performance.loadTimes || []).map(t => t.fullLoad).filter(Boolean);
            if (!times.length) return null;
            return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        })();

        const totalPageViews = Object.values(pageViews).reduce((a, b) => a + b, 0);

        const avgVolume = (() => {
            const vols = (data.calculator.volumes || []).map(v => v.vol);
            if (!vols.length) return 0;
            return parseFloat((vols.reduce((a, b) => a + b, 0) / vols.length).toFixed(2));
        })();

        // Timp mediu per pagina (secunde)
        const avgPageTime = {};
        Object.entries(pageTime).forEach(([page, sec]) => {
            const views = pageViews[page] || 1;
            avgPageTime[page] = Math.round(sec / views);
        });

        return {
            totalSessions,
            bounceRate,
            totalPageViews,
            pageViews,
            pageTime,
            avgPageTime,
            ctaClicks:       data.ctaClicks,
            calculatorUses:  data.calculator.uses,
            avgVolumeM3:     avgVolume,
            avgLoadTimeMs:   avgLoadTime,
            dailyVisits:     data.dailyVisits,
            deviceBreakdown: getDeviceBreakdown(sessions),
            topPage:         Object.entries(pageViews).sort((a, b) => b[1] - a[1])[0]?.[0] || 'acasa',
        };
    }

    function getDeviceBreakdown(sessions) {
        const breakdown = { mobile: 0, tablet: 0, desktop: 0 };
        sessions.forEach(s => {
            if (s.device && breakdown[s.device] !== undefined) breakdown[s.device]++;
        });
        return breakdown;
    }

    // ─── Injectare Listeners Auto pe CTA-uri ─────────────

    function attachCTAListeners() {
        document.addEventListener('click', function (e) {
            const el = e.target.closest('a');
            if (!el) return;

            const href = el.getAttribute('href') || '';
            if (href.startsWith('tel:'))    trackCTA('phone');
            if (href.startsWith('mailto:')) trackCTA('email');
        });
    }

    // ─── Inițializare ─────────────────────────────────────

    initData();
    startSession();
    trackPerformance();

    // Prima pagină vine din hash sau default acasa
    const initialPage = window.location.hash.replace('#', '') || 'acasa';
    trackPageView(initialPage);

    // Ascultă schimbările de hash (setate de router)
    window.addEventListener('hashchange', function () {
        const page = window.location.hash.replace('#', '') || 'acasa';
        trackPageView(page);
    });

    attachCTAListeners();

    // ─── API Public ───────────────────────────────────────
    window.UBC_Analytics = {
        trackPage:       trackPageView,
        trackCTA:        trackCTA,
        trackCalculator: trackCalculator,
        getStats:        getStats,
        getRawData:      readData,

        /** Exportă toate datele ca JSON descărcabil */
        export: function () {
            const raw  = readData();
            const data = JSON.stringify({ stats: getStats(), raw }, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = 'ubc_analytics_' + new Date().toISOString().slice(0, 10) + '.json';
            a.click();
            URL.revokeObjectURL(url);
        },

        /** Șterge toate datele analytics */
        clear: function () {
            localStorage.removeItem(STORAGE_KEY);
            sessionStorage.removeItem(SESSION_KEY);
            initData();
        },
    };

    console.log('%c[UBC Analytics] ✅ Activ', 'color:#2ECC71; font-weight:bold;');

})();
