/**
 * server.js — Server Express pentru site-ul UBC
 * Compilează SCSS → CSS la pornire și servește paginile EJS
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
//  Rute
// ─────────────────────────────────────────────
app.get('/', (req, res) => {
    res.render('index');
});

// ─────────────────────────────────────────────
//  Start server
// ─────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🚀  Server UBC pornit pe → http://localhost:${PORT}\n`);
});
