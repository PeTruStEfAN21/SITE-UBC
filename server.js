/**
 * server.js — Server Express pentru site-ul UBC
 * Compilează SCSS → CSS la pornire și servește paginile EJS
 * Citește datele din data/utilaje.json și data/portofoliu.json
 * Încărcare securizată a parolelor din fișierul .env (ignorat de GitHub).
 */

const express = require('express');
const sass    = require('sass');
const path    = require('path');
const fs      = require('fs');

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

app.use(express.json());

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
//  API Autentificare Admin (Verificare pe server)
// ─────────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
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
    const utilaje  = readJson('data/utilaje.json',    'utilaje');
    const proiecte = readJson('data/portofoliu.json', 'proiecte');

    res.render('index', { utilaje, proiecte });
});

// ─────────────────────────────────────────────
//  Start server
// ─────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🚀  Server UBC pornit pe → http://localhost:${PORT}\n`);
});
