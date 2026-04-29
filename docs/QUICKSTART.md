# Rychlý start projektu BarX

## Lokální běh
1. Ujisti se, že máš Node.js LTS.
2. V kořeni projektu spusť:
   ```bash
   npm install
   npm start
   ```
3. Otevři `http://localhost:3000`.

## Testy
```bash
npm test
```

Server se pro Playwright spouští automaticky přes `webServer` konfiguraci.

## Úklid artefaktů
```bash
npm run clean
```

Smaže logy a dočasné výstupy testů.

## Další dokumentace
- API: `docs/API.md`
- Architektura: `docs/ARCHITECTURE.md`
- Testování: `docs/TESTING.md`