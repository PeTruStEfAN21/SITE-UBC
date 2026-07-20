/**
 * public/js/intro.js
 * ══════════════════════════════════════════════════════════
 * Animație intro UBC — autobetonieră (cifă) care traversează
 * ecranul la fiecare intrare / refresh pe site.
 *
 * Secvență:
 *   1. Overlay negru apare instant (acoperă pagina în loading)
 *   2. Logo UBC fade-in central
 *   3. Cifa intră din stânga, traversează, iese dreapta (2.2s)
 *   4. Overlay fade-out elegant → site vizibil
 * ══════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ─── Injectare stiluri CSS ────────────────────────────
    function injectStyles() {
        if (document.getElementById('ubc-intro-styles')) return;
        const style = document.createElement('style');
        style.id = 'ubc-intro-styles';
        style.textContent = `

        /* ── Overlay principal ─────────────────────────── */
        #ubc-intro {
            position: fixed;
            inset: 0;
            z-index: 999999;
            background: #0d0f11;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            opacity: 1;
            transition: opacity 0.7s ease;
            pointer-events: all;
        }
        #ubc-intro.ubc-intro--fadeout {
            opacity: 0;
            pointer-events: none;
        }

        /* ── Scena ─────────────────────────────────────── */
        .ubc-intro-scene {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        /* ── Logo central ──────────────────────────────── */
        .ubc-intro-logo {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -60%);
            text-align: center;
            z-index: 2;
            opacity: 0;
            animation: ubcLogoReveal 2.8s ease forwards;
            animation-delay: 0.1s;
            pointer-events: none;
            user-select: none;
        }
        .ubc-intro-logo-main {
            font-family: 'Montserrat', sans-serif;
            font-size: clamp(4rem, 12vw, 9rem);
            font-weight: 900;
            letter-spacing: 0.1em;
            color: #fff;
            line-height: 1;
            text-shadow:
                0 0 40px rgba(46, 204, 113, 0),
                0 0 80px rgba(46, 204, 113, 0);
            animation: ubcLogoGlow 2.8s ease forwards;
            animation-delay: 0.1s;
        }
        .ubc-intro-logo-main .u-letter {
            color: #2ECC71;
        }
        .ubc-intro-logo-sub {
            font-family: 'Montserrat', sans-serif;
            font-size: clamp(0.7rem, 2vw, 1rem);
            font-weight: 700;
            letter-spacing: 0.35em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.45);
            margin-top: 10px;
            animation: ubcSubReveal 2.8s ease forwards;
            animation-delay: 0.3s;
            opacity: 0;
        }

        /* ── Linie orizontala (drum) ───────────────────── */
        .ubc-intro-road {
            position: absolute;
            bottom: calc(50% - 85px);
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg,
                transparent 0%,
                rgba(255,255,255,0.06) 20%,
                rgba(255,255,255,0.06) 80%,
                transparent 100%
            );
            z-index: 1;
        }
        .ubc-intro-road::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(90deg,
                transparent,
                rgba(46,204,113,0.4),
                transparent
            );
            animation: ubcRoadShine 2.8s ease forwards;
            animation-delay: 0.2s;
            opacity: 0;
        }

        /* ── Camion (wrap + SVG) ───────────────────────── */
        .ubc-intro-truck-wrap {
            position: absolute;
            bottom: calc(50% - 185px);
            left: 0;
            width: clamp(380px, 55vw, 600px);
            z-index: 3;

            /* Animatia de traversare: stanga → dreapta */
            animation: ubcTruckDrive 2.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
            animation-delay: 0.15s;
            transform: translateX(-650px);
        }
        .ubc-intro-truck-wrap svg {
            width: 100%;
            height: auto;
            display: block;
            filter: drop-shadow(0 12px 30px rgba(0,0,0,0.7));
        }

        /* ── Rotatie roti ──────────────────────────────── */
        .ubc-wheel-front,
        .ubc-wheel-rear,
        .ubc-wheel-mid {
            transform-box: fill-box;
            transform-origin: center;
            animation: ubcWheelSpin 0.35s linear infinite;
        }

        /* ── Rotatie toba betoniera ────────────────────── */
        .ubc-drum-group {
            transform-box: fill-box;
            transform-origin: center;
            animation: ubcDrumSpin 1.8s linear infinite;
        }

        /* ── Particule praf ────────────────────────────── */
        .ubc-intro-dust {
            position: absolute;
            left: 8px;
            bottom: 22px;
            display: flex;
            gap: 6px;
            align-items: flex-end;
        }
        .ubc-intro-dust span {
            display: block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: rgba(160, 166, 172, 0.5);
            animation: ubcDustPuff 0.6s ease-out infinite;
        }
        .ubc-intro-dust span:nth-child(1) { animation-delay: 0s;    width: 10px; height: 10px; }
        .ubc-intro-dust span:nth-child(2) { animation-delay: 0.2s;  width: 14px; height: 14px; }
        .ubc-intro-dust span:nth-child(3) { animation-delay: 0.1s;  width: 9px;  height: 9px;  }

        /* ── Bara de progres ───────────────────────────── */
        .ubc-intro-progress {
            position: absolute;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%);
            width: clamp(120px, 20vw, 200px);
            height: 2px;
            background: rgba(255,255,255,0.08);
            border-radius: 2px;
            overflow: hidden;
            z-index: 10;
        }
        .ubc-intro-progress-fill {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #2ECC71, #F5A623);
            border-radius: 2px;
            animation: ubcProgressBar 2.5s ease forwards;
            animation-delay: 0.15s;
        }

        /* ════ KEYFRAMES ════════════════════════════════ */

        @keyframes ubcTruckDrive {
            0%   { transform: translateX(-650px); }
            100% { transform: translateX(calc(100vw + 80px)); }
        }

        @keyframes ubcWheelSpin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
        }

        @keyframes ubcDrumSpin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(-360deg); }
        }

        @keyframes ubcDustPuff {
            0%   { transform: translateX(0) scale(1);   opacity: 0.7; }
            100% { transform: translateX(-40px) scale(2.5) translateY(-20px); opacity: 0; }
        }

        @keyframes ubcLogoReveal {
            0%   { opacity: 0; transform: translate(-50%, -60%) scale(0.92); }
            15%  { opacity: 1; transform: translate(-50%, -60%) scale(1); }
            75%  { opacity: 1; transform: translate(-50%, -60%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -60%) scale(1.04); }
        }

        @keyframes ubcLogoGlow {
            0%   { text-shadow: 0 0 40px rgba(46,204,113,0),  0 0 80px rgba(46,204,113,0); }
            40%  { text-shadow: 0 0 40px rgba(46,204,113,0.6),0 0 80px rgba(46,204,113,0.25); }
            70%  { text-shadow: 0 0 40px rgba(46,204,113,0.4),0 0 80px rgba(46,204,113,0.15); }
            100% { text-shadow: 0 0 40px rgba(46,204,113,0),  0 0 80px rgba(46,204,113,0); }
        }

        @keyframes ubcSubReveal {
            0%,10% { opacity: 0; transform: translateY(8px); }
            25%    { opacity: 1; transform: translateY(0); }
            75%    { opacity: 1; }
            100%   { opacity: 0; }
        }

        @keyframes ubcRoadShine {
            0%   { opacity: 0; transform: translateX(-100%); }
            30%  { opacity: 1; }
            70%  { opacity: 1; }
            100% { opacity: 0; transform: translateX(100%); }
        }

        @keyframes ubcProgressBar {
            0%   { width: 0%; }
            100% { width: 100%; }
        }

        /* ── Responsive: camion mai mic pe mobile ──────── */
        @media (max-width: 600px) {
            .ubc-intro-truck-wrap {
                width: 300px;
                bottom: calc(50% - 145px);
            }
            .ubc-intro-road {
                bottom: calc(50% - 68px);
            }
        }
        `;
        document.head.appendChild(style);
    }

    // ─── SVG autobetoniera ────────────────────────────────
    function buildTruckSVG() {
        return `
        <svg viewBox="0 0 560 190" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img">

            <!-- Umbra sol pe asfalt -->
            <ellipse cx="270" cy="185" rx="250" ry="7" fill="rgba(0,0,0,0.45)"/>

            <!-- SASIU (chassis) -->
            <rect x="15" y="118" width="505" height="32" rx="5" fill="#1a1e24"/>
            <rect x="15" y="124" width="505" height="10" rx="3" fill="#20262d"/>
            <!-- Lonjeroane laterale -->
            <rect x="15" y="116" width="505" height="5" rx="2" fill="#252c35"/>

            <!-- PLATFORMA sub toba -->
            <rect x="22" y="100" width="342" height="22" rx="4" fill="#20262d"/>

            <!-- TAMPON SPATE -->
            <rect x="8"  y="114" width="16" height="28" rx="3" fill="#141820"/>
            <rect x="8"  y="120" width="16" height="6"  rx="2" fill="#1e2530"/>

            <!-- ═══ TOBA BETONIERA ═══════════════════════ -->
            <g class="ubc-drum-group">
                <!-- Corp principal toba (elipsa) -->
                <ellipse cx="200" cy="82" rx="155" ry="65" fill="#1b2635"/>
                <!-- Strat de baza -->
                <ellipse cx="200" cy="82" rx="155" ry="65" fill="none"
                         stroke="#243040" stroke-width="3.5"/>
                <!-- Cercuri concentrice -->
                <ellipse cx="200" cy="82" rx="110" ry="58" fill="none"
                         stroke="#1d2d3e" stroke-width="2.5"/>
                <ellipse cx="200" cy="82" rx="65"  ry="48" fill="none"
                         stroke="#1d2d3e" stroke-width="2"/>
                <!-- Nervuri spiralate (helice malaxor) -->
                <path d="M 80 55 Q 200 30 320 55 Q 340 82 320 110 Q 200 135 80 110 Q 60 82 80 55 Z"
                      fill="none" stroke="#162030" stroke-width="7" stroke-linecap="round"/>
                <path d="M 95 48 Q 200 20 310 48"
                      fill="none" stroke="#162030" stroke-width="5" stroke-linecap="round"/>
                <path d="M 95 116 Q 200 144 310 116"
                      fill="none" stroke="#162030" stroke-width="5" stroke-linecap="round"/>
                <!-- Glow contur verde -->
                <ellipse cx="200" cy="82" rx="155" ry="65" fill="none"
                         stroke="rgba(46,204,113,0.18)" stroke-width="5"/>
                <!-- TEXT UBC pe toba -->
                <text x="200" y="90"
                      text-anchor="middle"
                      fill="#2ECC71"
                      font-size="32"
                      font-weight="900"
                      font-family="Montserrat, sans-serif"
                      letter-spacing="4"
                      opacity="0.92">UBC</text>
                <!-- Suport toba spate -->
                <rect x="340" y="95" width="24" height="30" rx="4" fill="#16202b"/>
                <!-- Suport toba fata -->
                <rect x="28"  y="95" width="24" height="30" rx="4" fill="#16202b"/>
            </g>

            <!-- ═══ CABINA ════════════════════════════════ -->
            <!-- Corp cabina principal -->
            <rect x="378" y="58" width="162" height="92" rx="9" fill="#191e27"/>
            <!-- Parbriz (trapez) -->
            <polygon points="378,58 520,58 520,96 378,112"
                     fill="#1c3a52" opacity="0.88"/>
            <!-- Geam lateral usa -->
            <rect x="394" y="64" width="54" height="36" rx="4"
                  fill="#1e3d56" opacity="0.75"/>
            <!-- Cadru geam -->
            <rect x="394" y="64" width="54" height="36" rx="4"
                  fill="none" stroke="#162840" stroke-width="1.5"/>
            <!-- Linie despartire parbriz / usa -->
            <line x1="454" y1="58" x2="454" y2="118"
                  stroke="#0f1318" stroke-width="3"/>
            <!-- Maner usa -->
            <rect x="458" y="100" width="24" height="5" rx="2.5" fill="#2a323e"/>
            <!-- Oglinda retrovizoare -->
            <rect x="372" y="70" width="8"  height="14" rx="3" fill="#20262e"/>
            <line x1="376" y1="77" x2="376" y2="84" stroke="#2ECC71" stroke-width="1" opacity="0.4"/>

            <!-- Acoperis cabina -->
            <rect x="381" y="50" width="155" height="12" rx="5" fill="#12161c"/>
            <!-- Girofar / lampa portocalie pe acoperis -->
            <rect x="406" y="44" width="26" height="9" rx="4" fill="#F5A623" opacity="0.9"/>
            <rect x="406" y="44" width="26" height="9" rx="4"
                  fill="none" stroke="#FFD080" stroke-width="1" opacity="0.6"/>

            <!-- GRILA FATA si FAR -->
            <rect x="534" y="86"  width="20" height="56" rx="5" fill="#0e1218"/>
            <!-- Lamele grila -->
            <line x1="534" y1="95"  x2="554" y2="95"  stroke="#161c24" stroke-width="2.5"/>
            <line x1="534" y1="103" x2="554" y2="103" stroke="#161c24" stroke-width="2.5"/>
            <line x1="534" y1="111" x2="554" y2="111" stroke="#161c24" stroke-width="2.5"/>
            <line x1="534" y1="119" x2="554" y2="119" stroke="#161c24" stroke-width="2.5"/>
            <line x1="534" y1="127" x2="554" y2="127" stroke="#161c24" stroke-width="2.5"/>
            <!-- Far principal (dreptunghi galben) -->
            <rect x="536" y="94" width="12" height="20" rx="6" fill="#FFD580"/>
            <!-- Glow far -->
            <rect x="536" y="94" width="12" height="20" rx="6"
                  fill="#FFD580" opacity="0.4"
                  style="filter:blur(6px)"/>

            <!-- TOBA ESAPAMENT -->
            <rect x="366" y="20" width="11" height="42" rx="4" fill="#191e27"/>
            <ellipse cx="371.5" cy="20" rx="7" ry="4.5" fill="#0f1318"/>
            <!-- Fum (3 cercuri care se estompeaza) -->
            <circle cx="371" cy="12" r="5"  fill="rgba(200,210,220,0.12)" class="ubc-smoke-1"/>
            <circle cx="368" cy="5"  r="7"  fill="rgba(200,210,220,0.08)" class="ubc-smoke-2"/>
            <circle cx="373" cy="-1" r="9"  fill="rgba(200,210,220,0.05)" class="ubc-smoke-3"/>

            <!-- ═══ ROTI ══════════════════════════════════ -->

            <!-- Roata fata (dreapta, sub cabina) -->
            <g class="ubc-wheel-front">
                <!-- Anvelopa -->
                <circle cx="468" cy="158" r="34" fill="#0e1115"/>
                <!-- Janta exterioara -->
                <circle cx="468" cy="158" r="29" fill="#191e27"/>
                <!-- Janta interioara -->
                <circle cx="468" cy="158" r="20" fill="#212830"/>
                <!-- Butuc -->
                <circle cx="468" cy="158" r="7"  fill="#171c22"/>
                <!-- Spoke-uri (spite) -->
                <line x1="468" y1="138" x2="468" y2="178" stroke="#2a323e" stroke-width="4.5" stroke-linecap="round"/>
                <line x1="448" y1="158" x2="488" y2="158" stroke="#2a323e" stroke-width="4.5" stroke-linecap="round"/>
                <line x1="454" y1="144" x2="482" y2="172" stroke="#2a323e" stroke-width="3.5" stroke-linecap="round"/>
                <line x1="482" y1="144" x2="454" y2="172" stroke="#2a323e" stroke-width="3.5" stroke-linecap="round"/>
                <!-- Reflex anvelopa -->
                <path d="M 444 135 Q 450 130 460 132" stroke="rgba(255,255,255,0.06)" stroke-width="3" fill="none" stroke-linecap="round"/>
            </g>

            <!-- Roata mijloc (sub toba, axle 2) -->
            <g class="ubc-wheel-mid">
                <circle cx="260" cy="158" r="31" fill="#0e1115"/>
                <circle cx="260" cy="158" r="26" fill="#191e27"/>
                <circle cx="260" cy="158" r="18" fill="#212830"/>
                <circle cx="260" cy="158" r="6"  fill="#171c22"/>
                <line x1="260" y1="140" x2="260" y2="176" stroke="#2a323e" stroke-width="4" stroke-linecap="round"/>
                <line x1="242" y1="158" x2="278" y2="158" stroke="#2a323e" stroke-width="4" stroke-linecap="round"/>
                <line x1="247" y1="145" x2="273" y2="171" stroke="#2a323e" stroke-width="3" stroke-linecap="round"/>
                <line x1="273" y1="145" x2="247" y2="171" stroke="#2a323e" stroke-width="3" stroke-linecap="round"/>
                <path d="M 238 136 Q 244 131 253 133" stroke="rgba(255,255,255,0.06)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            </g>

            <!-- Roata spate (axle 1) -->
            <g class="ubc-wheel-rear">
                <circle cx="90" cy="158" r="34" fill="#0e1115"/>
                <circle cx="90" cy="158" r="29" fill="#191e27"/>
                <circle cx="90" cy="158" r="20" fill="#212830"/>
                <circle cx="90" cy="158" r="7"  fill="#171c22"/>
                <line x1="90"  y1="138" x2="90"  y2="178" stroke="#2a323e" stroke-width="4.5" stroke-linecap="round"/>
                <line x1="70"  y1="158" x2="110" y2="158" stroke="#2a323e" stroke-width="4.5" stroke-linecap="round"/>
                <line x1="76"  y1="144" x2="104" y2="172" stroke="#2a323e" stroke-width="3.5" stroke-linecap="round"/>
                <line x1="104" y1="144" x2="76"  y2="172" stroke="#2a323e" stroke-width="3.5" stroke-linecap="round"/>
                <path d="M 66 135 Q 72 130 82 132" stroke="rgba(255,255,255,0.06)" stroke-width="3" fill="none" stroke-linecap="round"/>
            </g>

        </svg>
        `;
    }

    // ─── Construire overlay ───────────────────────────────
    function buildIntro() {
        const overlay = document.createElement('div');
        overlay.id = 'ubc-intro';
        overlay.setAttribute('role', 'status');
        overlay.setAttribute('aria-label', 'Se încarcă site-ul UBC');

        overlay.innerHTML = `
            <div class="ubc-intro-scene">

                <!-- Logo central -->
                <div class="ubc-intro-logo">
                    <div class="ubc-intro-logo-main">
                        <span class="u-letter">U</span>BC
                    </div>
                    <div class="ubc-intro-logo-sub">Stație de Betoane &bull; Oltenița</div>
                </div>

                <!-- Drum (linie orizontala) -->
                <div class="ubc-intro-road"></div>

                <!-- Cifa (autobetoniera) -->
                <div class="ubc-intro-truck-wrap">
                    ${buildTruckSVG()}
                    <!-- Praf in spate -->
                    <div class="ubc-intro-dust">
                        <span></span><span></span><span></span>
                    </div>
                </div>

                <!-- Bara de incarcare -->
                <div class="ubc-intro-progress">
                    <div class="ubc-intro-progress-fill"></div>
                </div>

            </div>
        `;

        document.body.appendChild(overlay);

        // ─── Fade out dupa traversarea cifei ─────────────
        // Durata totala: 0.15s delay + 2.4s drive + 0.15s buffer = 2.7s
        setTimeout(() => {
            overlay.classList.add('ubc-intro--fadeout');
            // Eliminam din DOM dupa fade
            setTimeout(() => {
                overlay.remove();
                document.body.style.overflow = '';
            }, 700);
        }, 2750);
    }

    // ─── Inițializare ─────────────────────────────────────
    injectStyles();

    // Blocam scroll cat timp ruleaza intro-ul
    document.body.style.overflow = 'hidden';

    // Porneste imediat la DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', buildIntro);
    } else {
        buildIntro();
    }

    console.log('%c[UBC Intro] ✅ Animație cifă activă', 'color:#F5A623; font-weight:bold;');

})();
