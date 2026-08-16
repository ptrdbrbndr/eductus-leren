# Design: cursusoverzicht leren.eductus.nl (Eductus-zelfstudie + Ductus-familiecursussen)

**Status:** goedgekeurd door Pieter, 2026-08-16.
**Bron:** `c:\Projecten\eductus-trainingen\SAP voor Business Analysts\OVERDRACHT-landingspagina-overzicht.md`

## 1. Context

`leren.eductus.nl` (repo `c:\Projecten\eductus.nl`, statische HTML + nginx, Coolify-app
`kpnj9u63vo9nxe9jl9eq7ved` op Beelink 1) toont vandaag alleen de Eductus-zelfstudiereeks
"SAP-fundamenten voor Business Analysts" (15 modules), met moduledata hardcoded in een
`MODULES`-array in `index.html`.

Pieter heeft daarnaast de Ductus-cursusfamilie: klassikale opleidingen met een vast
vier-deliverables-format (reader/werkboek/docentenhandleiding/slidedeck), bronmateriaal als
markdown in `c:\Projecten\eductus-trainingen\<Cursusnaam>\`. Deze cursussen hebben nog geen
renderpad naar een publieke pagina.

Inventarisatie (16 aug 2026) van `eductus-trainingen`:

| Cursus | Status |
|---|---|
| Testen en kwaliteitsborging | compleet, 30/30 delen (referentiecursus) |
| businessanalyse | compleet, 30/30 delen |
| Domain-Driven Design | compleet, 30/30 delen |
| Informatiebeveiliging | compleet, 30/30 delen |
| Requirementsmanagement | compleet, 30/30 delen |
| Risicomanagement | compleet, 30/30 delen |
| Enterprise Integration Patterns | gedeeltelijk, 15/30 delen (niveau 3 ontbreekt) |
| SAP voor Business Analysts | alleen opzet-document, 0 delen |

Geen van deze cursussen heeft een renderpad naar HTML — alleen "Testen en kwaliteitsborging"
en enkele andere hebben een begonnen/verkende opmaakfase (.docx/.pptx), niet gepubliceerd.

## 2. Beslissing (was open vraag §4 in de overdracht)

Pieter: elk cursus-contentproject wordt zelf verantwoordelijk voor het bijwerken van zijn
eigen tegel op het overzicht zodra het een renderpad/publicatie heeft. Tot die tijd krijgt
elke bekende cursus een **stub**-tegel: niet-klikbaar, toont titel/niveaus/deel-aantal en een
"Binnenkort beschikbaar"-badge, geen voortgangsring.

Dit geldt voor **alle** Ductus-familiecursussen, inclusief de 6 inhoudelijk complete — hun
opmaakfase (Word/PowerPoint) is niet overal af en er is geen webrenderpad, dus geen doorklik
totdat het eigen contentproject dat toevoegt.

## 3. Datamodel

Eén nieuw bestand `courses.json` in de repo-root van `eductus.nl`, met twee arrays:

```json
{
  "self_study": [
    { "id": "sap0", "title": "...", "sections": 6, "href": "sap-module-0.html", "progressKey": "eductus_sap0" }
  ],
  "family_courses": [
    {
      "id": "testen-en-kwaliteitsborging",
      "title": "Testen en kwaliteitsborging",
      "levels": 3,
      "parts": 30,
      "status": "stub",
      "href": null
    }
  ]
}
```

- `self_study`: bestaande 15 SAP-modules, 1-op-1 verhuisd uit de huidige `MODULES`-array in
  `index.html` (geen inhoudelijke wijziging, alleen verplaatsing naar data-bestand).
- `family_courses`: één entry per bekende Ductus-familiecursus (de 8 uit de tabel in §1).
  `status` is `"stub"` voor alle huidige entries. Een cursus-contentproject zet dit later zelf
  op `"live"` en vult `href` met de eigen bestemming (zie §5).
- Bovenaan het bestand een JSON-comment-achtige `_note`-sleutel (JSON kent geen native
  comments) die het ownership-principe en het risico uit §4 vastlegt:
  > "Elke cursus mag maar één canonieke entry hebben. Als een cursus ooit zowel als
  > self_study als als family_course zou bestaan, is dat een fout — kies één bron."

## 4. Pagina

`index.html` krijgt een tweede sectie onder de bestaande modulekaarten-grid:
"Cursusfamilie — Ductus-opleidingen". Rendering client-side via `fetch('courses.json')`,
zelfde patroon als de huidige inline modulerendering (geen build-stap, in lijn met hoe de
site nu al werkt — geen Next.js, geen `build.mjs` zoals bij boeken/kennis.eductus.nl, want er
is nog geen content om te genereren).

Stub-kaart: titel, "N niveaus · M delen", badge "Binnenkort beschikbaar", geen link/cursor
disabled. Live-kaart (toekomst, zodra een project `status: "live"` zet): zelfde vormgeving als
de huidige zelfstudie-moduletegels, met link naar `href`.

## 5. Uitbreidbaarheid / eigenaarschap

- Nieuwe familiecursus toevoegen (bijv. wanneer Pieter een cursus overzet vanuit claude.ai):
  entry toevoegen aan `family_courses` in `courses.json`, status `"stub"`.
- Cursus krijgt renderpad: het eigen contentproject (bijv. straks "SAP voor Business
  Analysts") past zelf `courses.json` aan (status → `"live"`, `href` invullen) als onderdeel
  van zijn eigen opleverwerk. Dit overzicht-traject bouwt geen omzetstap markdown→HTML — die
  keuze (optie 1/2/3 uit de oorspronkelijke overdracht) hoort bij het contentproject zelf,
  niet bij deze landingspagina.
- Geen dubbel onderhoud: zie `_note` in `courses.json` (§3).

## 6. Niet in scope

- Omzetten van cursusmateriaal naar HTML/PDF/downloadbare deliverables.
- Build-pipeline (`build.mjs`-achtig patroon) — pas relevant zodra een contentproject dat zelf
  nodig heeft.
- Wijzigingen aan de bestaande zelfstudie-modulepagina's zelf (alleen `index.html` en de
  nieuwe `courses.json`).

## 7. Testing

- Visuele check in browser: beide secties renderen, stub-kaarten zijn duidelijk
  niet-klikbaar, bestaande zelfstudie-sectie werkt ongewijzigd (voortgangsringen, links).
- JSON-validatie van `courses.json`.
- Smoke-test na deploy: `https://leren.eductus.nl` toont beide secties.
