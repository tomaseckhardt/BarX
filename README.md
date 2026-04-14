# BarX — Craft Cocktail Bar Praha

Rezervační systém s veřejným webem a admin dashboardem. Projekt je připravený pro statický hosting na GitHub Pages, data běží přímo přes Supabase Data API.

## Rychlý start (GitHub Pages)

1. V Supabase vytvoř tabulku `reservations` se správnými sloupci.
2. Otevři `supabase-config.js` a nastav:
    - `url`
    - `publishableKey` (jen public key, nikdy secret/service role)
3. Pushni repozitář na GitHub.
4. Zapni GitHub Pages (Deploy from branch: `main`, root).

Po nasazení běží web čistě staticky bez Node serveru.

## Struktura projektu

```
├── index.html          Veřejný web (menu, rezervace, kontakt)
├── admin.html          Admin dashboard (přehled rezervací)
├── styles.css          Sdílené styly pro obě stránky
├── supabase-config.js  Konfigurace + API vrstva pro Supabase
├── server.js           Volitelný lokální Node backend (není nutný pro GitHub Pages)
├── reservations.json   Starý lokální datový soubor (pro GitHub Pages se nepoužívá)
├── package.json        Skripty a závislosti
├── tests/              Playwright E2E testy
│   ├── playwright.config.js
│   ├── basic-functionality.spec.js
│   ├── full-booking-admin.spec.js
│   ├── admin-quick-actions.spec.js
│   └── api-reservation-status.spec.js
└── docs/
    ├── API.md          REST API dokumentace
    ├── ARCHITECTURE.md Architektura a klíčové komponenty
    └── TESTING.md      Průvodce testováním
```

## Hlavní funkce

| Stránka | Co dělá |
|---------|---------|
| **index.html** | Drink menu s filtry a modály, rezervační formulář s live souhrnem, vibe systém se slevami |
| **admin.html** | Tabulkový/kartový přehled rezervací, filtrování, řazení, rychlé akce (volat → potvrdit → hotovo → smazat) |
| **supabase-config.js** | Přímé CRUD volání na Supabase Data API bez backendu |

## Konfigurace pro GitHub Pages

V souboru `supabase-config.js` nastav:

- `url`: URL projektu, např. `https://xyzcompany.supabase.co`
- `publishableKey`: Supabase publishable key
- `table`: název tabulky (default `reservations`)

## RLS policies (doporučeno)

Pro browser-only variantu nastav v Supabase RLS policies tak, aby frontend mohl číst a měnit jen to, co potřebuje. Minimálně:

- `SELECT` pro veřejné čtení rezervací (nebo jen pro autorizované role)
- `INSERT` pro vytváření rezervací
- `UPDATE` pro admin akce (status/note)
- `DELETE` pro rušení rezervací

Bez správných RLS policy budou požadavky z GitHub Pages končit chybou 401/403.

## Lokální testy (volitelné)

```bash
npm install
npm run test:e2e
```

## Další dokumentace

- [docs/API.md](docs/API.md) — Endpointy, payloady, chybové kódy
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Komponenty, DOM IDs, JS funkce, datový model
- [docs/TESTING.md](docs/TESTING.md) — Jak spustit testy, co pokrývají, jak psát nové
