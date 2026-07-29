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

    // ─── SVG Autobetonieră MAN realistă ───
    function buildTruckSVG() {
        return `
        <svg viewBox="0 0 620 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img">
            <defs>
                <linearGradient id="cabGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#2C3E50"/>
                    <stop offset="100%" style="stop-color:#17232E"/>
                </linearGradient>
                <linearGradient id="drumGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#F0F4F8"/>
                    <stop offset="50%" style="stop-color:#D0DAE3"/>
                    <stop offset="100%" style="stop-color:#A8B8C5"/>
                </linearGradient>
                <linearGradient id="drumSide" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#B8C8D5"/>
                    <stop offset="100%" style="stop-color:#8A9FB0"/>
                </linearGradient>
                <linearGradient id="ubcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#2ECC71"/>
                    <stop offset="100%" style="stop-color:#1A9A50"/>
                </linearGradient>
                <linearGradient id="wheelGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:#2D3748"/>
                    <stop offset="100%" style="stop-color:#0A0E12"/>
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
            </defs>

            <!-- UMBRA SOL -->
            <ellipse cx="310" cy="212" rx="295" ry="8" fill="rgba(0,0,0,0.4)"/>

            <!-- ══════════════════════════════
                 ȘASIU / CADRU PRINCIPAL
                 ══════════════════════════════ -->
            <!-- Longeron superior -->
            <rect x="22" y="154" width="555" height="10" rx="3" fill="#0E1620"/>
            <!-- Longeron inferior -->
            <rect x="22" y="162" width="555" height="8"  rx="2" fill="#17222E"/>
            <!-- Traverse transversale -->
            <rect x="60"  y="151" width="8" height="20" rx="2" fill="#1A2A38"/>
            <rect x="115" y="151" width="8" height="20" rx="2" fill="#1A2A38"/>
            <rect x="175" y="151" width="8" height="20" rx="2" fill="#1A2A38"/>
            <rect x="240" y="151" width="8" height="20" rx="2" fill="#1A2A38"/>
            <rect x="305" y="151" width="8" height="20" rx="2" fill="#1A2A38"/>

            <!-- REZERVOR COMBUSTIBIL (pe șasiu) -->
            <rect x="255" y="138" width="68" height="24" rx="7" fill="#111C27"/>
            <rect x="259" y="142" width="60" height="14" rx="5" fill="#1A2A38"/>
            <rect x="316" y="136" width="6" height="6"  rx="3" fill="#2D3A47"/>

            <!-- SCĂRI URCARE (lateral stânga) -->
            <rect x="350" y="148" width="28" height="18" rx="3" fill="#0E1620"/>
            <rect x="353" y="152" width="22" height="10" rx="2" fill="#1A2A38"/>

            <!-- ══════════════════════════════
                 SUPORȚI TOBĂ
                 ══════════════════════════════ -->
            <!-- Suport spate (A-frame) -->
            <polygon points="38,118 60,118 70,164 28,164" fill="#111C27"/>
            <polygon points="42,120 56,120 64,162 34,162" fill="#1A2A38"/>
            <line x1="35" y1="145" x2="65" y2="145" stroke="#2D3A47" stroke-width="3"/>

            <!-- Suport față tobă -->
            <rect x="212" y="108" width="26" height="56" rx="4" fill="#111C27"/>
            <rect x="216" y="111" width="18" height="50" rx="3" fill="#1A2A38"/>
            <rect x="213" y="130" width="24" height="5"  rx="2" fill="#2D3A47"/>

            <!-- ══════════════════════════════
                 TOBĂ BETONIERĂ
                 (cilindrică înclinată ~12°)
                 ══════════════════════════════ -->
            <!-- Corp tobă principal -->
            <path d="
                M 46 52
                C 50 15, 95 10, 140 14
                C 185 18, 210 28, 216 55
                C 222 82, 214 120, 200 138
                C 184 155, 155 162, 115 158
                C 72 153, 44 138, 38 112
                C 32 88, 42 68, 46 52 Z
            " fill="url(#drumGrad)" stroke="#8A9FB0" stroke-width="1.5"/>

            <!-- Highlight superior tobă -->
            <path d="
                M 50 56 C 54 22, 95 14, 138 18
                C 180 22, 208 32, 212 56
                L 205 54 C 200 32, 175 22, 136 20
                C 96 17, 57 24, 52 56 Z
            " fill="rgba(255,255,255,0.18)"/>

            <!-- Nervuri elicoidale (lamele amestec) -->
            <path d="M 52 50 Q 130 22 210 58" fill="none" stroke="#94A8B8" stroke-width="6" stroke-linecap="round" opacity="0.75"/>
            <path d="M 42 74 Q 122 46 210 80" fill="none" stroke="#94A8B8" stroke-width="7" stroke-linecap="round" opacity="0.70"/>
            <path d="M 38 99 Q 116 72 206 104" fill="none" stroke="#94A8B8" stroke-width="7" stroke-linecap="round" opacity="0.68"/>
            <path d="M 38 122 Q 112 98 200 126" fill="none" stroke="#94A8B8" stroke-width="6" stroke-linecap="round" opacity="0.62"/>
            <path d="M 42 142 Q 110 122 192 144" fill="none" stroke="#94A8B8" stroke-width="5" stroke-linecap="round" opacity="0.55"/>

            <!-- Inel rotație spate (față vizibilă a tobei) -->
            <ellipse cx="48"  cy="90" rx="10" ry="44" fill="url(#drumSide)" stroke="#64788A" stroke-width="2"/>
            <!-- Inel față tobă (suport față) -->
            <ellipse cx="213" cy="90" rx="14" ry="52" fill="none" stroke="#4A6070" stroke-width="6"/>
            <ellipse cx="213" cy="90" rx="8"  ry="38" fill="none" stroke="#64788A" stroke-width="2"/>

            <!-- ── LOGO UBC pe tobă ── -->
            <g transform="translate(128, 84) rotate(-10)">
                <circle cx="0" cy="0" r="34" fill="url(#ubcGrad)"/>
                <circle cx="0" cy="0" r="34" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2.5"/>
                <circle cx="0" cy="0" r="29" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
                <text x="0" y="9" text-anchor="middle" fill="#FFFFFF"
                      font-size="22" font-weight="900"
                      font-family="Montserrat, Arial, sans-serif"
                      letter-spacing="2">UBC</text>
            </g>

            <!-- ══════════════════════════════
                 PÂLNIE ÎNCĂRCARE (sus spate)
                 ══════════════════════════════ -->
            <polygon points="34,10 72,10 76,52 30,52" fill="#111C27" stroke="#1A2A38" stroke-width="1"/>
            <polygon points="37,12 69,12 72,50 33,50" fill="#1A2A38"/>
            <rect x="32" y="8" width="38" height="6" rx="3" fill="#0E1620"/>

            <!-- Scăriță acces tobă -->
            <line x1="56" y1="14" x2="56" y2="120" stroke="#2D3A47" stroke-width="3"/>
            <line x1="49" y1="30"  x2="63" y2="30"  stroke="#2D3A47" stroke-width="2.5"/>
            <line x1="49" y1="46"  x2="63" y2="46"  stroke="#2D3A47" stroke-width="2.5"/>
            <line x1="49" y1="62"  x2="63" y2="62"  stroke="#2D3A47" stroke-width="2.5"/>
            <line x1="49" y1="78"  x2="63" y2="78"  stroke="#2D3A47" stroke-width="2.5"/>
            <line x1="49" y1="94"  x2="63" y2="94"  stroke="#2D3A47" stroke-width="2.5"/>
            <line x1="49" y1="110" x2="63" y2="110" stroke="#2D3A47" stroke-width="2.5"/>

            <!-- ══════════════════════════════
                 JGHEAB EVACUARE BETON (spate)
                 ══════════════════════════════ -->
            <!-- Braț principal jgheab -->
            <path d="M 35 154 L 5  188 L 16 193 L 48 158 Z"
                  fill="#374151" stroke="#1A2A38" stroke-width="1.5"/>
            <!-- Extensie jgheab -->
            <path d="M 5 188 L -4 205 L 8 210 L 16 193 Z" fill="#4B5563"/>
            <!-- Caneluri jgheab (detaliu) -->
            <line x1="8"  y1="190" x2="44" y2="157" stroke="#556070" stroke-width="1.5" opacity="0.6"/>
            <line x1="12" y1="193" x2="46" y2="160" stroke="#556070" stroke-width="1.5" opacity="0.4"/>

            <!-- ══════════════════════════════
                 CABINĂ MAN TGS (cab-over)
                 ══════════════════════════════ -->
            <!-- Corp principal cabină -->
            <path d="M 345 40 L 347 166 L 585 166 L 587 74
                     Q 584 40 555 37 Z"
                  fill="url(#cabGrad)"/>

            <!-- Panou față cabină (masca frontală) -->
            <path d="M 555 37 Q 588 42 590 76 L 590 166 L 572 166 L 572 48 Z"
                  fill="#101820"/>

            <!-- Grila frontală + faruri (MAN style) -->
            <!-- Cadru grila -->
            <rect x="574" y="80" width="16" height="72" rx="3" fill="#090F17"/>
            <!-- Grila orizontala -->
            <line x1="574" y1="90"  x2="590" y2="90"  stroke="#1A2A38" stroke-width="2.5"/>
            <line x1="574" y1="100" x2="590" y2="100" stroke="#1A2A38" stroke-width="2.5"/>
            <line x1="574" y1="110" x2="590" y2="110" stroke="#1A2A38" stroke-width="2.5"/>
            <line x1="574" y1="120" x2="590" y2="120" stroke="#1A2A38" stroke-width="2.5"/>
            <line x1="574" y1="130" x2="590" y2="130" stroke="#1A2A38" stroke-width="2.5"/>
            <line x1="574" y1="140" x2="590" y2="140" stroke="#1A2A38" stroke-width="2.5"/>

            <!-- Far principal (LED dreptunghiular) -->
            <rect x="575" y="82" width="13" height="22" rx="3" fill="#FFF8DC"/>
            <rect x="576" y="83" width="11" height="10" rx="2" fill="#FFE082" opacity="0.9" filter="url(#glow)"/>
            <!-- DRL strip -->
            <rect x="575" y="96" width="13" height="4" rx="2" fill="#90CAF9" opacity="0.85"/>
            <!-- Semnalizator -->
            <rect x="575" y="108" width="12" height="8" rx="2" fill="#FF8C00"/>

            <!-- Bara față / bumper -->
            <rect x="570" y="148" width="22" height="20" rx="4" fill="#090F17"/>
            <rect x="573" y="151" width="16" height="14" rx="3" fill="#111C27"/>
            <!-- Proiector ceata -->
            <circle cx="581" cy="158" r="4" fill="#FFFDE7" opacity="0.5"/>

            <!-- Parbriz panoramic mare -->
            <path d="M 356 46 L 552 46 L 552 102 L 356 112 Z"
                  fill="#1E4060" opacity="0.85"/>
            <!-- Reflex ploaie pe parbriz -->
            <path d="M 362 50 Q 440 47 510 50 L 505 62 Q 436 59 364 62 Z"
                  fill="rgba(255,255,255,0.06)"/>
            <!-- Stergatoare -->
            <line x1="380" y1="110" x2="460" y2="103" stroke="#0A1520" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="462" y1="103" x2="540" y2="100" stroke="#0A1520" stroke-width="2.5" stroke-linecap="round"/>

            <!-- Acoperis / spoiler -->
            <path d="M 347 34 L 563 34 L 570 44 L 345 44 Z" fill="#0A1520"/>
            <rect x="347" y="30" width="216" height="8" rx="3" fill="#0E1822"/>

            <!-- Lumini gabarit acoperiș (portocalii) -->
            <rect x="368" y="24" width="40" height="9" rx="4" fill="#F5A623" opacity="0.9"/>
            <rect x="420" y="24" width="14" height="9" rx="4" fill="#F5A623" opacity="0.7"/>
            <rect x="446" y="24" width="14" height="9" rx="4" fill="#F5A623" opacity="0.7"/>

            <!-- Separator ușă șofer / pasager -->
            <line x1="465" y1="42" x2="465" y2="166" stroke="#080E18" stroke-width="4"/>

            <!-- Geam ușă șofer (stânga) -->
            <rect x="357" y="116" width="104" height="42" rx="6" fill="#1E4060" opacity="0.8"/>
            <rect x="357" y="116" width="104" height="42" rx="6" fill="none" stroke="#080E18" stroke-width="1.5"/>
            <!-- Mâner ușă șofer -->
            <rect x="362" y="160" width="30" height="6" rx="3" fill="#1E2A38"/>
            <!-- Oglinda exterioara -->
            <rect x="335" y="62" width="13" height="28" rx="5" fill="#0A1520"/>
            <line x1="341" y1="74" x2="350" y2="74" stroke="#0A1520" stroke-width="4"/>
            <line x1="341" y1="82" x2="350" y2="82" stroke="#0A1520" stroke-width="4"/>

            <!-- Geam ușă pasager (dreapta) -->
            <rect x="470" y="50" width="96" height="46" rx="6" fill="#1E4060" opacity="0.78"/>
            <rect x="470" y="50" width="96" height="46" rx="6" fill="none" stroke="#080E18" stroke-width="1.5"/>
            <!-- Separator geam pasager -->
            <line x1="518" y1="42" x2="518" y2="166" stroke="#080E18" stroke-width="2.5"/>

            <!-- Tobă eșapament (lateral) -->
            <rect x="546" y="6" width="15" height="42" rx="6" fill="#111C27"/>
            <ellipse cx="553" cy="6" rx="10" ry="5" fill="#0A1218"/>
            <!-- Fum discret -->
            <circle cx="553" cy="-2" r="7"  fill="rgba(180,195,210,0.10)"/>
            <circle cx="550" cy="-12" r="9" fill="rgba(180,195,210,0.06)"/>

            <!-- Bandă reflectorizantă pe cabină -->
            <rect x="347" y="163" width="225" height="5" rx="2" fill="#F5A623" opacity="0.35"/>

            <!-- ══════════════════════════════
                 ROȚI (cu piulițe realiste)
                 ══════════════════════════════ -->
            <!-- Apărători roți spate -->
            <path d="M 78 170 A 34 34 0 0 1 216 170"
                  fill="none" stroke="#080E18" stroke-width="16" stroke-linecap="round"/>
            <!-- Apărătoare roată față -->
            <path d="M 460 170 A 30 30 0 0 1 542 170"
                  fill="none" stroke="#080E18" stroke-width="14" stroke-linecap="round"/>

            <!-- Roată spate 1 (axă tandem 1) -->
            <g class="ubc-wheel-rear1">
                <circle cx="112" cy="186" r="32" fill="#080C10"/>
                <circle cx="112" cy="186" r="26" fill="#131C26"/>
                <circle cx="112" cy="186" r="16" fill="#1E2C3A"/>
                <circle cx="112" cy="186" r="5.5" fill="#080C10"/>
                <!-- Piulițe roată (8 buc) -->
                <circle cx="112" cy="170" r="3.5" fill="#4A5568"/>
                <circle cx="112" cy="202" r="3.5" fill="#4A5568"/>
                <circle cx="96"  cy="175" r="3.5" fill="#4A5568"/>
                <circle cx="128" cy="175" r="3.5" fill="#4A5568"/>
                <circle cx="96"  cy="197" r="3.5" fill="#4A5568"/>
                <circle cx="128" cy="197" r="3.5" fill="#4A5568"/>
                <circle cx="96"  cy="186" r="3.5" fill="#4A5568"/>
                <circle cx="128" cy="186" r="3.5" fill="#4A5568"/>
            </g>

            <!-- Roată spate 2 (axă tandem 2) -->
            <g class="ubc-wheel-rear2">
                <circle cx="182" cy="186" r="32" fill="#080C10"/>
                <circle cx="182" cy="186" r="26" fill="#131C26"/>
                <circle cx="182" cy="186" r="16" fill="#1E2C3A"/>
                <circle cx="182" cy="186" r="5.5" fill="#080C10"/>
                <circle cx="182" cy="170" r="3.5" fill="#4A5568"/>
                <circle cx="182" cy="202" r="3.5" fill="#4A5568"/>
                <circle cx="166" cy="175" r="3.5" fill="#4A5568"/>
                <circle cx="198" cy="175" r="3.5" fill="#4A5568"/>
                <circle cx="166" cy="197" r="3.5" fill="#4A5568"/>
                <circle cx="198" cy="197" r="3.5" fill="#4A5568"/>
                <circle cx="166" cy="186" r="3.5" fill="#4A5568"/>
                <circle cx="198" cy="186" r="3.5" fill="#4A5568"/>
            </g>

            <!-- Roată față -->
            <g class="ubc-wheel-front">
                <circle cx="501" cy="186" r="32" fill="#080C10"/>
                <circle cx="501" cy="186" r="26" fill="#131C26"/>
                <circle cx="501" cy="186" r="16" fill="#1E2C3A"/>
                <circle cx="501" cy="186" r="5.5" fill="#080C10"/>
                <circle cx="501" cy="170" r="3.5" fill="#4A5568"/>
                <circle cx="501" cy="202" r="3.5" fill="#4A5568"/>
                <circle cx="485" cy="175" r="3.5" fill="#4A5568"/>
                <circle cx="517" cy="175" r="3.5" fill="#4A5568"/>
                <circle cx="485" cy="197" r="3.5" fill="#4A5568"/>
                <circle cx="517" cy="197" r="3.5" fill="#4A5568"/>
                <circle cx="485" cy="186" r="3.5" fill="#4A5568"/>
                <circle cx="517" cy="186" r="3.5" fill="#4A5568"/>
            </g>

        </svg>
        `;
    }

    // ─── Construire overlay ───────────────────────────────
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
