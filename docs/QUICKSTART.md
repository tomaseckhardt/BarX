# Rychlý start projektu BarX

## Spuštění serveru
1. Ujisti se, že máš nainstalovaný Node.js (doporučeno LTS).
2. V kořenové složce spusť:
   ```bash
   npm install
   npm start
   ```
   Server startuje z `backend/server.js` na portu 3000.
3. Otevři prohlížeč na adrese `http://localhost:3000`.

## Spuštění Playwright testů
1. Z kořenové složky projektu:
   ```bash
   npm run test:e2e
   ```
   Server se spustí automaticky — není třeba ho startovat ručně.
2. Výsledky najdeš ve složce `testy/test-results/`.

## Struktura projektu
- Viz soubor `STRUCTURE.md` v `docs/`.

## Další dokumentace
- API: `docs/API.md`
- Architektura: `docs/ARCHITECTURE.md`
- Testování: `docs/TESTING.md`

---
Pro detailnější informace čti README.md nebo kontaktuj autora projektu.