# BarX — rezervační systém

Projekt má dva provozní režimy:

1. Lokální režim (Node backend + JSON data)
2. Produkční režim (statický web + Supabase)

Frontend používá stejná API volání v obou režimech. Přepnutí je automatické podle hostname:

- localhost / 127.0.0.1: požadavky jdou na lokální endpoint /api/reservations
- produkční doména: požadavky jdou přes Supabase Data API (konfigurace v supabase-config.js)

## 1) Lokální režim

Použití:

- vývoj
- Playwright E2E testy
- lokální ladění backendu

Spuštění:

```bash
npm install
npm start
```

Server běží na http://localhost:3000 a obsluhuje:

- statické soubory (index.html, admin.html, CSS, JS)
- API /api/reservations
- lokální perzistenci do reservations.json

Testy:

```bash
npm test
```

Další užitečné skripty:

- npm run test:e2e:headed
- npm run test:e2e:debug
- npm run clean

## 2) Produkční režim

Použití:

- statický hosting (např. GitHub Pages)
- backend zajišťuje Supabase Data API

Konfigurace:

1. Otevři supabase-config.js
2. Nastav url, publishableKey a table
3. Nasaď statické soubory na hosting

Důležité:

- používej pouze publishable key
- nikdy neukládej service role key do frontendu
- nastav správné RLS policies, jinak zápisy/čtení skončí 401/403

Doporučené minimum RLS:

- SELECT
- INSERT
- UPDATE
- DELETE

## Struktura projektu (aktuální)

```text
.
├── index.html
├── admin.html
├── scripts.js
├── admin.js
├── styles.css
├── supabase-config.js
├── backend/
│   ├── server.js
│   ├── api.js
│   ├── reservations.js
│   ├── static.js
│   ├── storage.js
│   ├── http.js
│   ├── rate-limit.js
│   └── config.js
├── testy/
│   ├── playwright.config.js
│   ├── *.spec.js
│   └── helpers/
├── docs/
│   ├── QUICKSTART.md
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── STRUCTURE.md
│   └── TESTING.md
└── package.json
```

## Dokumentace

- [docs/QUICKSTART.md](docs/QUICKSTART.md)
- [docs/API.md](docs/API.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/STRUCTURE.md](docs/STRUCTURE.md)
- [docs/TESTING.md](docs/TESTING.md)
