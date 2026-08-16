# Cursusoverzicht leren.eductus.nl Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Voeg een tweede sectie "Cursusfamilie" toe aan `leren.eductus.nl` met stub-tegels voor de 8 bekende Ductus-familiecursussen, en verplaats de bestaande zelfstudiemodule-data van een hardcoded JS-array naar een gedeeld `courses.json`-bestand.

**Architecture:** Statische site zonder build-stap blijft statisch zonder build-stap. `index.html` haalt bij het laden `courses.json` op met `fetch()` en rendert daaruit zowel de bestaande zelfstudie-kaarten (Fundamenten/Verdieping/Capstone) als de nieuwe familiecursus-kaarten. Geen server-side wijziging nodig — nginx serveert `courses.json` als statisch bestand net als de HTML.

**Tech Stack:** Vanilla HTML/CSS/JS (geen framework, geen build tool), nginx:alpine, Coolify (app-uuid `kpnj9u63vo9nxe9jl9eq7ved`).

**Spec:** `docs/superpowers/specs/2026-08-16-cursusoverzicht-design.md`

## Global Constraints

- Geen build-stap toevoegen (spec §4/§6) — `courses.json` wordt client-side gefetcht, precies zoals de rest van de pagina nu al client-side rendert.
- Bestaande zelfstudie-secties (Fundamenten/Verdieping/Capstone) moeten na de refactor **visueel en functioneel identiek** blijven (zelfde voortgangsringen, localStorage-keys, links) — dit is een data-verplaatsing, geen herontwerp.
- Stub-kaarten voor familiecursussen zijn niet-klikbaar (geen `<a href>`, geen hover-navigatiegevoel) en tonen geen voortgangsring.
- `courses.json` bevat een `_note`-veld met het ownership-principe uit spec §5, zodat het zichtbaar blijft voor wie het bestand later bewerkt.
- Alle 8 cursussen uit de inventarisatie (spec §1) krijgen een `family_courses`-entry met `status: "stub"`.

---

## Task 1: `courses.json` — datamodel voor beide secties

**Files:**
- Create: `courses.json` (repo-root, naast `index.html`)

**Interfaces:**
- Produces: JSON met top-level sleutels `_note` (string), `self_study` (array van module-objecten met velden `n, file, key, sec, dur, title, sub, track`), `family_courses` (array van cursus-objecten met velden `id, title, levels, parts, status, href, note`). Task 2 en 3 consumeren dit bestand via `fetch('courses.json')`.

- [ ] **Step 1: Schrijf `courses.json`**

Inhoud (velden `n/file/key/sec/dur/title/sub` zijn 1-op-1 overgenomen uit de huidige `MODULES`/`MODULES_ADV`/`CAPSTONE`-arrays in `index.html`, met een nieuw veld `track` om aan te geven in welke grid de kaart hoort):

```json
{
  "_note": "Elke cursus mag maar één canonieke entry hebben: óf in self_study óf in family_courses, nooit beide. Als een cursus ooit in beide vormen zou bestaan, is dat een fout — kies één bron (zie spec 2026-08-16-cursusoverzicht-design.md §5).",
  "self_study": [
    {"n":"00","file":"sap-module-0-overzicht.html","key":"eductus_sap0_progress_v1","sec":6,"dur":"±1u","title":"De SAP-wereld in vogelvlucht","sub":"Wat is SAP, ECC vs. S/4HANA, de modules, deployment en het kernjargon.","track":"base"},
    {"n":"01","file":"sap-module-1-landschap.html","key":"eductus_sap1_progress_v1","sec":7,"dur":"±1,5u","title":"Systeemlandschap & navigatie","sub":"DEV→QAS→PRD, clients, GUI vs. Fiori, transactiecodes en zelf rondkijken.","track":"base"},
    {"n":"02","file":"sap-module-2-datamodel.html","key":"eductus_sap2_progress_v1","sec":6,"dur":"±2u","title":"Tabellen & Data Dictionary","sub":"Waar de data écht staat: tabellen, keys, SE11/SE16 — de grootste hefboom.","track":"base"},
    {"n":"03","file":"sap-module-3-abap-lezen.html","key":"eductus_sap3_progress_v1","sec":6,"dur":"±3u","title":"ABAP lezen voor BA's","sub":"Code begrijpen en meepraten — lezen, niet schrijven.","track":"base"},
    {"n":"04","file":"sap-module-4-business-logica.html","key":"eductus_sap4_progress_v1","sec":6,"dur":"±2u","title":"Business logica & uitbreidingen","sub":"Config vs. custom, IMG, BAdI's, BRFplus, workflow en 'keep the core clean'.","track":"base"},
    {"n":"05","file":"sap-module-5-integratie.html","key":"eductus_sap5_progress_v1","sec":6,"dur":"±2u","title":"Integratie & interfaces","sub":"IDoc, RFC/BAPI, OData, middleware en foutafhandeling tussen systemen.","track":"base"},
    {"n":"06","file":"sap-module-6-ba-werkstroom.html","key":"eductus_sap6_progress_v1","sec":6,"dur":"±1,5u","title":"De BA-werkstroom in SAP-projecten","sub":"Activate-fasen, fit-gap, functioneel ontwerp, testen en cutover.","track":"base"},
    {"n":"08","file":"sap-module-8-documentflow.html","key":"eductus_sap8_progress_v1","sec":7,"dur":"±2,5u","title":"Documenten & documentflow","sub":"Hoe SAP een proces denkt: documentketens, copy control en de methode 'volg het document'.","track":"adv"},
    {"n":"09","file":"sap-module-9-determinatie.html","key":"eductus_sap9_progress_v1","sec":7,"dur":"±2,5u","title":"Organisatiestructuur & determinatie","sub":"Org-niveaus en condition technique: hoe SAP automatisch prijs, rekening en output bepaalt.","track":"adv"},
    {"n":"10","file":"sap-module-10-status-output.html","key":"eductus_sap10_progress_v1","sec":6,"dur":"±2u","title":"Status, berichten & output","sub":"Statusprofielen als procesbewaker en berichtbepaling: wat mag, en wat gaat eruit.","track":"adv"},
    {"n":"11","file":"sap-module-11-financiele-schaduw.html","key":"eductus_sap11_progress_v1","sec":6,"dur":"±2u","title":"De financiële schaduw van elk proces","sub":"Elk document boekt: account determination, Universal Journal en de FS-CD-keten.","track":"adv"},
    {"n":"12","file":"sap-module-12-case-o2c.html","key":"eductus_sap12_progress_v1","sec":6,"dur":"±3u","title":"Case: Order-to-Cash ontleed","sub":"Eén proces van klik tot boeking, per stap het vierluik: document, determinatie, status, boeking.","track":"adv"},
    {"n":"13","file":"sap-module-13-case-implementeren.html","key":"eductus_sap13_progress_v1","sec":7,"dur":"±3u","title":"Case: een proces implementeren","sub":"Van bedrijfswens naar werkend SAP-proces: mapping, fit-gap, spec, test — met verzekeringscasus.","track":"adv"},
    {"n":"14","file":"sap-module-14-debugging.html","key":"eductus_sap14_progress_v1","sec":6,"dur":"±2,5u","title":"Debugging & runtime-analyse","sub":"Zelf traceren wat het systeem écht doet: debugger, traces, dumps en logs als analysewapen.","track":"adv"},
    {"n":"07","file":"sap-fs-pm-btx-module.html","key":"eductus_btx_progress_v1","sec":7,"dur":"±3,5u","title":"BTX in SAP FS-PM","sub":"Business Transactions — het hart van Policy Management. Je capstone.","track":"cap"}
  ],
  "family_courses": [
    {"id":"testen-en-kwaliteitsborging","title":"Testen en kwaliteitsborging","levels":3,"parts":30,"status":"stub","href":null,"note":null},
    {"id":"businessanalyse","title":"Businessanalyse","levels":3,"parts":30,"status":"stub","href":null,"note":null},
    {"id":"domain-driven-design","title":"Domain-Driven Design","levels":3,"parts":30,"status":"stub","href":null,"note":null},
    {"id":"informatiebeveiliging","title":"Informatiebeveiliging","levels":3,"parts":30,"status":"stub","href":null,"note":null},
    {"id":"requirementsmanagement","title":"Requirementsmanagement","levels":3,"parts":30,"status":"stub","href":null,"note":null},
    {"id":"risicomanagement","title":"Risicomanagement","levels":3,"parts":30,"status":"stub","href":null,"note":null},
    {"id":"enterprise-integration-patterns","title":"Enterprise Integration Patterns","levels":3,"parts":30,"status":"stub","href":null,"note":"In ontwikkeling — 15 van 30 delen gereed."},
    {"id":"sap-voor-business-analysts","title":"SAP voor Business Analysts","levels":3,"parts":30,"status":"stub","href":null,"note":"Nog alleen een opzet-document."}
  ]
}
```

- [ ] **Step 2: Valideer JSON-syntax**

Run: `node -e "JSON.parse(require('fs').readFileSync('courses.json','utf8')); console.log('valid')"`
Expected: `valid`

- [ ] **Step 3: Commit**

```bash
git add courses.json
git commit -m "Voeg courses.json toe als gedeelde databron voor zelfstudie- en familiecursussen"
```

---

## Task 2: `index.html` — zelfstudiesectie uit `courses.json` renderen

**Files:**
- Modify: `index.html:159-253` (het `<script>`-blok)

**Interfaces:**
- Consumes: `courses.json` zoals geproduceerd in Task 1 (`self_study` array, velden `n/file/key/sec/dur/title/sub/track`).
- Produces: zelfde DOM-structuur en gedrag als voorheen (kaarten in `#gridBase`/`#gridAdv`/`#gridCap`, voortgangsring in `#ovRing`/`#ovPct`/`#ovBar`/`#ovSub`, reset-knop `#ovReset`) — Task 3 bouwt de nieuwe sectie ernaast, zonder deze functies te wijzigen.

- [ ] **Step 1: Vervang het hardcoded-array-gedeelte door een fetch + render van `self_study`**

Vervang in `index.html` het script-blok (regel 159-253) door:

```html
<script>
(function(){
  function load(k){try{return JSON.parse(localStorage.getItem(k)||"{}")}catch(e){return {}}}
  function doneCount(m){var s=load(m.key),c=0;for(var i=1;i<=m.sec;i++){if(s["s"+i])c++}return c}

  function statusOf(done,total){
    if(done===0)return {cls:"ns",txt:"Niet gestart"};
    if(done>=total)return {cls:"done",txt:"Afgerond"};
    return {cls:"busy",txt:"Bezig"};
  }

  function card(m){
    var done=doneCount(m),pct=Math.round(done/m.sec*100),st=statusOf(done,m.sec);
    var a=document.createElement("a");
    a.href=m.file;
    a.className="card"+(m.track==="cap"?" capstone":"")+(done>=m.sec?" done":"");
    a.innerHTML=
      '<div class="card__top">'+
        '<div class="card__num">'+m.n+'</div>'+
        '<div class="card__ring" style="--v:'+pct+'"><b>'+pct+'%</b></div>'+
      '</div>'+
      '<h4>'+m.title+'</h4>'+
      '<p>'+m.sub+'</p>'+
      '<div class="card__meta">'+
        '<span class="tag">'+m.dur+'</span>'+
        '<span class="tag">'+m.sec+' secties</span>'+
        '<span class="tag">'+done+'/'+m.sec+' klaar</span>'+
        '<span class="status '+st.cls+'">'+st.txt+'</span>'+
      '</div>'+
      '<div class="card__go">Openen →</div>';
    return a;
  }

  function renderSelfStudy(all){
    var gridBase=document.getElementById("gridBase");
    var gridAdv=document.getElementById("gridAdv");
    var gridCap=document.getElementById("gridCap");
    all.forEach(function(m){
      var target=m.track==="adv"?gridAdv:(m.track==="cap"?gridCap:gridBase);
      target.appendChild(card(m));
    });

    var totalSec=all.reduce(function(a,m){return a+m.sec},0);
    var doneSec=all.reduce(function(a,m){return a+doneCount(m)},0);
    var modsDone=all.filter(function(m){return doneCount(m)>=m.sec}).length;
    var pct=Math.round(doneSec/totalSec*100);
    document.getElementById("ovRing").style.setProperty("--v",pct);
    document.getElementById("ovPct").textContent=pct+"%";
    document.getElementById("ovBar").style.width=pct+"%";
    var sub=document.getElementById("ovSub");
    if(doneSec===0){sub.textContent="Nog niet begonnen — start met Module 0.";}
    else if(modsDone>=all.length){document.getElementById("ovTitle").textContent="Volledig afgerond 🎉";sub.textContent="Je hebt alle "+all.length+" modules doorlopen. Sterk gedaan.";}
    else{sub.textContent=modsDone+" van "+all.length+" modules afgerond · "+doneSec+" van "+totalSec+" secties gelezen.";}

    document.getElementById("ovReset").addEventListener("click",function(){
      if(!confirm("Alle voortgang van alle modules wissen? Dit kan niet ongedaan worden gemaakt."))return;
      all.forEach(function(m){try{localStorage.removeItem(m.key)}catch(e){}});
      location.reload();
    });
  }

  fetch("courses.json").then(function(r){return r.json()}).then(function(data){
    renderSelfStudy(data.self_study);
  });
})();
</script>
```

- [ ] **Step 2: Start een lokale statische server en controleer in de browser**

`fetch()` van een lokaal bestand werkt niet via `file://` — serveer de map lokaal:

Run: `cd "c:\Projecten\eductus.nl" && python -m http.server 8123`

Open `http://localhost:8123/` in de browser. Controleer:
- Fundamenten (7 kaarten), Verdieping (7 kaarten), Capstone (1 kaart) verschijnen precies als voorheen.
- Voortgangsring bovenaan toont `0%` bij een lege browser (of het eerder opgebouwde localStorage-percentage als je die browser al gebruikt hebt).
- Klik een module open, vink een sectie af, ga terug naar `index.html`, ring/percentage/status zijn bijgewerkt.
- "Alles resetten" wist de voortgang en herlaadt.

Expected: identiek gedrag aan de vorige (hardcoded) versie. Stop de server (Ctrl+C) na de check.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Render zelfstudiesectie uit courses.json in plaats van hardcoded arrays"
```

---

## Task 3: `index.html` — sectie "Cursusfamilie" met stub-kaarten

**Files:**
- Modify: `index.html` (CSS in `<style>`, HTML-structuur, en het script uit Task 2)

**Interfaces:**
- Consumes: `courses.json`'s `family_courses` array (velden `id/title/levels/parts/status/href/note`), en `renderSelfStudy` / de `fetch("courses.json")`-belofte uit Task 2.
- Produces: geen nieuwe interfaces voor latere tasks — dit is de laatste task van het plan.

- [ ] **Step 1: Voeg CSS toe voor de stub-kaart**

Voeg toe aan het `<style>`-blok in `index.html`, na de bestaande `.card__go`-regel (rond regel 92):

```css
.card--stub{cursor:default;opacity:.82}
.card--stub:hover{transform:none;box-shadow:var(--shadow);border-color:var(--line)}
.card--stub:hover::after{background:var(--line)}
.card--stub .card__num{background:var(--ink-faint)}
.badge-soon{font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.5px;text-transform:uppercase;font-weight:600;background:var(--paper);border:1px solid var(--line);color:var(--ink-faint);padding:4px 10px;border-radius:999px;margin-top:14px;display:inline-block}
.card--stub .card__meta-note{margin:8px 0 0;font-size:14px;color:var(--ink-faint)}
```

- [ ] **Step 2: Voeg de HTML-sectie toe**

Voeg toe in `index.html` na de bestaande `<div class="note">...</div>` (rond regel 138) en vóór de "Verder in Eductus"-sectie:

```html
<div class="rowhead"><h3>Cursusfamilie</h3><span>Ductus-opleidingen — klassikaal, drie niveaus</span><div class="line"></div></div>
<div class="grid" id="gridFamily"></div>
<div class="note"><b>Let op.</b> De cursussen hierboven zijn inhoudelijk in ontwikkeling bij Ductus. Zodra een cursus een eigen webweergave krijgt, wordt de tegel hier automatisch klikbaar — dat werk gebeurt door het cursusproject zelf, niet door deze overzichtspagina.</div>
```

- [ ] **Step 3: Voeg de renderfunctie toe en roep hem aan**

In het `<script>`-blok uit Task 2, voeg toe vóór de afsluitende `fetch(...)`-aanroep:

```javascript
  function familyCard(c){
    var el=document.createElement(c.href?"a":"div");
    if(c.href)el.href=c.href;
    el.className="card"+(c.href?"":" card--stub");
    el.innerHTML=
      '<div class="card__top"><div class="card__num">'+c.levels+'N</div></div>'+
      '<h4>'+c.title+'</h4>'+
      '<p>'+c.parts+' delen in '+c.levels+' niveaus.'+(c.note?' '+c.note:'')+'</p>'+
      '<div class="card__meta">'+
        '<span class="tag">'+c.levels+' niveaus</span>'+
        '<span class="tag">'+c.parts+' delen</span>'+
      '</div>'+
      (c.href?'<div class="card__go">Openen →</div>':'<span class="badge-soon">Binnenkort beschikbaar</span>');
    return el;
  }

  function renderFamily(list){
    var grid=document.getElementById("gridFamily");
    list.forEach(function(c){grid.appendChild(familyCard(c))});
  }
```

En wijzig de bestaande `fetch`-aanroep aan het eind van het script zodat hij beide rendert:

```javascript
  fetch("courses.json").then(function(r){return r.json()}).then(function(data){
    renderSelfStudy(data.self_study);
    renderFamily(data.family_courses);
  });
```

- [ ] **Step 4: Test in de browser**

Run: `cd "c:\Projecten\eductus.nl" && python -m http.server 8123`

Open `http://localhost:8123/`. Controleer:
- Nieuwe sectie "Cursusfamilie" toont 8 kaarten, in dezelfde grid-stijl als de zelfstudiekaarten maar visueel gedempt (`.card--stub`).
- Geen enkele stub-kaart is een klikbare link (inspecteer element: `<div class="card card--stub">`, geen `<a>`).
- Elke kaart toont "Binnenkort beschikbaar"-badge; de EIP- en SAP-BA-kaart tonen ook hun `note`-tekst.
- Bestaande secties (Fundamenten/Verdieping/Capstone/voortgang) werken nog steeds zoals in Task 2 getest.

Expected: sectie is zichtbaar en gedraagt zich als ontworpen. Stop de server na de check.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Voeg sectie Cursusfamilie toe met stub-kaarten voor Ductus-familiecursussen"
```

---

## Task 4: Deploy naar productie

**Files:** geen (deploy-actie)

**Interfaces:**
- Consumes: de commits van Task 1–3, reeds gepusht naar `origin/main`.

- [ ] **Step 1: Push naar GitHub**

```bash
cd "c:\Projecten\eductus.nl" && git push origin main
```

- [ ] **Step 2: Trigger Coolify-redeploy**

Via Coolify UI (project `eductus`, app-uuid `kpnj9u63vo9nxe9jl9eq7ved`) of API: `POST /api/v1/deploy?uuid=kpnj9u63vo9nxe9jl9eq7ved`.

- [ ] **Step 3: Smoke-test productie**

Open `https://leren.eductus.nl` in de browser (niet via WebFetch/ClaudeBot — die wordt door `robots.txt` geblokkeerd, zie spec-bron §3). Controleer dat beide secties correct laden en dat `courses.json` een 200 geeft (via browser devtools-network-tab).

---

## Self-Review Notes

- **Spec coverage:** §3 datamodel → Task 1. §4 pagina/rendering → Task 2+3. §5 uitbreidbaarheid/`_note` → Task 1 Step 1. §6 (geen build-stap, geen wijziging modulepagina's) → gerespecteerd, geen enkele task raakt de losse `sap-module-*.html`-bestanden. §7 testing → handmatige browserchecks in Task 2/3/4, JSON-validatie in Task 1.
- **Placeholder scan:** geen TBD/TODO; alle code-blokken zijn volledig, geen "vergelijkbaar met Task N"-verwijzingen zonder code.
- **Type/naam-consistentie:** `courses.json`-veldnamen (`n, file, key, sec, dur, title, sub, track` / `id, title, levels, parts, status, href, note`) zijn identiek in Task 1 (productie) en Task 2/3 (consumptie). `renderSelfStudy`/`renderFamily`/`familyCard`/`card` functienamen consistent tussen Task 2 en 3.
