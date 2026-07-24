/**
 * public/js/app.js
 * ══════════════════════════════════════════════════════════
 * Logica front-end UBC:
 *   1. Router SPA cu persistență hash URL (refresh → pagina curentă)
 *   2. Calculator dinamic de beton (cu validare + analytics)
 *   3. Tab-uri clase de beton
 *   4. Toast notifications
 *   5. Keyboard navigation
 *   6. Integrare cu UBC_Analytics & UBC_Errors
 * ══════════════════════════════════════════════════════════
 */

document.addEventListener('DOMContentLoaded', () => {

    // ═══════════════════════════════════════════════════════
    //  1. SISTEM TOAST NOTIFICATIONS
    // ═══════════════════════════════════════════════════════

    /**
     * Afișează un toast notification.
     * @param {string} message  - Textul mesajului
     * @param {'success'|'error'|'info'|'warning'} type - Tipul toastului
     * @param {number} duration - Durata în ms (default 3500)
     */
    function showToast(message, type = 'info', duration = 3500) {
        // Crează containerul dacă nu există
        let container = document.getElementById('ubc-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'ubc-toast-container';
            container.setAttribute('aria-live', 'polite');
            container.setAttribute('aria-atomic', 'false');
            document.body.appendChild(container);
            injectToastStyles();
        }

        const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

        const toast = document.createElement('div');
        toast.className = `ubc-toast ubc-toast--${type}`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <span class="ubc-toast-icon">${icons[type] || 'ℹ️'}</span>
            <span class="ubc-toast-msg">${message}</span>
            <button class="ubc-toast-close" aria-label="Închide notificarea">✕</button>
        `;

        container.appendChild(toast);

        // Animație de intrare
        requestAnimationFrame(() => toast.classList.add('ubc-toast--visible'));

        // Buton de închidere
        toast.querySelector('.ubc-toast-close').addEventListener('click', () => removeToast(toast));

        // Auto-dismiss
        const timer = setTimeout(() => removeToast(toast), duration);

        // Pauză la hover
        toast.addEventListener('mouseenter', () => clearTimeout(timer));
        toast.addEventListener('mouseleave', () => setTimeout(() => removeToast(toast), 1000));
    }

    function removeToast(toast) {
        toast.classList.remove('ubc-toast--visible');
        toast.classList.add('ubc-toast--hiding');
        setTimeout(() => toast.remove(), 350);
    }

    function injectToastStyles() {
        if (document.getElementById('ubc-toast-styles')) return;
        const style = document.createElement('style');
        style.id = 'ubc-toast-styles';
        style.textContent = `
            #ubc-toast-container {
                position: fixed;
                bottom: 28px;
                right: 28px;
                z-index: 99000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 360px;
                pointer-events: none;
            }
            .ubc-toast {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 13px 16px;
                border-radius: 12px;
                background: #21272c;
                border: 1px solid rgba(255,255,255,0.1);
                box-shadow: 0 8px 24px rgba(0,0,0,0.4);
                color: #fff;
                font-family: 'Montserrat', sans-serif;
                font-size: .88rem;
                font-weight: 600;
                pointer-events: auto;
                transform: translateX(110%);
                opacity: 0;
                transition: transform .35s cubic-bezier(.175,.885,.32,1.275), opacity .35s ease;
            }
            .ubc-toast--visible { transform: translateX(0); opacity: 1; }
            .ubc-toast--hiding  { transform: translateX(110%); opacity: 0; }
            .ubc-toast--success { border-left: 3px solid #2ECC71; }
            .ubc-toast--error   { border-left: 3px solid #e74c3c; }
            .ubc-toast--warning { border-left: 3px solid #f39c12; }
            .ubc-toast--info    { border-left: 3px solid #3498db; }
            .ubc-toast-icon { font-size: 1rem; flex-shrink: 0; }
            .ubc-toast-msg  { flex: 1; }
            .ubc-toast-close {
                background: none; border: none; color: #a0a6ac;
                cursor: pointer; font-size: .9rem; padding: 2px;
                flex-shrink: 0;
            }
            .ubc-toast-close:hover { color: #fff; }
            @media(max-width:480px) {
                #ubc-toast-container { right:12px; bottom:12px; left:12px; max-width:unset; }
            }
        `;
        document.head.appendChild(style);
    }


    // ═══════════════════════════════════════════════════════
    //  2. ROUTER SPA CU HASH URL (persistență refresh)
    // ═══════════════════════════════════════════════════════

    const navLinks = document.querySelectorAll('[data-target]');
    const pages    = document.querySelectorAll('.page-view');

    /** Paginile valide ale site-ului */
    const VALID_PAGES = ['acasa', 'despre', 'utilaje', 'portofoliu', 'galerie', 'contact'];

    // ─── Salvare / Restaurare poziție scroll ──────────────

    /** Salvează scroll-ul curent pentru pagina activă */
    function saveScrollPosition() {
        const currentPage = window.location.hash.replace('#', '') || 'acasa';
        sessionStorage.setItem(`ubc_scroll_${currentPage}`, window.scrollY);
    }

    /** Restaurează scroll-ul pentru o pagină */
    function restoreScrollPosition(pageId) {
        const savedY = parseInt(sessionStorage.getItem(`ubc_scroll_${pageId}`), 10);
        if (!isNaN(savedY) && savedY > 0) {
            // Mică întârziere pentru ca DOM-ul să se stabilizeze
            setTimeout(() => window.scrollTo({ top: savedY, behavior: 'instant' }), 50);
        } else {
            window.scrollTo({ top: 0, behavior: 'instant' });
        }
    }

    // Salvăm poziția scroll la fiecare scroll (debounced)
    let scrollSaveTimer = null;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollSaveTimer);
        scrollSaveTimer = setTimeout(saveScrollPosition, 150);
    }, { passive: true });

    // Salvăm și înainte de refresh/închidere
    window.addEventListener('beforeunload', saveScrollPosition);

    /**
     * Navighează la pagina specificată.
     * @param {string} targetId    - ID-ul paginii (ex: 'despre')
     * @param {boolean} pushHistory - Dacă să actualizeze hash-ul URL
     * @param {boolean} restoreScroll - Dacă să restaureze scroll-ul salvat
     */
    function navigateTo(targetId, pushHistory = true, restoreScroll = false) {
        // Validăm pagina
        if (!VALID_PAGES.includes(targetId)) {
            targetId = 'acasa';
        }

        const targetPage = document.getElementById(`page-${targetId}`);
        if (!targetPage) return;

        // Ascundem toate paginile și dezactivăm butoanele
        pages.forEach(p => p.classList.remove('active'));
        document.querySelectorAll('nav a.btn-menu').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.logo-ubc').forEach(logo => logo.classList.remove('active'));

        // Activăm pagina țintă
        targetPage.classList.add('active');

        // Activăm butonul de navigare corespunzător
        const activeNavBtn = document.querySelector(`nav a.btn-menu[data-target="${targetId}"]`);
        if (activeNavBtn) activeNavBtn.classList.add('active');

        // Actualizăm hash-ul URL
        if (pushHistory) {
            history.pushState({ page: targetId }, '', `#${targetId}`);
        }

        // Scroll: restaurăm poziția sau mergem sus
        if (restoreScroll) {
            restoreScrollPosition(targetId);
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Informăm modulul de analytics
        if (window.UBC_Analytics) {
            window.UBC_Analytics.trackPage(targetId);
        }
    }

    // Atașăm click listener pe toate linkurile de navigare
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            if (targetId) navigateTo(targetId);
        });
    });

    // Gestionăm butonul Back/Forward al browserului
    window.addEventListener('popstate', (event) => {
        const page = event.state?.page || window.location.hash.replace('#', '') || 'acasa';
        navigateTo(page, false, true); // restaurăm scroll-ul la back/forward
    });

    // ─── Restaurare pagină + scroll la refresh ────────────
    // Citim hash-ul din URL și navigăm direct la pagina respectivă,
    // restaurând și poziția de scroll salvată anterior.
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash && VALID_PAGES.includes(initialHash)) {
        // Pagina din URL cu scroll restaurat (refresh pe aceeași pagină)
        navigateTo(initialHash, false, true);
    } else {
        // Niciun hash valid — pagina default este acasa, sus
        navigateTo('acasa', false, false);
    }


    // ═══════════════════════════════════════════════════════
    //  3. CALCULATOR DINAMIC DE BETON
    // ═══════════════════════════════════════════════════════

    const inputL     = document.getElementById('lungime');
    const inputl     = document.getElementById('latime');
    const inputH     = document.getElementById('grosime');
    const afisaj     = document.getElementById('rezultat-volum');
    const btnComanda = document.getElementById('btn-comanda-calc');
    const telNumber  = '0720006655';

    // Referinte pentru vizualul pilonului de beton
    const pillarFill   = document.getElementById('calc-pillar-fill');
    const pillarTrucks = document.getElementById('calc-pillar-trucks');
    const calcBreakdown  = document.getElementById('calc-breakdown');
    const calcTrucksText = document.getElementById('calc-trucks-text');
    const MAX_PILLAR_VOL = 25; // 25 m³ = 100% umplere vizuala

    // Limită rezonabilă pentru un calcul (m³) — alertăm dacă e prea mare
    const VOLUM_MAX_ALERT = 500;
    const VOLUM_MIN_VALID = 0.001;

    let calcUsed = false; // Flag: calculator utilizat în sesiune

    const calculVolum = () => {
        let L = parseFloat(inputL.value) || 0;
        let l = parseFloat(inputl.value) || 0;
        let h = parseFloat(inputH.value) || 0;

        // Eliminăm valorile negative
        if (L < 0) { L = 0; inputL.value = 0; }
        if (l < 0) { l = 0; inputl.value = 0; }
        if (h < 0) { h = 0; inputH.value = 0; }

        const volum = L * l * h;

        // ─── Animatie vizuala pilon beton ───────────────
        if (pillarFill) {
            const fillPct = Math.min((volum / MAX_PILLAR_VOL) * 100, 100);
            pillarFill.style.height = `${fillPct}%`;
        }
        const trucks = volum > 0 ? Math.ceil(volum / 8) : 0;
        if (pillarTrucks) pillarTrucks.textContent = trucks;
        if (calcBreakdown && calcTrucksText) {
            if (volum > 0) {
                calcTrucksText.textContent =
                    `≈ ${trucks} cifă${trucks !== 1 ? '' : ''} × 8 m³ — livrare estimată`;
            } else {
                calcTrucksText.textContent = 'Introdu dimensiunile mai sus';
            }
        }
        // ────────────────────────────────────────────────

        // Afișăm rezultatul
        if (afisaj) {
            afisaj.innerHTML = `${volum.toFixed(2)} <span style="font-size: 1.8rem; font-weight: 700;">m³</span>`;
        }

        if (L > 0 && l > 0 && h > 0) {
            btnComanda.style.opacity       = '1';
            btnComanda.style.pointerEvents = 'auto';
            btnComanda.href                = `tel:${telNumber}`;
            btnComanda.innerHTML           = `📞 Comandă Telefonic ${volum.toFixed(2)} m³`;

            // Micro-animație la schimbare
            if (afisaj) {
                afisaj.style.transform = 'scale(1.05)';
                setTimeout(() => afisaj.style.transform = 'scale(1)', 150);
            }

            // Analytics: prima utilizare a calculatorului
            if (!calcUsed) {
                calcUsed = true;
                if (window.UBC_Analytics) window.UBC_Analytics.trackCTA('calculator');
            }

            // Toast de alertă pentru volume foarte mari (probabil eroare de input)
            if (volum > VOLUM_MAX_ALERT) {
                showToast(`Volum de ${volum.toFixed(0)} m³ este neobișnuit de mare. Verifică dimensiunile!`, 'warning', 5000);
            }

        } else {
            btnComanda.style.opacity       = '0.5';
            btnComanda.style.pointerEvents = 'none';
            btnComanda.href                = '#';
            btnComanda.innerHTML           = 'Introdu dimensiunile pentru comandă';
        }

        // Trimitem volumul la analytics la fiecare calcul valid
        if (volum >= VOLUM_MIN_VALID && window.UBC_Analytics) {
            window.UBC_Analytics.trackCalculator(volum);
        }
    };

    if (inputL) {
        inputL.addEventListener('input', calculVolum);
        inputl.addEventListener('input', calculVolum);
        inputH.addEventListener('input', calculVolum);

        // Validare la blur: alertăm pentru valori irealiste
        [inputL, inputl, inputH].forEach(inp => {
            inp.addEventListener('blur', () => {
                const val = parseFloat(inp.value);
                if (val > 1000) {
                    showToast('Valoarea introdusă pare prea mare. Verificați unitățile (metri).', 'warning');
                }
            });
        });
    }

    // Tracking click pe butonul de comandă (telefon din calculator)
    if (btnComanda) {
        btnComanda.addEventListener('click', () => {
            if (btnComanda.style.pointerEvents !== 'none') {
                if (window.UBC_Analytics) window.UBC_Analytics.trackCTA('phone');
                showToast('Se inițiază apelul la dispecerat...', 'success', 2500);
            }
        });
    }


    // ═══════════════════════════════════════════════════════
    //  4. TAB-URI CLASE DE BETON
    // ═══════════════════════════════════════════════════════

    const tabButtons = document.querySelectorAll('.tab-btn');
    const gridUsoare = document.getElementById('grid-usoare');
    const gridGrele  = document.getElementById('grid-grele');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (targetTab === 'usoare') {
                gridGrele.classList.add('hidden');
                gridUsoare.classList.remove('hidden');
            } else if (targetTab === 'grele') {
                gridUsoare.classList.add('hidden');
                gridGrele.classList.remove('hidden');
            }
        });
    });


    // ═══════════════════════════════════════════════════════
    //  5. HAMBURGER MENU (Mobile)
    // ═══════════════════════════════════════════════════════

    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mainNav      = document.getElementById('main-nav');

    function openNav() {
        hamburgerBtn.classList.add('open');
        mainNav.classList.add('nav-open');
        hamburgerBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden'; // blochează scroll în spate
    }

    function closeNav() {
        hamburgerBtn.classList.remove('open');
        mainNav.classList.remove('nav-open');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    function toggleNav() {
        mainNav.classList.contains('nav-open') ? closeNav() : openNav();
    }

    if (hamburgerBtn && mainNav) {
        hamburgerBtn.addEventListener('click', toggleNav);

        // Închide nav-ul când utilizatorul dă click pe un link
        mainNav.querySelectorAll('[data-target], a[href]').forEach(link => {
            link.addEventListener('click', closeNav);
        });

        // Închide nav-ul la click în afara lui (pe overlay)
        document.addEventListener('click', (e) => {
            if (mainNav.classList.contains('nav-open') &&
                !mainNav.contains(e.target) &&
                !hamburgerBtn.contains(e.target)) {
                closeNav();
            }
        });

        // Închide nav-ul la Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mainNav.classList.contains('nav-open')) {
                closeNav();
                hamburgerBtn.focus();
            }
        });
    }


    // ═══════════════════════════════════════════════════════
    //  5. KEYBOARD NAVIGATION (Accesibilitate)
    // ═══════════════════════════════════════════════════════

    /**
     * Navigare cu tastatura între pagini:
     *   Alt+← / Alt+→ : pagina anterioară / următoare
     *   Alt+1..4      : Acasă / Despre / Utilaje / Portofoliu
     */
    document.addEventListener('keydown', (e) => {
        // Ignorăm dacă utilizatorul e într-un input
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
        // Ignorăm dacă dashboard-ul e deschis
        if (document.getElementById('ubc-dashboard')) return;

        const currentHash  = window.location.hash.replace('#', '') || 'acasa';
        const currentIndex = VALID_PAGES.indexOf(currentHash);

        if (e.altKey && e.key === 'ArrowRight') {
            e.preventDefault();
            const next = VALID_PAGES[currentIndex + 1];
            if (next) navigateTo(next);
        }

        if (e.altKey && e.key === 'ArrowLeft') {
            e.preventDefault();
            const prev = VALID_PAGES[currentIndex - 1];
            if (prev) navigateTo(prev);
        }

        // Alt+1 → Alt+4 pentru navigare directă
        if (e.altKey && ['1','2','3','4'].includes(e.key)) {
            e.preventDefault();
            const idx = parseInt(e.key) - 1;
            if (VALID_PAGES[idx]) navigateTo(VALID_PAGES[idx]);
        }
    });


    // ═══════════════════════════════════════════════════════
    //  6. PERFORMANCE MONITORING (client-side)
    // ═══════════════════════════════════════════════════════

    window.addEventListener('load', () => {
        try {
            const nav = performance.getEntriesByType('navigation')[0];
            if (nav) {
                const loadTime = Math.round(nav.loadEventEnd - nav.startTime);
                // Avertizăm (doar în consolă) dacă pagina e lentă
                if (loadTime > 4000) {
                    console.warn(`[UBC Perf] ⚠️ Pagina s-a încărcat în ${loadTime}ms — analizează resursele!`);
                    if (window.UBC_Errors) {
                        window.UBC_Errors.log(`Timp de încărcare mare: ${loadTime}ms`, 'performance');
                    }
                } else {
                    console.log(`%c[UBC Perf] ✅ Pagina încărcată în ${loadTime}ms`, 'color:#2ECC71;');
                }
            }
        } catch (_) {}
    });




    // ═══════════════════════════════════════════════════════
    //  7. COUNTER ANIMAT — Cifre Impact (30+, 2003, 60m³)
    // ═══════════════════════════════════════════════════════

    /**
     * Animează un număr de la 0 la target cu easing ease-out.
     * @param {HTMLElement} el     - Elementul span cu textul contorului
     * @param {number}      target - Valoarea finală
     * @param {number}      ms     - Durata animației în ms
     */
    function animateCounter(el, target, ms = 1800) {
        const start     = performance.now();
        const startVal  = 0;

        // Easing ease-out cubic
        const easeOut = t => 1 - Math.pow(1 - t, 3);

        function step(now) {
            const elapsed  = now - start;
            const progress = Math.min(elapsed / ms, 1);
            const current  = Math.round(easeOut(progress) * (target - startVal) + startVal);
            el.textContent = current.toLocaleString('ro-RO');

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.textContent = target.toLocaleString('ro-RO');
            }
        }

        requestAnimationFrame(step);
    }

    // Pornește counterele când secțiunea intră în viewport
    const counters = document.querySelectorAll('.impact-counter');

    if (counters.length && 'IntersectionObserver' in window) {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const el     = entry.target;
                const target = parseInt(el.dataset.target, 10);

                // Durata mai scurtă pentru numere mari (2003 → 1200ms)
                const duration = target > 1000 ? 1200 : 1800;

                animateCounter(el, target, duration);
                counterObserver.unobserve(el); // animă o singură dată
            });
        }, { threshold: 0.3 });

        counters.forEach(el => counterObserver.observe(el));
    } else {
        // Fallback fără IntersectionObserver — afișează direct valoarea
        counters.forEach(el => {
            el.textContent = parseInt(el.dataset.target, 10).toLocaleString('ro-RO');
        });
    }

    // ═══════════════════════════════════════════════════════
    //  SCROLL REVEAL — Animă secțiunile la scroll
    // ═══════════════════════════════════════════════════════
    const revealEls = document.querySelectorAll('.reveal');

    if (revealEls.length > 0 && 'IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('reveal--visible');
                revealObserver.unobserve(entry.target);
            });
        }, {
            threshold: 0.10,
            rootMargin: '0px 0px -40px 0px'
        });

        revealEls.forEach(el => revealObserver.observe(el));
    } else {
        // Fallback: arata imediat daca browser-ul nu suporta IO
        revealEls.forEach(el => el.classList.add('reveal--visible'));
    }

    // Ascunde iframe-ul gol și arată placeholder-ul
    const videoIframe = document.getElementById('ubc-video');
    const videoPlaceholder = document.getElementById('video-placeholder');
    if (videoIframe && videoPlaceholder) {
        if (!videoIframe.getAttribute('src') || videoIframe.getAttribute('src') === '') {
            videoIframe.style.display = 'none';
            videoPlaceholder.style.display = 'flex';
        } else {
            videoPlaceholder.style.display = 'none';
        }
    }

    // ═══════════════════════════════════════════════════════
    //  FORMULAR PAGINĂ CONTACT (#cp-contact-form)
    // ═══════════════════════════════════════════════════════
    const contactForm = document.getElementById('cp-contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nume = document.getElementById('cp-nume')?.value || '';
            const telefon = document.getElementById('cp-telefon')?.value || '';

            if (window.UBC_Analytics) {
                window.UBC_Analytics.trackCTA('email');
            }

            showToast(`Vă mulțumim, ${nume}! Solicitarea dvs. a fost înregistrată. Vă contactăm rapid pe numărul ${telefon}.`, 'success', 5000);
            contactForm.reset();
        });
    }


    // ═══════════════════════════════════════════════════════
    //  8. PERFORMANCE MONITORING (client-side)
    // ═══════════════════════════════════════════════════════

    window.addEventListener('load', () => {
        try {
            const nav = performance.getEntriesByType('navigation')[0];
            if (nav) {
                const loadTime = Math.round(nav.loadEventEnd - nav.startTime);
                // Avertizăm (doar în consolă) dacă pagina e lentă
                if (loadTime > 4000) {
                    console.warn(`[UBC Perf] ⚠️ Pagina s-a încărcat în ${loadTime}ms — analizează resursele!`);
                    if (window.UBC_Errors) {
                        window.UBC_Errors.log(`Timp de încărcare mare: ${loadTime}ms`, 'performance');
                    }
                } else {
                    console.log(`%c[UBC Perf] ✅ Pagina încărcată în ${loadTime}ms`, 'color:#2ECC71;');
                }
            }
        } catch (_) {}
    });


    // ═══════════════════════════════════════════════════════
    //  9. INIT — Mesaj de confirmare în consolă
    // ═══════════════════════════════════════════════════════

    console.log('%c[UBC App] ✅ Toate modulele front-end active!', 'color:#2ECC71; font-weight:bold; font-size:12px;');
    console.log('%c  → Ctrl+Shift+D pentru Dashboard Admin', 'color:#a0a6ac; font-size:11px;');
    console.log('%c  → Alt+← / Alt+→ pentru navigare cu tastatura', 'color:#a0a6ac; font-size:11px;');

});
