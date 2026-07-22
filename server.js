/**
 * server.js — Server Express pentru site-ul UBC
 * Compilează SCSS → CSS la pornire și servește paginile EJS
 * Citește datele din data/utilaje.json și data/portofoliu.json
 * la fiecare request (hot-reload fără restart server).
 */

const express = require('express');
const sass    = require('sass');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = 3000;

// ─────────────────────────────────────────────
//  Compilare SCSS → public/css/main.css
// ─────────────────────────────────────────────
function compileScss() {
    try {
        const scssPath = path.join(__dirname, 'scss', 'main.scss');
        const cssPath  = path.join(__dirname, 'public', 'css', 'main.css');

        // Asigurăm că folderul public/css există
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
//  Rute
// ─────────────────────────────────────────────
app.get('/', (req, res) => {
    // Date citite la fiecare request → editezi JSON, dai refresh, gata
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
