# Rychlý start projektu BarX

## Spuštění serveru
1. Ujisti se, že máš nainstalovaný Node.js (doporučeno LTS).
2. V kořenové složce spusť:
   ```bash
   npm install
   node server.js
   ```
3. Otevři prohlížeč na adrese `http://localhost:3000` (nebo port dle nastavení).

## Spuštění Playwright testů
1. Přejdi do složky `tests/`:
   ```bash
   cd tests
   npm install
   npx playwright test
   ```
2. Výsledky najdeš ve složce `test-results/`.

## Struktura projektu
- Viz soubor `STRUCTURE.md` v `docs/`.

## Další dokumentace
- API: `docs/API.md`
- Architektura: `docs/ARCHITECTURE.md`
- Testování: `docs/TESTING.md`

---
Pro detailnější informace čti README.md nebo kontaktuj autora projektu.