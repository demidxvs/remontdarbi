<!--
Projekta nosaukums: Remontdarbi
Autors: Artjoms Demidovs
Versija: 1.0
Izveides datums: 2026. gada 7. janvāris
Pēdējo izmaiņu datums: 2026. gada 17. marts
Mērķauditorija: Klienti, administratori un sistēmas lietotāji
Projekta mērķis: Nodrošināt remontdarbu pieteikumu iesniegšanu un pārvaldību tīmekļa vidē
Atsauksme uz resursiem: Izmantoti mācību materiāli, Vite, React, Tailwind CSS, Express un PostgreSQL dokumentācija
Faila apraksts: Projekta dokumentācija ar aprakstu, struktūru un palaišanas instrukcijām
-->
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

## Noklusējuma pieslēgšanās dati

Pēc noklusējuma testēšanai var izmantot šādus administratora piekļuves datus:

- Login: `admin`
- Password: `123456`

## Izmantotie resursi un mācību platformas

Projekta izstrādes laikā tika izmantota oficiālā dokumentācija un mācību materiāli, lai labāk izprastu izmantotās tehnoloģijas un atrastu piemērotus risinājumus.

- Vite dokumentācija: https://vite.dev/
- Vite konfigurācija: https://vite.dev/config/
- React dokumentācija: https://react.dev/
- Tailwind CSS dokumentācija: https://tailwindcss.com/docs/installation
- Express maršrutēšanas dokumentācija: https://expressjs.com/en/guide/routing.html
- node-postgres dokumentācija: https://node-postgres.com/
- PostgreSQL funkciju dokumentācija: https://www.postgresql.org/docs/current/sql-createfunction.html
- MDN Web Docs (Fetch API un vispārējā tīmekļa izstrāde): https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
- freeCodeCamp mācību materiāli par React, Express un PostgreSQL: https://www.freecodecamp.org/news/
- W3Schools mācību materiāli par SQL, HTML, CSS un JavaScript: https://www.w3schools.com/
- GeeksforGeeks mācību materiāli par Express.js un full-stack izstrādi: https://www.geeksforgeeks.org/





-- Проверить, к какой БД подключен
SELECT current_database(), current_user;

-- Показать пользователей
SELECT id, username, role, created_at FROM users ORDER BY id;

-- Показать заявки
SELECT id, client_name, status, created_at FROM applications ORDER BY id DESC;

-- Проверить конкретную заявку
SELECT * FROM applications WHERE id = 123;

-- Удалить конкретную заявку вручную (если нужно)
DELETE FROM applications WHERE id = 123;

-- Сбросить пароль admin (пример)
UPDATE users
SET password_hash = crypt('NewStrongPass123!', gen_salt('bf'))
WHERE username = 'admin';


SELECT create_user('newuser', 'StrongPass123!', 'viewer');
-- роли: 'admin' | 'manager' | 'viewer'



SELECT id, username, role FROM users ORDER BY id;




SELECT delete_user(5);



SELECT delete_user(id) FROM users WHERE username = 'newuser';
