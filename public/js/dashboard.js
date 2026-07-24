/**
 * public/js/dashboard.js
 * ══════════════════════════════════════════════════════════
 * Dashboard Admin UBC — Panou de control ascuns
 *   - Activat cu Ctrl+Shift+D
 *   - Protejat cu parolă (sesiune)
 *   - Afișează analytics, erori, performanță
 *   - Export JSON, reset date
 * ══════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ─── Configurare ──────────────────────────────────────
    const AUTH_SESSION_KEY = 'ubc_admin_auth';

    // ─── Stare internă ────────────────────────────────────
    let dashboardEl   = null;
    let isOpen        = false;
    let refreshTimer  = null;

    // ─── Autentificare ────────────────────────────────────

    function isAuthenticated() {
        return sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';
    }

    async function authenticate(password) {
        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
                    return true;
                }
            }
        } catch (e) {
            console.error('Eroare autentificare server:', e);
        }
        return false;
    }

    function logout() {
        sessionStorage.removeItem(AUTH_SESSION_KEY);
        closeDashboard();
    }

    // ─── Deschide / Închide ───────────────────────────────

    function toggleDashboard() {
        if (isOpen) {
            closeDashboard();
        } else {
            openDashboard();
        }
    }

    function openDashboard() {
        if (!isAuthenticated()) {
            showLoginModal();
            return;
        }
        renderDashboard();
        isOpen = true;
    }

    function closeDashboard() {
        if (dashboardEl) {
            dashboardEl.classList.add('ubc-dash--closing');
            setTimeout(() => {
                dashboardEl.remove();
                dashboardEl = null;
            }, 300);
        }
        clearInterval(refreshTimer);
        isOpen = false;
    }

    // ─── Modal de Login ───────────────────────────────────

    function showLoginModal() {
        const existing = document.getElementById('ubc-login-modal');
        if (existing) { existing.remove(); }

        const modal = document.createElement('div');
        modal.id = 'ubc-login-modal';
        modal.innerHTML = `
            <div class="ubc-login-backdrop" id="ubc-login-backdrop">
                <div class="ubc-login-box" role="dialog" aria-modal="true" aria-labelledby="ubc-login-title">
                    <div class="ubc-login-logo">
                        <span class="ubc-login-icon">🔐</span>
                        <h2 id="ubc-login-title">Admin <span>UBC</span></h2>
                        <p>Panou de control privat</p>
                    </div>
                    <div class="ubc-login-form">
                        <label for="ubc-pass-input">Parolă de acces</label>
                        <div class="ubc-pass-wrapper">
                            <input
                                type="password"
                                id="ubc-pass-input"
                                placeholder="Introdu parola..."
                                autocomplete="current-password"
                                autofocus
                            >
                            <button class="ubc-pass-toggle" id="ubc-pass-toggle" type="button" aria-label="Arată parola">👁</button>
                        </div>
                        <div class="ubc-login-error" id="ubc-login-error" style="display:none;">
                            ❌ Parolă incorectă. Încearcă din nou.
                        </div>
                        <button class="ubc-login-btn" id="ubc-login-btn">Intră în Dashboard →</button>
                    </div>
                    <button class="ubc-login-close" id="ubc-login-close" aria-label="Închide">✕</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        injectLoginStyles();

        const input  = document.getElementById('ubc-pass-input');
        const btn    = document.getElementById('ubc-login-btn');
        const errEl  = document.getElementById('ubc-login-error');
        const toggle = document.getElementById('ubc-pass-toggle');
        const close  = document.getElementById('ubc-login-close');
        const bkdrop = document.getElementById('ubc-login-backdrop');

        async function attemptLogin() {
            const val = input.value.trim();
            if (!val) return;
            btn.disabled = true;
            btn.textContent = 'Se verifică...';
            const ok = await authenticate(val);
            btn.disabled = false;
            btn.textContent = 'Intră în Dashboard →';

            if (ok) {
                modal.remove();
                renderDashboard();
                isOpen = true;
            } else {
                errEl.style.display = 'block';
                input.value = '';
                input.classList.add('shake');
                setTimeout(() => input.classList.remove('shake'), 500);
                input.focus();
            }
        }

        btn.addEventListener('click', attemptLogin);
        input.addEventListener('keydown', e => { if (e.key === 'Enter') attemptLogin(); });
        toggle.addEventListener('click', () => {
            input.type = input.type === 'password' ? 'text' : 'password';
        });
        close.addEventListener('click', () => modal.remove());
        bkdrop.addEventListener('click', e => { if (e.target === bkdrop) modal.remove(); });

        setTimeout(() => input.focus(), 100);
    }

    // ─── Render Dashboard ─────────────────────────────────

    function renderDashboard() {
        if (dashboardEl) dashboardEl.remove();

        dashboardEl = document.createElement('div');
        dashboardEl.id = 'ubc-dashboard';
        dashboardEl.setAttribute('role', 'dialog');
        dashboardEl.setAttribute('aria-label', 'Dashboard Admin UBC');

        dashboardEl.innerHTML = buildDashboardHTML();
        document.body.appendChild(dashboardEl);
        injectDashboardStyles();
        bindDashboardEvents();

        // Auto-refresh la fiecare 30 secunde
        clearInterval(refreshTimer);
        refreshTimer = setInterval(refreshDashboardData, 30000);
    }

    function buildDashboardHTML() {
        const stats  = window.UBC_Analytics ? window.UBC_Analytics.getStats()  : null;
        const errors = window.UBC_Errors    ? window.UBC_Errors.bySeverity()    : null;
        const session = getSessionUptime();

        return `
        <div class="ubc-dash-panel">

            <!-- Header -->
            <div class="ubc-dash-header">
                <div class="ubc-dash-title">
                    <span class="ubc-dash-logo">⚙️</span>
                    <div>
                        <h2>Dashboard Admin <span>UBC</span></h2>
                        <small>Ultima actualizare: ${new Date().toLocaleTimeString('ro-RO')}</small>
                    </div>
                </div>
                <div class="ubc-dash-header-actions">
                    <span class="ubc-dash-uptime">⏱ Sesiune: ${session}</span>
                    <button class="ubc-dash-btn ubc-dash-btn--outline" id="ubc-dash-refresh">↻ Refresh</button>
                    <button class="ubc-dash-btn ubc-dash-btn--danger"  id="ubc-dash-logout">🔓 Ieși</button>
                    <button class="ubc-dash-close" id="ubc-dash-close" aria-label="Închide">✕</button>
                </div>
            </div>

            <!-- KPI Cards -->
            ${stats ? buildKPICards(stats) : '<p class="ubc-dash-no-data">Analytics nedisponibil.</p>'}

            <!-- Tabs -->
            <div class="ubc-dash-tabs">
                <button class="ubc-dash-tab active" data-dash-tab="analytics">📊 Analytics</button>
                <button class="ubc-dash-tab" data-dash-tab="errors">🚨 Erori (${errors ? (errors.critical.length + errors.warning.length + errors.info.length) : 0})</button>
                <button class="ubc-dash-tab" data-dash-tab="performance">⚡ Performanță</button>
                <button class="ubc-dash-tab" data-dash-tab="tools">🛠 Instrumente</button>
            </div>

            <!-- Tab Content -->
            <div class="ubc-dash-content">

                <!-- Tab: Analytics -->
                <div class="ubc-dash-tab-panel active" id="ubc-dash-tab-analytics">
                    ${stats ? buildAnalyticsTab(stats) : '<p class="ubc-dash-no-data">Nicio sesiune înregistrată.</p>'}
                </div>

                <!-- Tab: Erori -->
                <div class="ubc-dash-tab-panel" id="ubc-dash-tab-errors">
                    ${errors ? buildErrorsTab(errors) : '<p class="ubc-dash-no-data">Error tracker nedisponibil.</p>'}
                </div>

                <!-- Tab: Performanță -->
                <div class="ubc-dash-tab-panel" id="ubc-dash-tab-performance">
                    ${stats ? buildPerformanceTab(stats) : '<p class="ubc-dash-no-data">Nicio măsurătoare disponibilă.</p>'}
                </div>

                <!-- Tab: Instrumente -->
                <div class="ubc-dash-tab-panel" id="ubc-dash-tab-tools">
                    ${buildToolsTab()}
                </div>

            </div>
        </div>
        `;
    }

    // ─── Build Sections ───────────────────────────────────

    function buildKPICards(stats) {
        return `
        <div class="ubc-kpi-grid">
            <div class="ubc-kpi-card">
                <span class="ubc-kpi-icon">👥</span>
                <div class="ubc-kpi-value">${stats.totalSessions}</div>
                <div class="ubc-kpi-label">Sesiuni totale</div>
            </div>
            <div class="ubc-kpi-card">
                <span class="ubc-kpi-icon">📄</span>
                <div class="ubc-kpi-value">${stats.totalPageViews}</div>
                <div class="ubc-kpi-label">Vizualizări pagini</div>
            </div>
            <div class="ubc-kpi-card ${stats.bounceRate > 70 ? 'ubc-kpi-card--warn' : ''}">
                <span class="ubc-kpi-icon">↩️</span>
                <div class="ubc-kpi-value">${stats.bounceRate}%</div>
                <div class="ubc-kpi-label">Bounce rate</div>
            </div>
            <div class="ubc-kpi-card">
                <span class="ubc-kpi-icon">🧮</span>
                <div class="ubc-kpi-value">${stats.calculatorUses}</div>
                <div class="ubc-kpi-label">Calc. utilizat</div>
            </div>
            <div class="ubc-kpi-card">
                <span class="ubc-kpi-icon">📞</span>
                <div class="ubc-kpi-value">${stats.ctaClicks.phone}</div>
                <div class="ubc-kpi-label">Click-uri telefon</div>
            </div>
            <div class="ubc-kpi-card">
                <span class="ubc-kpi-icon">📦</span>
                <div class="ubc-kpi-value">${stats.avgVolumeM3} m³</div>
                <div class="ubc-kpi-label">Volum mediu calc.</div>
            </div>
        </div>`;
    }

    function buildAnalyticsTab(stats) {
        // Grafic bare pentru pagini vizitate
        const pages = Object.entries(stats.pageViews || {}).sort((a, b) => b[1] - a[1]);
        const maxPV = pages.length ? Math.max(...pages.map(p => p[1])) : 1;

        const pageRows = pages.map(([page, count]) => `
            <div class="ubc-bar-row">
                <span class="ubc-bar-label">${page}</span>
                <div class="ubc-bar-track">
                    <div class="ubc-bar-fill" style="width:${Math.round((count / maxPV) * 100)}%"></div>
                </div>
                <span class="ubc-bar-count">${count}</span>
            </div>
        `).join('') || '<p class="ubc-dash-no-data">Nicio pagină vizitată.</p>';

        // Timp mediu pe pagini
        const timeRows = Object.entries(stats.avgPageTime || {}).map(([page, sec]) => `
            <div class="ubc-stat-row">
                <span>${page}</span>
                <span class="ubc-stat-val">${formatSeconds(sec)}</span>
            </div>
        `).join('') || '<p class="ubc-dash-no-data">—</p>';

        // Vizite zilnice (ultimele 7 zile)
        const dailyEntries = Object.entries(stats.dailyVisits || {})
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-7);
        const maxDaily = dailyEntries.length ? Math.max(...dailyEntries.map(d => d[1])) : 1;
        const dailyRows = dailyEntries.map(([date, count]) => `
            <div class="ubc-bar-row">
                <span class="ubc-bar-label">${date.slice(5)}</span>
                <div class="ubc-bar-track">
                    <div class="ubc-bar-fill ubc-bar-fill--blue" style="width:${Math.round((count / maxDaily) * 100)}%"></div>
                </div>
                <span class="ubc-bar-count">${count}</span>
            </div>
        `).join('') || '<p class="ubc-dash-no-data">Nicio vizită înregistrată.</p>';

        // Dispozitive
        const dev = stats.deviceBreakdown || {};
        const totalDev = (dev.desktop||0) + (dev.mobile||0) + (dev.tablet||0) || 1;

        return `
        <div class="ubc-dash-grid-2">
            <div class="ubc-dash-card">
                <h3>📄 Pagini vizitate</h3>
                <div class="ubc-bar-chart">${pageRows}</div>
            </div>
            <div class="ubc-dash-card">
                <h3>📅 Vizite zilnice (7 zile)</h3>
                <div class="ubc-bar-chart">${dailyRows}</div>
            </div>
        </div>
        <div class="ubc-dash-grid-2">
            <div class="ubc-dash-card">
                <h3>⏱ Timp mediu / pagină</h3>
                <div class="ubc-stat-list">${timeRows}</div>
            </div>
            <div class="ubc-dash-card">
                <h3>📱 Dispozitive</h3>
                <div class="ubc-stat-list">
                    <div class="ubc-stat-row"><span>💻 Desktop</span><span class="ubc-stat-val">${dev.desktop||0} (${Math.round(((dev.desktop||0)/totalDev)*100)}%)</span></div>
                    <div class="ubc-stat-row"><span>📱 Mobile</span><span class="ubc-stat-val">${dev.mobile||0} (${Math.round(((dev.mobile||0)/totalDev)*100)}%)</span></div>
                    <div class="ubc-stat-row"><span>📟 Tablet</span><span class="ubc-stat-val">${dev.tablet||0} (${Math.round(((dev.tablet||0)/totalDev)*100)}%)</span></div>
                </div>
                <h3 style="margin-top:16px;">🧮 Calculator Beton</h3>
                <div class="ubc-stat-list">
                    <div class="ubc-stat-row"><span>Utilizări totale</span><span class="ubc-stat-val">${stats.calculatorUses}</span></div>
                    <div class="ubc-stat-row"><span>Volum mediu calculat</span><span class="ubc-stat-val">${stats.avgVolumeM3} m³</span></div>
                    <div class="ubc-stat-row"><span>Click-uri tel.</span><span class="ubc-stat-val">${stats.ctaClicks.phone}</span></div>
                    <div class="ubc-stat-row"><span>Click-uri email</span><span class="ubc-stat-val">${stats.ctaClicks.email}</span></div>
                </div>
            </div>
        </div>`;
    }

    function buildErrorsTab(errors) {
        function renderErrorList(list, label, color) {
            if (!list.length) return `<p class="ubc-dash-no-data">✅ Nicio eroare de tip ${label}.</p>`;
            return list.slice(0, 20).map(e => `
                <div class="ubc-error-item ubc-error-item--${e.severity}">
                    <div class="ubc-error-header">
                        <span class="ubc-error-badge" style="background:${color}">${e.severity.toUpperCase()}</span>
                        <span class="ubc-error-type">${e.type}</span>
                        <span class="ubc-error-time">${new Date(e.timestamp).toLocaleString('ro-RO')}</span>
                    </div>
                    <div class="ubc-error-msg">${escapeHtml(e.message)}</div>
                    ${e.source ? `<div class="ubc-error-source">📍 ${escapeHtml(e.source)}${e.line ? ':' + e.line : ''}</div>` : ''}
                    ${e.stack ? `<details><summary>Stack trace</summary><pre class="ubc-error-stack">${escapeHtml(e.stack.slice(0, 500))}</pre></details>` : ''}
                </div>
            `).join('');
        }

        const all = [...errors.critical, ...errors.warning, ...errors.info]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (!all.length) {
            return `<div class="ubc-dash-no-data" style="padding:40px;text-align:center;">
                <div style="font-size:3rem;">✅</div>
                <p>Nicio eroare înregistrată. Site-ul funcționează perfect!</p>
            </div>`;
        }

        return `
        <div class="ubc-error-summary">
            <span class="ubc-error-badge" style="background:#e74c3c">${errors.critical.length} Critical</span>
            <span class="ubc-error-badge" style="background:#f39c12">${errors.warning.length} Warning</span>
            <span class="ubc-error-badge" style="background:#3498db">${errors.info.length} Info</span>
            <button class="ubc-dash-btn ubc-dash-btn--sm" id="ubc-clear-errors">🗑 Șterge tot</button>
            <button class="ubc-dash-btn ubc-dash-btn--sm" id="ubc-export-errors">⬇ Export JSON</button>
        </div>
        <div class="ubc-error-list">
            ${renderErrorList(all, 'toate', '#666')}
        </div>`;
    }

    function buildPerformanceTab(stats) {
        const raw  = window.UBC_Analytics ? window.UBC_Analytics.getRawData() : {};
        const times = (raw.performance && raw.performance.loadTimes) ? raw.performance.loadTimes.slice(-10).reverse() : [];

        const timeRows = times.map((t, i) => `
            <div class="ubc-stat-row">
                <span>${new Date(t.date).toLocaleString('ro-RO')}</span>
                <span class="ubc-stat-val ${t.fullLoad > 3000 ? 'ubc-val--warn' : 'ubc-val--ok'}">
                    ${t.fullLoad}ms
                </span>
            </div>
        `).join('') || '<p class="ubc-dash-no-data">Nicio măsurătoare.</p>';

        const avgLoad = stats.avgLoadTimeMs;

        return `
        <div class="ubc-dash-grid-2">
            <div class="ubc-dash-card">
                <h3>⚡ Timp mediu de încărcare</h3>
                <div class="ubc-perf-big ${avgLoad > 3000 ? 'ubc-perf-big--slow' : 'ubc-perf-big--fast'}">
                    ${avgLoad !== null ? avgLoad + ' ms' : 'N/A'}
                </div>
                <p class="ubc-dash-hint">
                    ${avgLoad === null ? 'Navighează pe site pentru a înregistra date.' :
                      avgLoad < 1500 ? '✅ Excelent! Sub 1.5 secunde.' :
                      avgLoad < 3000 ? '⚠️ Acceptabil. Poate fi optimizat.' :
                      '❌ Lent. Verifică resursele încărcate.'}
                </p>
            </div>
            <div class="ubc-dash-card">
                <h3>📋 Ultimele 10 măsurători</h3>
                <div class="ubc-stat-list">${timeRows}</div>
            </div>
        </div>`;
    }

    function buildToolsTab() {
        return `
        <div class="ubc-tools-grid">
            <div class="ubc-dash-card">
                <h3>⬇ Export Date</h3>
                <p class="ubc-dash-hint">Descarcă toate datele în format JSON pentru analiză offline.</p>
                <button class="ubc-dash-btn" id="ubc-export-analytics">📊 Export Analytics</button>
                <button class="ubc-dash-btn" id="ubc-export-errors-tools">🚨 Export Erori</button>
            </div>
            <div class="ubc-dash-card">
                <h3>🗑 Resetare Date</h3>
                <p class="ubc-dash-hint">Atenție: acțiunile de mai jos sunt ireversibile.</p>
                <button class="ubc-dash-btn ubc-dash-btn--danger" id="ubc-reset-analytics">Resetează Analytics</button>
                <button class="ubc-dash-btn ubc-dash-btn--danger" id="ubc-reset-errors">Resetează Erori</button>
            </div>
            <div class="ubc-dash-card">
                <h3>🔍 Info Sesiune</h3>
                <div class="ubc-stat-list">
                    <div class="ubc-stat-row"><span>User Agent</span><span class="ubc-stat-val" style="font-size:0.7rem;word-break:break-all;">${navigator.userAgent.slice(0,60)}...</span></div>
                    <div class="ubc-stat-row"><span>Limbă browser</span><span class="ubc-stat-val">${navigator.language}</span></div>
                    <div class="ubc-stat-row"><span>Rezoluție</span><span class="ubc-stat-val">${screen.width}×${screen.height}</span></div>
                    <div class="ubc-stat-row"><span>Online</span><span class="ubc-stat-val">${navigator.onLine ? '✅ Da' : '❌ Nu'}</span></div>
                    <div class="ubc-stat-row"><span>Cookies activate</span><span class="ubc-stat-val">${navigator.cookieEnabled ? '✅ Da' : '❌ Nu'}</span></div>
                </div>
            </div>
            <div class="ubc-dash-card">
                <h3>⌨️ Shortcuts</h3>
                <div class="ubc-stat-list">
                    <div class="ubc-stat-row"><span>Deschide / Închide dashboard</span><span class="ubc-stat-val"><kbd>Ctrl+Shift+D</kbd></span></div>
                    <div class="ubc-stat-row"><span>Logout admin</span><span class="ubc-stat-val">Buton "Ieși"</span></div>
                </div>
            </div>
        </div>`;
    }

    // ─── Event Listeners Dashboard ────────────────────────

    function bindDashboardEvents() {
        // Tabs
        document.querySelectorAll('[data-dash-tab]').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('[data-dash-tab]').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.ubc-dash-tab-panel').forEach(p => p.classList.remove('active'));
                this.classList.add('active');
                const panel = document.getElementById('ubc-dash-tab-' + this.dataset.dashTab);
                if (panel) panel.classList.add('active');
            });
        });

        // Close / Logout / Refresh
        document.getElementById('ubc-dash-close')?.addEventListener('click', closeDashboard);
        document.getElementById('ubc-dash-logout')?.addEventListener('click', logout);
        document.getElementById('ubc-dash-refresh')?.addEventListener('click', () => {
            closeDashboard();
            setTimeout(() => { openDashboard(); }, 350);
        });

        // Error actions
        document.getElementById('ubc-clear-errors')?.addEventListener('click', () => {
            if (confirm('Ești sigur că vrei să ștergi toate erorile?')) {
                window.UBC_Errors && window.UBC_Errors.clear();
                closeDashboard();
                setTimeout(() => openDashboard(), 350);
            }
        });
        document.getElementById('ubc-export-errors')?.addEventListener('click', () => {
            window.UBC_Errors && window.UBC_Errors.export();
        });

        // Tools actions
        document.getElementById('ubc-export-analytics')?.addEventListener('click', () => {
            window.UBC_Analytics && window.UBC_Analytics.export();
        });
        document.getElementById('ubc-export-errors-tools')?.addEventListener('click', () => {
            window.UBC_Errors && window.UBC_Errors.export();
        });
        document.getElementById('ubc-reset-analytics')?.addEventListener('click', () => {
            if (confirm('Resetezi TOATE datele analytics. Acțiunea este ireversibilă!')) {
                window.UBC_Analytics && window.UBC_Analytics.clear();
                closeDashboard();
                setTimeout(() => openDashboard(), 350);
            }
        });
        document.getElementById('ubc-reset-errors')?.addEventListener('click', () => {
            if (confirm('Resetezi TOATE erorile înregistrate. Acțiunea este ireversibilă!')) {
                window.UBC_Errors && window.UBC_Errors.clear();
                closeDashboard();
                setTimeout(() => openDashboard(), 350);
            }
        });

        // Închide cu Escape
        document.addEventListener('keydown', function escClose(e) {
            if (e.key === 'Escape' && isOpen) {
                closeDashboard();
                document.removeEventListener('keydown', escClose);
            }
        });
    }

    function refreshDashboardData() {
        if (!isOpen) return;
        closeDashboard();
        setTimeout(() => openDashboard(), 350);
    }

    // ─── Helpers ──────────────────────────────────────────

    function formatSeconds(sec) {
        if (sec < 60)  return sec + 's';
        if (sec < 3600) return Math.floor(sec / 60) + 'm ' + (sec % 60) + 's';
        return Math.floor(sec / 3600) + 'h ' + Math.floor((sec % 3600) / 60) + 'm';
    }

    function getSessionUptime() {
        const start = parseInt(sessionStorage.getItem('ubc_session_start') || Date.now(), 10);
        sessionStorage.setItem('ubc_session_start', start);
        return formatSeconds(Math.floor((Date.now() - start) / 1000));
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ─── Keyboard & Mobile Triggers ───────────────────────

    // 1. Shortcut tastatură (Desktop: Ctrl+Shift+D)
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            toggleDashboard();
        }
    });

    // 2. Secret Hash URL: #admin (pentru orice dispozitiv)
    function checkHashTrigger() {
        if (window.location.hash === '#admin') {
            openDashboard();
        }
    }
    window.addEventListener('hashchange', checkHashTrigger);
    document.addEventListener('DOMContentLoaded', checkHashTrigger);
    checkHashTrigger();

    // 3. Triple-Tap / 3 click-uri rapide pe Logo-ul UBC (pentru Telefon)
    let logoTapCount = 0;
    let logoTapTimer = null;
    document.addEventListener('click', function (e) {
        const logo = e.target.closest('.logo-ubc');
        if (logo) {
            logoTapCount++;
            clearTimeout(logoTapTimer);
            if (logoTapCount >= 3) {
                logoTapCount = 0;
                openDashboard();
            } else {
                logoTapTimer = setTimeout(() => { logoTapCount = 0; }, 800);
            }
        }
    });

    // ─── Injectare Stiluri ────────────────────────────────

    function injectLoginStyles() {
        if (document.getElementById('ubc-login-styles')) return;
        const style = document.createElement('style');
        style.id = 'ubc-login-styles';
        style.textContent = `
            #ubc-login-modal { position:fixed; inset:0; z-index:99999; }
            .ubc-login-backdrop {
                position:fixed; inset:0;
                background:rgba(0,0,0,0.85);
                backdrop-filter:blur(8px);
                display:flex; align-items:center; justify-content:center;
                animation: ubcFadeIn .2s ease;
            }
            .ubc-login-box {
                background:linear-gradient(145deg, #1e2328, #282d32);
                border:1px solid rgba(46,204,113,0.3);
                border-radius:20px;
                padding:40px 36px;
                width:100%; max-width:400px;
                box-shadow:0 0 60px rgba(46,204,113,0.15), 0 25px 50px rgba(0,0,0,0.5);
                position:relative;
                animation: ubcSlideUp .25s ease;
            }
            .ubc-login-logo { text-align:center; margin-bottom:28px; }
            .ubc-login-icon { font-size:2.5rem; display:block; margin-bottom:10px; }
            .ubc-login-logo h2 { font-size:1.6rem; color:#fff; font-weight:900; margin:0 0 6px; }
            .ubc-login-logo h2 span { color:#2ECC71; }
            .ubc-login-logo p { color:#a0a6ac; font-size:.9rem; margin:0; }
            .ubc-login-form label { display:block; color:#a0a6ac; font-size:.8rem; font-weight:700; text-transform:uppercase; letter-spacing:.5px; margin-bottom:8px; }
            .ubc-pass-wrapper { position:relative; }
            #ubc-pass-input {
                width:100%; padding:13px 46px 13px 16px;
                background:rgba(255,255,255,0.06);
                border:1px solid rgba(255,255,255,0.12);
                border-radius:10px; color:#fff; font-size:1rem;
                outline:none; box-sizing:border-box;
                transition:border-color .2s;
            }
            #ubc-pass-input:focus { border-color:#2ECC71; box-shadow:0 0 0 3px rgba(46,204,113,0.15); }
            #ubc-pass-input.shake { animation: ubcShake .4s ease; }
            .ubc-pass-toggle {
                position:absolute; right:12px; top:50%; transform:translateY(-50%);
                background:none; border:none; cursor:pointer; font-size:1.1rem; padding:4px;
            }
            .ubc-login-error {
                background:rgba(231,76,60,0.15); border:1px solid rgba(231,76,60,0.4);
                color:#e74c3c; padding:10px 14px; border-radius:8px;
                font-size:.85rem; margin:12px 0;
            }
            .ubc-login-btn {
                width:100%; margin-top:16px; padding:14px;
                background:linear-gradient(135deg,#2ECC71,#27ae60);
                border:none; border-radius:10px; color:#fff;
                font-size:1rem; font-weight:700; cursor:pointer;
                transition:opacity .2s, transform .15s;
            }
            .ubc-login-btn:hover { opacity:.9; transform:translateY(-1px); }
            .ubc-login-close {
                position:absolute; top:14px; right:16px;
                background:none; border:none; color:#a0a6ac;
                font-size:1.1rem; cursor:pointer;
            }
            @keyframes ubcFadeIn  { from{opacity:0} to{opacity:1} }
            @keyframes ubcSlideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
            @keyframes ubcShake   { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
        `;
        document.head.appendChild(style);
    }

    function injectDashboardStyles() {
        if (document.getElementById('ubc-dash-styles')) return;
        const style = document.createElement('style');
        style.id = 'ubc-dash-styles';
        style.textContent = `
            #ubc-dashboard {
                position:fixed; inset:0; z-index:99998;
                overflow-y:auto;
                background:rgba(0,0,0,0.88);
                backdrop-filter:blur(10px);
                padding:20px;
                animation:ubcFadeIn .25s ease;
                font-family:'Montserrat',sans-serif;
                font-size:14px;
                color:#fff;
            }
            #ubc-dashboard.ubc-dash--closing { animation:ubcFadeOut .3s ease forwards; }
            @keyframes ubcFadeOut { to{opacity:0} }
            .ubc-dash-panel {
                max-width:1200px; margin:0 auto;
                background:linear-gradient(160deg,#1a1e22,#21272c);
                border:1px solid rgba(46,204,113,0.2);
                border-radius:20px;
                overflow:hidden;
                box-shadow:0 0 80px rgba(46,204,113,0.08), 0 30px 60px rgba(0,0,0,0.5);
            }
            /* Header */
            .ubc-dash-header {
                display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;
                padding:20px 24px;
                background:rgba(46,204,113,0.06);
                border-bottom:1px solid rgba(46,204,113,0.15);
            }
            .ubc-dash-title { display:flex; align-items:center; gap:14px; }
            .ubc-dash-logo { font-size:1.8rem; }
            .ubc-dash-title h2 { margin:0; font-size:1.2rem; font-weight:900; }
            .ubc-dash-title h2 span { color:#2ECC71; }
            .ubc-dash-title small { color:#a0a6ac; font-size:.75rem; display:block; margin-top:2px; }
            .ubc-dash-header-actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
            .ubc-dash-uptime { color:#a0a6ac; font-size:.8rem; margin-right:8px; }
            /* Buttons */
            .ubc-dash-btn {
                padding:7px 14px; border-radius:8px; border:none; cursor:pointer;
                font-weight:700; font-size:.8rem; font-family:inherit;
                background:rgba(46,204,113,0.15); color:#2ECC71;
                border:1px solid rgba(46,204,113,0.3);
                transition:all .2s;
            }
            .ubc-dash-btn:hover { background:rgba(46,204,113,0.25); }
            .ubc-dash-btn--outline { background:transparent; color:#a0a6ac; border-color:rgba(255,255,255,0.15); }
            .ubc-dash-btn--outline:hover { color:#fff; border-color:rgba(255,255,255,0.3); }
            .ubc-dash-btn--danger { background:rgba(231,76,60,0.15); color:#e74c3c; border-color:rgba(231,76,60,0.3); }
            .ubc-dash-btn--danger:hover { background:rgba(231,76,60,0.25); }
            .ubc-dash-btn--sm { padding:4px 10px; font-size:.75rem; }
            .ubc-dash-close {
                background:none; border:none; color:#a0a6ac; font-size:1.2rem;
                cursor:pointer; padding:4px 8px; border-radius:6px;
                transition:color .2s;
            }
            .ubc-dash-close:hover { color:#fff; }
            /* KPI Grid */
            .ubc-kpi-grid {
                display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:14px;
                padding:20px 24px;
                border-bottom:1px solid rgba(255,255,255,0.06);
            }
            .ubc-kpi-card {
                background:rgba(255,255,255,0.04);
                border:1px solid rgba(255,255,255,0.08);
                border-radius:12px; padding:16px;
                text-align:center; transition:border-color .2s;
            }
            .ubc-kpi-card:hover { border-color:rgba(46,204,113,0.3); }
            .ubc-kpi-card--warn { border-color:rgba(243,156,18,0.4) !important; background:rgba(243,156,18,0.06); }
            .ubc-kpi-icon { font-size:1.4rem; display:block; margin-bottom:8px; }
            .ubc-kpi-value { font-size:1.6rem; font-weight:900; color:#fff; }
            .ubc-kpi-label { font-size:.72rem; color:#a0a6ac; text-transform:uppercase; letter-spacing:.5px; margin-top:4px; }
            /* Tabs */
            .ubc-dash-tabs {
                display:flex; gap:0;
                border-bottom:1px solid rgba(255,255,255,0.08);
                padding:0 24px;
                overflow-x:auto;
            }
            .ubc-dash-tab {
                padding:13px 18px; background:none; border:none; color:#a0a6ac;
                font-weight:700; font-size:.82rem; cursor:pointer; white-space:nowrap;
                border-bottom:2px solid transparent; margin-bottom:-1px;
                transition:color .2s, border-color .2s;
                font-family:inherit;
            }
            .ubc-dash-tab:hover { color:#fff; }
            .ubc-dash-tab.active { color:#2ECC71; border-bottom-color:#2ECC71; }
            /* Content */
            .ubc-dash-content { padding:20px 24px; }
            .ubc-dash-tab-panel { display:none; }
            .ubc-dash-tab-panel.active { display:block; }
            .ubc-dash-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
            @media(max-width:700px){ .ubc-dash-grid-2 { grid-template-columns:1fr; } }
            .ubc-dash-card {
                background:rgba(255,255,255,0.04);
                border:1px solid rgba(255,255,255,0.08);
                border-radius:12px; padding:18px;
            }
            .ubc-dash-card h3 { margin:0 0 14px; font-size:.9rem; color:#a0a6ac; text-transform:uppercase; letter-spacing:.5px; }
            .ubc-dash-hint { color:#a0a6ac; font-size:.8rem; margin:8px 0 14px; }
            .ubc-dash-no-data { color:#a0a6ac; font-size:.85rem; font-style:italic; }
            /* Bar Charts */
            .ubc-bar-chart { display:flex; flex-direction:column; gap:8px; }
            .ubc-bar-row { display:flex; align-items:center; gap:10px; }
            .ubc-bar-label { width:80px; font-size:.8rem; color:#a0a6ac; text-align:right; flex-shrink:0; }
            .ubc-bar-track { flex:1; height:8px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden; }
            .ubc-bar-fill { height:100%; background:linear-gradient(90deg,#2ECC71,#3FEF8B); border-radius:4px; transition:width .6s ease; }
            .ubc-bar-fill--blue { background:linear-gradient(90deg,#3498db,#5dade2); }
            .ubc-bar-count { width:30px; text-align:right; font-size:.8rem; font-weight:700; }
            /* Stat list */
            .ubc-stat-list { display:flex; flex-direction:column; gap:8px; }
            .ubc-stat-row { display:flex; justify-content:space-between; align-items:center; padding:7px 0; border-bottom:1px solid rgba(255,255,255,0.06); font-size:.85rem; }
            .ubc-stat-row:last-child { border-bottom:none; }
            .ubc-stat-val { font-weight:700; color:#fff; }
            .ubc-val--ok { color:#2ECC71; }
            .ubc-val--warn { color:#f39c12; }
            /* Errors */
            .ubc-error-summary { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:16px; }
            .ubc-error-badge { padding:3px 10px; border-radius:20px; font-size:.75rem; font-weight:700; color:#fff; }
            .ubc-error-list { display:flex; flex-direction:column; gap:10px; max-height:400px; overflow-y:auto; }
            .ubc-error-item {
                background:rgba(255,255,255,0.03);
                border:1px solid rgba(255,255,255,0.08);
                border-radius:10px; padding:12px;
            }
            .ubc-error-item--critical { border-left:3px solid #e74c3c; }
            .ubc-error-item--warning  { border-left:3px solid #f39c12; }
            .ubc-error-item--info     { border-left:3px solid #3498db; }
            .ubc-error-header { display:flex; align-items:center; gap:8px; margin-bottom:6px; flex-wrap:wrap; }
            .ubc-error-type  { font-size:.8rem; color:#a0a6ac; }
            .ubc-error-time  { font-size:.75rem; color:#a0a6ac; margin-left:auto; }
            .ubc-error-msg   { font-size:.85rem; color:#fff; margin-bottom:4px; }
            .ubc-error-source { font-size:.75rem; color:#a0a6ac; }
            .ubc-error-stack { font-size:.7rem; color:#a0a6ac; white-space:pre-wrap; word-break:break-all; background:rgba(0,0,0,0.3); padding:8px; border-radius:6px; margin-top:6px; }
            details summary { cursor:pointer; font-size:.78rem; color:#a0a6ac; margin-top:4px; }
            /* Performance */
            .ubc-perf-big { font-size:3rem; font-weight:900; text-align:center; padding:20px; }
            .ubc-perf-big--fast { color:#2ECC71; }
            .ubc-perf-big--slow { color:#e74c3c; }
            /* Tools */
            .ubc-tools-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:16px; }
            .ubc-tools-grid .ubc-dash-card { display:flex; flex-direction:column; gap:10px; }
            kbd { background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); border-radius:4px; padding:2px 7px; font-size:.8rem; font-family:monospace; }
        `;
        document.head.appendChild(style);
    }

    console.log('%c[UBC Dashboard] ✅ Activ — Ctrl+Shift+D', 'color:#2ECC71; font-weight:bold;');

})();
