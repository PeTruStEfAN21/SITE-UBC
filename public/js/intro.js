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

        /* ── Stream beton (curge din jgheabul din spate) ── */
        .ubc-pour-stream {
            position: absolute;
            /* Aliniat exact sub jgheabul de evacuare din spatele betonierei */
            left: calc(50% + 155px);
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
            left: calc(50% + 140px);
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

        /* Camion: intra din dreapta → parcare → iesire stanga */
        @keyframes ubcTruckPark {
            0%   { transform: translateX(calc(100vw + 350px)); animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94); }
            /* Ajunge la centru si se opreste */
            34%  { transform: translateX(calc(50vw - 360px)); animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1); }
            /* Hold la parcare */
            36%  { transform: translateX(calc(50vw - 360px)); }
            79%  { transform: translateX(calc(50vw - 360px)); animation-timing-function: ease-in; }
            /* Iesire stanga */
            100% { transform: translateX(calc(-100vw - 350px)); }
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
                left: calc(50% + 80px);
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

    // ─── SVG Autobetonieră realistă (Proporții perfecte & Model fidel) ───
    function buildTruckSVG() {
        return `
        <svg viewBox="0 0 680 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img">
            <defs>
                <!-- Gradiente culori -->
                <linearGradient id="cabBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%"   style="stop-color:#FFFFFF"/>
                    <stop offset="65%"  style="stop-color:#EDF2F7"/>
                    <stop offset="100%" style="stop-color:#CBD5E1"/>
                </linearGradient>

                <linearGradient id="drumMainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%"   style="stop-color:#FFFFFF"/>
                    <stop offset="35%"  style="stop-color:#F8FAFC"/>
                    <stop offset="75%"  style="stop-color:#E2E8F0"/>
                    <stop offset="100%" style="stop-color:#CBD5E1"/>
                </linearGradient>

                <linearGradient id="ubcLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%"   style="stop-color:#2ECC71"/>
                    <stop offset="50%"  style="stop-color:#27AE60"/>
                    <stop offset="100%" style="stop-color:#1E8449"/>
                </linearGradient>

                <linearGradient id="ubcAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%"   style="stop-color:#00B4DB"/>
                    <stop offset="100%" style="stop-color:#0083B0"/>
                </linearGradient>

                <radialGradient id="tyreGrad" cx="50%" cy="40%" r="55%">
                    <stop offset="0%"   style="stop-color:#2C3238"/>
                    <stop offset="100%" style="stop-color:#121518"/>
                </radialGradient>

                <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%"   style="stop-color:#E2E8F0"/>
                    <stop offset="50%"  style="stop-color:#CBD5E1"/>
                    <stop offset="100%" style="stop-color:#94A3B8"/>
                </linearGradient>
            </defs>

            <!-- ══ UMBRA SOL ══ -->
            <ellipse cx="340" cy="232" rx="320" ry="7" fill="rgba(0,0,0,0.35)"/>

            <!-- ══ ȘASIU & CADRU METALIC ══ -->
            <rect x="110" y="166" width="530" height="14" rx="3" fill="#1E293B"/>
            <rect x="110" y="177" width="530" height="6"  rx="2" fill="#0F172A"/>

            <!-- PROTECȚIE LATERALĂ METALICĂ (SIDE GUARD — GRI METALIC ÎNTUNECAT, NU GARD ALB) -->
            <rect x="250" y="165" width="180" height="6" rx="2" fill="#475569" stroke="#334155" stroke-width="1"/>
            <rect x="250" y="175" width="180" height="6" rx="2" fill="#475569" stroke="#334155" stroke-width="1"/>
            <rect x="260" y="160" width="7"   height="24" rx="2" fill="#334155"/>
            <rect x="335" y="160" width="7"   height="24" rx="2" fill="#334155"/>
            <rect x="410" y="160" width="7"   height="24" rx="2" fill="#334155"/>

            <!-- Echipament rezervor/comenzi în spatele cabinei -->
            <rect x="260" y="132" width="65" height="28" rx="4" fill="#334155" stroke="#1E293B" stroke-width="1"/>
            <rect x="265" y="136" width="55" height="16" rx="3" fill="#475569"/>
            <circle cx="310" cy="144" r="3.5" fill="#94A3B8"/>

            <!-- APĂRĂTORI ROȚI SPATE (FENDERS PROFILATE, ÎNTUNECATE) -->
            <path d="M 430 178 L 440 162 L 610 162 L 620 178 Z" fill="#1E293B"/>
            <rect x="438" y="160" width="174" height="6" rx="2" fill="#0F172A"/>

            <!-- ══════════════════════════════════
                 CABINĂ (PROPORȚII PERFECTE — MODEL HINO/MAN ALB)
                 ══════════════════════════════════ -->
            <!-- Corp cabină principal alb -->
            <path d="
                M 125 55
                C 135 38, 155 30, 185 28
                L 235 28
                C 240 28, 245 32, 246 38
                L 248 178
                L 115 178
                L 115 95
                C 115 78, 120 65, 125 55 Z
            " fill="url(#cabBodyGrad)" stroke="#CBD5E1" stroke-width="1.5"/>

            <!-- Bara protecție & pasaj roată față (întunecat, bine proporționat) -->
            <path d="
                M 115 145 L 115 178 L 140 178 L 140 174
                A 38 38 0 0 0 212 174 L 248 174 L 248 145 Z
            " fill="#334155"/>
            <path d="M 115 145 L 248 145 L 248 152 L 115 152 Z" fill="#1E293B"/>

            <!-- Semnalizator colț față portocaliu -->
            <path d="M 116 122 Q 116 140 126 143 L 130 122 Z" fill="#FF9800"/>

            <!-- Parbriz (Geam închis la culoare) -->
            <path d="M 132 60 L 236 60 L 236 106 L 128 106 Z" fill="#1E293B"/>
            <path d="M 136 63 Q 185 61 228 63 L 223 74 Q 183 72 138 74 Z" fill="rgba(255,255,255,0.15)"/>
            <path d="M 132 60 L 236 60 L 236 106 L 128 106 Z" fill="none" stroke="#0F172A" stroke-width="2.5"/>
            <!-- Ștergătoare -->
            <line x1="145" y1="102" x2="190" y2="98" stroke="#0F172A" stroke-width="2" stroke-linecap="round"/>
            <line x1="192" y1="98"  x2="232" y2="95" stroke="#0F172A" stroke-width="2" stroke-linecap="round"/>

            <!-- Geam ușă laterală cu decupaj oblic -->
            <path d="M 152 112 L 216 112 L 216 68 L 152 68 Z" fill="#1E293B" stroke="#0F172A" stroke-width="1.5"/>
            <polygon points="152,112 178,112 152,94" fill="#E2E8F0"/>

            <!-- Grilă ventilație verticală în spatele ușii -->
            <rect x="224" y="66" width="16" height="66" rx="2" fill="#0F172A"/>
            <line x1="227" y1="74"  x2="236" y2="74"  stroke="#475569" stroke-width="1.5"/>
            <line x1="227" y1="82"  x2="236" y2="82"  stroke="#475569" stroke-width="1.5"/>
            <line x1="227" y1="90"  x2="236" y2="90"  stroke="#475569" stroke-width="1.5"/>
            <line x1="227" y1="98"  x2="236" y2="98"  stroke="#475569" stroke-width="1.5"/>
            <line x1="227" y1="106" x2="236" y2="106" stroke="#475569" stroke-width="1.5"/>
            <line x1="227" y1="114" x2="236" y2="114" stroke="#475569" stroke-width="1.5"/>

            <!-- Mâner ușă -->
            <rect x="190" y="122" width="20" height="5" rx="2.5" fill="#0F172A"/>

            <!-- Oglindă retrovizoare pe braț -->
            <rect x="106" y="70" width="13" height="30" rx="3.5" fill="#1E293B" stroke="#0F172A" stroke-width="1"/>
            <line x1="118" y1="77" x2="132" y2="75" stroke="#0F172A" stroke-width="3"/>
            <line x1="118" y1="90" x2="132" y2="92" stroke="#0F172A" stroke-width="3"/>


            <!-- ══════════════════════════════════
                 TOBĂ BETONIERĂ (ÎNCLINATĂ, ALBĂ CURATĂ)
                 ══════════════════════════════════ -->
            <g transform="rotate(-12, 420, 95)">
                <!-- Suport rotație față tobă -->
                <rect x="250" y="55" width="30" height="80" rx="6" fill="#334155"/>
                <rect x="254" y="59" width="22" height="72" rx="4" fill="#475569"/>

                <!-- Siluetă corp principal tobă -->
                <path d="
                    M 270 70
                    C 290 35, 340 22, 420 22
                    C 500 22, 550 45, 570 70
                    C 585 90, 580 105, 565 120
                    C 545 140, 490 155, 410 155
                    C 330 155, 285 138, 270 115
                    C 260 98, 260 82, 270 70 Z
                " fill="url(#drumMainGrad)" stroke="#CBD5E1" stroke-width="2"/>

                <!-- Linii fine de umbră/luciu pe lungimea tobei -->
                <path d="M 275 62 C 340 30, 470 30, 565 65"  fill="none" stroke="#FFFFFF" stroke-width="8" opacity="0.6" stroke-linecap="round"/>
                <path d="M 270 75 C 335 48, 480 48, 572 82"  fill="none" stroke="#E2E8F0" stroke-width="7" opacity="0.5" stroke-linecap="round"/>
                <path d="M 266 98 C 330 75, 485 75, 570 104" fill="none" stroke="#E2E8F0" stroke-width="7" opacity="0.5" stroke-linecap="round"/>
                <path d="M 268 116 C 335 100, 480 100, 562 122" fill="none" stroke="#CBD5E1" stroke-width="6" opacity="0.4" stroke-linecap="round"/>

                <!-- Inel spate tobă -->
                <ellipse cx="566" cy="92" rx="14" ry="42" fill="none" stroke="#64748B" stroke-width="7"/>
                <ellipse cx="566" cy="92" rx="8"  ry="34" fill="none" stroke="#94A3B8" stroke-width="2"/>

                <!-- EMBLEMĂ / LOGO UBC ORIGINAL PERSONALIZAT PE TOBĂ -->
                <g transform="translate(420, 88)">
                    <!-- Cerc alb de fundal cu contur dublu verde -->
                    <circle cx="0" cy="0" r="48" fill="#FFFFFF" stroke="#27D045" stroke-width="3.5"/>
                    <circle cx="0" cy="0" r="42" fill="none" stroke="rgba(39, 208, 69, 0.25)" stroke-width="1.5"/>

                    <!-- Accent geometric verde jos -->
                    <path d="M -26 15 Q 0 24 26 15" fill="none" stroke="#27D045" stroke-width="3" stroke-linecap="round"/>

                    <!-- Text UBC (U verde, BC negru ca pe site) -->
                    <text x="0" y="5" text-anchor="middle" font-size="26" font-weight="900" font-family="'Montserrat', sans-serif" letter-spacing="1">
                        <tspan fill="#27D045">U</tspan><tspan fill="#0F172A">BC</tspan>
                    </text>

                    <!-- Subtext Stație Betoane -->
                    <text x="0" y="26" text-anchor="middle" fill="#64748B" font-size="6" font-weight="800" font-family="'Montserrat', sans-serif" letter-spacing="1.5">OLTENIȚA</text>
                </g>
            </g>


            <!-- ══════════════════════════════════
                 PÂLNIE SPATE, SCĂRIȚĂ & JGHEAB EVACUARE BETON
                 ══════════════════════════════════ -->
            <!-- Suport spate baza A-frame -->
            <polygon points="560,115 590,115 605,170 545,170" fill="#1E293B"/>
            <polygon points="565,118 585,118 598,167 552,167" fill="#334155"/>

            <!-- Pâlnie de încărcare albă sus -->
            <path d="M 570 30 L 625 30 L 610 80 L 575 75 Z" fill="#F8F9FA" stroke="#CBD5E1" stroke-width="1.5"/>
            <path d="M 575 33 L 620 33 L 606 76 L 579 72 Z" fill="#E2E8F0"/>

            <!-- SCĂRIȚĂ ALBĂ TUBULARĂ PE SPATE -->
            <g stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" fill="none">
                <line x1="595" y1="25" x2="595" y2="155"/>
                <line x1="618" y1="25" x2="618" y2="155"/>
                <line x1="595" y1="38"  x2="618" y2="38"/>
                <line x1="595" y1="52"  x2="618" y2="52"/>
                <line x1="595" y1="66"  x2="618" y2="66"/>
                <line x1="595" y1="80"  x2="618" y2="80"/>
                <line x1="595" y1="94"  x2="618" y2="94"/>
                <line x1="595" y1="108" x2="618" y2="108"/>
                <line x1="595" y1="122" x2="618" y2="122"/>
                <line x1="595" y1="136" x2="618" y2="136"/>
                <path d="M 590 25 C 590 12, 623 12, 623 25" stroke-width="2.5"/>
            </g>

            <!-- Jgheab evacuare beton metalic (pozitionat exact peste stream) -->
            <path d="M 580 125 L 655 158 L 648 172 L 575 138 Z" fill="#64748B" stroke="#334155" stroke-width="1.5"/>
            <path d="M 582 128 L 652 159 L 646 168 L 578 139 Z" fill="#94A3B8"/>


            <!-- ══════════════════════════════════
                 ROȚI CU JANTE METALICE DE CAMION
                 ══════════════════════════════════ -->
            <!-- Roată față (Sub cabină) -->
            <g class="ubc-wheel-front">
                <circle cx="175" cy="198" r="33" fill="url(#tyreGrad)"/>
                <circle cx="175" cy="198" r="28" fill="#181C20"/>
                <circle cx="175" cy="198" r="20" fill="url(#rimGrad)" stroke="#64748B" stroke-width="1.5"/>
                <circle cx="175" cy="198" r="14" fill="#475569"/>

                <circle cx="175" cy="182" r="2.2" fill="#1E293B"/>
                <circle cx="175" cy="214" r="2.2" fill="#1E293B"/>
                <circle cx="159" cy="198" r="2.2" fill="#1E293B"/>
                <circle cx="191" cy="198" r="2.2" fill="#1E293B"/>
                <circle cx="163" cy="186" r="2.2" fill="#1E293B"/>
                <circle cx="187" cy="186" r="2.2" fill="#1E293B"/>
                <circle cx="163" cy="210" r="2.2" fill="#1E293B"/>
                <circle cx="187" cy="210" r="2.2" fill="#1E293B"/>

                <circle cx="175" cy="198" r="8" fill="#1E293B" stroke="#94A3B8" stroke-width="1"/>
                <circle cx="175" cy="198" r="3" fill="#64748B"/>
            </g>

            <!-- Roată spate 1 (Tandem centru-dreapta) -->
            <g class="ubc-wheel-mid">
                <circle cx="475" cy="198" r="33" fill="url(#tyreGrad)"/>
                <circle cx="475" cy="198" r="28" fill="#181C20"/>
                <circle cx="475" cy="198" r="20" fill="url(#rimGrad)" stroke="#64748B" stroke-width="1.5"/>
                <circle cx="475" cy="198" r="14" fill="#475569"/>
                <circle cx="475" cy="182" r="2.2" fill="#1E293B"/>
                <circle cx="475" cy="214" r="2.2" fill="#1E293B"/>
                <circle cx="459" cy="198" r="2.2" fill="#1E293B"/>
                <circle cx="491" cy="198" r="2.2" fill="#1E293B"/>
                <circle cx="463" cy="186" r="2.2" fill="#1E293B"/>
                <circle cx="487" cy="186" r="2.2" fill="#1E293B"/>
                <circle cx="463" cy="210" r="2.2" fill="#1E293B"/>
                <circle cx="487" cy="210" r="2.2" fill="#1E293B"/>
                <circle cx="475" cy="198" r="8" fill="#1E293B" stroke="#94A3B8" stroke-width="1"/>
                <circle cx="475" cy="198" r="3" fill="#64748B"/>
            </g>

            <!-- Roată spate 2 (Tandem dreapta) -->
            <g class="ubc-wheel-rear">
                <circle cx="565" cy="198" r="33" fill="url(#tyreGrad)"/>
                <circle cx="565" cy="198" r="28" fill="#181C20"/>
                <circle cx="565" cy="198" r="20" fill="url(#rimGrad)" stroke="#64748B" stroke-width="1.5"/>
                <circle cx="565" cy="198" r="14" fill="#475569"/>
                <circle cx="565" cy="182" r="2.2" fill="#1E293B"/>
                <circle cx="565" cy="214" r="2.2" fill="#1E293B"/>
                <circle cx="549" cy="198" r="2.2" fill="#1E293B"/>
                <circle cx="581" cy="198" r="2.2" fill="#1E293B"/>
                <circle cx="553" cy="186" r="2.2" fill="#1E293B"/>
                <circle cx="577" cy="186" r="2.2" fill="#1E293B"/>
                <circle cx="553" cy="210" r="2.2" fill="#1E293B"/>
                <circle cx="577" cy="210" r="2.2" fill="#1E293B"/>
                <circle cx="565" cy="198" r="8" fill="#1E293B" stroke="#94A3B8" stroke-width="1"/>
                <circle cx="565" cy="198" r="3" fill="#64748B"/>
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
