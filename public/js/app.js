/**
 * public/js/app.js
 * Logica front-end UBC:
 *   1. Router SPA — comutare pagini
 *   2. Calculator dinamic de beton
 *   3. Tab-uri clase de beton
 */

document.addEventListener('DOMContentLoaded', () => {

    // ═══════════════════════════════════════════
    //  1. ROUTER SPA (SWITCHER PAGINI)
    // ═══════════════════════════════════════════
    const navLinks = document.querySelectorAll('[data-target]');
    const pages    = document.querySelectorAll('.page-view');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');

            // Scoatem clasa active de pe toate paginile și butoanele din meniu
            pages.forEach(p => p.classList.remove('active'));
            document.querySelectorAll('nav a.btn-menu').forEach(btn => btn.classList.remove('active'));

            // Afișăm pagina selectată și marcăm butonul din meniu
            const targetPage = document.getElementById(`page-${targetId}`);
            if (targetPage) {
                targetPage.classList.add('active');

                // Activăm vizual butonul corespondent din meniu
                const activeNavBtn = document.querySelector(`nav a.btn-menu[data-target="${targetId}"]`);
                if (activeNavBtn) activeNavBtn.classList.add('active');

                // Facem scroll fin înapoi sus la schimbarea paginii
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });

    // ═══════════════════════════════════════════
    //  2. CALCULATOR DINAMIC DE BETON
    // ═══════════════════════════════════════════
    const inputL    = document.getElementById('lungime');
    const inputl    = document.getElementById('latime');
    const inputH    = document.getElementById('grosime');
    const afisaj    = document.getElementById('rezultat-volum');
    const btnComanda = document.getElementById('btn-comanda-calc');
    const telNumber = '0724349503';

    const calculVolum = () => {
        let L = parseFloat(inputL.value) || 0;
        let l = parseFloat(inputl.value) || 0;
        let h = parseFloat(inputH.value) || 0;

        if (L < 0) L = 0;
        if (l < 0) l = 0;
        if (h < 0) h = 0;

        const volum = L * l * h;
        if (afisaj) {
            afisaj.innerHTML = `${volum.toFixed(2)} <span style="font-size: 1.8rem; font-weight: 700;">m³</span>`;
        }

        if (L > 0 && l > 0 && h > 0) {
            btnComanda.style.opacity      = '1';
            btnComanda.style.pointerEvents = 'auto';
            btnComanda.href               = `tel:${telNumber}`;
            btnComanda.innerHTML          = `📞 Comandă Telefonic ${volum.toFixed(2)} m³`;

            afisaj.style.transform = 'scale(1.05)';
            setTimeout(() => afisaj.style.transform = 'scale(1)', 150);
        } else {
            btnComanda.style.opacity      = '0.5';
            btnComanda.style.pointerEvents = 'none';
            btnComanda.href               = '#';
            btnComanda.innerHTML          = 'Introdu dimensiunile pentru comandă';
        }
    };

    if (inputL) {
        inputL.addEventListener('input', calculVolum);
        inputl.addEventListener('input', calculVolum);
        inputH.addEventListener('input', calculVolum);
    }

    // ═══════════════════════════════════════════
    //  3. TAB-URI CLASE DE BETON
    // ═══════════════════════════════════════════
    const tabButtons  = document.querySelectorAll('.tab-btn');
    const gridUsoare  = document.getElementById('grid-usoare');
    const gridGrele   = document.getElementById('grid-grele');

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

});
