/**
 * public/js/dashboard.js
 * ══════════════════════════════════════════════════════════
 * Dashboard Admin UBC — Panou de control cu Analytics Reali Server-Side
 *   - Activat cu Ctrl+Shift+D sau secret hash #admin sau 3 atingeri pe logo
 *   - Autentificare securizată
 *   - Numără REAL câți oameni intră (Vizitatori unici & Hits pe server)
 *   - Înregistrează REAL ce secțiuni accesează și pe ce butoane dau click
 *   - Detectează REAL din ce zone/județe ale României este accesat site-ul (prin Geo-IP)
 *   - Jurnal în timp real cu ultimele 50 de acțiuni ale vizitatorilor
 * ══════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const AUTH_SESSION_KEY = 'ubc_admin_auth';

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
                dashboardEl?.remove();
                dashboardEl = null;
            }, 300);
        }
        clearInterval(refreshTimer);
        isOpen = false;
    }

    // ─── Modal Login ──────────────────────────────────────

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
                        <p>Panou de control privat &amp; Analytics Reali</p>
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

    // ─── Render Dashboard Async (Date Reale Server) ───────

    async function renderDashboard() {
        if (dashboardEl) dashboardEl.remove();

        dashboardEl = document.createElement('div');
        dashboardEl.id = 'ubc-dashboard';
        dashboardEl.setAttribute('role', 'dialog');
        dashboardEl.setAttribute('aria-label', 'Dashboard Admin UBC');

        dashboardEl.innerHTML = `
            <div class="ubc-dash-panel" style="padding:60px 20px; text-align:center;">
                <div style="font-size:2.5rem; margin-bottom:12px;">📊</div>
                <h3 style="color:#2ECC71; margin-bottom:8px; font-weight:900;">Se preiau datele de pe Server...</h3>
                <p style="color:#a0a6ac; font-size:0.9rem;">Se calculează vizitatorii reali, locațiile IP din România și click-urile pe secțiuni</p>
            </div>
        `;
        document.body.appendChild(dashboardEl);
        injectDashboardStyles();

        let serverData = null;
        try {
            const res = await fetch('/api/admin/stats');
            if (res.ok) {
                serverData = await res.json();
            }
        } catch(e) {
            console.error('Nu s-au putut prelua datele reale de pe server:', e);
        }

        dashboardEl.innerHTML = buildDashboardHTML(serverData);
        bindDashboardEvents();

        clearInterval(refreshTimer);
        refreshTimer = setInterval(refreshDashboardData, 20000);
    }

    function buildDashboardHTML(data) {
        const summary   = data?.summary || { totalHits: 0, totalUniqueVisitors: 0, totalPageViews: 0, totalClicks: 0, totalCalculatorUses: 0 };
        const geo       = data?.geoLocations || {};
        const pages     = data?.pageViews || {};
        const clicks    = data?.clickEvents || {};
        const events    = data?.recentEvents || [];
        const uptime    = getSessionUptime();

        return `
        <div class="ubc-dash-panel">

            <!-- Header -->
            <div class="ubc-dash-header">
                <div class="ubc-dash-title">
                    <span class="ubc-dash-logo">⚙️</span>
                    <div>
                        <h2>Dashboard Admin <span>UBC</span> — Telemetrie Server</h2>
                        <small>Actualizat în timp real: ${new Date().toLocaleTimeString('ro-RO')}</small>
                    </div>
                </div>
                <div class="ubc-dash-header-actions">
                    <span class="ubc-dash-uptime">⏱ Sesiune Admin: ${uptime}</span>
                    <button class="ubc-dash-btn ubc-dash-btn--outline" id="ubc-dash-refresh">↻ Refresh Date</button>
                    <button class="ubc-dash-btn ubc-dash-btn--danger"  id="ubc-dash-logout">🔓 Ieși</button>
                    <button class="ubc-dash-close" id="ubc-dash-close" aria-label="Închide">✕</button>
                </div>
            </div>

            <!-- KPI Cards Reale -->
            ${buildKPICards(summary, geo)}

            <!-- Tabs Navigare -->
            <div class="ubc-dash-tabs">
                <button class="ubc-dash-tab active" data-dash-tab="geo">📍 Zone &amp; Județe România (${Object.keys(geo).length})</button>
                <button class="ubc-dash-tab" data-dash-tab="sections">📊 Secțiuni &amp; Butoane Accesate</button>
                <button class="ubc-dash-tab" data-dash-tab="live">⏱ Jurnal Live Vizitatori (${events.length})</button>
                <button class="ubc-dash-tab" data-dash-tab="tools">🛠 Instrumente &amp; Resetare</button>
            </div>

            <!-- Conținut Tabs -->
            <div class="ubc-dash-content">

                <!-- Tab 1: Zone România (GeoIP) -->
                <div class="ubc-dash-tab-panel active" id="ubc-dash-tab-geo">
                    ${buildGeoTab(geo, summary.totalHits)}
                </div>

                <!-- Tab 2: Secțiuni & Click-uri -->
                <div class="ubc-dash-tab-panel" id="ubc-dash-tab-sections">
                    ${buildSectionsTab(pages, clicks)}
                </div>

                <!-- Tab 3: Jurnal Live -->
                <div class="ubc-dash-tab-panel" id="ubc-dash-tab-live">
                    ${buildLiveFeedTab(events)}
                </div>

                <!-- Tab 4: Instrumente -->
                <div class="ubc-dash-tab-panel" id="ubc-dash-tab-tools">
                    ${buildToolsTab()}
                </div>

            </div>
        </div>
        `;
    }

    // ─── Componente UI ────────────────────────────────────

    function buildKPICards(summary, geo) {
        const locationsCount = Object.keys(geo).length;

        return `
        <div class="ubc-kpi-grid">
            <div class="ubc-kpi-card ubc-kpi-card--highlight">
                <span class="ubc-kpi-icon">👥</span>
                <div class="ubc-kpi-value">${summary.totalUniqueVisitors || 0}</div>
                <div class="ubc-kpi-label">Vizitatori Unici Reali</div>
            </div>
            <div class="ubc-kpi-card">
                <span class="ubc-kpi-icon">📈</span>
                <div class="ubc-kpi-value">${summary.totalHits || 0}</div>
                <div class="ubc-kpi-label">Accesări Totale (Hits)</div>
            </div>
            <div class="ubc-kpi-card">
                <span class="ubc-kpi-icon">📄</span>
                <div class="ubc-kpi-value">${summary.totalPageViews || 0}</div>
                <div class="ubc-kpi-label">Vizualizări Pagini</div>
            </div>
            <div class="ubc-kpi-card">
                <span class="ubc-kpi-icon">🖱️</span>
                <div class="ubc-kpi-value">${summary.totalClicks || 0}</div>
                <div class="ubc-kpi-label">Click-uri Butoane / CTA</div>
            </div>
            <div class="ubc-kpi-card">
                <span class="ubc-kpi-icon">🧮</span>
                <div class="ubc-kpi-value">${summary.totalCalculatorUses || 0}</div>
                <div class="ubc-kpi-label">Calculat Volum Beton</div>
            </div>
            <div class="ubc-kpi-card">
                <span class="ubc-kpi-icon">📍</span>
                <div class="ubc-kpi-value">${locationsCount}</div>
                <div class="ubc-kpi-label">Zone / Județe România</div>
            </div>
        </div>`;
    }

    function buildGeoTab(geo, totalHits) {
        const sorted = Object.entries(geo).sort((a, b) => b[1] - a[1]);
        if (!sorted.length) {
            return `<div class="ubc-dash-no-data" style="padding:40px; text-align:center;">
                <p>📍 Încă nu s-au înregistrat vizite de pe server. Accesează site-ul de pe telefon sau calculator pentru a genera primele statistici de locație IP!</p>
            </div>`;
        }

        const maxHits = Math.max(...sorted.map(s => s[1]), 1);
        const total = totalHits || sorted.reduce((a, b) => a + b[1], 0) || 1;

        const rows = sorted.map(([loc, count]) => {
            const pct = Math.round((count / total) * 100);
            const barPct = Math.round((count / maxHits) * 100);

            let flag = '🇷🇴';
            if (loc.includes('Oltenița') || loc.includes('Călărași')) flag = '📍';
            else if (loc.includes('București')) flag = '🏙️';
            else if (loc.includes('Prahova')) flag = '🏔️';

            return `
            <div class="ubc-bar-row">
                <span class="ubc-bar-label" style="width:200px; text-align:left; font-weight:700; color:#fff;">${flag} ${loc}</span>
                <div class="ubc-bar-track">
                    <div class="ubc-bar-fill" style="width:${barPct}%"></div>
                </div>
                <span class="ubc-bar-count" style="width:90px; text-align:right;">${count} vizite (${pct}%)</span>
            </div>`;
        }).join('');

        return `
        <div class="ubc-dash-card">
            <h3>📍 Distribuția Vizitatorilor pe Zone / Județe din România (Detectat din IP)</h3>
            <p class="ubc-dash-hint">Analiză automată a locațiilor geografice de unde este accesat site-ul Stației de Betoane UBC.</p>
            <div class="ubc-bar-chart" style="margin-top:16px;">${rows}</div>
        </div>`;
    }

    function buildSectionsTab(pages, clicks) {
        const sortedPages = Object.entries(pages).sort((a, b) => b[1] - a[1]);
        const sortedClicks = Object.entries(clicks).sort((a, b) => b[1] - a[1]);

        const maxPV = sortedPages.length ? Math.max(...sortedPages.map(p => p[1])) : 1;
        const pageRows = sortedPages.map(([page, count]) => `
            <div class="ubc-bar-row">
                <span class="ubc-bar-label" style="width:180px; text-align:left; font-weight:700;">${page}</span>
                <div class="ubc-bar-track">
                    <div class="ubc-bar-fill ubc-bar-fill--blue" style="width:${Math.round((count / maxPV) * 100)}%"></div>
                </div>
                <span class="ubc-bar-count">${count} vizite</span>
            </div>
        `).join('') || '<p class="ubc-dash-no-data">Nicio pagină înregistrată încă.</p>';

        const maxClick = sortedClicks.length ? Math.max(...sortedClicks.map(c => c[1])) : 1;
        const clickRows = sortedClicks.map(([action, count]) => `
            <div class="ubc-bar-row">
                <span class="ubc-bar-label" style="width:230px; text-align:left; font-weight:600; font-size:0.8rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${action}">${action}</span>
                <div class="ubc-bar-track">
                    <div class="ubc-bar-fill" style="width:${Math.round((count / maxClick) * 100)}%"></div>
                </div>
                <span class="ubc-bar-count">${count} click-uri</span>
            </div>
        `).join('') || '<p class="ubc-dash-no-data">Niciun click înregistrat pe butoane încă.</p>';

        return `
        <div class="ubc-dash-grid-2">
            <div class="ubc-dash-card">
                <h3>📄 Top Pagini / Secțiuni Vizitate</h3>
                <div class="ubc-bar-chart">${pageRows}</div>
            </div>
            <div class="ubc-dash-card">
                <h3>🖱️ Top Click-uri Butoane &amp; Acțiuni Utilizatori</h3>
                <div class="ubc-bar-chart">${clickRows}</div>
            </div>
        </div>`;
    }

    function buildLiveFeedTab(events) {
        if (!events.length) {
            return `<div class="ubc-dash-no-data" style="padding:40px; text-align:center;">
                <p>⏱ Nu există evenimente recente înregistrate în jurnal.</p>
            </div>`;
        }

        const rows = events.map(e => {
            const timeStr = new Date(e.time).toLocaleString('ro-RO');
            let badgeColor = '#3498db';
            let icon = '📄';

            if (e.type === 'click' || e.type === 'cta') {
                badgeColor = '#2ECC71';
                icon = '🖱️';
            } else if (e.type === 'calculator') {
                badgeColor = '#f39c12';
                icon = '🧮';
            }

            return `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                <td style="padding:10px 12px; font-size:0.8rem; color:#a0a6ac; white-space:nowrap;">${timeStr}</td>
                <td style="padding:10px 12px; font-weight:700; color:#fff;">📍 ${escapeHtml(e.location)}</td>
                <td style="padding:10px 12px;">
                    <span style="background:${badgeColor}; color:#fff; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:800;">
                        ${icon} ${escapeHtml(e.action)}
                    </span>
                </td>
                <td style="padding:10px 12px; font-size:0.8rem; color:#a0a6ac;">${e.device || 'Desktop'}</td>
                <td style="padding:10px 12px; font-size:0.8rem; color:#666; font-family:monospace;">${e.ip}</td>
            </tr>`;
        }).join('');

        return `
        <div class="ubc-dash-card" style="overflow-x:auto;">
            <h3>⏱ Jurnal Live în Timp Real (Ultimele ${events.length} acțiuni ale vizitatorilor)</h3>
            <table style="width:100%; border-collapse:collapse; text-align:left; margin-top:14px; font-size:0.85rem;">
                <thead>
                    <tr style="border-bottom:2px solid rgba(46,204,113,0.3); color:#2ECC71;">
                        <th style="padding:10px 12px;">Ora &amp; Data</th>
                        <th style="padding:10px 12px;">Oraș / Județ (România)</th>
                        <th style="padding:10px 12px;">Acțiune Executată</th>
                        <th style="padding:10px 12px;">Dispozitiv</th>
                        <th style="padding:10px 12px;">IP Mascat</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>`;
    }

    function buildToolsTab() {
        return `
        <div class="ubc-tools-grid">
            <div class="ubc-dash-card">
                <h3>⬇ Export Date Telemetrie</h3>
                <p class="ubc-dash-hint">Descarcă toate statisticile reale direct în format JSON.</p>
                <button class="ubc-dash-btn" id="ubc-export-server-stats">📊 Descarcă JSON Analytics Server</button>
            </div>
            <div class="ubc-dash-card">
                <h3>🗑 Resetare Analytics Server</h3>
                <p class="ubc-dash-hint">Atenție: resetează toate numărătorile de pe server la 0.</p>
                <button class="ubc-dash-btn ubc-dash-btn--danger" id="ubc-reset-server-stats">Resetează Statisticile Serverului</button>
            </div>
            <div class="ubc-dash-card">
                <h3>🔍 Shortcuts Acces Rapid</h3>
                <div class="ubc-stat-list">
                    <div class="ubc-stat-row"><span>Desktop shortcut</span><span class="ubc-stat-val"><kbd>Ctrl+Shift+D</kbd></span></div>
                    <div class="ubc-stat-row"><span>Mobil / Telefon shortcut</span><span class="ubc-stat-val">Triple-tap pe Logo UBC</span></div>
                    <div class="ubc-stat-row"><span>URL Hash secret</span><span class="ubc-stat-val">Adaugă #admin la URL</span></div>
                </div>
            </div>
        </div>`;
    }

    // ─── Event Listeners Dashboard ────────────────────────

    function bindDashboardEvents() {
        document.querySelectorAll('[data-dash-tab]').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('[data-dash-tab]').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.ubc-dash-tab-panel').forEach(p => p.classList.remove('active'));
                this.classList.add('active');
                const panel = document.getElementById('ubc-dash-tab-' + this.dataset.dashTab);
                if (panel) panel.classList.add('active');
            });
        });

        document.getElementById('ubc-dash-close')?.addEventListener('click', closeDashboard);
        document.getElementById('ubc-dash-logout')?.addEventListener('click', logout);
        document.getElementById('ubc-dash-refresh')?.addEventListener('click', () => {
            renderDashboard();
        });

        document.getElementById('ubc-export-server-stats')?.addEventListener('click', async () => {
            try {
                const res = await fetch('/api/admin/stats');
                if (res.ok) {
                    const data = await res.json();
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url  = URL.createObjectURL(blob);
                    const a    = document.createElement('a');
                    a.href     = url;
                    a.download = 'ubc_server_analytics_' + new Date().toISOString().slice(0, 10) + '.json';
                    a.click();
                    URL.revokeObjectURL(url);
                }
            } catch(e) { alert('Eroare export date.'); }
        });

        document.getElementById('ubc-reset-server-stats')?.addEventListener('click', async () => {
            if (confirm('Ești sigur că vrei să resetezi TOATE datele de analytics de pe server la 0?')) {
                try {
                    const res = await fetch('/api/admin/reset-stats', { method: 'POST' });
                    if (res.ok) {
                        alert('✅ Datele au fost resetate cu succes!');
                        renderDashboard();
                    }
                } catch(e) { alert('Eroare resetare date.'); }
            }
        });

        document.addEventListener('keydown', function escClose(e) {
            if (e.key === 'Escape' && isOpen) {
                closeDashboard();
                document.removeEventListener('keydown', escClose);
            }
        });
    }

    function refreshDashboardData() {
        if (!isOpen) return;
        renderDashboard();
    }

    // ─── Helpers ──────────────────────────────────────────

    function formatSeconds(sec) {
        if (sec < 60)   return sec + 's';
        if (sec < 3600) return Math.floor(sec / 60) + 'm ' + (sec % 60) + 's';
        return Math.floor(sec / 3600) + 'h ' + Math.floor((sec % 3600) / 60) + 'm';
    }

    function getSessionUptime() {
        const start = parseInt(sessionStorage.getItem('ubc_session_start') || Date.now(), 10);
        sessionStorage.setItem('ubc_session_start', start);
        return formatSeconds(Math.floor((Date.now() - start) / 1000));
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ─── Keyboard & Mobile Triggers ───────────────────────

    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            toggleDashboard();
        }
    });

    function checkHashTrigger() {
        if (window.location.hash === '#admin') {
            openDashboard();
        }
    }
    window.addEventListener('hashchange', checkHashTrigger);
    document.addEventListener('DOMContentLoaded', checkHashTrigger);
    checkHashTrigger();

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

    // ─── Injectare Stiluri CSS ────────────────────────────

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
            .ubc-dash-close {
                background:none; border:none; color:#a0a6ac; font-size:1.2rem;
                cursor:pointer; padding:4px 8px; border-radius:6px;
                transition:color .2s;
            }
            .ubc-dash-close:hover { color:#fff; }
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
            .ubc-kpi-card--highlight { border-color:rgba(46,204,113,0.4) !important; background:rgba(46,204,113,0.06); }
            .ubc-kpi-icon { font-size:1.4rem; display:block; margin-bottom:8px; }
            .ubc-kpi-value { font-size:1.6rem; font-weight:900; color:#fff; }
            .ubc-kpi-label { font-size:.72rem; color:#a0a6ac; text-transform:uppercase; letter-spacing:.5px; margin-top:4px; }
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
            .ubc-bar-chart { display:flex; flex-direction:column; gap:8px; }
            .ubc-bar-row { display:flex; align-items:center; gap:10px; }
            .ubc-bar-label { font-size:.8rem; color:#a0a6ac; flex-shrink:0; }
            .ubc-bar-track { flex:1; height:10px; background:rgba(255,255,255,0.08); border-radius:5px; overflow:hidden; }
            .ubc-bar-fill { height:100%; background:linear-gradient(90deg,#2ECC71,#3FEF8B); border-radius:5px; transition:width .6s ease; }
            .ubc-bar-fill--blue { background:linear-gradient(90deg,#3498db,#5dade2); }
            .ubc-bar-count { font-size:.8rem; font-weight:700; color:#2ECC71; }
            .ubc-tools-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:16px; }
            .ubc-stat-list { display:flex; flex-direction:column; gap:8px; }
            .ubc-stat-row { display:flex; justify-content:space-between; align-items:center; padding:7px 0; border-bottom:1px solid rgba(255,255,255,0.06); font-size:.85rem; }
            .ubc-stat-row:last-child { border-bottom:none; }
            .ubc-stat-val { font-weight:700; color:#fff; }
        `;
        document.head.appendChild(style);
    }

})();
