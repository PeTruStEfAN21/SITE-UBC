/**
 * public/js/error-tracker.js
 * ══════════════════════════════════════════════════════════
 * Modul de monitoring erori UBC
 *   - Captează orice eroare JS necaptată (window.onerror)
 *   - Captează Promise-uri respinse fără handler (unhandledrejection)
 *   - Stochează în localStorage cu metadata completă
 *   - Exportă API global: window.UBC_Errors
 * ══════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ─── Constante ────────────────────────────────────────
    const STORAGE_KEY = 'ubc_error_log';
    const MAX_ERRORS   = 100; // limită maximă de erori stocate

    // ─── Helpers ──────────────────────────────────────────

    /** Citește log-ul curent din localStorage */
    function readLog() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (_) {
            return [];
        }
    }

    /** Scrie log-ul în localStorage */
    function writeLog(log) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
        } catch (_) {
            // localStorage plin sau indisponibil
        }
    }

    /** Adaugă o intrare nouă în log */
    function pushError(entry) {
        const log = readLog();
        log.unshift(entry); // cele mai recente primele
        if (log.length > MAX_ERRORS) log.length = MAX_ERRORS;
        writeLog(log);
    }

    /** Construiește obiectul de eroare standard */
    function buildEntry(type, message, source, lineno, colno, stack) {
        return {
            id:        Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            type:      type,       // 'js_error' | 'promise_rejection' | 'manual'
            severity:  detectSeverity(message),
            message:   String(message || 'Eroare necunoscută'),
            source:    source   || window.location.href,
            line:      lineno   || null,
            col:       colno    || null,
            stack:     stack    || null,
            page:      window.location.hash || '#acasa',
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            session:   getSessionId(),
        };
    }

    /** Detectează severitatea erorii pe baza mesajului */
    function detectSeverity(message) {
        const msg = String(message || '').toLowerCase();
        if (msg.includes('syntaxerror') || msg.includes('typeerror') || msg.includes('referenceerror')) {
            return 'critical';
        }
        if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed')) {
            return 'warning';
        }
        return 'info';
    }

    /** Returnează sau creează un ID de sesiune persistent */
    function getSessionId() {
        let sid = sessionStorage.getItem('ubc_session_id');
        if (!sid) {
            sid = 'ses_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
            sessionStorage.setItem('ubc_session_id', sid);
        }
        return sid;
    }

    // ─── Interceptori globali ─────────────────────────────

    /** Captează erori JS sincrone necaptate */
    window.onerror = function (message, source, lineno, colno, error) {
        const stack = error && error.stack ? error.stack : null;
        pushError(buildEntry('js_error', message, source, lineno, colno, stack));
        return false; // nu suprima comportamentul default al browserului
    };

    /** Captează Promise-uri respinse fără .catch() */
    window.addEventListener('unhandledrejection', function (event) {
        const reason  = event.reason;
        const message = reason instanceof Error ? reason.message : String(reason);
        const stack   = reason instanceof Error ? reason.stack   : null;
        pushError(buildEntry('promise_rejection', message, null, null, null, stack));
    });

    // ─── API Public ───────────────────────────────────────
    window.UBC_Errors = {

        /** Înregistrează manual o eroare (utilă din cod de business logic) */
        log: function (message, context) {
            const entry = buildEntry('manual', message, context || null, null, null, null);
            entry.severity = 'warning';
            pushError(entry);
        },

        /** Returnează toate erorile stocate */
        getAll: function () {
            return readLog();
        },

        /** Returnează numărul de erori */
        count: function () {
            return readLog().length;
        },

        /** Șterge tot log-ul */
        clear: function () {
            localStorage.removeItem(STORAGE_KEY);
        },

        /** Exportă log-ul ca JSON descărcabil */
        export: function () {
            const data = JSON.stringify(readLog(), null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = 'ubc_errors_' + new Date().toISOString().slice(0,10) + '.json';
            a.click();
            URL.revokeObjectURL(url);
        },

        /** Returnează erorile grupate pe severitate */
        bySeverity: function () {
            const log = readLog();
            return {
                critical: log.filter(e => e.severity === 'critical'),
                warning:  log.filter(e => e.severity === 'warning'),
                info:     log.filter(e => e.severity === 'info'),
            };
        },
    };

    console.log('%c[UBC Error Tracker] ✅ Activ', 'color:#2ECC71; font-weight:bold;');

})();
