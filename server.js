/**
 * server.js — Server Express pentru site-ul UBC
 * Compilează SCSS → CSS la pornire și servește paginile EJS
 * Analytics Server-Side Real (IP, Locație România, Secțiuni vizitate, Click-uri)
 * Încărcare securizată a parolelor din fișierul .env (ignorat de GitHub).
 */

const express   = require('express');
const sass      = require('sass');
const path      = require('path');
const fs        = require('fs');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');

// GeoIP module
let geoip = null;
try {
    geoip = require('geoip-lite');
} catch(e) {
    console.warn('⚠️ Module geoip-lite not loaded yet');
}

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
app.disable('x-powered-by');

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

app.use(express.json({ limit: '10kb' }));

// Rate Limiter Global
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    message: '⚠️ Prea multe cereri de pe această adresă IP. Încearcă din nou peste 15 minute.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(globalLimiter);

// Rate Limiter dedicat pentru Autentificare Admin
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
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
//  Fișiere statice
// ─────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─────────────────────────────────────────────
//  View engine — EJS
// ─────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─────────────────────────────────────────────
//  SERVER-SIDE ANALYTICS & GEO-IP MOTOR REAL
// ─────────────────────────────────────────────
function resolveGeoLocation(ip) {
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return 'Județul Călărași (Oltenița / Local)';
    }

    if (geoip) {
        try {
            const geo = geoip.lookup(ip);
            if (geo) {
                const city = geo.city || '';
                const reg  = geo.region || '';
                if (geo.country === 'RO') {
                    if (city.includes('Oltenita') || city.includes('Calarasi') || reg === 'CL') {
                        return 'Județul Călărași (Oltenița)';
                    } else if (city.includes('Bucharest') || city.includes('Bucuresti') || reg === 'B' || reg === 'IF') {
                        return 'București & Ilfov';
                    } else if (city.includes('Ploiesti') || reg === 'PH') {
                        return 'Prahova (Ploiești)';
                    } else if (reg === 'GR' || city.includes('Giurgiu')) {
                        return 'Județul Giurgiu';
                    } else if (reg === 'IL' || city.includes('Slobozia')) {
                        return 'Ialomița (Slobozia)';
                    } else if (reg === 'CT' || city.includes('Constanta')) {
                        return 'Județul Constanța';
                    } else if (reg === 'CJ' || city.includes('Cluj')) {
                        return 'Județul Cluj';
                    } else if (reg === 'TM' || city.includes('Timisoara')) {
                        return 'Județul Timiș';
                    } else if (city) {
                        return `Județul ${city}`;
                    } else {
                        return 'România (Zone Diverse)';
                    }
                } else if (geo.country) {
                    return `${city ? city + ', ' : ''}${geo.country}`;
                }
            }
        } catch(e) {}
    }
    return 'Județul Călărași (Oltenița)';
}

function maskIp(rawIp) {
    if (!rawIp) return 'x.x.x.x';
    const parts = rawIp.split('.');
    if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.x.x`;
    }
    return rawIp.slice(0, 8) + '...';
}

function getDeviceType(ua) {
    if (/mobile/i.test(ua)) return 'Mobile';
    if (/ipad|tablet/i.test(ua)) return 'Tablet';
    return 'Desktop';
}

function recordAnalyticsEvent(req, payload = {}) {
    const filePath = path.join(__dirname, 'data', 'analytics.json');
    let data;
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        data = JSON.parse(raw);
    } catch(e) {
        data = {
            summary: { totalHits: 0, totalUniqueVisitors: 0, totalPageViews: 0, totalClicks: 0, totalCalculatorUses: 0 },
            visitors: {},
            dailyStats: {},
            pageViews: {},
            clickEvents: {},
            geoLocations: {},
            recentEvents: []
        };
    }

    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    if (ip.includes(',')) ip = ip.split(',')[0].trim();
    if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');

    const locationName = resolveGeoLocation(ip);
    const today = new Date().toISOString().slice(0, 10);
    const nowISO = new Date().toISOString();
    const ua = req.headers['user-agent'] || '';

    // Visitor Key (unica per IP si agent browser)
    const visitorKey = ip + '_' + ua.slice(0, 30);
    if (!data.visitors[visitorKey]) {
        data.visitors[visitorKey] = {
            ip: maskIp(ip),
            firstSeen: nowISO,
            lastSeen: nowISO,
            location: locationName,
            device: getDeviceType(ua),
            visitsCount: 1
        };
    } else {
        data.visitors[visitorKey].lastSeen = nowISO;
        data.visitors[visitorKey].visitsCount++;
    }
    data.summary.totalUniqueVisitors = Object.keys(data.visitors).length;
    data.summary.totalHits = (data.summary.totalHits || 0) + 1;

    // Geo-locations count
    data.geoLocations[locationName] = (data.geoLocations[locationName] || 0) + 1;

    // Daily breakdown
    if (!data.dailyStats[today]) {
        data.dailyStats[today] = { hits: 0, pageviews: 0, clicks: 0 };
    }
    data.dailyStats[today].hits++;

    // Tip eveniment
    const eventType = payload.eventType || 'pageview';
    const actionName = payload.name || payload.pageId || 'Acasă';

    if (eventType === 'pageview') {
        data.summary.totalPageViews = (data.summary.totalPageViews || 0) + 1;
        data.dailyStats[today].pageviews++;
        data.pageViews[actionName] = (data.pageViews[actionName] || 0) + 1;
    } else if (eventType === 'click' || eventType === 'cta') {
        data.summary.totalClicks = (data.summary.totalClicks || 0) + 1;
        data.dailyStats[today].clicks++;
        data.clickEvents[actionName] = (data.clickEvents[actionName] || 0) + 1;
    } else if (eventType === 'calculator') {
        data.summary.totalCalculatorUses = (data.summary.totalCalculatorUses || 0) + 1;
        const volStr = payload.volume ? ` (${payload.volume} m³)` : '';
        data.clickEvents['Calculator Beton' + volStr] = (data.clickEvents['Calculator Beton' + volStr] || 0) + 1;
    }

    // Jurnal evenimente recente (ultimele 50)
    if (!data.recentEvents) data.recentEvents = [];
    data.recentEvents.unshift({
        time: nowISO,
        type: eventType,
        action: actionName,
        location: locationName,
        ip: maskIp(ip),
        device: getDeviceType(ua)
    });
    if (data.recentEvents.length > 50) {
        data.recentEvents.pop();
    }

    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch(e) {
        console.warn('⚠️ Eroare salvare analytics:', e.message);
    }

    return data;
}

// ─────────────────────────────────────────────
//  API Telemetrie & Analytics Server-Side
// ─────────────────────────────────────────────
app.post('/api/analytics/track', (req, res) => {
    try {
        const payload = req.body || {};
        const updated = recordAnalyticsEvent(req, payload);
        res.json({ success: true, summary: updated.summary });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/admin/stats', (req, res) => {
    try {
        const filePath = path.join(__dirname, 'data', 'analytics.json');
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf8');
            return res.json(JSON.parse(raw));
        }
        res.json({ summary: {}, visitors: {}, dailyStats: {}, pageViews: {}, clickEvents: {}, geoLocations: {}, recentEvents: [] });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/reset-stats', (req, res) => {
    try {
        const filePath = path.join(__dirname, 'data', 'analytics.json');
        const empty = {
            summary: { totalHits: 0, totalUniqueVisitors: 0, totalPageViews: 0, totalClicks: 0, totalCalculatorUses: 0 },
            visitors: {},
            dailyStats: {},
            pageViews: {},
            clickEvents: {},
            geoLocations: {},
            recentEvents: []
        };
        fs.writeFileSync(filePath, JSON.stringify(empty, null, 2));
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Helper: citire JSON
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

// API Autentificare Admin
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
    // Înregistrează automat hit-ul de accesare a site-ului
    recordAnalyticsEvent(req, { eventType: 'pageview', name: 'Acasă (Vizită Principală)' });

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
