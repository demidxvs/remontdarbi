# Remontdarbi

Tīmekļa lietotne remontdarbu pieteikumu saņemšanai un pārvaldībai. Ir publiskā sadaļa ar apstiprināto pieteikumu sarakstu un administrācijas sadaļa pieteikumu, kategoriju un lietotāju pārvaldībai. Atbalstīta pieslēgšanās un viesu režīms (viesis var skatīt paziņojumus, bet nevar izveidot pieteikumus).

## Galvenās iespējas
- Remontdarbu pieteikumu izveide (forma ar validāciju).
- Publisks apstiprināto pieteikumu saraksts un detalizēts skats.
- Administrācija: pieteikumu, kategoriju un lietotāju pārvaldība.
- Autorizācija, sesijas datubāzē, sesijas atjaunošana pēc aktivitātes.
- Lietotāja pēdējās pieslēgšanās un izrakstīšanās laika fiksēšana.
- Viesu režīms (tikai skatīšana).

## Tehnoloģijas un kā tās tiek izmantotas
- React 19 + React Router: lietotāja saskarne, maršrutēšana un stāvoklis.
- Vite: ātrs izstrādes serveris, būvēšana, HMR.
- Tailwind CSS + PostCSS: stili, utilītklases.
- Express: HTTP API darbam ar pieteikumiem un administrāciju.
- PostgreSQL: lietotāju, sesiju, pieteikumu un kategoriju glabāšana.
- PL/pgSQL funkcijas: piekļuve datiem tikai caur drošām funkcijām.

## Arhitektūra
- Frontends piekļūst API caur `src/lib/api.js`.
- Backendā realizēts REST API `server/index.js`.
- Datubāzē ir tabulas `users`, `sessions`, `applications`, `categories`.
- Piekļuve datiem notiek caur funkcijām `db/schema.sql`.

## Projekta struktūra un failu nozīme

Projekta sakne:
- `index.html` - HTML veidne Vite un React montēšanas punkts.
- `package.json` - frontenda atkarības un skripti.
- `package-lock.json` - fiksētās frontenda atkarību versijas.
- `vite.config.js` - Vite konfigurācija.
- `tailwind.config.js` - Tailwind CSS konfigurācija.
- `postcss.config.js` - PostCSS konfigurācija.
- `eslint.config.js` - ESLint noteikumi.
- `public/` - statiskie faili, kas pieejami tieši.
- `db/schema.sql` - DB shēma, tabulas un glabātās funkcijas.

Frontends (`src/`):
- `src/main.jsx` - React ieejas punkts un maršrutētāja iestatīšana.
- `src/App.jsx` - lietotnes saknes loģika, maršruti, navigācija, viesu režīms.
- `src/lib/api.js` - funkcija API URL veidošanai.
- `src/index.css` - pamata stili un Tailwind pieslēgšana.
- `src/App.css` - papildu lietotnes stili.
- `src/assets/react.svg` - noklusējuma ikona.
- `src/pages/Login.jsx` - pieslēgšanās/registrācijas forma un ieeja kā viesim.
- `src/pages/NewApplication.jsx` - jauna pieteikuma izveide, validācija, nosūtīšana uz API.
- `src/pages/ApplicationsList.jsx` - apstiprināto pieteikumu saraksts, pāreja uz detaļām.
- `src/pages/ApplicationDetails.jsx` - pieteikuma detaļu skats un admina darbības.
- `src/pages/Admin.jsx` - administrācijas panelis pieteikumiem un kategorijām.
- `src/pages/AdminUsers.jsx` - lietotāju pārvaldība (tikai admin).

Backend (`server/`):
- `server/index.js` - Express API: maršruti, validācija, darbs ar DB.
- `server/db.js` - savienojums ar PostgreSQL, izmantojot `pg` un `DATABASE_URL`.
- `server/package.json` - servera atkarības un skripti.
- `server/package-lock.json` - fiksētās servera atkarību versijas.

## Palaišana

Frontends:
```bash
cd /Users/demidxvs/Documents/remontdarbi/remont-darbi
npm install
npm run dev
```

Backends:
```bash
cd /Users/demidxvs/Documents/remontdarbi/remont-darbi/server
npm install
npm run dev
```

DB shēmas uzlikšana:
```bash
psql "$DATABASE_URL" -f /Users/demidxvs/Documents/remontdarbi/remont-darbi/db/schema.sql
```
