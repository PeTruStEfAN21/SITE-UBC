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

    // ─── SVG autobetoniera (Model realist 3 axe conform pozei) ───
    function buildTruckSVG() {
        return `
        <svg viewBox="0 0 460 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img">
            <ellipse cx="230" cy="188" rx="210" ry="6" fill="rgba(0,0,0,0.5)"/>
            <rect x="35" y="138" width="385" height="15" rx="3" fill="#1A2027"/>
            <rect x="40" y="142" width="375" height="6" rx="2" fill="#242C35"/>
            <rect x="205" y="146" width="115" height="12" rx="3" fill="#2C3540"/>
            <line x1="210" y1="152" x2="315" y2="152" stroke="#526070" stroke-width="2"/>
            <rect x="215" y="140" width="55" height="18" rx="4" fill="#222A33" stroke="#333F4C" stroke-width="1"/>
            <g class="ubc-drum-group">
                <polygon points="72,102 95,102 95,140 72,140" fill="#222A33"/>
                <polygon points="295,92 318,92 318,140 295,140" fill="#222A33"/>
                <path d="M 68 80 L 125 36 Q 225 18 292 70 Q 312 86 312 104 Q 292 120 225 132 L 125 128 Z" fill="#F2F6FA" stroke="#D1DBE5" stroke-width="2"/>
                <path d="M 125 36 Q 210 32 292 70" fill="none" stroke="#E1E8F0" stroke-width="6"/>
                <path d="M 115 50 Q 200 48 290 85" fill="none" stroke="#E1E8F0" stroke-width="8"/>
                <path d="M 100 70 Q 185 70 280 102" fill="none" stroke="#E1E8F0" stroke-width="8"/>
                <path d="M 90 92 Q 170 98 250 124" fill="none" stroke="#E1E8F0" stroke-width="6"/>
                <ellipse cx="298" cy="96" rx="14" ry="24" fill="none" stroke="#94A3B8" stroke-width="4"/>
                <g transform="translate(195, 78) rotate(-12)">
                    <circle cx="0" cy="0" r="28" fill="#27D045" opacity="0.95"/>
                    <circle cx="0" cy="0" r="28" fill="none" stroke="#FFFFFF" stroke-width="2.5"/>
                    <text x="0" y="8" text-anchor="middle" fill="#FFFFFF" font-size="20" font-weight="900" font-family="Montserrat, sans-serif" letter-spacing="1">UBC</text>
                </g>
            </g>
            <polygon points="48,28 75,32 68,72 45,66" fill="#222A33" stroke="#333F4C" stroke-width="1"/>
            <path d="M 52 72 L 20 118 L 30 122 L 62 78 Z" fill="#333F4C" stroke="#1E242B" stroke-width="1"/>
            <path d="M 20 118 L 5 135 L 14 138 L 30 122 Z" fill="#475569"/>
            <line x1="58" y1="36" x2="58" y2="102" stroke="#64748B" stroke-width="2.5"/>
            <line x1="54" y1="48" x2="62" y2="48" stroke="#64748B" stroke-width="2"/>
            <line x1="54" y1="62" x2="62" y2="62" stroke="#64748B" stroke-width="2"/>
            <line x1="54" y1="76" x2="62" y2="76" stroke="#64748B" stroke-width="2"/>
            <path d="M 320 58 L 412 58 Q 432 58 434 82 L 436 142 L 320 142 Z" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
            <path d="M 318 126 L 438 126 L 438 146 L 318 146 Z" fill="#1E242B"/>
            <rect x="424" y="130" width="10" height="10" rx="3" fill="#FFD580"/>
            <rect x="424" y="120" width="8" height="6" rx="2" fill="#FF9F43"/>
            <rect x="432" y="90" width="5" height="32" rx="2" fill="#0F172A"/>
            <line x1="432" y1="96" x2="437" y2="96" stroke="#334155" stroke-width="1.5"/>
            <line x1="432" y1="104" x2="437" y2="104" stroke="#334155" stroke-width="1.5"/>
            <line x1="432" y1="112" x2="437" y2="112" stroke="#334155" stroke-width="1.5"/>
            <polygon points="378,65 422,65 422,98 378,98" fill="#1E293B" opacity="0.9"/>
            <line x1="378" y1="65" x2="378" y2="98" stroke="#0F172A" stroke-width="2.5"/>
            <rect x="330" y="65" width="44" height="33" rx="4" fill="#243447" opacity="0.85"/>
            <rect x="330" y="65" width="44" height="33" rx="4" fill="none" stroke="#0F172A" stroke-width="1.5"/>
            <rect x="332" y="104" width="14" height="4" rx="2" fill="#334155"/>
            <rect x="426" y="72" width="7" height="18" rx="2" fill="#0F172A"/>
            <path d="M 80 152 A 28 28 0 0 1 215 152" fill="none" stroke="#1E293B" stroke-width="10" stroke-linecap="round"/>
            <path d="M 350 152 A 28 28 0 0 1 410 152" fill="none" stroke="#1E293B" stroke-width="10" stroke-linecap="round"/>
            <g class="ubc-wheel-rear1">
                <circle cx="110" cy="162" r="25" fill="#0F172A"/>
                <circle cx="110" cy="162" r="20" fill="#242C35"/>
                <circle cx="110" cy="162" r="13" fill="#334155"/>
                <circle cx="110" cy="162" r="5"  fill="#0F172A"/>
                <line x1="110" y1="148" x2="110" y2="176" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="96"  y1="162" x2="124" y2="162" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/>
            </g>
            <g class="ubc-wheel-rear2">
                <circle cx="175" cy="162" r="25" fill="#0F172A"/>
                <circle cx="175" cy="162" r="20" fill="#242C35"/>
                <circle cx="175" cy="162" r="13" fill="#334155"/>
                <circle cx="175" cy="162" r="5"  fill="#0F172A"/>
                <line x1="175" y1="148" x2="175" y2="176" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="161" y1="162" x2="189" y2="162" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/>
            </g>
            <g class="ubc-wheel-front">
                <circle cx="380" cy="162" r="25" fill="#0F172A"/>
                <circle cx="380" cy="162" r="20" fill="#242C35"/>
                <circle cx="380" cy="162" r="13" fill="#334155"/>
                <circle cx="380" cy="162" r="5"  fill="#0F172A"/>
                <line x1="380" y1="148" x2="380" y2="176" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="366" y1="162" x2="394" y2="162" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/>
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
