/**
 * public/js/analytics.js
 * ══════════════════════════════════════════════════════════
 * Modul Telemetrie & Analytics UBC — Transmitere în timp real către Server
 *   - Înregistrează vizitatori reali pe server (IP, Locație Județ România, Dispozitiv)
 *   - Monitorizează paginile vizitate și secțiunile accesate cel mai des
 *   - Monitorizează click-urile pebutoane (Telefon, Email, Calculator, Tab-uri, Lightbox)
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

    function sendServerTelemetry(payload) {
        try {
            fetch('/api/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                keepalive: true
            }).catch(function () {});
        } catch (_) {}
    }

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

    function getVisitorId() {
        let vid = localStorage.getItem(VISITOR_KEY);
        if (!vid) {
            vid = 'vis_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
            localStorage.setItem(VISITOR_KEY, vid);
        }
        return vid;
    }

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
                version:      '2.0',
            };
        }

        if (!data.sessions)        data.sessions = [];
        if (!data.pageTime)        data.pageTime = {};
        if (!data.pageViews)       data.pageViews = {};
        if (!data.ctaClicks)       data.ctaClicks = { phone: 0, email: 0, calculator: 0 };
        if (!data.calculator)      data.calculator = { uses: 0, volumes: [] };
        if (!data.dailyVisits)     data.dailyVisits = {};
        if (!data.performance)     data.performance = { loadTimes: [] };

        writeData(data);
        return data;
    }

    // ─── Tracking Sesiune ─────────────────────────────────

    function startSession() {
        const session = readSession();
        if (session.active) return;

        const data = readData();
        const sessionId = 'ses_' + Date.now();

        const newSession = {
            id:        sessionId,
            start:     new Date().toISOString(),
            end:       null,
            pages:     [],
            isBounce:  true,
            referrer:  document.referrer || 'direct',
            device:    getDeviceType(),
        };

        data.sessions.push(newSession);

        const d = today();
        data.dailyVisits[d] = (data.dailyVisits[d] || 0) + 1;

        writeData(data);
        writeSession({ active: true, id: sessionId, currentPage: null, pageStart: null });

        window.addEventListener('beforeunload', endSession);
    }

    function endSession() {
        const session = readSession();
        if (!session.active || !session.id) return;

        const data = readData();
        const idx  = data.sessions.findIndex(s => s.id === session.id);
        if (idx !== -1) {
            data.sessions[idx].end = new Date().toISOString();
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

        if (session.currentPage && session.pageStart) {
            const elapsed = Math.floor((Date.now() - session.pageStart) / 1000);
            data.pageTime[session.currentPage] = (data.pageTime[session.currentPage] || 0) + elapsed;
        }

        const friendlyName = mapPageName(pageName);
        data.pageViews[friendlyName] = (data.pageViews[friendlyName] || 0) + 1;

        if (session.currentPage && session.currentPage !== friendlyName) {
            const sesIdx = data.sessions.findIndex(s => s.id === session.id);
            if (sesIdx !== -1) {
                data.sessions[sesIdx].isBounce = false;
                if (!data.sessions[sesIdx].pages.includes(friendlyName)) {
                    data.sessions[sesIdx].pages.push(friendlyName);
                }
            }
        } else if (!session.currentPage) {
            const sesIdx = data.sessions.findIndex(s => s.id === session.id);
            if (sesIdx !== -1 && !data.sessions[sesIdx].pages.includes(friendlyName)) {
                data.sessions[sesIdx].pages.push(friendlyName);
            }
        }

        writeData(data);
        writeSession({
            ...session,
            currentPage: friendlyName,
            pageStart:   Date.now(),
        });

        // Trimite în timp real către server
        sendServerTelemetry({
            eventType: 'pageview',
            name: friendlyName
        });
    }

    function mapPageName(name) {
        const clean = (name || '').replace('#', '').trim().toLowerCase();
        if (clean === '' || clean === 'acasa') return 'Pagină: Acasă';
        if (clean === 'despre') return 'Pagină: Despre Noi';
        if (clean === 'utilaje') return 'Pagină: Flotă & Utilaje';
        if (clean === 'portofoliu') return 'Pagină: Portofoliu Proiecte';
        if (clean === 'galerie') return 'Pagină: Galerie Foto & Parteneri';
        if (clean === 'contact') return 'Pagină: Contact Dispecerat';
        return 'Pagină: ' + clean;
    }

    // ─── Tracking CTA & Click-uri ─────────────────────────

    function trackCTA(type, customName) {
        const data = readData();
        if (data.ctaClicks[type] !== undefined) {
            data.ctaClicks[type]++;
        }
        writeData(data);

        const actionLabel = customName || (
            type === 'phone' ? 'Click Telefon / Dispecerat' :
            type === 'email' ? 'Click Trimite Email' :
            type === 'calculator' ? 'Apăsat Calculator Beton' : 'Click ' + type
        );

        sendServerTelemetry({
            eventType: 'click',
            name: actionLabel
        });
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
            if (data.calculator.volumes.length > 200) {
                data.calculator.volumes = data.calculator.volumes.slice(-200);
            }
        }
        writeData(data);

        sendServerTelemetry({
            eventType: 'calculator',
            name: 'Calculat Volum Beton (' + volumeM3 + ' m³)',
            volume: volumeM3
        });
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
                        date:       new Date().toISOString(),
                        domLoad:    Math.round(nav.domContentLoadedEventEnd - nav.startTime),
                        fullLoad:   Math.round(nav.loadEventEnd - nav.startTime),
                        ttfb:       Math.round(nav.responseStart - nav.requestStart),
                        fcp:        paint.find(p => p.name === 'first-contentful-paint')
                                        ? Math.round(paint.find(p => p.name === 'first-contentful-paint').startTime)
                                        : null,
                        connection: navigator.connection ? navigator.connection.effectiveType : 'unknown',
                    };

                    data.performance.loadTimes.push(entry);
                    if (data.performance.loadTimes.length > 50) {
                        data.performance.loadTimes = data.performance.loadTimes.slice(-50);
                    }
                    writeData(data);
                } catch (_) {}
            }, 0);
        });
    }

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
            topPage:         Object.entries(pageViews).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Acasă',
        };
    }

    function getDeviceBreakdown(sessions) {
        const breakdown = { mobile: 0, tablet: 0, desktop: 0 };
        sessions.forEach(s => {
            if (s.device && breakdown[s.device] !== undefined) breakdown[s.device]++;
        });
        return breakdown;
    }

    // ─── Injectare Listeners Auto pe Butoane & Elemente ──

    function attachClickListeners() {
        document.addEventListener('click', function (e) {
            const btn = e.target.closest('a, button, .tab-btn, .pf-item, .gl-item, #theme-toggle-btn');
            if (!btn) return;

            const href = btn.getAttribute('href') || '';
            const text = (btn.textContent || btn.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 35);

            if (href.startsWith('tel:')) {
                trackCTA('phone', 'Click Telefon (' + href.replace('tel:', '') + ')');
            } else if (href.startsWith('mailto:')) {
                trackCTA('email', 'Click Email (' + href.replace('mailto:', '') + ')');
            } else if (btn.classList.contains('tab-btn')) {
                trackCTA('tab', 'Selectat Clasă Beton: ' + text);
            } else if (btn.id === 'theme-toggle-btn') {
                trackCTA('theme', 'Comutat Temă Light/Dark');
            } else if (btn.classList.contains('pf-item') || btn.classList.contains('gl-item')) {
                trackCTA('lightbox', 'Deschis Poză Portofoliu');
            } else if (text && text.length > 2) {
                trackCTA('custom', 'Click Buton: ' + text);
            }
        });
    }

    // ─── Inițializare ─────────────────────────────────────

    initData();
    startSession();
    trackPerformance();

    const initialPage = window.location.hash.replace('#', '') || 'acasa';
    trackPageView(initialPage);

    window.addEventListener('hashchange', function () {
        const page = window.location.hash.replace('#', '') || 'acasa';
        trackPageView(page);
    });

    attachClickListeners();

    // ─── API Public ───────────────────────────────────────
    window.UBC_Analytics = {
        trackPage:       trackPageView,
        trackCTA:        trackCTA,
        trackCalculator: trackCalculator,
        getStats:        getStats,
        getRawData:      readData,

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

        clear: function () {
            localStorage.removeItem(STORAGE_KEY);
            sessionStorage.removeItem(SESSION_KEY);
            initData();
        },
    };

    console.log('%c[UBC Analytics Server Telemetry] ✅ Activ pe Backend & Frontend', 'color:#2ECC71; font-weight:bold;');

})();
