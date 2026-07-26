/**
 * server.js — Server Express pentru site-ul UBC
 * Compilează SCSS → CSS la pornire și servește paginile EJS
 * Citește datele din data/utilaje.json și data/portofoliu.json
 * Încărcare securizată a parolelor din fișierul .env (ignorat de GitHub).
 */

const express   = require('express');
const sass      = require('sass');
const path      = require('path');
const fs        = require('fs');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');

// Încărcare variabile din .env (fără dependințe externe)
(function loadEnv() {
    try {
        const envPath = path.join(__dirname, '.env');
        if (fs.existsSync(envPath)) {
            const lines = fs.readFileSync(envPath, 'utf8').split('\n');
            lines.forEach(line => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    const [key, ...vals] = trimmed.split('=');
                    if (key && vals.length > 0) {
                        process.env[key.trim()] = vals.join('=').trim();
                    }
                }
            });
        }
    } catch (e) {
        console.warn('⚠️  Nu pot citi .env:', e.message);
    }
})();

const app  = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────
//  SECURITATE & NUTRITION HEADERS
// ─────────────────────────────────────────────
app.disable('x-powered-by'); // Ascunde că serverul rulează Express

// Configurare Helmet — Antete HTTP de securitate
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc:  ["'self'", "'unsafe-inline'"],
                styleSrc:   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc:    ["'self'", "https://fonts.gstatic.com"],
                imgSrc:     ["'self'", "data:", "blob:", "https:"],
                mediaSrc:   ["'self'", "https://res.cloudinary.com", "blob:"],
                frameSrc:   ["'self'", "https://www.google.com", "https://maps.google.com", "https://*.google.com"],
                connectSrc: ["'self'", "https://res.cloudinary.com", "https://api.cloudinary.com"]
            }
        },
        crossOriginEmbedderPolicy: false
    })
);

// Limitează dimensiunea cererilor JSON la 10kb (previne atacuri cu fișiere masive)
app.use(express.json({ limit: '10kb' }));

// Rate Limiter Global — Maxim 300 cereri / 15 min per IP
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: '⚠️ Prea multe cereri de pe această adresă IP. Încearcă din nou peste 15 minute.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(globalLimiter);

// Rate Limiter dedicat pentru Autentificare Admin — Maxim 5 încercări / 15 min
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: '🔒 Prea multe încercări eșuate de autentificare. Acces blocat 15 minute.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ─────────────────────────────────────────────
//  Compilare SCSS → public/css/main.css
// ─────────────────────────────────────────────
function compileScss() {
    try {
        const scssPath = path.join(__dirname, 'scss', 'main.scss');
        const cssPath  = path.join(__dirname, 'public', 'css', 'main.css');

        fs.mkdirSync(path.join(__dirname, 'public', 'css'), { recursive: true });

        const result = sass.compile(scssPath, { style: 'expanded' });
        fs.writeFileSync(cssPath, result.css);
        console.log('✅  SCSS compilat cu succes → public/css/main.css');
    } catch (err) {
        console.error('❌  Eroare la compilarea SCSS:', err.message);
    }
}

compileScss();

// ─────────────────────────────────────────────
//  Fișiere statice (CSS, JS, photos)
// ─────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─────────────────────────────────────────────
//  View engine — EJS
// ─────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─────────────────────────────────────────────
//  Helper: citire JSON cu fallback la array gol
// ─────────────────────────────────────────────
function readJson(relativePath, key) {
    try {
        const raw  = fs.readFileSync(path.join(__dirname, relativePath), 'utf8');
        const data = JSON.parse(raw);
        return data[key] || [];
    } catch (err) {
        console.warn(`⚠️  Nu pot citi ${relativePath}: ${err.message}`);
        return [];
    }
}

// ─────────────────────────────────────────────
//  API Autentificare Admin (Verificare pe server + Protecție Brute-Force)
// ─────────────────────────────────────────────
app.post('/api/admin/login', loginLimiter, (req, res) => {
    const { password } = req.body || {};
    const adminPass    = process.env.ADMIN_PASSWORD || 'UBCiment';

    if (password && password === adminPass) {
        return res.json({ success: true });
    }
    return res.status(401).json({ success: false, message: 'Parolă incorectă' });
});

// ─────────────────────────────────────────────
//  Rute
// ─────────────────────────────────────────────
app.get('/', (req, res) => {
    const utilaje   = readJson('data/utilaje.json',    'utilaje');
    const proiecte  = readJson('data/portofoliu.json', 'proiecte');
    const parteneri = readJson('data/parteneri.json',  'parteneri');

    res.render('index', { utilaje, proiecte, parteneri });
});

// ─────────────────────────────────────────────
//  Start server
// ─────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🚀  Server UBC pornit pe → http://localhost:${PORT}\n`);
});
