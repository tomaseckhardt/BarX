# Struktura projektu BarX

Tento soubor popisuje základní strukturu projektu a účel jednotlivých souborů a složek.

## Kořenové soubory
- `index.html` — Hlavní stránka s menu drinků a veškerým UI.
- `admin.html` — Administrátorské rozhraní pro správu rezervací a obsahu.
- `styles.css` — Hlavní stylopis pro celý web.
- `server.js` — Node.js server pro backendovou logiku a API.
- `package.json` — Konfigurace Node.js projektu a závislostí.
- `reservations.json` — Databáze rezervací (JSON formát).
- `README.md` — Úvodní informace a základní popis projektu.

## Složky
- `docs/` — Dokumentace projektu (API, architektura, testování, struktura).
- `tests/` — Playwright testy a konfigurace pro automatizované testování.
- `test-results/` — Výstupy z testů (reporty, logy).

## Důležité soubory v docs/
- `API.md` — Popis API endpointů a jejich použití.
- `ARCHITECTURE.md` — Architektura aplikace a hlavní komponenty.
- `TESTING.md` — Postupy a scénáře pro testování.

## Důležité soubory v tests/
- `*.spec.js` — Jednotlivé Playwright testy.
- `playwright.config.js` — Konfigurace Playwrightu.

---
Tento soubor slouží pro rychlou orientaci v projektu.