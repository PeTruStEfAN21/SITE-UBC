# 🏗️ UBC - Stație de Betoane Oltenița & Călărași

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4.18-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Sass](https://img.shields.io/badge/Sass-SCSS-CC6699?style=for-the-badge&logo=sass&logoColor=white)](https://sass-lang.com/)
[![Render](https://img.shields.io/badge/Deployment-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/)
[![License](https://img.shields.io/badge/License-Proprietary-FF4500?style=for-the-badge)](#-licență)

> Platformă web modernă și interactivă pentru **Union Business Company (UBC)** — Stație automatizată de betoane ecologică, flotă de utilaje grele și servicii în construcții civile & industriale în Oltenița și județul Călărași.

---

## 🌟 Caracteristici Principale (Key Features)

- ☀️ / 🌙 **Light & Dark Theme Switcher:**
  - Comutare instantanee între tema luminoasă (high-contrast, chenare negre definite) și tema întunecată (industrial neon).
  - Script sincron de pre-încărcare în `<head>` pentru eliminarea efectului de *Flash of Unstyled Content (FOUC)*.
  - Salvare automată a preferinței utilizatorului în `localStorage`.

- 🧮 **Calculator Interactiv de Volum Beton:**
  - Calcul în timp real al metrului cub de beton necesar pentru fundații, planșee și stâlpi.
  - Pilon animat cu efect hidraulic de umplere vizuală și estimare automată de cife (autobetoniere).

- 🏢 **Catalog Produse & Clase de Beton:**
  - Structură completă de betoane de la `C8/10 (B150)` până la `C35/45 (B450)`, beton rutiere, șape și betoane speciale de helesteu.

- 🚜 **Flotă & Închiriere Utilaje Grele:**
  - Secțiune dedicată pentru producție, transport cu cife de 8 m³, autopompe cu braț articulat de 28m și echipamente grele (autograder, buldoexcavatoare, compactoare, freze asfalt, trailer special 2T–40T).

- 🖼️ **Portofoliu Proiecte & Galerie Foto:**
  - Galerie structurată pe categorii (*Construcții Civile & Industriale*, *Construcții Edilitare*) cu modal Lightbox interactiv de vizualizare poze la rezoluție înaltă.
  - Carousel cu derulare lină pentru logourile partenerilor.

- 📞 **Dispecerat & Hub Contact Direct:**
  - Butoane operative *Click-to-Call* (`tel:0720006655`) și *Click-to-Email* (`mailto:ubcbeton@gmail.com`).
  - Harta Google Maps interactivă integrată direct pentru locația din Oltenița.

- 🔍 **SEO & Meta-taguri Avansate:**
  - Taguri OpenGraph, Twitter Cards, Schema.org JSON-LD (LocalBusiness), meta keywords extinse pentru betoane, utilaje și servicii.

---

## 🛠️ Tehnologii Utilizate (Tech Stack)

| Strat (Layer) | Tehnologie |
| :--- | :--- |
| **Backend Engine** | [Node.js](https://nodejs.org/) + [Express.js](https://expressjs.com/) |
| **Templating Engine** | [EJS (Embedded JavaScript)](https://ejs.co/) |
| **Styling & Theme** | SCSS / Sass (Compilat în Vanilla CSS), CSS Custom Properties |
| **Client-Side Logic** | Vanilla JavaScript (ES6+), LocalStorage Theme Manager |
| **Securitate & Utilitare** | `helmet`, `cors`, `dotenv` |
| **Hosting & Deployment** | [Render Web Services](https://render.com/) |

---

## 📁 Structura Proiectului (Directory Structure)

```text
SITE-UBC/
├── data/                  # Fișiere de date JSON (betoane.json, portofoliu.json, utilaje.json)
├── public/                # Fișiere statice servite direct
│   ├── css/               # Fișierul compilat main.css
│   ├── js/                # Scripturi client (app.js, dashboard.js)
│   └── photos/            # Imagini, sigle și favoricon
├── scss/                  # Sursa SCSS (Modularizată pe secțiuni)
│   ├── _variables.scss    # Variabile culori, temă Light/Dark
│   ├── _header.scss       # Header, navigare și buton comutare temă
│   ├── _home.scss         # Hero, calculator, carduri de beton
│   ├── _servicii.scss     # Carduri prestări servicii și închiriere utilaje
│   ├── _despre.scss       # Scrollytelling & Parallax Despre Noi
│   ├── _utilaje.scss      # Showcase flotă & utilaje
│   ├── _portofoliu.scss   # Galerie proiecte & Lightbox
│   ├── _galerie.scss      # Carousel parteneri & galerie foto
│   ├── _contact-page.scss # Pagina dedicată de contact
│   └── main.scss          # Fișierul principal de import SCSS
├── views/                 # Șabloane EJS
│   ├── pages/             # Pagini individuale (acasa, despre, utilaje, portofoliu, galerie, contact)
│   └── partials/          # Componente reutilizabile (head, header, footer, contact)
├── server.js              # Serverul principal Express.js
├── package.json           # Dependințe & scripturi npm
└── README.md              # Documentația oficială
```

---

## 🚀 Rularea Proiectului Local (Development Setup)

### Cerințe Preliminare:
- **Node.js** (versiunea `18.0.0` sau mai nouă)
- **npm** (inclus cu Node.js)

### Pași pentru Instalare și Rulare:

1. **Clonarea repozitoriului:**
   ```bash
   git clone https://github.com/PeTruStEfAN21/SITE-UBC.git
   cd SITE-UBC
   ```

2. **Instalarea dependințelor:**
   ```bash
   npm install
   ```

3. **Recompilarea fișierelor SCSS (Dacă aduci modificări la stiluri):**
   ```bash
   node -e "const sass=require('sass'),fs=require('fs'),path=require('path'); const r=sass.compile(path.join('scss','main.scss'),{style:'expanded'}); fs.writeFileSync(path.join('public','css','main.css'),r.css);"
   ```

4. **Pornirea serverului local:**
   ```bash
   npm start
   ```
   *Serverul va fi accesibil la adresa:* `http://localhost:3000`

---

## ☁️ Deployment pe Render.com

Proiectul este pregătit pentru deploy automat pe **Render**:
- **Environment:** Node
- **Build Command:** `npm install`
- **Start Command:** `node server.js`
- **Auto-Deploy:** Activat pe branch-ul `main`. Orice `git push` va actualiza automat site-ul live.

---

## 📞 Date de Contact Oficiale UBC

- **Companie:** Union Business Company (UBC)
- **Telefon Dispecerat Comenzi:** `0720 006 655`
- **Email:** `ubcbeton@gmail.com`
- **Adresă Stație:** Șoseaua Călărași nr. 4, Oltenița, Jud. Călărași, România

---

## 📄 Licență

Proiect dezvoltat exclusiv pentru **Union Business Company (UBC)**. Toate drepturile rezervate © 2026.
