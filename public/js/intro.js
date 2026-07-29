/**
 * public/js/intro.js
 * ══════════════════════════════════════════════════════════
 * Animație intro UBC — Betoniera intră, se oprește central,
 * toarnă beton (stream animat) care umple bara de încărcare,
 * apoi iese spre dreapta.
 *
 * Secvență:
 *   1. Overlay negru instant
 *   2. Logo UBC fade-in
 *   3. Cifa intră din stânga → se oprește la centru (1.2s)
 *   4. Stream verde coboară din tobă → bara se umple (1.8s)
 *   5. Cifa iese spre dreapta
 *   6. Overlay fade-out → site vizibil
 * ══════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ─── Constante timing ────────────────────────────────
    const TRUCK_DUR_S   = 3.5;   // durata totala animatie camion (secunde)
    const POUR_DELAY_MS = 1300;  // cand incepe turnarea (ms)
    const POUR_DUR_MS   = 1900;  // cat dureaza turnarea (ms)
    const FADEOUT_MS    = 3700;  // cand incepe fade-out overlay (ms)

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
            animation: ubcLogoReveal 3.8s ease forwards 0.1s;
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
            animation: ubcLogoGlow 3.8s ease forwards 0.1s;
        }
        .ubc-intro-logo-main .u-letter { color: #27D045; }
        .ubc-intro-logo-sub {
            font-family: 'Montserrat', sans-serif;
            font-size: clamp(0.7rem, 2vw, 1rem);
            font-weight: 700;
            letter-spacing: 0.35em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.45);
            margin-top: 10px;
            animation: ubcSubReveal 3.8s ease forwards 0.3s;
            opacity: 0;
        }

        /* ── Linie drum ────────────────────────────────── */
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
            background: linear-gradient(90deg, transparent, rgba(46,204,113,0.4), transparent);
            animation: ubcRoadShine 3.8s ease forwards 0.2s;
            opacity: 0;
        }

        /* ── Camion ────────────────────────────────────── */
        .ubc-intro-truck-wrap {
            position: absolute;
            bottom: calc(50% - 185px);
            left: 0;
            width: clamp(380px, 55vw, 600px);
            z-index: 3;
            animation: ubcTruckPark ${TRUCK_DUR_S}s ease forwards 0.15s;
            transform: translateX(-700px);
        }
        .ubc-intro-truck-wrap svg {
            width: 100%;
            height: auto;
            display: block;
            filter: drop-shadow(0 12px 30px rgba(0,0,0,0.7));
        }

        /* ── Roti: se opresc la parcare ────────────────── */
        .ubc-wheel-front, .ubc-wheel-rear, .ubc-wheel-mid {
            transform-box: fill-box;
            transform-origin: center;
            animation: ubcWheelRoll ${TRUCK_DUR_S}s linear forwards 0.15s;
        }

        /* ── Toba: statica (rotatia 2D CSS arata nerealist) ─ */
        .ubc-drum-group {
            /* Fara rotatie — toba statica arata mai bine decat o rotatie 2D incorecta */
        }

        /* ── Praf intrare ───────────────────────────────── */
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
            border-radius: 50%;
            background: rgba(160, 166, 172, 0.5);
            animation: ubcDustPuff 0.7s ease-out 2 forwards;
        }
        .ubc-intro-dust span:nth-child(1) { animation-delay: 0.15s; width: 10px; height: 10px; }
        .ubc-intro-dust span:nth-child(2) { animation-delay: 0.35s; width: 14px; height: 14px; }
        .ubc-intro-dust span:nth-child(3) { animation-delay: 0.25s; width: 9px;  height: 9px; }

        /* ── Stream beton (curge din toba) ─────────────── */
        .ubc-pour-stream {
            position: absolute;
            /* Aliniat cu gura de evacuare (spatele tobei) cand camionul e parcat */
            left: calc(50% - 55px);
            bottom: calc(50% - 187px);
            width: 12px;
            height: 0;
            background: linear-gradient(
                180deg,
                rgba(63, 239, 139, 1.0)  0%,
                rgba(46, 204, 113, 0.90) 40%,
                rgba(30, 160, 80,  0.70) 80%,
                rgba(46, 204, 113, 0.30) 100%
            );
            border-radius: 2px 2px 5px 5px;
            z-index: 5;
            transform-origin: top center;
            opacity: 0;
            animation: ubcPourDown ${POUR_DUR_MS / 1000}s ease forwards ${POUR_DELAY_MS / 1000}s;
        }

        /* Bula la capatul streamului */
        .ubc-pour-stream::before {
            content: '';
            position: absolute;
            top: -7px;
            left: 50%;
            transform: translateX(-50%);
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: rgba(63, 239, 139, 0.6);
            animation: ubcDripPulse 0.35s ease-in-out infinite ${POUR_DELAY_MS / 1000}s;
        }

        /* Picatura care cade de la baza streamului */
        .ubc-pour-stream::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 50%;
            transform: translateX(-50%);
            width: 10px;
            height: 12px;
            border-radius: 50% 50% 65% 65%;
            background: rgba(46, 204, 113, 0.7);
            animation: ubcDripFall 0.4s ease-in infinite ${POUR_DELAY_MS / 1000}s;
        }

        /* Splash la baza (imprastiere pe bara) */
        .ubc-pour-splash {
            position: absolute;
            left: calc(50% - 70px);
            bottom: calc(50% - 255px);
            width: 40px;
            height: 8px;
            z-index: 5;
            opacity: 0;
            animation: ubcSplashIn ${POUR_DUR_MS / 1000}s ease forwards ${POUR_DELAY_MS / 1000}s;
        }
        .ubc-pour-splash::before,
        .ubc-pour-splash::after {
            content: '';
            position: absolute;
            top: 0;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: rgba(46, 204, 113, 0.5);
        }
        .ubc-pour-splash::before { left: 0;   animation: ubcSplashLeft  0.3s ease-out infinite ${POUR_DELAY_MS / 1000 + 0.2}s; }
        .ubc-pour-splash::after  { right: 0;  animation: ubcSplashRight 0.3s ease-out infinite ${POUR_DELAY_MS / 1000 + 0.1}s; }

        /* ── Bara de incarcare — tema beton ────────────── */
        .ubc-intro-progress {
            position: absolute;
            bottom: 48px;
            left: 50%;
            transform: translateX(-50%);
            width: clamp(200px, 38vw, 340px);
            z-index: 10;
        }
        .ubc-intro-progress-label {
            font-family: 'Montserrat', sans-serif;
            font-size: 0.68rem;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.28);
            text-align: center;
            margin-bottom: 10px;
            opacity: 0;
            animation: ubcFadeIn 0.5s ease forwards ${(POUR_DELAY_MS - 100) / 1000}s;
        }
        .ubc-intro-progress-track {
            width: 100%;
            height: 7px;
            background: rgba(255,255,255,0.06);
            border-radius: 4px;
            overflow: hidden;
            border: 1px solid rgba(46,204,113,0.12);
        }
        .ubc-intro-progress-fill {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #2ECC71, #27ae60 70%, #3FEF8B);
            border-radius: 4px;
            animation: ubcBarFill ${POUR_DUR_MS / 1000}s ease-out forwards ${POUR_DELAY_MS / 1000}s;
            position: relative;
            box-shadow: 0 0 12px rgba(46,204,113,0.45);
        }
        /* Shimmer la marginea barei */
        .ubc-intro-progress-fill::after {
            content: '';
            position: absolute;
            top: 0; right: 0;
            width: 28px;
            height: 100%;
            background: rgba(255,255,255,0.4);
            border-radius: 4px;
            filter: blur(3px);
            animation: ubcFillPulse 0.45s ease-in-out infinite ${POUR_DELAY_MS / 1000}s;
        }
        .ubc-intro-progress-pct {
            font-family: 'Montserrat', sans-serif;
            font-size: 0.62rem;
            font-weight: 700;
            color: rgba(46,204,113,0.65);
            text-align: right;
            margin-top: 6px;
            letter-spacing: 0.05em;
            opacity: 0;
            animation: ubcFadeIn 0.4s ease forwards ${POUR_DELAY_MS / 1000}s;
        }

        /* ════ KEYFRAMES ════════════════════════════════ */

        /* Camion: intra → parcare → iesire */
        @keyframes ubcTruckPark {
            0%   { transform: translateX(-700px); animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94); }
            /* Ajunge la centru si se opreste */
            34%  { transform: translateX(calc(50vw - 100px)); animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1); }
            /* Hold la parcare */
            36%  { transform: translateX(calc(50vw - 100px)); }
            79%  { transform: translateX(calc(50vw - 100px)); animation-timing-function: ease-in; }
            /* Iesire dreapta */
            100% { transform: translateX(calc(100vw + 250px)); }
        }

        /* Roti: se opresc la parcare, pornesc la iesire */
        @keyframes ubcWheelRoll {
            0%   { transform: rotate(0deg);     animation-timing-function: linear; }
            34%  { transform: rotate(-2000deg); animation-timing-function: ease-out; }
            40%  { transform: rotate(-2015deg); }
            /* Aproape oprit in timpul turnarii */
            78%  { transform: rotate(-2025deg); animation-timing-function: ease-in; }
            /* Porneste la iesire */
            100% { transform: rotate(-4000deg); }
        }



        /* Stream de beton care curge */
        @keyframes ubcPourDown {
            0%   { height: 0;    opacity: 0; }
            10%  { height: 10px; opacity: 1; }
            55%  { height: 70px; opacity: 1; }
            85%  { height: 70px; opacity: 0.9; }
            100% { height: 0;    opacity: 0; }
        }

        /* Bula pulsatila la capatul de sus */
        @keyframes ubcDripPulse {
            0%, 100% { transform: translateX(-50%) scale(1);   opacity: 0.65; }
            50%       { transform: translateX(-50%) scale(1.5); opacity: 0.3;  }
        }

        /* Picatura care cade */
        @keyframes ubcDripFall {
            0%   { transform: translateX(-50%) translateY(0)    scale(1.0); opacity: 0.8; }
            100% { transform: translateX(-50%) translateY(16px) scale(0.5); opacity: 0; }
        }

        /* Splash la baza streamului */
        @keyframes ubcSplashIn {
            0%, 15% { opacity: 0; }
            20%     { opacity: 1; }
            85%     { opacity: 1; }
            100%    { opacity: 0; }
        }
        @keyframes ubcSplashLeft {
            0%   { transform: translate(0, 0) scale(1);   opacity: 0.7; }
            100% { transform: translate(-10px, -6px) scale(0.4); opacity: 0; }
        }
        @keyframes ubcSplashRight {
            0%   { transform: translate(0, 0) scale(1);   opacity: 0.7; }
            100% { transform: translate(10px, -6px) scale(0.4); opacity: 0; }
        }

        /* Bara de incarcare umplere */
        @keyframes ubcBarFill {
            0%   { width: 0%; }
            100% { width: 100%; }
        }

        /* Shimmer la marginea fill-ului */
        @keyframes ubcFillPulse {
            0%, 100% { opacity: 0.5; }
            50%       { opacity: 1.0; }
        }

        @keyframes ubcFadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
        }

        @keyframes ubcDustPuff {
            0%   { transform: translateX(0) scale(1);   opacity: 0.7; }
            100% { transform: translateX(-40px) scale(2.5) translateY(-20px); opacity: 0; }
        }

        @keyframes ubcLogoReveal {
            0%   { opacity: 0; transform: translate(-50%, -60%) scale(0.92); }
            10%  { opacity: 1; transform: translate(-50%, -60%) scale(1); }
            82%  { opacity: 1; transform: translate(-50%, -60%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -60%) scale(1.03); }
        }

        @keyframes ubcLogoGlow {
            0%   { text-shadow: 0 0 40px rgba(46,204,113,0),   0 0 80px rgba(46,204,113,0); }
            40%  { text-shadow: 0 0 40px rgba(46,204,113,0.6), 0 0 80px rgba(46,204,113,0.25); }
            70%  { text-shadow: 0 0 40px rgba(46,204,113,0.4), 0 0 80px rgba(46,204,113,0.15); }
            100% { text-shadow: 0 0 40px rgba(46,204,113,0),   0 0 80px rgba(46,204,113,0); }
        }

        @keyframes ubcSubReveal {
            0%,10% { opacity: 0; transform: translateY(8px); }
            25%    { opacity: 1; transform: translateY(0); }
            82%    { opacity: 1; }
            100%   { opacity: 0; }
        }

        @keyframes ubcRoadShine {
            0%   { opacity: 0; transform: translateX(-100%); }
            20%  { opacity: 1; }
            82%  { opacity: 1; }
            100% { opacity: 0; }
        }

        /* Responsive mobile */
        @media (max-width: 600px) {
            .ubc-intro-truck-wrap {
                width: 300px;
                bottom: calc(50% - 145px);
            }
            .ubc-intro-road {
                bottom: calc(50% - 68px);
            }
            .ubc-pour-stream,
            .ubc-pour-splash {
                left: calc(50% - 30px);
            }
            .ubc-pour-stream {
                bottom: calc(50% - 163px);
            }
            .ubc-pour-splash {
                bottom: calc(50% - 227px);
            }
        }
        `;
        document.head.appendChild(style);
    }

    // ─── SVG Autobetonieră MAN (Model realist) ───
    function buildTruckSVG() {
        return `
        <svg viewBox="0 0 520 210" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img">
            <defs>
                <linearGradient id="cabGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#2C3E50"/>
                    <stop offset="100%" style="stop-color:#1a252f"/>
                </linearGradient>
                <linearGradient id="drumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#E8EDF2"/>
                    <stop offset="60%" style="stop-color:#CBD5E0"/>
                    <stop offset="100%" style="stop-color:#A0AEC0"/>
                </linearGradient>
                <linearGradient id="ubcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#27D045"/>
                    <stop offset="100%" style="stop-color:#1aA333"/>
                </linearGradient>
            </defs>

            <!-- Umbra pe sol -->
            <ellipse cx="260" cy="200" rx="230" ry="7" fill="rgba(0,0,0,0.45)"/>

            <!-- ═══ ȘASIU ═══ -->
            <rect x="30" y="148" width="430" height="16" rx="3" fill="#151B22"/>
            <rect x="30" y="152" width="430" height="6" rx="2" fill="#1E2830"/>
            <!-- Bara longitudinală -->
            <rect x="30" y="146" width="430" height="4" rx="2" fill="#2D3A47"/>

            <!-- ═══ TOBĂ BETONIERĂ (pară înclinată realistă) ═══ -->
            <!-- Suport spate tobă (A-frame) -->
            <polygon points="60,110 78,110 85,150 53,150" fill="#1E2830"/>
            <polygon points="64,112 74,112 80,148 58,148" fill="#253040"/>

            <!-- Corp principal tobă — formă pară realismă -->
            <ellipse cx="82" cy="88" rx="38" ry="52" fill="url(#drumGrad)" transform="rotate(-15, 82, 88)"/>
            <path d="M 52 58 Q 58 18 112 28 Q 148 35 175 65 Q 195 88 185 115 Q 175 138 145 148 Q 115 155 85 148 Q 55 138 42 115 Q 32 92 52 58 Z"
                  fill="url(#drumGrad)" stroke="#94A3B8" stroke-width="1.5"/>

            <!-- Nervuri spiralate pe tobă -->
            <path d="M 58 60 Q 115 35 170 68" fill="none" stroke="#B0BEC5" stroke-width="5" stroke-linecap="round" opacity="0.6"/>
            <path d="M 50 82 Q 108 58 172 88" fill="none" stroke="#B0BEC5" stroke-width="6" stroke-linecap="round" opacity="0.5"/>
            <path d="M 48 104 Q 100 82 168 108" fill="none" stroke="#B0BEC5" stroke-width="6" stroke-linecap="round" opacity="0.5"/>
            <path d="M 52 126 Q 100 108 162 128" fill="none" stroke="#B0BEC5" stroke-width="5" stroke-linecap="round" opacity="0.5"/>
            <path d="M 62 142 Q 108 132 155 144" fill="none" stroke="#B0BEC5" stroke-width="4" stroke-linecap="round" opacity="0.4"/>

            <!-- Inel de suport rotație (spate tobă) -->
            <ellipse cx="175" cy="90" rx="18" ry="32" fill="none" stroke="#64748B" stroke-width="5"/>
            <ellipse cx="175" cy="90" rx="10" ry="20" fill="none" stroke="#94A3B8" stroke-width="2"/>

            <!-- Logo UBC pe tobă (cerc verde) -->
            <g transform="translate(112, 85) rotate(-12)">
                <circle cx="0" cy="0" r="30" fill="url(#ubcGrad)"/>
                <circle cx="0" cy="0" r="30" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
                <text x="0" y="9" text-anchor="middle" fill="#FFFFFF"
                      font-size="22" font-weight="900"
                      font-family="Montserrat, Arial, sans-serif"
                      letter-spacing="1">UBC</text>
            </g>

            <!-- Suport față tobă -->
            <rect x="188" y="100" width="20" height="50" rx="3" fill="#1E2830"/>
            <rect x="190" y="102" width="16" height="46" rx="2" fill="#253040"/>

            <!-- ═══ JGHEAB EVACUARE (spate) ═══ -->
            <path d="M 48 148 L 15 178 L 24 182 L 58 152 Z" fill="#374151" stroke="#1E2830" stroke-width="1"/>
            <path d="M 15 178 L 5 192 L 13 195 L 24 182 Z" fill="#4B5563"/>
            <!-- Pâlnie încărcare sus -->
            <polygon points="40,20 68,26 60,62 32,56" fill="#1E2830" stroke="#374151" stroke-width="1"/>
            <!-- Scăriță acces -->
            <line x1="52" y1="28" x2="52" y2="100" stroke="#4B5563" stroke-width="2.5"/>
            <line x1="47" y1="42" x2="57" y2="42" stroke="#4B5563" stroke-width="2"/>
            <line x1="47" y1="58" x2="57" y2="58" stroke="#4B5563" stroke-width="2"/>
            <line x1="47" y1="74" x2="57" y2="74" stroke="#4B5563" stroke-width="2"/>
            <line x1="47" y1="90" x2="57" y2="90" stroke="#4B5563" stroke-width="2"/>

            <!-- ═══ REZERVOR COMBUSTIBIL ═══ -->
            <rect x="198" y="135" width="65" height="22" rx="5" fill="#1E2830" stroke="#2D3A47" stroke-width="1"/>
            <rect x="202" y="139" width="57" height="10" rx="3" fill="#253040"/>

            <!-- ═══ CABINĂ MAN (cab-over modern) ═══ -->
            <!-- Corp cabină principal — alb/gri deschis -->
            <path d="M 218 52 L 220 148 L 460 148 L 462 80 Q 460 52 432 50 Z"
                  fill="url(#cabGrad)"/>
            <!-- Panou frontal cabină (față) -->
            <path d="M 432 50 Q 460 52 462 80 L 462 148 L 448 148 L 448 60 Z"
                  fill="#1a252f"/>

            <!-- Parbriz mare (tăiat în trepte) -->
            <path d="M 228 58 L 430 58 L 430 105 L 228 112 Z"
                  fill="#1B3A52" opacity="0.88"/>
            <!-- Reflecție parbriz -->
            <path d="M 235 62 Q 290 60 350 62 L 345 72 Q 288 70 238 72 Z"
                  fill="rgba(255,255,255,0.08)"/>

            <!-- Geam lateral stânga ușă -->
            <rect x="228" y="115" width="72" height="28" rx="5" fill="#1B3A52" opacity="0.8"/>
            <rect x="228" y="115" width="72" height="28" rx="5" fill="none" stroke="#0F1A26" stroke-width="1.5"/>
            <!-- Mâner ușă -->
            <rect x="234" y="148" width="18" height="4" rx="2" fill="#2D3A47"/>

            <!-- Linie separatoare ușă / parbriz -->
            <line x1="304" y1="56" x2="304" y2="148" stroke="#0F1A26" stroke-width="3"/>

            <!-- Geam ușă dreapta -->
            <rect x="310" y="62" width="116" height="42" rx="5" fill="#1B3A52" opacity="0.82"/>
            <rect x="310" y="62" width="116" height="42" rx="5" fill="none" stroke="#0F1A26" stroke-width="1.5"/>
            <line x1="368" y1="56" x2="368" y2="148" stroke="#0F1A26" stroke-width="2.5"/>

            <!-- Acoperis cabină -->
            <rect x="220" y="44" width="210" height="14" rx="5" fill="#111820"/>
            <!-- Girofar portocaliu pe acoperiș -->
            <rect x="240" y="38" width="32" height="10" rx="4" fill="#F5A623" opacity="0.9"/>
            <rect x="240" y="38" width="32" height="10" rx="4" fill="none" stroke="#FFD080" stroke-width="1"/>

            <!-- Oglindă retrovizoare -->
            <rect x="210" y="68" width="10" height="22" rx="3" fill="#111820"/>
            <line x1="214" y1="76" x2="220" y2="76" stroke="#111820" stroke-width="3"/>
            <line x1="214" y1="86" x2="220" y2="86" stroke="#111820" stroke-width="3"/>

            <!-- Mâner ușă dreapta -->
            <rect x="416" y="110" width="20" height="4" rx="2" fill="#2D3A47"/>

            <!-- FAȚĂ CABINĂ — Grilă & Faruri -->
            <!-- Grilă radiator -->
            <rect x="452" y="78" width="10" height="55" rx="2" fill="#0A1018"/>
            <line x1="452" y1="88"  x2="462" y2="88"  stroke="#1E2830" stroke-width="2"/>
            <line x1="452" y1="98"  x2="462" y2="98"  stroke="#1E2830" stroke-width="2"/>
            <line x1="452" y1="108" x2="462" y2="108" stroke="#1E2830" stroke-width="2"/>
            <line x1="452" y1="118" x2="462" y2="118" stroke="#1E2830" stroke-width="2"/>
            <line x1="452" y1="128" x2="462" y2="128" stroke="#1E2830" stroke-width="2"/>
            <!-- Far principal -->
            <rect x="453" y="84" width="8" height="18" rx="4" fill="#FFE082"/>
            <rect x="453" y="84" width="8" height="18" rx="4" fill="#FFD54F" opacity="0.5" style="filter:blur(4px)"/>
            <!-- Semnalizator -->
            <rect x="453" y="104" width="7" height="8" rx="2" fill="#FF8C00"/>

            <!-- Bara față -->
            <rect x="450" y="135" width="14" height="14" rx="3" fill="#0A1018"/>

            <!-- Tobă eșapament -->
            <rect x="426" y="14" width="12" height="44" rx="4" fill="#1E2830"/>
            <ellipse cx="432" cy="14" rx="8" ry="5" fill="#111820"/>
            <!-- Fum -->
            <circle cx="432" cy="6"  r="5"  fill="rgba(200,210,220,0.1)"/>
            <circle cx="429" cy="-2" r="7"  fill="rgba(200,210,220,0.07)"/>

            <!-- ═══ ROȚI ═══ -->
            <!-- Aripi / Aparători -->
            <path d="M 82 162 A 30 30 0 0 1 205 162" fill="none" stroke="#111820" stroke-width="12" stroke-linecap="round"/>
            <path d="M 355 162 A 26 26 0 0 1 430 162" fill="none" stroke="#111820" stroke-width="12" stroke-linecap="round"/>

            <!-- Roată spate 1 -->
            <g class="ubc-wheel-rear1">
                <circle cx="110" cy="172" r="28" fill="#0A0E12"/>
                <circle cx="110" cy="172" r="22" fill="#1A2028"/>
                <circle cx="110" cy="172" r="14" fill="#2D3748"/>
                <circle cx="110" cy="172" r="5"  fill="#0A0E12"/>
                <line x1="110" y1="155" x2="110" y2="189" stroke="#4A5568" stroke-width="3" stroke-linecap="round"/>
                <line x1="93"  y1="172" x2="127" y2="172" stroke="#4A5568" stroke-width="3" stroke-linecap="round"/>
                <line x1="98"  y1="159" x2="122" y2="185" stroke="#4A5568" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="122" y1="159" x2="98"  y2="185" stroke="#4A5568" stroke-width="2.5" stroke-linecap="round"/>
            </g>

            <!-- Roată spate 2 (tandem) -->
            <g class="ubc-wheel-rear2">
                <circle cx="176" cy="172" r="28" fill="#0A0E12"/>
                <circle cx="176" cy="172" r="22" fill="#1A2028"/>
                <circle cx="176" cy="172" r="14" fill="#2D3748"/>
                <circle cx="176" cy="172" r="5"  fill="#0A0E12"/>
                <line x1="176" y1="155" x2="176" y2="189" stroke="#4A5568" stroke-width="3" stroke-linecap="round"/>
                <line x1="159" y1="172" x2="193" y2="172" stroke="#4A5568" stroke-width="3" stroke-linecap="round"/>
                <line x1="164" y1="159" x2="188" y2="185" stroke="#4A5568" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="188" y1="159" x2="164" y2="185" stroke="#4A5568" stroke-width="2.5" stroke-linecap="round"/>
            </g>

            <!-- Roată față (sub cabină) -->
            <g class="ubc-wheel-front">
                <circle cx="393" cy="172" r="28" fill="#0A0E12"/>
                <circle cx="393" cy="172" r="22" fill="#1A2028"/>
                <circle cx="393" cy="172" r="14" fill="#2D3748"/>
                <circle cx="393" cy="172" r="5"  fill="#0A0E12"/>
                <line x1="393" y1="155" x2="393" y2="189" stroke="#4A5568" stroke-width="3" stroke-linecap="round"/>
                <line x1="376" y1="172" x2="410" y2="172" stroke="#4A5568" stroke-width="3" stroke-linecap="round"/>
                <line x1="381" y1="159" x2="405" y2="185" stroke="#4A5568" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="405" y1="159" x2="381" y2="185" stroke="#4A5568" stroke-width="2.5" stroke-linecap="round"/>
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
                    <!-- Praf la intrare -->
                    <div class="ubc-intro-dust">
                        <span></span><span></span><span></span>
                    </div>
                </div>

                <!-- Stream beton care curge din toba -->
                <div class="ubc-pour-stream"></div>

                <!-- Splash la baza streamului -->
                <div class="ubc-pour-splash"></div>

                <!-- Bara de incarcare -->
                <div class="ubc-intro-progress">
                    <div class="ubc-intro-progress-label">Se toarnă betonul...</div>
                    <div class="ubc-intro-progress-track">
                        <div class="ubc-intro-progress-fill"></div>
                    </div>
                    <div class="ubc-intro-progress-pct" id="ubc-intro-pct">0%</div>
                </div>

            </div>
        `;

        document.body.appendChild(overlay);

        // ─── Counter procentaj animat în timp real ────────
        setTimeout(() => {
            const pctEl = document.getElementById('ubc-intro-pct');
            if (!pctEl) return;
            const startTime = performance.now();
            const tick = (now) => {
                const elapsed  = Math.min(now - startTime, POUR_DUR_MS);
                const progress = elapsed / POUR_DUR_MS;
                // Ease-out pentru ca procentul sa creasca mai incet spre final
                const eased    = 1 - Math.pow(1 - progress, 2);
                const pct      = Math.round(eased * 100);
                pctEl.textContent = pct + '%';
                if (elapsed < POUR_DUR_MS) {
                    requestAnimationFrame(tick);
                } else {
                    pctEl.textContent = '100%';
                }
            };
            requestAnimationFrame(tick);
        }, POUR_DELAY_MS);

        // ─── Fade-out overlay dupa turnare + iesire camion ─
        setTimeout(() => {
            overlay.classList.add('ubc-intro--fadeout');
            setTimeout(() => {
                overlay.remove();
                document.body.style.overflow = '';
            }, 700);
        }, FADEOUT_MS);
    }

    // ─── Inițializare ─────────────────────────────────────
    injectStyles();
    document.body.style.overflow = 'hidden';

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', buildIntro);
    } else {
        buildIntro();
    }

    console.log('%c[UBC Intro] ✅ Animație turnare beton activă', 'color:#2ECC71; font-weight:bold;');

})();
