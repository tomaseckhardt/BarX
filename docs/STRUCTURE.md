# Struktura projektu BarX

Tento soubor popisuje základní strukturu projektu a účel jednotlivých souborů a složek.

## Kořenové soubory
- `index.html` — Hlavní stránka s menu drinků a veškerým UI.
- `admin.html` — Administrátorské rozhraní pro správu rezervací a obsahu.
- `admin.js` — Logika administrátorského dashboardu (JS pro admin.html).
- `scripts.js` — Klientský JS pro hlavní stránku (formuláře, animace, menu).
- `styles.css` — Hlavní stylopis pro celý web.
- `supabase-config.js` — Konfigurace Supabase pro produkční prostředí.
- `package.json` — Konfigurace Node.js projektu a závislostí.
- `reservations.json` — Lokální runtime data rezervací pro Node backend.
- `README.md` — Úvodní informace a základní popis projektu.

## Složky
- `backend/` — Node.js server a veškerá backendová logika.
- `docs/` — Dokumentace projektu (API, architektura, testování, struktura).
- `testy/` — Playwright testy a konfigurace pro automatizované testování.

## Soubory v backend/
- `server.js` — Vstupní bod serveru, spouští HTTP server.
- `api.js` — Routování API požadavků (GET/POST/PATCH/DELETE).
- `reservations.js` — Logika rezervací (validace, normalizace, CRUD operace).
- `static.js` — Obsluha statických souborů (HTML, CSS, JS).
- `storage.js` — Čtení a zápis reservations.json (file lock).
- `http.js` — HTTP utility (sendJson, headers, logging, CORS).
- `rate-limit.js` — Rate limiting požadavků.
- `config.js` — Centrální konfigurace (port, cesty, validace, MIME typy).

## Soubory v testy/
- `*.spec.js` — Jednotlivé Playwright testy.
- `playwright.config.js` — Konfigurace Playwrightu.
- `helpers/` — Sdílené pomocné funkce pro testy.
- `test-results/` — Výstupy z testů (generované, necommitují se).

---
Tento soubor slouží pro rychlou orientaci v projektu.