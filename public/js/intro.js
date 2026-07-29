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

    // ─── SVG Autobetonieră realistă (după model referință) ───
    function buildTruckSVG() {
        return `
        <svg viewBox="0 0 660 235" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img">
            <defs>
                <linearGradient id="drumWhite" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%"   style="stop-color:#FFFFFF"/>
                    <stop offset="40%"  style="stop-color:#F2F4F6"/>
                    <stop offset="100%" style="stop-color:#D8DCE0"/>
                </linearGradient>
                <linearGradient id="cabWhite" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%"   style="stop-color:#F8F8F8"/>
                    <stop offset="100%" style="stop-color:#DEDEDE"/>
                </linearGradient>
                <linearGradient id="cabFront" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   style="stop-color:#E0E0E0"/>
                    <stop offset="100%" style="stop-color:#C0C0C0"/>
                </linearGradient>
                <linearGradient id="ubcG" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%"   style="stop-color:#2ECC71"/>
                    <stop offset="100%" style="stop-color:#1A8A48"/>
                </linearGradient>
                <linearGradient id="drumEndGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   style="stop-color:#C8CDD3"/>
                    <stop offset="100%" style="stop-color:#E8ECEF"/>
                </linearGradient>
                <radialGradient id="wheelRad" cx="50%" cy="40%" r="60%">
                    <stop offset="0%"   style="stop-color:#3A4050"/>
                    <stop offset="100%" style="stop-color:#0A0C10"/>
                </radialGradient>
            </defs>

            <!-- ══ UMBRA SOL ══ -->
            <ellipse cx="325" cy="228" rx="315" ry="7" fill="rgba(0,0,0,0.28)"/>

            <!-- ══ CADRU / ȘASIU ══ -->
            <rect x="15"  y="162" width="605" height="13" rx="3" fill="#1A1A1F"/>
            <rect x="15"  y="173" width="605" height="7"  rx="2" fill="#242428"/>
            <!-- Traverse șasiu -->
            <rect x="55"  y="158" width="9" height="22" rx="2" fill="#1E1E22"/>
            <rect x="118" y="158" width="9" height="22" rx="2" fill="#1E1E22"/>
            <rect x="186" y="158" width="9" height="22" rx="2" fill="#1E1E22"/>
            <rect x="260" y="158" width="9" height="22" rx="2" fill="#1E1E22"/>
            <rect x="330" y="158" width="9" height="22" rx="2" fill="#1E1E22"/>
            <!-- Sub-cadru suport tobă -->
            <rect x="15" y="155" width="380" height="9" rx="3" fill="#242428"/>

            <!-- ══ SUPORT SPATE TOBĂ (A-FRAME) ══ -->
            <polygon points="28,122 56,122 68,168 16,168" fill="#1A1A1F"/>
            <polygon points="32,124 52,124 62,166 20,166" fill="#2A2A30"/>
            <rect x="16" y="145" width="52" height="6" rx="2" fill="#323238"/>

            <!-- ══ SUPORT FAȚĂ TOBĂ ══ -->
            <rect x="225" y="115" width="24" height="52" rx="4" fill="#1A1A1F"/>
            <rect x="229" y="118" width="16" height="46" rx="3" fill="#2A2A30"/>
            <rect x="223" y="135" width="28" height="6"  rx="2" fill="#323238"/>

            <!-- ══ REZERVOR COMBUSTIBIL ══ -->
            <rect x="265" y="140" width="72" height="26" rx="7" fill="#1A1A1F"/>
            <rect x="270" y="144" width="62" height="16" rx="5" fill="#242428"/>

            <!-- ════════════════════════════════
                 TOBĂ BETONIERĂ — forma realistă
                 ════════════════════════════════ -->
            <!-- Corp principal tobă (mare, albă, ușor înclinată) -->
            <path d="
                M 58 28
                C 62 8, 98 2, 155 4
                L 318 4
                C 368 4, 382 28, 382 85
                C 382 142, 368 162, 318 162
                L 80 162
                C 32 162, 18 140, 18 92
                C 18 48, 38 28, 58 28 Z
            " fill="url(#drumWhite)" stroke="#C8D0D8" stroke-width="1.5"/>

            <!-- Highlight superior (luciu) -->
            <path d="
                M 62 32
                C 66 14, 100 8, 154 8
                L 316 8
                C 362 8, 374 30, 374 82
                L 364 80
                C 362 34, 350 14, 314 12
                L 154 12
                C 102 12, 70 16, 66 34 Z
            " fill="rgba(255,255,255,0.55)"/>

            <!-- Umbra inferioară tobă -->
            <path d="
                M 62 158
                C 34 158, 22 138, 22 94
                L 30 96
                C 30 134, 40 154, 64 154
                L 316 154
                C 352 154, 368 136, 370 100
                L 378 102
                C 376 140, 360 162, 316 162
                L 80 162 Z
            " fill="rgba(0,0,0,0.07)"/>

            <!-- Nervuri elicoidale (lamele de amestecare) -->
            <path d="M 56 24 Q 220 4  375 44"  fill="none" stroke="#B8C4CC" stroke-width="5.5" stroke-linecap="round" opacity="0.85"/>
            <path d="M 36 54 Q 208 30 376 72"  fill="none" stroke="#B8C4CC" stroke-width="6.5" stroke-linecap="round" opacity="0.80"/>
            <path d="M 24 86 Q 200 62 376 100" fill="none" stroke="#B8C4CC" stroke-width="6.5" stroke-linecap="round" opacity="0.75"/>
            <path d="M 24 116 Q 196 94 372 128" fill="none" stroke="#B8C4CC" stroke-width="5.5" stroke-linecap="round" opacity="0.68"/>
            <path d="M 30 144 Q 196 126 368 152" fill="none" stroke="#B8C4CC" stroke-width="4.5" stroke-linecap="round" opacity="0.58"/>

            <!-- Față tobă spate (capac eliptic stânga) -->
            <ellipse cx="32" cy="95" rx="14" ry="67" fill="url(#drumEndGrad)" stroke="#A8B4BC" stroke-width="1.5"/>
            <ellipse cx="32" cy="95" rx="7"  ry="50" fill="none" stroke="#C0C8D0" stroke-width="1"/>

            <!-- Inel rotație față tobă (rulment) -->
            <ellipse cx="368" cy="83" rx="16" ry="79" fill="none" stroke="#7A8A95" stroke-width="8"/>
            <ellipse cx="368" cy="83" rx="8"  ry="62" fill="none" stroke="#A0B0B8" stroke-width="2"/>

            <!-- ── LOGO UBC ── -->
            <g transform="translate(210, 83)">
                <!-- Cerc alb fundal -->
                <circle cx="0" cy="0" r="58" fill="rgba(255,255,255,0.95)"/>
                <!-- Cerc verde UBC -->
                <circle cx="0" cy="0" r="52" fill="url(#ubcG)"/>
                <circle cx="0" cy="0" r="52" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2.5"/>
                <!-- Inel interior -->
                <circle cx="0" cy="0" r="44" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
                <!-- Text UBC -->
                <text x="0" y="12" text-anchor="middle" fill="#FFFFFF"
                      font-size="30" font-weight="900"
                      font-family="Montserrat, Arial Black, sans-serif"
                      letter-spacing="3">UBC</text>
            </g>

            <!-- ══ JGHEAB EVACUARE BETON (spate-stânga) ══ -->
            <!-- Braț principal -->
            <path d="M 24 158 L -8 198 L 6 204 L 40 164 Z"
                  fill="#5A6068" stroke="#3A4048" stroke-width="1.5"/>
            <!-- Extensie rabatabilă -->
            <path d="M -8 198 L -20 218 L -6 224 L 6 204 Z"
                  fill="#6A7078"/>
            <!-- Caneluri jgheab -->
            <line x1="-5"  y1="200" x2="36" y2="162" stroke="#7A8088" stroke-width="1.5" opacity="0.6"/>
            <line x1="-10" y1="204" x2="32" y2="166" stroke="#7A8088" stroke-width="1"   opacity="0.4"/>

            <!-- ══ SCĂRIȚĂ ACCES TOBĂ (față-dreapta la noi = stânga în imagine) ══ -->
            <!-- Montant stânga -->
            <rect x="384" y="14" width="6" height="148" rx="2" fill="#A0A8B0"/>
            <!-- Montant dreapta -->
            <rect x="410" y="14" width="6" height="148" rx="2" fill="#A0A8B0"/>
            <!-- Trepte scăriță -->
            <rect x="384" y="24"  width="32" height="6" rx="2" fill="#8A9298"/>
            <rect x="384" y="40"  width="32" height="6" rx="2" fill="#8A9298"/>
            <rect x="384" y="56"  width="32" height="6" rx="2" fill="#8A9298"/>
            <rect x="384" y="72"  width="32" height="6" rx="2" fill="#8A9298"/>
            <rect x="384" y="88"  width="32" height="6" rx="2" fill="#8A9298"/>
            <rect x="384" y="104" width="32" height="6" rx="2" fill="#8A9298"/>
            <rect x="384" y="120" width="32" height="6" rx="2" fill="#8A9298"/>
            <rect x="384" y="136" width="32" height="6" rx="2" fill="#8A9298"/>
            <!-- Platformă pâlnie sus -->
            <rect x="382" y="8" width="38" height="10" rx="3" fill="#B0B8C0"/>
            <polygon points="380,0 422,0 425,10 377,10" fill="#9AA2AA"/>

            <!-- ══════════════════════════════════
                 CABINĂ (Hino / Asian cab-over, ALBĂ)
                 ══════════════════════════════════ -->
            <!-- Corp cabină principal — ALBY -->
            <path d="
                M 418 62
                C 422 40, 448 24, 480 22
                L 580 22
                Q 616 22 622 58
                L 624 178
                L 416 178 Z
            " fill="url(#cabWhite)" stroke="#C8C8C8" stroke-width="1.5"/>

            <!-- Față cabină (panou frontal) -->
            <path d="
                M 580 22 Q 620 26 624 60
                L 624 178 L 608 178 L 608 32 Z
            " fill="url(#cabFront)"/>

            <!-- Panou sub parbriz (capota rotunjita) -->
            <path d="
                M 418 120 L 618 120 L 622 135 L 416 135 Z
            " fill="#E0E0E0"/>

            <!-- Parbriz mare ══ -->
            <path d="M 428 68 L 606 68 L 606 118 L 428 122 Z"
                  fill="#4A6E85" opacity="0.72"/>
            <!-- Highlight parbriz -->
            <path d="M 433 71 Q 515 69 570 71 L 566 81 Q 512 79 435 81 Z"
                  fill="rgba(255,255,255,0.14)"/>
            <!-- Ștergătoare -->
            <line x1="446" y1="120" x2="530" y2="117" stroke="#2A2A2A" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="533" y1="117" x2="600" y2="115" stroke="#2A2A2A" stroke-width="2" stroke-linecap="round"/>

            <!-- Acoperiș cabină + spoiler -->
            <path d="M 420 60 L 610 60 L 615 68 L 418 68 Z" fill="#D5D5D5"/>
            <rect x="420" y="54" width="194" height="8" rx="3" fill="#C8C8C8"/>

            <!-- Lumini gabarit acoperiș (portocalii) -->
            <rect x="440" y="46" width="42" height="10" rx="4" fill="#F0A020" opacity="0.9"/>
            <rect x="494" y="46" width="18" height="10" rx="4" fill="#F0A020" opacity="0.75"/>
            <rect x="522" y="46" width="18" height="10" rx="4" fill="#F0A020" opacity="0.75"/>

            <!-- Separator ușă șofer / pasager -->
            <line x1="514" y1="62" x2="514" y2="178" stroke="#B8B8B8" stroke-width="3"/>

            <!-- Geam șofer (ușa stânga) -->
            <rect x="430" y="126" width="80" height="44" rx="5" fill="#4A6E85" opacity="0.68"/>
            <rect x="430" y="126" width="80" height="44" rx="5" fill="none" stroke="#B0B0B0" stroke-width="1.5"/>
            <!-- Mâner ușă -->
            <rect x="436" y="172" width="28" height="6" rx="3" fill="#A0A0A8"/>

            <!-- Geam pasager (ușa dreapta) -->
            <rect x="518" y="72" width="84" height="44" rx="5" fill="#4A6E85" opacity="0.62"/>
            <rect x="518" y="72" width="84" height="44" rx="5" fill="none" stroke="#B0B0B0" stroke-width="1.5"/>
            <line x1="560" y1="62" x2="560" y2="178" stroke="#B8B8B8" stroke-width="2"/>

            <!-- Treaptă urcare șofer -->
            <rect x="416" y="162" width="36" height="18" rx="4" fill="#808088"/>
            <rect x="420" y="166" width="28" height="10" rx="3" fill="#6A6A72"/>

            <!-- Oglindă retrovizoare -->
            <rect x="396" y="72" width="22" height="30" rx="5" fill="#D5D5D5" stroke="#B8B8B8" stroke-width="1.5"/>
            <line x1="408" y1="82" x2="420" y2="82" stroke="#C0C0C0" stroke-width="3.5"/>
            <line x1="408" y1="91" x2="420" y2="91" stroke="#C0C0C0" stroke-width="3.5"/>

            <!-- Grila frontală + far + semnalizator -->
            <rect x="608" y="76" width="16" height="75" rx="3" fill="#D5D5D5"/>
            <!-- Bare grila -->
            <line x1="608" y1="86"  x2="624" y2="86"  stroke="#B0B0B0" stroke-width="2.5"/>
            <line x1="608" y1="96"  x2="624" y2="96"  stroke="#B0B0B0" stroke-width="2.5"/>
            <line x1="608" y1="106" x2="624" y2="106" stroke="#B0B0B0" stroke-width="2.5"/>
            <line x1="608" y1="116" x2="624" y2="116" stroke="#B0B0B0" stroke-width="2.5"/>
            <line x1="608" y1="126" x2="624" y2="126" stroke="#B0B0B0" stroke-width="2.5"/>
            <line x1="608" y1="136" x2="624" y2="136" stroke="#B0B0B0" stroke-width="2.5"/>
            <!-- Far (oval galben/amber, tip Hino) -->
            <ellipse cx="616" cy="90" rx="7" ry="12" fill="#FFD54F" stroke="#F0A000" stroke-width="1.5"/>
            <ellipse cx="616" cy="90" rx="5" ry="8"  fill="#FFE082" opacity="0.7"/>
            <!-- Semnalizator -->
            <rect x="610" y="106" width="13" height="10" rx="3" fill="#FF9800"/>
            <!-- Bara / bumper față -->
            <rect x="604" y="152" width="22" height="26" rx="5" fill="#D0D0D0" stroke="#B8B8B8" stroke-width="1"/>
            <rect x="607" y="156" width="16" height="18" rx="3" fill="#C0C0C0"/>
            <!-- Proiector ceata -->
            <circle cx="616" cy="165" r="5" fill="#FFFDE7" opacity="0.6"/>

            <!-- ══ APĂRĂTORI ROȚI (FENDERS) ══ -->
            <!-- Spate -->
            <path d="M 92 175 A 40 40 0 0 1 254 175"
                  fill="none" stroke="#111118" stroke-width="20" stroke-linecap="round"/>
            <!-- Față -->
            <path d="M 470 175 A 36 36 0 0 1 580 175"
                  fill="none" stroke="#111118" stroke-width="18" stroke-linecap="round"/>

            <!-- ══ ROȚI CU HUB CAP ══ -->
            <!-- Roată spate 1 (tandem 1) -->
            <g class="ubc-wheel-rear1">
                <circle cx="130" cy="196" r="36" fill="url(#wheelRad)"/>
                <circle cx="130" cy="196" r="28" fill="#161820"/>
                <circle cx="130" cy="196" r="20" fill="#242830"/>
                <!-- Hub cap argintiu -->
                <circle cx="130" cy="196" r="14" fill="#909098" stroke="#787880" stroke-width="1.5"/>
                <circle cx="130" cy="196" r="8"  fill="#707078"/>
                <circle cx="130" cy="196" r="4"  fill="#505058"/>
                <!-- Piulițe (6x) -->
                <circle cx="130" cy="178" r="4.5" fill="#5A6068"/>
                <circle cx="130" cy="214" r="4.5" fill="#5A6068"/>
                <circle cx="114" cy="184" r="4.5" fill="#5A6068"/>
                <circle cx="146" cy="184" r="4.5" fill="#5A6068"/>
                <circle cx="114" cy="208" r="4.5" fill="#5A6068"/>
                <circle cx="146" cy="208" r="4.5" fill="#5A6068"/>
            </g>

            <!-- Roată spate 2 (tandem 2) -->
            <g class="ubc-wheel-rear2">
                <circle cx="216" cy="196" r="36" fill="url(#wheelRad)"/>
                <circle cx="216" cy="196" r="28" fill="#161820"/>
                <circle cx="216" cy="196" r="20" fill="#242830"/>
                <circle cx="216" cy="196" r="14" fill="#909098" stroke="#787880" stroke-width="1.5"/>
                <circle cx="216" cy="196" r="8"  fill="#707078"/>
                <circle cx="216" cy="196" r="4"  fill="#505058"/>
                <circle cx="216" cy="178" r="4.5" fill="#5A6068"/>
                <circle cx="216" cy="214" r="4.5" fill="#5A6068"/>
                <circle cx="200" cy="184" r="4.5" fill="#5A6068"/>
                <circle cx="232" cy="184" r="4.5" fill="#5A6068"/>
                <circle cx="200" cy="208" r="4.5" fill="#5A6068"/>
                <circle cx="232" cy="208" r="4.5" fill="#5A6068"/>
            </g>

            <!-- Roată față -->
            <g class="ubc-wheel-front">
                <circle cx="525" cy="196" r="36" fill="url(#wheelRad)"/>
                <circle cx="525" cy="196" r="28" fill="#161820"/>
                <circle cx="525" cy="196" r="20" fill="#242830"/>
                <circle cx="525" cy="196" r="14" fill="#909098" stroke="#787880" stroke-width="1.5"/>
                <circle cx="525" cy="196" r="8"  fill="#707078"/>
                <circle cx="525" cy="196" r="4"  fill="#505058"/>
                <circle cx="525" cy="178" r="4.5" fill="#5A6068"/>
                <circle cx="525" cy="214" r="4.5" fill="#5A6068"/>
                <circle cx="509" cy="184" r="4.5" fill="#5A6068"/>
                <circle cx="541" cy="184" r="4.5" fill="#5A6068"/>
                <circle cx="509" cy="208" r="4.5" fill="#5A6068"/>
                <circle cx="541" cy="208" r="4.5" fill="#5A6068"/>
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
