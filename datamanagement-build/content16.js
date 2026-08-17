// Deel 16 — Data governance operating model.
// Deel 16 is in de generator (04-Broncode/generator) gebouwd met een oudere, losse
// scriptset (reader.js/werkboek.js/docent.js/slides.js/quiz.js) in plaats van met een
// content16.js-object zoals de andere 28 delen. Dit bestand herstructureert diezelfde
// tekst (ongewijzigd overgenomen) naar het gedeelde content-object-formaat, uitsluitend
// voor de HTML-leesversie (fase 2). De docx/pptx-generatie in 04-Broncode/generator
// blijft ongewijzigd en gebruikt dit bestand niet.
module.exports = {
  nr: 16,
  titel: 'Data governance operating model',
  kicker: 'NIVEAU 2 · PRAKTIJK · DEEL 16',
  uren: '± 9 uur (4 uur klassikaal, 5 uur zelfstandig)',
  klassikaal: '4 uur (twee dagdelen van 2 uur)',
  meenemen: 'Reader deel 16 en je eigen DMBOK2',
  benodigd: 'Whiteboard of modelleertool, reader en werkboek',

  reader: (L) => {
    const { h1, h2, h3, p, bul, num, table, callout, spacer, pageBreak, coverBlock, DISCLAIMER } = L;
    const c = [];
    c.push(...coverBlock('NIVEAU 2 · PRAKTIJK · DEEL 16', 'Data governance operating model', 'Deelnemersreader', [
      ['STUDIELAST', '± 9 uur (4 uur klassikaal, 5 uur zelfstandig)'],
      ['EXAMENLIJN', 'CDMP-specialist Data Governance'],
      ['CASUS', 'Meridiaan Pensioen N.V.'],
      ['VERSIE', 'Augustus 2026'],
    ]));
    c.push(spacer(400));
    c.push(callout('Voorbereiding, geen vervanging', DISCLAIMER));
    c.push(pageBreak());

    c.push(h1('1. Waar dit deel over gaat'));
    c.push(p('Governanceprogramma’s stranden zelden op inhoud. Ze stranden omdat niemand weet wie beslist. Een definitiediscussie over "actieve deelnemer" sleept een jaar voort, niet omdat het begrip moeilijk is, maar omdat er geen orgaan is dat de knoop mág doorhakken. Het operating model is het antwoord op precies die vraag: wie beslist wat, op grond waarvan, binnen welke termijn, en wat gebeurt er bij onenigheid.'));
    c.push(p('In deel 14 heb je gezien hoe je master- en referentiedata inricht, in deel 15 hoe je kwaliteit als proces organiseert. Beide leunen op besluiten die iemand moet nemen. Dit deel bouwt de structuur waarin die besluiten vallen — en modelleert die structuur in notaties die je al beheerst: BPMN, CMMN en DMN.'));
    c.push(h3('Leerdoelen'));
    c.push(...num([
      'Je onderscheidt de zes bouwstenen van een governance operating model en benoemt per bouwsteen wat er misgaat als hij ontbreekt.',
      'Je ontwerpt een organenstructuur waarin elk orgaan een mandaat, een agendabron en een escalatiepad heeft.',
      'Je stelt een besluitrechtenmatrix op voor de zeven terugkerende besluittypen en verdedigt de keuzes daarin.',
      'Je kiest per governanceproces de passende notatie — BPMN, CMMN of DMN — en onderbouwt die keuze.',
      'Je kiest tussen centrale, decentrale, federatieve en hub-and-spoke inrichting op grond van expliciete criteria.',
      'Je stelt een adoptieaanpak en een KPI-set op die gedrag meten in plaats van activiteit.',
    ]));
    c.push(pageBreak());

    c.push(h1('2. Wat een operating model is — en wat niet'));
    c.push(p('Data governance is het geheel van besluitrechten en verantwoordingslijnen over data, samen met de organen, rollen, processen en normen waarmee die rechten worden uitgeoefend. Het operating model is de concrete inrichting daarvan in één specifieke organisatie.'));
    c.push(p('Twee dingen doet governance, en niet meer dan dat. Het verdeelt schaarste — aandacht, budget, prioriteit, de tijd van stewards. En het beslecht conflicten — over definities, over eigenaarschap, over toegang. Alles wat een governance-inrichting doet dat niet op één van die twee is terug te voeren, is overhead.'));
    c.push(h3('Drie hardnekkige misverstanden'));
    c.push(...bul([
      'Governance is geen datakwaliteitsproject. Kwaliteit is een van de onderwerpen waarover besloten wordt, niet het doel van de inrichting.',
      'Governance is geen vergaderstructuur. Organen zonder besluitrechten zijn overleg, en overleg verandert niets.',
      'Governance is geen tool. Een catalogus registreert besluiten; hij neemt ze niet.',
    ]));
    c.push(spacer(120));
    c.push(callout('De vergadertoets', [
      'Als niemand het merkt wanneer een governance-orgaan een half jaar niet bijeenkomt, had dat orgaan geen besluitrechten. Loop bij elk voorgesteld orgaan deze toets langs voordat je het in het ontwerp opneemt.',
    ]));
    c.push(h2('De zes bouwstenen'));
    c.push(p('Elk werkend operating model bevat dezelfde zes elementen. Ze zijn niet optioneel en ze hangen aan elkaar: een besluitrecht zonder orgaan is een wens, een orgaan zonder mandaat is een praatgroep.'));
    c.push(table(['#', 'Bouwsteen', 'Kernvraag', 'Als hij ontbreekt'], [
      ['1', 'Mandaat en scope', 'Waar komt het gezag vandaan en waarover gaat het?', 'Elke beslissing wordt heronderhandeld'],
      ['2', 'Organen', 'Waar valt het besluit?', 'Besluiten vallen in de lijn, per afdeling anders'],
      ['3', 'Rollen', 'Wie is aanspreekbaar?', 'Eigenaarschap verdampt bij de eerste reorganisatie'],
      ['4', 'Besluitrechten', 'Wie beslist wat, binnen welke termijn?', 'Alles escaleert, of niets'],
      ['5', 'Processen en normen', 'Hoe verloopt het besluit en wat geldt er?', 'Besluiten zijn niet reproduceerbaar of vindbaar'],
      ['6', 'Meting en bijsturing', 'Werkt het?', 'Het programma sterft stil na achttien maanden'],
    ], [520, 2000, 3400, 3100]));
    c.push(pageBreak());

    c.push(h1('3. Bouwsteen 1 — Mandaat en scope'));
    c.push(p('Mandaat is niet hetzelfde als draagvlak. Draagvlak is prettig; mandaat is de bevoegdheid om een besluit te nemen dat ook geldt voor wie het er niet mee eens is. In de praktijk komt mandaat uit drie bronnen, en de bron bepaalt hoe stevig het staat.'));
    c.push(...bul([
      'Een bestuursbesluit met vastgelegde bevoegdheid — het sterkst, maar traag te verkrijgen.',
      'Een toezichtseis of auditbevinding — snel effectief, maar het mandaat verdampt zodra de bevinding is afgesloten.',
      'Een incident — verschaft momentum van hooguit enkele maanden; gebruik het om iets duurzamers vast te leggen.',
    ]));
    c.push(p('Leg het mandaat vast in een charter. Dat document hoeft niet lang te zijn — twee pagina’s volstaat — maar wel expliciet.'));
    c.push(h3('Elementen van het charter'));
    c.push(...bul([
      'Doel en aanleiding, in één alinea, zonder jargon.',
      'Scope: welke datadomeinen, welke systemen, welke besluittypen. Even belangrijk: wat er buiten valt.',
      'Bevoegdheden per orgaan, inclusief wat het orgaan níét mag.',
      'Verhouding tot aangrenzende disciplines: informatiebeveiliging, privacy, architectuur, risicomanagement.',
      'Rapportagelijn en frequentie richting bestuur.',
      'Herzieningstermijn van het charter zelf.',
    ]));
    c.push(h3('Afbakening naar de buren'));
    c.push(p('De meeste conflicten in het eerste jaar gaan niet over data maar over territorium. Beschrijf de raakvlakken vooraf, in termen van besluiten in plaats van onderwerpen.'));
    c.push(table(['Discipline', 'Beslist over', 'Data governance beslist over'], [
      ['Informatiebeveiliging', 'Beveiligingsmaatregelen en -normen', 'Classificatie van datadomeinen en wie toegang krijgt'],
      ['Privacy / FG', 'Rechtmatigheid van verwerking', 'Definities, kwaliteit en herkomst van de gegevens'],
      ['Architectuur', 'Landschap en technologiekeuzes', 'Betekenis, eigenaarschap en normen voor data'],
      ['Risicomanagement', 'Risicobereidheid en beheersing', 'Data-risico’s aanleveren en beheersmaatregelen uitvoeren'],
    ], [1900, 3400, 3720]));
    c.push(pageBreak());

    c.push(h1('4. Bouwsteen 2 — Organen'));
    c.push(p('Een organenstructuur is geen organogram maar een besluitketen. Ontwerp hem van onderaf: begin bij de besluiten die dagelijks vallen en werk omhoog naar wat werkelijk bestuurlijk is.'));
    c.push(table(['Orgaan', 'Mandaat', 'Samenstelling', 'Ritme', 'Typische besluiten'], [
      ['Data governance board', 'Strategisch, vaststellend', 'Directie, CDO, domeineigenaren', 'Per kwartaal', 'Beleid, budget, escalaties, waivers met hoog risico'],
      ['Domeinraad', 'Tactisch, beslissend binnen domein', 'Data owner, stewards, architect', 'Per maand', 'Definities, kwaliteitsnormen, toegang, prioritering'],
      ['Stewardship-overleg', 'Operationeel, uitvoerend', 'Business- en technical stewards', 'Twee­wekelijks', 'Uitzonderingen, incidenten, regelwijzigingen'],
      ['Werkgroep', 'Tijdelijk, adviserend', 'Wisselend, per vraagstuk', 'Tot einddatum', 'Voorbereiding van één specifiek besluit'],
      ['Community of practice', 'Geen besluitrecht', 'Iedereen die wil', 'Per twee maanden', 'Kennisdeling, signalering'],
    ], [1700, 1750, 1750, 1300, 2520]));
    c.push(spacer(140));
    c.push(h3('Vier ontwerpregels'));
    c.push(...num([
      'Nooit meer organen dan besluittypen. Twee organen die over hetzelfde beslissen, leiden tot forumshoppen.',
      'Elk orgaan heeft een vaste agendabron. Wie mag agenderen, en waar komt de aanvraag binnen? Zonder aanvoer valt een orgaan binnen een half jaar stil.',
      'Elk orgaan heeft een escalatiepad omhoog én een delegatiepad omlaag. Een orgaan dat alles zelf doet, wordt een bottleneck.',
      'Sluit aan op wat er al is. Een bestaand maandelijks domeinoverleg met een uitgebreide agenda werkt beter dan een nieuw gremium met een mooie naam.',
    ]));
    c.push(spacer(120));
    c.push(callout('Praktijkobservatie', [
      'De meest voorkomende ontwerpfout is een board die maandelijks vergadert over operationele uitzonderingen. Bestuurders raken verveeld, komen niet meer, en het mandaat verdampt. Zet het bestuurlijke orgaan op kwartaalritme met een korte agenda en beleg de rest lager.',
    ]));
    c.push(L.fig('16-2', 'De organenstructuur als piramide — van community of practice zonder besluitrecht onderaan, via stewardship-overleg en domeinraad, tot de governance board bovenaan, met escalatie omhoog en delegatie omlaag'));
    c.push(pageBreak());

    c.push(h1('5. Bouwsteen 3 — Rollen'));
    c.push(p('Rollen zijn geen functies. Een data steward is meestal iemand die daarnaast gewoon zijn werk doet — en juist daarom moet het tijdsbeslag expliciet zijn. Een stewardrol zonder uren in het functieprofiel is binnen twee kwartalen verdwenen.'));
    c.push(table(['Rol', 'Verantwoordelijk voor', 'Veelgemaakte fout'], [
      ['Data owner', 'Eindverantwoordelijk voor een datadomein: definities, kwaliteitsnormen, toegang', 'Beleggen per systeem in plaats van per domein'],
      ['Business steward', 'Betekenis en kwaliteit in de dagelijkse praktijk; eerste aanspreekpunt', 'Rol toekennen zonder uren en zonder mandaat'],
      ['Technical steward', 'Herkomst, lineage, technische regels en implementatie', 'Verwarren met de beheerder van het systeem'],
      ['Data custodian', 'Beheer van opslag, back-up, beschikbaarheid en technische toegang', 'Verantwoordelijk houden voor inhoudelijke kwaliteit'],
      ['Data consumer', 'Correct gebruik binnen de afgesproken context', 'Vergeten in het ontwerp, waardoor niemand misbruik signaleert'],
      ['CDO of datamanager', 'Samenhang, programma, rapportage aan bestuur', 'Eigenaar maken van alle data — dan is niemand het'],
      ['Data-architect', 'Modellen, standaarden, samenhang in het landschap', 'Besluitrecht geven over betekenis dat bij de business hoort'],
    ], [1900, 4000, 3120]));
    c.push(spacer(140));
    c.push(h3('Eigenaarschap beleggen: domein, niet systeem'));
    c.push(p('Beleg eigenaarschap op een datadomein — Deelnemer, Werkgever, Belegging, Financiële transactie — en niet op de applicatie waarin die data toevallig staat. Systemen worden vervangen, domeinen niet. Wie eigenaarschap aan applicaties koppelt, herhaalt bij elke migratie dezelfde discussie en krijgt per systeem afwijkende definities.'));
    c.push(pageBreak());

    c.push(h1('6. Bouwsteen 4 — Besluitrechten en escalatie'));
    c.push(p('Dit is het hart van het operating model en het onderdeel dat in de praktijk het vaakst ontbreekt. Een besluitrechtenmatrix beschrijft per besluittype wie adviseert, wie besluit, wie geïnformeerd wordt, binnen welke termijn en waarheen het escaleert.'));
    c.push(h3('De zeven terugkerende besluittypen'));
    c.push(...num([
      'Vaststellen of wijzigen van een begripsdefinitie.',
      'Beleggen van eigenaarschap over een datadomein.',
      'Vaststellen van een kwaliteitsnorm en de bijbehorende drempelwaarde.',
      'Verlenen van toegang tot een dataset of datadomein.',
      'Toestaan van een uitzondering op beleid (waiver).',
      'Prioriteren van datainitiatieven bij schaarste.',
      'Aangaan van uitwisseling of inkoop van externe data.',
    ]));
    c.push(spacer(140));
    c.push(table(['Besluittype', 'Adviseert', 'Besluit', 'Termijn', 'Escaleert naar'], [
      ['Begripsdefinitie', 'Business steward', 'Domeinraad', '15 werkdagen', 'Board'],
      ['Eigenaarschap domein', 'CDO', 'Board', '1 kwartaal', 'Directie'],
      ['Kwaliteitsnorm', 'Steward + architect', 'Domeinraad', '15 werkdagen', 'Board'],
      ['Toegang tot data', 'Steward + security', 'Data owner', '5 werkdagen', 'Domeinraad'],
      ['Waiver op beleid', 'Risk', 'Board (hoog risico), anders domeinraad', '10 werkdagen', 'Directie'],
      ['Prioritering', 'CDO', 'Board', 'Per kwartaal', 'Directie'],
      ['Externe data', 'Inkoop, privacy, risk', 'Board', '1 kwartaal', 'Directie'],
    ], [1900, 1900, 2400, 1300, 1520]));
    c.push(spacer(160));
    c.push(h3('RACI: waar het misgaat'));
    c.push(p('RACI is bruikbaar mits streng toegepast. Twee regels zijn niet onderhandelbaar: er is precies één A per besluit, en R en A mogen samenvallen maar A mag nooit gedeeld worden. Een matrix met vier A’s op één rij betekent dat niemand aanspreekbaar is; dat is geen inrichting maar een gebrek aan keuze dat er ordelijk uitziet.'));
    c.push(h3('Escalatie zonder termijn bestaat niet'));
    c.push(p('De belangrijkste kolom in de matrix hierboven is niet "besluit" maar "termijn". Een escalatiepad zonder tijdslimiet wordt nooit gebruikt: partijen blijven onderhandelen omdat niets hen dwingt. Formuleer het als automatisme — neemt de domeinraad binnen vijftien werkdagen geen besluit, dan gaat het dossier ongewijzigd naar de board. Dat verschuift het gesprek van "wie heeft gelijk" naar "willen wij dit echt door de board laten beslissen", en dat lost verrassend veel op.'));
    c.push(pageBreak());

    c.push(h1('7. Bouwsteen 5 — De normenhiërarchie'));
    c.push(p('Organisaties noemen graag alles "beleid". Het gevolg is dat elke wijziging naar het bestuur moet en er dus niets meer verandert. Onderscheid vijf niveaus, elk met een eigen vaststeller en herzieningsritme.'));
    c.push(table(['Niveau', 'Beantwoordt', 'Vastgesteld door', 'Herziening', 'Afwijken'], [
      ['Beleid', 'Wat willen we en waarom', 'Bestuur', 'Elke 3 jaar', 'Alleen via bestuursbesluit'],
      ['Standaard', 'Welke norm geldt verplicht', 'Governance board', 'Jaarlijks', 'Waiver met einddatum'],
      ['Richtlijn', 'Wat adviseren we', 'Domeinraad', 'Jaarlijks', 'Motiveren volstaat'],
      ['Procedure', 'Hoe verloopt het proces', 'Proceseigenaar', 'Bij wijziging', 'Niet van toepassing'],
      ['Werkinstructie', 'Wie doet wat, waar, wanneer', 'Teamleider', 'Bij wijziging', 'Niet van toepassing'],
    ], [1500, 2400, 1900, 1500, 1720]));
    c.push(spacer(140));
    c.push(callout('Waivers verlopen', [
      'Geef elke waiver een einddatum en een eigenaar. Een uitzondering zonder vervaldatum is een stille beleidswijziging: hij wordt nooit heroverwogen en fungeert binnen een jaar als precedent. Rapporteer het aantal openstaande en verlopen waivers per kwartaal aan de board — het is de scherpste indicator van of het beleid nog leeft.',
    ]));
    c.push(pageBreak());

    c.push(h1('8. Bouwsteen 6 — Governanceprocessen modelleren'));
    c.push(p('Governanceprocessen zijn processen. Ze verdienen dezelfde precisie als een schadeproces of een offertetraject, en ze zijn te modelleren in de notaties die je al gebruikt. De keuze van notatie is geen smaakkwestie: hij volgt uit de aard van het werk.'));
    c.push(table(['Notatie', 'Geschikt wanneer', 'Governancevoorbeeld'], [
      ['BPMN', 'De volgorde ligt vast, het proces heeft een duidelijk begin en eind, afwijkingen zijn uitzondering', 'Een begripsdefinitie wijzigen en publiceren'],
      ['CMMN', 'De volgorde is onbekend of situatie-afhankelijk; de behandelaar bepaalt wat nodig is', 'Een datakwaliteitsincident onderzoeken'],
      ['DMN', 'Een herhaalbaar besluit op grond van expliciete regels, los van wie het uitvoert', 'Bepalen van de classificatie van een dataset'],
    ], [1200, 4000, 3820]));
    c.push(spacer(160));
    c.push(h3('BPMN — het begripswijzigingsproces'));
    c.push(p('Een definitiewijziging verloopt voorspelbaar en hoort daarom in BPMN. Het proces in hoofdlijnen: de aanvraag komt binnen bij de business steward; die voert een impactanalyse uit op rapportages, koppelvlakken en modellen; de technical steward beoordeelt de technische gevolgen; de domeinraad besluit; bij akkoord wordt de definitie in de catalogus gepubliceerd, de wijziging gecommuniceerd aan de bekende afnemers, en het versienummer met ingangsdatum vastgelegd.'));
    c.push(p([
      { text: 'Let op twee dingen. ', bold: false },
      { text: 'Ten eerste ', bold: true },
      { text: 'is de publicatie in de catalogus een processtap en geen bijzaak: zonder die stap valt het besluit buiten het geheugen van de organisatie. ' },
      { text: 'Ten tweede ', bold: true },
      { text: 'hoort de terugkoppeling naar de aanvrager in het model, ook bij afwijzing — dat is de stap die het vertrouwen in de inrichting bepaalt.' },
    ]));
    c.push(L.fig('16-1', 'BPMN-diagram van het begripswijzigingsproces — van aanvraag via impactanalyse en domeinraadbesluit naar publicatie in de catalogus, communicatie aan de afnemers en terugkoppeling aan de aanvrager, met de afwijzingsroute'));
    c.push(h3('CMMN — het kwaliteitsincident'));
    c.push(p('Bij een incident weet je vooraf niet welke stappen nodig zijn. Soms volstaat profiling, soms is een ketengesprek met de bronhouder nodig, soms blijkt de definitie zelf het probleem. Dat is casemanagement, geen proces.'));
    c.push(p('Modelleer een case file met de beschikbare taken — profiling uitvoeren, bronanalyse, ketengesprek, herstelactie, definitie-review — waarvan sommige verplicht zijn en andere discretionair. Gebruik mijlpalen (oorzaak vastgesteld, herstel uitgevoerd, structurele maatregel belegd) en sentries om taken beschikbaar te maken zodra een voorwaarde is vervuld. De behandelaar kiest; het model bewaakt dat de mijlpalen worden gehaald.'));
    c.push(h3('DMN — de classificatiebeslissing'));
    c.push(p('Classificatie is een regelbesluit: dezelfde invoer hoort altijd tot dezelfde uitkomst te leiden, ongeacht wie het uitvoert. Dat is precies waarvoor een beslistabel bestaat.'));
    c.push(spacer(100));
    c.push(table(['#', 'Persoonsgegevens', 'Bijzondere categorie', 'Extern gedeeld', 'Classificatie', 'Toegangsregime'], [
      ['1', 'nee', '—', 'nee', 'Intern', 'Domeinbreed, op aanvraag'],
      ['2', 'nee', '—', 'ja', 'Extern deelbaar', 'Contractueel vastgelegd'],
      ['3', 'ja', 'nee', 'nee', 'Vertrouwelijk', 'Named access, jaarlijkse review'],
      ['4', 'ja', 'nee', 'ja', 'Vertrouwelijk — extern', 'Verwerkersovereenkomst vereist'],
      ['5', 'ja', 'ja', '—', 'Bijzonder', 'Named access + DPIA + logging'],
    ], [420, 1700, 1700, 1400, 1900, 1900]));
    c.push(spacer(120));
    c.push(p([
      { text: 'Hit policy: ', bold: true },
      { text: 'Unique. Elke combinatie valt onder precies één regel; overlap is een modelleerfout en moet bij validatie zichtbaar worden. Kies bewust — bij ' },
      { text: 'First', italics: true },
      { text: ' verbergt de volgorde de overlap in plaats van hem te melden, wat prettig lijkt en het onderhoud sloopt.' },
    ]));
    c.push(spacer(120));
    c.push(L.fig('16-3', 'DMN-beslistabel voor de classificatiebeslissing — vijf regels op basis van persoonsgegevens, bijzondere categorie en externe deling, met classificatie en toegangsregime als uitvoer en hit policy Unique'));
    c.push(callout('Vuistregel voor notatiekeuze', [
      'Teken je een BPMN-proces met acht of meer exclusieve gateways achter elkaar? Dan modelleer je een besluit als een proces. Haal de logica eruit en zet hem in een DMN-beslistabel; het BPMN-model houdt één beslistaak over en wordt weer leesbaar.',
      'Kun je de gateways niet vooraf benoemen omdat het van het geval afhangt? Dan is het geen BPMN maar CMMN.',
    ]));
    c.push(pageBreak());

    c.push(h1('9. Inrichtingsmodellen'));
    c.push(p('Centraal, decentraal, federatief of hub-and-spoke — de keuze is geen ideologie maar een afweging tussen snelheid en uniformiteit. Beschrijf hem als zodanig richting je opdrachtgever.'));
    c.push(table(['Model', 'Kenmerk', 'Passend wanneer', 'Risico'], [
      ['Centraal', 'Eén team stelt normen vast én voert uit', 'Kleine organisatie, homogene data, lage volwassenheid', 'Bottleneck; business voelt zich niet eigenaar'],
      ['Decentraal', 'Domeinen bepalen zelf, geen centrale norm', 'Sterk verschillende domeinen, hoge volwassenheid', 'Definities lopen uiteen; ketenrapportage klopt niet'],
      ['Federatief', 'Centrale normstelling, decentrale uitvoering', 'Middelgroot, meerdere domeinen, toezichtsdruk', 'Onduidelijkheid over wat centraal is en wat niet'],
      ['Hub-and-spoke', 'Klein centraal team ondersteunt domeinstewards', 'Groeimodel richting federatief', 'Hub wordt uitvoerder in plaats van enabler'],
    ], [1500, 2400, 2600, 2520]));
    c.push(spacer(140));
    c.push(h3('Keuzecriteria'));
    c.push(...bul([
      'Omvang en spreiding van de organisatie.',
      'Homogeniteit van de datadomeinen: lijken ze op elkaar of niet?',
      'Volwassenheid — decentraal werkt alleen als domeinen het zelf kunnen.',
      'Toezichtsdruk: hoe meer aantoonbaarheid gevraagd wordt, hoe zwaarder de centrale normstelling.',
      'Staat van het IT-landschap: veel gedeelde systemen duwt richting centraal, domeingebonden platforms richting federatief.',
    ]));
    c.push(p('Voor een middelgrote Nederlandse verzekeraar of pensioenuitvoerder onder DNB-toezicht komt de afweging vrijwel altijd uit op federatief met stevige centrale normstelling. Zeg dat niet als vanzelfsprekendheid tegen de opdrachtgever — laat de criteria het werk doen, anders is het jouw model en niet het hunne.'));
    c.push(pageBreak());

    c.push(h1('10. Adoptie'));
    c.push(p('Een ontwerp dat op papier klopt en in de organisatie niet landt, is een mislukking met goede documentatie. Adoptie is geen sluitstuk van het ontwerp maar een ontwerpeis.'));
    c.push(...bul([
      'Sluit aan op bestaande overleggen in plaats van nieuwe te creëren. Een agendapunt in een bestaand domeinoverleg heeft meer kans dan een nieuw gremium met eigen naam.',
      'Zorg voor zichtbare winst binnen negentig dagen. Eén langlopende definitiediscussie beslechten doet meer voor het draagvlak dan een compleet raamwerk.',
      'Neem stewardrollen op in functieprofiel en beoordelingscyclus, met een expliciet aantal uren.',
      'Maak besluiten vindbaar. Wie een besluit niet kan terugvinden, neemt het opnieuw.',
      'Reken op weerstand en herken de vorm: "dit hebben wij al", "dit vertraagt ons", "hier gaat IT over". Alle drie zijn ze een uiting van onduidelijke besluitrechten — beantwoord ze met de matrix, niet met overtuigingskracht.',
    ]));
    c.push(h2('11. Meten wat er gebeurt'));
    c.push(p('Meet gedrag en uitkomsten, niet activiteit. Het aantal gehouden vergaderingen zegt niets; de doorlooptijd van besluiten zegt alles.'));
    c.push(table(['KPI', 'Wat het zegt', 'Signaalwaarde'], [
      ['Dekking eigenaarschap', 'Aandeel kritieke datadomeinen met een benoemde owner', 'Onder 80% is de inrichting nog niet af'],
      ['Definitiedekking', 'Aandeel kritieke begrippen met vastgestelde definitie', 'Stagnatie duidt op ontbrekend besluitrecht'],
      ['Doorlooptijd besluiten', 'Mediaan van aanvraag tot besluit per besluittype', 'Stijging betekent overbelast orgaan'],
      ['Openstaande waivers', 'Aantal en gemiddelde leeftijd', 'Groei duidt op onwerkbaar beleid'],
      ['Kwaliteitsscore KDE', 'Score op kritieke data-elementen', 'De uitkomstmaat; alle andere zijn voorwaarden'],
      ['Incidenten met dataoorzaak', 'Aandeel incidenten herleidbaar tot data', 'Daling is het bewijs richting bestuur'],
    ], [2200, 3800, 3020]));
    c.push(pageBreak());

    c.push(h1('12. Tien fouten die je in het veld tegenkomt'));
    c.push(...num([
      'Organen zonder besluitrechten — overleg dat zichzelf in stand houdt.',
      'Eigenaarschap belegd op systemen in plaats van datadomeinen.',
      'Stewardrollen zonder uren, mandaat of vermelding in het functieprofiel.',
      'Escalatiepaden zonder termijn, waardoor ze nooit worden gebruikt.',
      'Alles "beleid" noemen, waardoor elke wijziging bestuursbesluit vergt.',
      'Waivers zonder einddatum, die stilzwijgend beleid worden.',
      'Een board die zich met operationele uitzonderingen bezighoudt.',
      'Governanceprocessen die alleen in tekst bestaan en nergens zijn gemodelleerd.',
      'KPI’s die activiteit meten in plaats van uitkomst.',
      'Een raamwerk overnemen zonder het te snoeien op de organisatie.',
    ]));
    c.push(h1('13. Examenrelevantie'));
    c.push(p('Dit deel vormt samen met deel 11 de kern van de voorbereiding op het CDMP-specialistexamen Data Governance. De stof sluit aan op het hoofdstuk over data governance in de DAMA-DMBOK2 Revised Edition; de daar gehanteerde terminologie is leidend op het examen, ook waar de Nederlandse praktijk andere woorden gebruikt.'));
    c.push(h3('Aandachtspunten bij het studeren'));
    c.push(...bul([
      'Ken het onderscheid tussen data owner, steward en custodian in de bewoordingen van het DMBOK — examenvragen toetsen dat onderscheid regelmatig via een scenario.',
      'Governance versus stewardship: waar houdt het besluitrecht op en begint de uitvoering?',
      'Het verschil tussen beleid, standaard en richtlijn, en wie welk niveau vaststelt.',
      'De verhouding tussen data governance en aangrenzende disciplines — dat raakt ook vragen uit andere kennisgebieden.',
      'Engelstalige begrippen: decision rights, stewardship, charter, operating model, escalation path.',
    ]));
    c.push(spacer(140));
    c.push(callout('Studiemateriaal bij dit deel', [
      'Kernbron: het hoofdstuk over data governance in de DAMA-DMBOK2 Revised Edition — schaf deze zelf aan, hij is tijdens het examen ook het enige toegestane hulpmiddel.',
      'Verdieping: het standaardwerk van John Ladley over het ontwerpen en volhouden van een governanceprogramma.',
      'Examenopzet en actuele lijst met specialistexamens: cdmp.info/exams en dama.org/certification.',
      'Dit materiaal reproduceert geen van deze bronnen en vervangt ze niet.',
    ]));
    c.push(pageBreak());

    c.push(h1('14. Casus — Meridiaan Pensioen N.V.'));
    c.push(p('Alle opdrachten in het werkboek spelen zich af bij Meridiaan. Lees deze beschrijving vóór de klassikale sessie; hij is bewust incompleet op punten waar je zelf aannames moet doen en expliciet maken.'));
    c.push(h3('De organisatie'));
    c.push(...bul([
      'Nederlandse pensioenuitvoerder, ongeveer 1.200 medewerkers, circa 380.000 deelnemers, onder toezicht van DNB.',
      'Vier businessdomeinen: Deelnemers, Werkgevers, Beleggingen en Financiën. Elk domein heeft een directeur; geen van hen is formeel data owner.',
      'De polisadministratie is vijfendertig jaar oud. Twee jaar geleden is een cloud-dataplatform in gebruik genomen; migratie loopt en is de grootste risicopost van het jaar.',
    ]));
    c.push(h3('De aanleiding'));
    c.push(...bul([
      'DNB heeft een bevinding opgeleverd over de betrouwbaarheid van de rapportageketen. De termijn voor het herstelplan is vier maanden.',
      'Drie afdelingen rapporteren verschillende deelnemersaantallen over hetzelfde kwartaal. Er blijken vier definities van "actieve deelnemer" in omloop.',
      'Er is een begrippenlijst in een spreadsheet met ruim vierhonderd termen. Niemand is er eigenaar van; de laatste wijziging dateert van veertien maanden geleden.',
    ]));
    c.push(h3('Wat er al is'));
    c.push(...bul([
      'Sinds negen maanden een CDO voor 0,6 fte, rapporterend aan de CFO. Het mandaat is nooit schriftelijk vastgelegd.',
      'Een "Data Board" die maandelijks bijeenkomt, uitsluitend adviseert en waar de laatste twee keer minder dan de helft van de leden aanwezig was.',
      'Vier medewerkers die zichzelf steward noemen, zonder uren in hun functieprofiel.',
      'Een datacatalogus is aangeschaft maar nog niet gevuld.',
    ]));
    c.push(h3('Wat de opdrachtgever vraagt'));
    c.push(p('De CFO wil binnen zes weken een inrichtingsvoorstel dat aan DNB te tonen is, dat de definitiediscussie beslecht, en dat het migratieprogramma niet vertraagt. Hij heeft laten weten "geen nieuwe overlegstructuren" te willen.'));
    return c;
  },

  werkboekIntro: [
    'De opdrachten 1 tot en met 3 maak je vóór de klassikale sessie. Opdracht 4 tot en met 6 doe je klassikaal in tweetallen; daar hoort discussie bij en die is het halve leerrendement. Opdracht 7 en 8 rond je daarna zelfstandig af, samen met de zelftoets.',
    'Alle opdrachten spelen bij Meridiaan Pensioen N.V. De casusbeschrijving staat in hoofdstuk 14 van de reader. De casus is bewust incompleet: waar informatie ontbreekt, doe je een aanname en schrijf je die op. Een expliciete aanname is een goed antwoord; een verzwegen aanname is dat niet.',
  ],
  opdrachtTabel: [
    ['1. Mandaat en charter', 'Vooraf', 'Individueel', '45 min'],
    ['2. Organenontwerp', 'Vooraf', 'Individueel', '45 min'],
    ['3. Besluitrechtenmatrix', 'Vooraf', 'Individueel', '60 min'],
    ['4. BPMN — begripswijziging', 'Klassikaal', 'Tweetal', '50 min'],
    ['5. CMMN — kwaliteitsincident', 'Klassikaal', 'Tweetal', '40 min'],
    ['6. DMN — classificatietabel', 'Klassikaal', 'Tweetal', '45 min'],
    ['7. Inrichtingsmodel kiezen', 'Achteraf', 'Individueel', '45 min'],
    ['8. Adoptieplan 90 dagen', 'Achteraf', 'Individueel', '45 min'],
    ['Zelftoets', 'Achteraf', 'Individueel', '25 min'],
  ],
  opdrachten: [
    {
      nr: 1, tijd: '45 minuten', titel: 'Mandaat en charter',
      doel: 'Vaststellen waar het gezag van de datagovernance bij Meridiaan vandaan komt en dat vastleggen in een charter dat aan DNB te tonen is.',
      stappen: [
        'Benoem welke van de drie mandaatbronnen bij Meridiaan aanwezig zijn en beoordeel per bron hoe duurzaam die is.',
        'Schrijf een charter van maximaal één A4 met de zes elementen uit paragraaf 3 van de reader.',
        'Beschrijf expliciet wat buiten scope valt. Noem minstens drie onderwerpen die anderen erin zullen willen schuiven.',
        'Formuleer de afbakening naar informatiebeveiliging, privacy en risicomanagement in besluiten, niet in onderwerpen.',
      ],
      oplevering: 'Charter van één A4 plus een korte notitie over de houdbaarheid van het mandaat.',
      tip: 'De CDO heeft 0,6 fte en rapporteert aan de CFO. Vraag jezelf af of het mandaat dat je opschrijft met die positionering waargemaakt kan worden — en zo niet, wat je daarover in het charter regelt.',
      ruimte: 6,
    },
    {
      nr: 2, tijd: '45 minuten', titel: 'Organenontwerp',
      doel: 'Een organenstructuur ontwerpen die past bij vier domeinen, een lopende migratie en een opdrachtgever die geen nieuwe overleggen wil.',
      stappen: [
        'Bepaal welke organen strikt noodzakelijk zijn. Pas op elk voorgesteld orgaan de vergadertoets uit de reader toe.',
        'Leg per orgaan vast: mandaat, samenstelling, ritme, agendabron, escalatie omhoog en delegatie omlaag.',
        'Geef aan welke bestaande overleggen je hergebruikt en wat er dan aan hun opdracht verandert.',
        'Beschrijf wat er met de huidige adviserende Data Board gebeurt — opheffen, ombouwen of laten bestaan.',
      ],
      oplevering: 'Overzichtstabel van organen plus twee alinea’s over de omgang met de bestaande Data Board.',
      tip: 'De opmerking "geen nieuwe overlegstructuren" is geen obstakel maar een ontwerpeis. Het beste antwoord voegt netto nul overleggen toe.',
      ruimte: 6,
    },
    {
      nr: 3, tijd: '60 minuten', titel: 'Besluitrechtenmatrix',
      doel: 'De zeven besluittypen beleggen bij de organen uit opdracht 2, met termijnen en escalatie.',
      stappen: [
        'Vul voor elk van de zeven besluittypen in: wie adviseert, wie besluit, wie wordt geïnformeerd, binnen welke termijn, waarheen escaleert het.',
        'Onderbouw de termijnen. Een termijn die je niet kunt verdedigen, is een wens.',
        'Controleer op precies één A per rij en op forumshoppen: is er een besluit dat bij twee organen kan landen?',
        'Markeer welk besluit de definitiediscussie over "actieve deelnemer" beslecht en hoe lang dat volgens jouw matrix duurt.',
      ],
      oplevering: 'Ingevulde matrix van zeven rijen plus een korte toelichting bij de twee besluiten waarover je het langst hebt getwijfeld.',
      tip: 'Reken de doorlooptijd van de definitiediscussie na. Als jouw matrix uitkomt op meer dan zes weken, ligt de DNB-termijn van vier maanden onder druk — dan is dat zelf een bevinding.',
      ruimte: 8,
    },
    {
      nr: 4, tijd: '50 minuten', titel: 'BPMN — het begripswijzigingsproces',
      doel: 'Het proces modelleren waarmee de definitie van "actieve deelnemer" wordt gewijzigd en gepubliceerd.',
      stappen: [
        'Modelleer in BPMN, van aanvraag tot publicatie en communicatie. Gebruik lanes voor de betrokken rollen.',
        'Neem de impactanalyse op rapportages, koppelvlakken en modellen als expliciete taak op.',
        'Modelleer zowel de goedkeuring als de afwijzing, inclusief terugkoppeling aan de aanvrager.',
        'Bepaal waar het versienummer en de ingangsdatum worden vastgelegd, en wie daarvoor tekent.',
        'Tel je exclusieve gateways. Zijn het er meer dan vijf, splits dan de beslislogica af naar opdracht 6.',
      ],
      oplevering: 'BPMN-diagram met lanes, plus één alinea over de vraag welke stap je zou schrappen als het proces te traag blijkt.',
      tip: 'De verleiding is om te stoppen bij "besluit genomen". De stappen daarna — publiceren, communiceren, versie vastleggen — bepalen of het besluit over een jaar nog vindbaar is.',
      ruimte: 4,
    },
    {
      nr: 5, tijd: '40 minuten', titel: 'CMMN — het kwaliteitsincident',
      doel: 'Het onderzoek naar een datakwaliteitsincident modelleren als case in plaats van als proces.',
      stappen: [
        'Beschrijf de case file: welke informatie ligt bij aanvang vast?',
        'Benoem minimaal vijf taken en geef per taak aan of die verplicht of discretionair is.',
        'Definieer drie mijlpalen en bepaal per mijlpaal wanneer die is bereikt.',
        'Beschrijf twee sentries: welke gebeurtenis maakt welke taak beschikbaar?',
        'Geef aan wanneer de case mag sluiten — en wie dat besluit neemt.',
      ],
      oplevering: 'CMMN-model plus een korte argumentatie waarom dit géén BPMN-proces is.',
      tip: 'De scherpste toets: kun je vooraf de volgorde van de taken opschrijven? Kan dat wel, dan had het BPMN moeten zijn en klopt je casuskeuze niet.',
      ruimte: 4,
    },
    {
      nr: 6, tijd: '45 minuten', titel: 'DMN — de classificatiebeslissing',
      doel: 'Een beslistabel opstellen die de classificatie van een dataset bepaalt, met de bijbehorende toegangsregels.',
      stappen: [
        'Bepaal de invoervariabelen. Begin met de vier uit de reader en voeg er ten minste één toe die specifiek is voor een pensioenuitvoerder.',
        'Stel de beslistabel op met classificatie én toegangsregime als uitvoer.',
        'Kies een hit policy en verantwoord de keuze.',
        'Controleer op volledigheid en op overlap. Noteer welke combinaties je bewust niet hebt afgedekt.',
        'Bepaal waar deze beslistabel in het BPMN-model van opdracht 4 wordt aangeroepen.',
      ],
      oplevering: 'DMN-beslistabel met minimaal zes regels, plus een notitie over volledigheid en overlap.',
      tip: 'Denk aan gegevens die bij een pensioenuitvoerder bijzonder gevoelig liggen zonder formeel een bijzondere categorie te zijn — arbeidsongeschiktheid, scheidingsgegevens, nabestaanden.',
      ruimte: 4,
    },
    {
      nr: 7, tijd: '45 minuten', titel: 'Inrichtingsmodel kiezen',
      doel: 'Een onderbouwde keuze maken tussen centraal, decentraal, federatief en hub-and-spoke voor Meridiaan.',
      stappen: [
        'Scoor Meridiaan op de vijf keuzecriteria uit de reader.',
        'Kies een model en beschrijf in maximaal 300 woorden waarom, in termen die de CFO begrijpt.',
        'Benoem het grootste risico van jouw keuze en de maatregel waarmee je dat afdekt.',
        'Beschrijf hoe het model er over twee jaar uitziet als de migratie is afgerond — verandert de keuze dan?',
      ],
      oplevering: 'Scoringstabel, keuzenotitie van maximaal 300 woorden, en een risicoparagraaf.',
      tip: 'Presenteer de criteria vóór de conclusie. Een opdrachtgever die de criteria heeft geaccepteerd, accepteert de uitkomst; andersom werkt het zelden.',
      ruimte: 6,
    },
    {
      nr: 8, tijd: '45 minuten', titel: 'Adoptieplan voor negentig dagen',
      doel: 'Een plan maken dat binnen drie maanden zichtbaar resultaat oplevert zonder het migratieprogramma te vertragen.',
      stappen: [
        'Kies één zichtbare winst die binnen negentig dagen haalbaar is en verantwoord die keuze.',
        'Beschrijf hoe je de vier bestaande stewards van rol naar mandaat brengt, inclusief uren en verankering in het functieprofiel.',
        'Stel een KPI-set van maximaal zes indicatoren op en geef per indicator de startwaarde die je verwacht.',
        'Benoem de drie weerstandpatronen die je bij Meridiaan verwacht en je reactie erop.',
        'Beschrijf wat je in de eerste kwartaalrapportage aan de board laat zien.',
      ],
      oplevering: 'Plan van maximaal twee A4, met tijdlijn, KPI-set en risicoparagraaf.',
      tip: 'Kies de zichtbare winst zo dat de DNB-bevinding erdoor wordt geraakt. Winst die de toezichthouder niet aangaat, koopt intern minder krediet dan je denkt.',
      ruimte: 6,
    },
  ],
  reflectie: [
    'Welke bouwsteen ontbreekt bij jouw eigen opdrachtgever het meest?',
    'Welk besluittype blijft daar structureel liggen, en waarom?',
    'Wat ga je binnen twee weken concreet anders doen?',
  ],

  quiz: [
    { q: 'Een verzekeraar belegt data-eigenaarschap per applicatie. Wat is het meest waarschijnlijke gevolg?', o: ['De kwaliteit van de brondata neemt structureel toe.', 'Definities gaan per systeem uiteenlopen en herhalen zich bij elke migratie.', 'Stewards krijgen automatisch meer mandaat.', 'Het aantal waivers daalt.'], a: 1, e: 'Systemen worden vervangen, datadomeinen niet. Eigenaarschap op applicatieniveau laat betekenis meebewegen met techniek, waardoor bij elke vervanging dezelfde definitiediscussie terugkomt en systemen onderling gaan afwijken.' },
    { q: 'Wie stelt in een goed ingerichte normenhiërarchie een verplichte standaard vast?', o: ['Het bestuur', 'De governance board', 'De domeinraad', 'De proceseigenaar'], a: 1, e: 'Beleid is bestuurlijk, de verplichte standaard hoort bij de governance board, een richtlijn bij de domeinraad en de procedure bij de proceseigenaar. Alles bij het bestuur beleggen maakt wijziging praktisch onmogelijk.' },
    { q: 'Een escalatiepad is beschreven maar wordt in twee jaar niet één keer gebruikt. Wat is de meest waarschijnlijke oorzaak?', o: ['De organisatie is uitzonderlijk volwassen.', 'Er ontbreekt een termijn waarbinnen het lagere orgaan moet beslissen.', 'Het escalatiepad is te kort.', 'De board vergadert te vaak.'], a: 1, e: 'Zonder tijdslimiet dwingt niets partijen tot afronding en blijft men onderhandelen. Een automatische doorgeleiding na een vaste termijn maakt het pad werkzaam — juist doordat men het liever vermijdt.' },
    { q: 'Welke notatie past bij het onderzoeken van een datakwaliteitsincident waarvan de aanpak per geval verschilt?', o: ['BPMN', 'CMMN', 'DMN', 'UML-sequentiediagram'], a: 1, e: 'De volgorde is niet vooraf bekend en de behandelaar bepaalt wat nodig is. Dat is casemanagement: CMMN, met discretionaire taken, mijlpalen en sentries.' },
    { q: 'Je treft een BPMN-model aan met elf opeenvolgende exclusieve gateways. Wat is de aangewezen ingreep?', o: ['Het model opsplitsen in drie subprocessen.', 'De gateways vervangen door parallelle gateways.', 'De beslislogica verplaatsen naar een DMN-beslistabel en één beslistaak overhouden.', 'Overstappen op CMMN.'], a: 2, e: 'Een reeks exclusieve gateways is een besluit dat als proces is getekend. In DMN wordt de logica expliciet, toetsbaar en onderhoudbaar, en blijft het BPMN-model leesbaar.' },
    { q: 'Wat betekent de hit policy "Unique" in een DMN-beslistabel?', o: ['De eerste passende regel wint.', 'Elke combinatie van invoerwaarden valt onder precies één regel; overlap is een fout.', 'Alle passende regels worden uitgevoerd.', 'De regel met de hoogste prioriteit wint.'], a: 1, e: 'Unique dwingt af dat regels elkaar niet overlappen en maakt modelleerfouten zichtbaar bij validatie. First verbergt overlap juist achter de volgorde, wat het onderhoud op termijn onbetrouwbaar maakt.' },
    { q: 'Een RACI-matrix bevat op één rij drie A’s. Wat is de consequentie?', o: ['Het besluit is extra goed geborgd.', 'Er is feitelijk niemand aanspreekbaar op dat besluit.', 'De R kan vervallen.', 'Het besluit hoort automatisch naar het bestuur.'], a: 1, e: 'Accountability is per definitie enkelvoudig. Meerdere A’s zijn geen borging maar een uitgestelde keuze die er ordelijk uitziet; in de praktijk verwijst iedereen naar de ander.' },
    { q: 'Welke situatie pleit het sterkst voor een federatief inrichtingsmodel?', o: ['Kleine organisatie met één homogeen datadomein en lage volwassenheid.', 'Middelgrote organisatie met meerdere domeinen en aantoonbaarheidseisen van een toezichthouder.', 'Organisatie waarin elk domein volledig autonoom wil blijven.', 'Organisatie zonder centrale IT-functie.'], a: 1, e: 'Federatief combineert centrale normstelling met decentrale uitvoering. Dat past waar uniformiteit aantoonbaar moet zijn maar domeinen genoeg verschillen om eigen invulling te rechtvaardigen.' },
    { q: 'Welke van deze indicatoren is een vanity metric voor data governance?', o: ['Mediane doorlooptijd van besluiten per besluittype.', 'Aandeel kritieke datadomeinen met een benoemde owner.', 'Aantal gehouden vergaderingen van de governance board.', 'Aantal en gemiddelde leeftijd van openstaande waivers.'], a: 2, e: 'Vergaderfrequentie meet activiteit, niet uitkomst. Een board kan trouw vergaderen terwijl geen enkel besluit valt; de andere drie meten of de inrichting daadwerkelijk iets verandert.' },
    { q: 'Wat is het grootste risico van een waiver zonder einddatum?', o: ['De auditor keurt hem niet goed.', 'Hij wordt stilzwijgend beleid en werkt als precedent.', 'De steward verliest zijn mandaat.', 'De classificatie moet opnieuw worden vastgesteld.'], a: 1, e: 'Een uitzondering die nooit vervalt, wordt nooit heroverwogen. Binnen een jaar beroept een volgende afdeling zich erop, en de facto is de standaard gewijzigd zonder dat iemand dat heeft besloten.' },
    { q: 'Wat onderscheidt een data custodian van een data owner?', o: ['De custodian bepaalt de definitie, de owner de opslag.', 'De custodian beheert opslag, beschikbaarheid en technische toegang; de owner is inhoudelijk eindverantwoordelijk.', 'De custodian is altijd een externe partij.', 'Er is geen wezenlijk verschil; het zijn synoniemen.'], a: 1, e: 'De custodian is de technische bewaarder en wordt regelmatig ten onrechte aangesproken op inhoudelijke kwaliteit. Die verantwoordelijkheid ligt bij de owner, ondersteund door de stewards.' },
    { q: 'Een organisatie wil governance invoeren zonder nieuwe overlegstructuren. Wat is de meest kansrijke aanpak?', o: ['Toch een nieuw gremium instellen, maar met een andere naam.', 'Besluitrechten beleggen bij bestaande domeinoverleggen en hun agenda uitbreiden.', 'Alle besluiten bij de CDO beleggen.', 'Wachten tot het migratieprogramma is afgerond.'], a: 1, e: 'Bestaande overleggen hebben al aanwezigheid, ritme en gezag. Het besluitrecht expliciet daar beleggen kost minder adoptie-energie dan een nieuw orgaan dat zijn bestaansrecht nog moet verdienen.' },
  ],

  docent: {
    vooraf: [
      'Reader deel 16 gelezen, inclusief de casusbeschrijving in hoofdstuk 14.',
      'Opdracht 1, 2 en 3 gemaakt. Vraag bij binnenkomst wie ze af heeft; met minder dan de helft verschuif je opdracht 4 en gebruik je het eerste half uur voor opdracht 3 in tweetallen.',
    ],
    klaarzetten: [
      'Een modelleeromgeving of groot whiteboard per tweetal. BPMN en CMMN op papier werkt beter dan een tool die niemand kent.',
      'Vier geprinte exemplaren van de besluitrechtenmatrix uit de reader als terugvaloptie.',
      'Je eigen DMBOK2 zichtbaar op tafel — het modelleert het gedrag dat je bij het examen verwacht.',
    ],
    positionering: 'Deel 11 leverde het frameworkdenken en de volwassenheidsmeting; deel 15 leverde het kwaliteitsproces waarvan hier de besluitvorming wordt ingericht. Deel 16 is samen met deel 11 de kern van de voorbereiding op het CDMP-specialistexamen Data Governance. De opbrengst van dit deel — organenontwerp, besluitrechtenmatrix, adoptieplan — komt terug in de capstone van deel 21.',
    dagindeling: [
      ['0:00–0:20', 'Opening: de vergadertoets', 'Plenair', 'Laat drie deelnemers een orgaan uit hun eigen praktijk langs de toets leggen'],
      ['0:20–0:50', 'Bespreking opdracht 1 t/m 3', 'Plenair', 'Niet alle drie uitputtend; kies de matrix als zwaartepunt'],
      ['0:50–1:40', 'Opdracht 4 — BPMN', 'Tweetallen', 'Loop rond en tel gateways'],
      ['1:40–2:00', 'Nabespreking BPMN', 'Plenair', 'Twee modellen op het bord, laat het verschil zien'],
      ['— pauze —', '', '', ''],
      ['2:00–2:40', 'Opdracht 5 — CMMN', 'Tweetallen', 'Grijp in zodra men een volgorde tekent'],
      ['2:40–3:25', 'Opdracht 6 — DMN', 'Tweetallen', 'Dwing een expliciete hit policy af'],
      ['3:25–3:45', 'Notatiekeuze: het overzicht', 'Plenair', 'Koppel terug naar de vuistregel uit de reader'],
      ['3:45–4:00', 'Afsluiting en huiswerk', 'Plenair', 'Opdracht 7, 8 en de zelftoets uitzetten'],
    ],
    model: [
      { nr: 1, titel: 'Mandaat en charter',
        sterk: ['Herkenning dat de DNB-bevinding het sterkste maar meest vluchtige mandaat is: effectief zolang de bevinding openstaat, daarna weg.', 'Een charter dat expliciet maakt wat de CDO níét beslist — anders belooft het meer dan 0,6 fte kan waarmaken.', 'Scope-uitsluitingen die concreet zijn: het migratieprogramma zelf, informatiebeveiligingsmaatregelen, de rechtmatigheidstoets van verwerkingen.', 'Afbakening geformuleerd in besluiten in plaats van onderwerpen.', 'Een herzieningstermijn voor het charter zelf.'],
        mis: ['Charter van vier pagina’s met missie, visie en kernwaarden. Stuur naar één A4 en naar bevoegdheden.', 'Mandaat afleiden uit de aanstelling van de CDO. Een aanstelling is geen bevoegdheid.', 'De DNB-bevinding als permanente basis nemen; vraag door op wat er gebeurt als de bevinding is afgesloten.'],
        vraag: 'Stel dat DNB de bevinding morgen sluit. Welke zin in jouw charter houdt het mandaat dan overeind?' },
      { nr: 2, titel: 'Organenontwerp',
        sterk: ['Netto nul nieuwe overleggen: de vier bestaande domeinoverleggen krijgen besluitrecht en een uitgebreide agenda.', 'De huidige adviserende Data Board wordt omgebouwd tot besluitvormende board op kwartaalritme, met een kleinere bezetting.', 'Het stewardship-overleg wordt tweewekelijks en is het enige nieuwe ritme — verdedigbaar omdat het operationeel is en geen bestuurders kost.', 'Per orgaan een benoemde agendabron, bijvoorbeeld: definitieaanvragen komen binnen bij de business steward van het domein.', 'Expliciete delegatie omlaag, zodat de board niet volloopt.'],
        mis: ['Een nieuw "Data Governance Office" instellen. Toets dat aan de eis "geen nieuwe overlegstructuren".', 'De Data Board maandelijks laten doorvergaderen. Vraag naar de opkomstcijfers uit de casus.', 'Vijf of zes organen ontwerpen voor vier domeinen en zeven besluittypen.'],
        vraag: 'Welk orgaan in jouw ontwerp zou over een half jaar als eerste stilvallen, en wat houdt het in leven?' },
      { nr: 3, titel: 'Besluitrechtenmatrix',
        sterk: ['Definitiebesluiten bij de domeinraad, niet bij de board — anders duurt de "actieve deelnemer"-discussie een kwartaal.', 'Toegangsbesluiten bij de data owner met een korte termijn, vijf werkdagen of minder; hier ontstaat anders schaduwbeleid.', 'Waivers gesplitst naar risiconiveau, zodat niet elke uitzondering bestuurlijk wordt.', 'Precies één A per rij, ook waar dat ongemakkelijk voelt.', 'Een doorrekening van de definitiediscussie: aanvraag, impactanalyse, besluit, publicatie — realistisch drie tot zes weken.'],
        mis: ['Alle zeven besluiten bij de board. Wijs op het risico van een bottleneck en op de DNB-termijn.', 'Termijnen invullen zonder onderbouwing. Vraag waar de vijftien werkdagen vandaan komen.', 'De informatieplicht overslaan. Wie niet weet dat een definitie is gewijzigd, blijft de oude rapporteren.'],
        vraag: 'Als jouw matrix klopt, hoe lang duurt het dan tot Meridiaan één definitie van "actieve deelnemer" heeft? Haalt dat de DNB-termijn?' },
      { nr: 4, titel: 'BPMN — begripswijziging',
        sterk: ['Lanes voor aanvrager, business steward, technical steward, domeinraad en catalogusbeheer.', 'Impactanalyse als expliciete taak met een eigen uitkomst, niet verstopt in "beoordelen".', 'Zowel de akkoord- als de afwijzingsroute, beide met terugkoppeling aan de aanvrager.', 'Publicatie in de catalogus, communicatie aan bekende afnemers en vastlegging van versie en ingangsdatum als afzonderlijke stappen.', 'Hooguit twee of drie exclusieve gateways; meer betekent dat er beslislogica in het proces zit.'],
        mis: ['Het proces eindigt bij "besluit genomen". Vraag wie dan de rapportagebouwer inlicht.', 'De afwijzingsroute ontbreekt. Dat is precies de route die het vertrouwen in de inrichting bepaalt.', 'Taken en besluiten door elkaar: een gateway per criterium in plaats van één beslistaak.'],
        vraag: 'Welke stap schrap je als de doorlooptijd van zes naar drie weken moet? En wat kost dat?' },
      { nr: 5, titel: 'CMMN — kwaliteitsincident',
        sterk: ['Case file met melding, betrokken data-elementen, gemelde afwijking en eerste inschatting van impact.', 'Verplichte taken: impactbepaling en afsluitende vastlegging. Discretionair: profiling, bronanalyse, ketengesprek, definitie-review.', 'Mijlpalen: impact bepaald, oorzaak vastgesteld, herstel uitgevoerd, structurele maatregel belegd.', 'Sentries die werken, bijvoorbeeld: zodra de oorzaak in een bronsysteem ligt, wordt het ketengesprek beschikbaar.', 'Sluiting door de data owner, niet door de behandelaar zelf.'],
        mis: ['Een volgorde tekenen. Grijp meteen in: als de volgorde vaststaat, is het BPMN en klopt de casuskeuze niet.', 'Alle taken verplicht maken. Dan is de discretie weg en had CMMN geen meerwaarde.', 'Mijlpalen die eigenlijk taken zijn — "profiling uitvoeren" is geen mijlpaal, "oorzaak vastgesteld" wel.'],
        vraag: 'Noem een incident uit je eigen praktijk waarbij de aanpak halverwege omging. Welke sentry had dat kunnen vangen?' },
      { nr: 6, titel: 'DMN — classificatiebeslissing',
        sterk: ['Een vijfde invoervariabele die past bij een pensioenuitvoerder: arbeidsongeschiktheidsgegevens, scheidings- of nabestaandengegevens, of gegevens van minderjarige begunstigden.', 'Uitvoer met twee kolommen: classificatie én toegangsregime, zodat de tabel direct bruikbaar is.', 'Hit policy Unique met een expliciete verantwoording, of First met een verantwoording waarom volgorde hier acceptabel is.', 'Een notitie over niet-afgedekte combinaties in plaats van een schijnbaar volledige tabel.', 'Aanroep vanuit een beslistaak in het BPMN-model van opdracht 4 of in het onboardingproces van nieuwe datasets.'],
        mis: ['Geen hit policy benoemen. Dwing de keuze af; hij bepaalt of overlap een fout of een feature is.', 'Tien of meer regels doordat elke uitzondering een eigen rij krijgt. Vraag welke invoervariabele ontbreekt.', 'Toegangsregime weglaten, waardoor de classificatie geen gevolg heeft.'],
        vraag: 'Wat gebeurt er in jouw tabel met een dataset waarvan de inhoud pas na verrijking bijzondere gegevens bevat?' },
      { nr: 7, titel: 'Inrichtingsmodel',
        sterk: ['Federatief met stevige centrale normstelling is het verwachte antwoord — maar de score op de criteria moet dat dragen.', 'Erkenning dat de volwassenheid laag is, wat tijdelijk zwaarder centraal pleit; hub-and-spoke als groeipad is een sterk antwoord.', 'Het grootste risico benoemd: onduidelijkheid over wat centraal is, met als maatregel een expliciete lijst van centraal vastgestelde normen.', 'Een blik op de situatie na de migratie, waarin het accent verder naar de domeinen kan verschuiven.'],
        mis: ['Het model kiezen en pas daarna de criteria erbij zoeken. Dat is te horen aan de volgorde in de notitie.', 'Decentraal kiezen omdat het modern klinkt. Confronteer met de vier definities van "actieve deelnemer".', 'Meer dan 300 woorden. De beperking is de oefening.'],
        vraag: 'Verdedig je keuze tegenover een domeindirecteur die vindt dat hij dit prima zelf kan.' },
      { nr: 8, titel: 'Adoptieplan',
        sterk: ['Zichtbare winst die de DNB-bevinding raakt: één vastgestelde definitie van "actieve deelnemer" met aantoonbare doorwerking in de drie rapportages.', 'Stewardrollen met een concreet aantal uren, opgenomen in het functieprofiel, met akkoord van de leidinggevende als voorwaarde.', 'Maximaal zes KPI’s, waarvan minstens één uitkomstmaat en geen enkele die activiteit meet.', 'Weerstandpatronen benoemd met een antwoord dat naar de besluitrechtenmatrix verwijst in plaats van naar overtuigingskracht.', 'Een eerste kwartaalrapportage die past op één pagina.'],
        mis: ['Een communicatieplan in plaats van een adoptieplan. Vraag wat er in gedrag verandert.', 'Twaalf KPI’s. Laat schrappen tot zes; de discussie daarover is het leermoment.', 'Winst kiezen die pas na de migratie zichtbaar wordt.'],
        vraag: 'Wat doe je in week elf als blijkt dat de zichtbare winst het niet gaat halen?' },
    ],
    discussie: [
      'Kan governance werken zonder mandaat, puur op vrijwilligheid? Onder welke voorwaarden wel?',
      'Waar houdt data governance op en begint data-architectuur — en wie beslist dat?',
      'Is een CDO die aan de CFO rapporteert beter of slechter af dan een CDO onder de COO?',
      'Wat doe je als de data owner van een domein structureel niet komt opdagen?',
      'Federated computational governance uit de data mesh-literatuur: nieuw idee of oude wijn? Dit loopt door naar deel 23 en 25.',
    ],
    snelle: [
      'Laat de besluitrechtenmatrix uitbreiden met een achtste besluittype dat zij zelf uit hun praktijk halen.',
      'Vraag om de DMN-tabel te herschrijven met een andere hit policy en de gevolgen te benoemen.',
      'Laat ze de rol van criticaster spelen bij de nabespreking van opdracht 7.',
    ],
    vast: [
      'Beperk opdracht 3 tot vier besluittypen in plaats van zeven.',
      'Geef bij opdracht 4 de lanes voor; het modelleren zelf is dan de oefening.',
      'Laat opdracht 5 in duo met een sterkere deelnemer maken en de nabespreking presenteren.',
    ],
    faq: [
      ['"Moet ik het DMBOK echt zelf kopen?"', 'Ja. Het is tijdens het CDMP-examen het enige toegestane hulpmiddel en dit materiaal reproduceert het niet. Papier of digitaal, niet beide.'],
      ['"Telt dit deel als officiële examentraining?"', 'Nee. Ductus is geen geaccrediteerde aanbieder; dit is onafhankelijk voorbereidend materiaal.'],
      ['"Welke twee specialistexamens moet ik kiezen?"', 'Voor consultants adviseren wij Data Governance en Data Quality. De keuze is vrij; controleer de actuele lijst bij DAMA.'],
      ['"Zijn de zelftoetsvragen echte examenvragen?"', 'Nee, ze zijn door Ductus opgesteld en trainen het vraagtype, niet de inhoud van het examen.'],
      ['"Is BPMN op het examen nodig?"', 'Niet als notatie. Het onderscheid tussen governanceproces en besluitregel wel; dat toetsen scenariovragen regelmatig.'],
    ],
  },

  slides: [
    { t: 'cover', sub: 'Wie beslist wat, op grond waarvan, binnen welke termijn — en wat er gebeurt bij onenigheid.', notes: 'Open met de vraag: wie in deze zaal heeft een definitiediscussie meegemaakt die langer dan een half jaar duurde? Vrijwel iedere hand gaat omhoog. Dat is het onderwerp van vandaag.' },
    { t: 'stat', kicker: 'DE AANLEIDING', titel: 'Governance strandt zelden op inhoud',
      big: '4', bigsub: 'definities van "actieve deelnemer" in omloop bij Meridiaan — over hetzelfde kwartaal, in drie rapportages.',
      right: ['Het begrip is niet moeilijk — er is geen orgaan dat de knoop mág doorhakken.', 'De begrippenlijst telt 400 termen en heeft geen eigenaar.', 'De DNB-bevinding geeft vier maanden om dit aantoonbaar op te lossen.', 'De CDO heeft 0,6 fte en een mandaat dat nergens is vastgelegd.'],
      notes: 'Laat de deelnemers eerst zelf benoemen waarom dit niet met een spreadsheet op te lossen is. Het antwoord moet uitkomen bij besluitrechten.' },
    { t: 'cards', kicker: 'DEFINITIE', titel: 'Governance doet twee dingen', sub: 'Alles wat daar niet op terug te voeren is, is overhead.',
      items: [
        { h: 'Schaarste verdelen', b: 'Aandacht, budget, prioriteit, de tijd van stewards. Er is altijd minder capaciteit dan vraag; governance maakt die verdeling expliciet in plaats van impliciet.' },
        { h: 'Conflicten beslechten', b: 'Over definities, over eigenaarschap, over toegang. Niet door consensus af te wachten, maar door vast te leggen wie de knoop doorhakt en wanneer.' },
      ], cols: 2, y: 2.4, h: 2.6, hSize: 22, bSize: 15,
      foot: 'Data governance = besluitrechten en verantwoordingslijnen over data, plus de organen, rollen, processen en normen waarmee die worden uitgeoefend.',
      notes: 'Benadruk: governance is geen kwaliteitsproject, geen vergaderstructuur en geen tool.' },
    { t: 'cards', kicker: 'WAT HET NIET IS', titel: 'Drie hardnekkige misverstanden',
      items: [
        { n: '1', h: 'Geen kwaliteitsproject', b: 'Kwaliteit is een van de onderwerpen waarover besloten wordt, niet het doel van de inrichting.' },
        { n: '2', h: 'Geen vergaderstructuur', b: 'Organen zonder besluitrechten zijn overleg. Overleg verandert niets.' },
        { n: '3', h: 'Geen tool', b: 'Een catalogus registreert besluiten. Hij neemt ze niet.' },
      ], cols: 3, y: 2.3, h: 2.8,
      notes: 'Vraag welk misverstand men bij de eigen opdrachtgever het meest tegenkomt. Meestal nummer twee.' },
    { t: 'cards', kicker: 'HET RAAMWERK VAN VANDAAG', titel: 'Zes bouwstenen', sub: 'Niet optioneel, en ze hangen aan elkaar.',
      items: [
        { n: '1', h: 'Mandaat en scope', b: 'Waar komt het gezag vandaan?' },
        { n: '2', h: 'Organen', b: 'Waar valt het besluit?' },
        { n: '3', h: 'Rollen', b: 'Wie is aanspreekbaar?' },
        { n: '4', h: 'Besluitrechten', b: 'Wie beslist wat, binnen welke termijn?' },
        { n: '5', h: 'Processen en normen', b: 'Hoe verloopt het en wat geldt er?' },
        { n: '6', h: 'Meting', b: 'Werkt het?' },
      ], cols: 3, y: 2.25, h: 2.1, hSize: 16, bSize: 12,
      notes: 'Kondig aan dat elke bouwsteen een opdracht kent. Bouwsteen 6 komt terug in het huiswerk.' },
    { t: 'statement', kicker: 'DE VERGADERTOETS',
      big: 'Merkt niemand het wanneer een orgaan een half jaar niet bijeenkomt, dan had het geen besluitrechten.',
      small: 'Leg elk voorgesteld orgaan langs deze toets vóórdat je het in het ontwerp opneemt. In de praktijk sneuvelt hier ongeveer de helft.',
      notes: 'Laat drie deelnemers een orgaan uit hun eigen praktijk langs de toets leggen. Dit is het moment waarop het kwartje valt.' },
    { t: 'cards', kicker: 'BOUWSTEEN 1', titel: 'Mandaat is geen draagvlak', sub: 'Draagvlak is prettig. Mandaat is de bevoegdheid om te beslissen voor wie het er niet mee eens is.',
      items: [
        { h: 'Bestuursbesluit', b: 'Het sterkst en het duurzaamst. Traag te verkrijgen, dus begin er vroeg aan.' },
        { h: 'Toezichtseis', b: 'Snel effectief. Verdampt zodra de bevinding is afgesloten — leg intussen iets duurzamers vast.' },
        { h: 'Incident', b: 'Hooguit enkele maanden momentum. Gebruik het, maar bouw er niets structureels op.' },
      ], cols: 3, y: 2.6, h: 2.5,
      foot: 'Leg het mandaat vast in een charter van maximaal één A4 — met een herzieningstermijn voor het charter zelf.',
      notes: 'Meridiaan heeft bron twee en drie, maar niet bron één. Dat is precies opdracht 1.' },
    { t: 'table', kicker: 'BOUWSTEEN 1', titel: 'Afbakening naar de buren', sub: 'De meeste conflicten in jaar één gaan niet over data maar over territorium.',
      head: ['Discipline', 'Beslist over', 'Data governance beslist over'],
      rows: [
        ['Informatiebeveiliging', 'Beveiligingsmaatregelen en -normen', 'Classificatie van datadomeinen en wie toegang krijgt'],
        ['Privacy / FG', 'Rechtmatigheid van de verwerking', 'Definitie, kwaliteit en herkomst van de gegevens'],
        ['Architectuur', 'Landschap en technologiekeuzes', 'Betekenis, eigenaarschap en normen voor data'],
        ['Risicomanagement', 'Risicobereidheid en beheersing', 'Data-risico’s aanleveren en maatregelen uitvoeren'],
      ], colW: [2.6, 4.3, 5.0], rowH: 0.52, size: 13,
      notes: 'Vraag wie deze afbakening ooit schriftelijk heeft zien staan. Bijna niemand — en daar komen de conflicten vandaan.' },
    { t: 'table', kicker: 'BOUWSTEEN 2', titel: 'Organen: ontwerp van onderaf', sub: 'Begin bij de besluiten die dagelijks vallen en werk omhoog naar wat werkelijk bestuurlijk is.',
      head: ['Orgaan', 'Mandaat', 'Ritme', 'Typische besluiten'],
      rows: [
        ['Governance board', 'Strategisch, vaststellend', 'Per kwartaal', 'Beleid, budget, escalaties, zware waivers'],
        ['Domeinraad', 'Tactisch, beslissend', 'Per maand', 'Definities, kwaliteitsnormen, toegang, prioritering'],
        ['Stewardship-overleg', 'Operationeel, uitvoerend', 'Tweewekelijks', 'Uitzonderingen, incidenten, regelwijzigingen'],
        ['Werkgroep', 'Tijdelijk, adviserend', 'Tot einddatum', 'Voorbereiding van één specifiek besluit'],
        ['Community of practice', 'Geen besluitrecht', 'Per twee maanden', 'Kennisdeling, signalering'],
      ], colW: [2.9, 2.9, 2.0, 4.1], rowH: 0.46, size: 12,
      notes: 'Wijs op de laatste rij: een community zonder besluitrecht is prima, mits je dat expliciet maakt.' },
    { t: 'cards', kicker: 'BOUWSTEEN 2', titel: 'Vier ontwerpregels',
      items: [
        { n: '1', h: 'Nooit meer organen dan besluittypen', b: 'Twee organen die over hetzelfde beslissen, leiden tot forumshoppen.' },
        { n: '2', h: 'Elk orgaan heeft een agendabron', b: 'Wie mag agenderen en waar komt de aanvraag binnen? Zonder aanvoer valt een orgaan binnen een half jaar stil.' },
        { n: '3', h: 'Escalatie omhoog, delegatie omlaag', b: 'Een orgaan dat alles zelf doet, wordt de bottleneck van het programma.' },
        { n: '4', h: 'Sluit aan op wat er al is', b: 'Een bestaand overleg met een uitgebreide agenda werkt beter dan een nieuw gremium met een mooie naam.' },
      ], cols: 2, y: 2.15, h: 2.25, hSize: 17, bSize: 13,
      notes: 'Regel 4 is bij Meridiaan een harde eis: de CFO wil geen nieuwe overlegstructuren.' },
    { t: 'table', kicker: 'BOUWSTEEN 3', titel: 'Rollen zijn geen functies', sub: 'Een stewardrol zonder uren in het functieprofiel is binnen twee kwartalen verdwenen.',
      head: ['Rol', 'Verantwoordelijk voor', 'Veelgemaakte fout'],
      rows: [
        ['Data owner', 'Eindverantwoordelijk voor een datadomein', 'Beleggen per systeem in plaats van per domein'],
        ['Business steward', 'Betekenis en kwaliteit in de praktijk', 'Rol toekennen zonder uren en zonder mandaat'],
        ['Technical steward', 'Herkomst, lineage, technische regels', 'Verwarren met de systeembeheerder'],
        ['Data custodian', 'Opslag, beschikbaarheid, technische toegang', 'Aanspreken op inhoudelijke kwaliteit'],
        ['CDO', 'Samenhang, programma, bestuursrapportage', 'Eigenaar maken van álle data — dan is niemand het'],
      ], colW: [2.7, 4.5, 4.7], rowH: 0.46, size: 12,
      notes: 'De custodian-fout is de meest voorkomende in verzekeringsland.' },
    { t: 'statement', kicker: 'BOUWSTEEN 3',
      big: 'Beleg eigenaarschap op een datadomein, nooit op een applicatie.',
      small: 'Systemen worden vervangen, domeinen niet. Wie eigenaarschap aan applicaties koppelt, herhaalt bij elke migratie dezelfde discussie en krijgt per systeem afwijkende definities. Bij Meridiaan loopt op dit moment precies zo’n migratie.',
      notes: 'Koppel terug naar de vier definities van actieve deelnemer.' },
    { t: 'twocol', kicker: 'BOUWSTEEN 4 — HET HART VAN HET MODEL', titel: 'Zeven besluiten die altijd terugkomen',
      leftH: 'Besluiten 1–4', left: ['Vaststellen of wijzigen van een begripsdefinitie', 'Beleggen van eigenaarschap over een datadomein', 'Vaststellen van een kwaliteitsnorm en drempelwaarde', 'Verlenen van toegang tot een dataset of domein'],
      rightH: 'Besluiten 5–7', right: ['Toestaan van een uitzondering op beleid (waiver)', 'Prioriteren van datainitiatieven bij schaarste', 'Aangaan van uitwisseling of inkoop van externe data'],
      foot: 'Per besluittype vastleggen: wie adviseert, wie besluit, wie wordt geïnformeerd, binnen welke termijn, waarheen het escaleert. Dat is opdracht 3.',
      notes: 'Vraag of iemand een achtste besluittype uit de eigen praktijk kan noemen.' },
    { t: 'table', kicker: 'BOUWSTEEN 4', titel: 'De besluitrechtenmatrix', sub: 'De belangrijkste kolom is niet "besluit" maar "termijn".',
      head: ['Besluittype', 'Adviseert', 'Besluit', 'Termijn', 'Escaleert naar'],
      rows: [
        ['Begripsdefinitie', 'Business steward', 'Domeinraad', '15 werkdagen', 'Board'],
        ['Eigenaarschap domein', 'CDO', 'Board', '1 kwartaal', 'Directie'],
        ['Kwaliteitsnorm', 'Steward + architect', 'Domeinraad', '15 werkdagen', 'Board'],
        ['Toegang tot data', 'Steward + security', 'Data owner', '5 werkdagen', 'Domeinraad'],
        ['Waiver op beleid', 'Risk', 'Board of domeinraad', '10 werkdagen', 'Directie'],
        ['Prioritering', 'CDO', 'Board', 'Per kwartaal', 'Directie'],
        ['Externe data', 'Inkoop, privacy, risk', 'Board', '1 kwartaal', 'Directie'],
      ], colW: [2.6, 2.8, 2.5, 2.0, 2.0], rowH: 0.4, size: 12,
      notes: 'Let op: precies één A per rij.' },
    { t: 'statement', kicker: 'BOUWSTEEN 4',
      big: 'Een escalatiepad zonder termijn wordt nooit gebruikt.',
      small: 'Formuleer het als automatisme: neemt de domeinraad binnen vijftien werkdagen geen besluit, dan gaat het dossier ongewijzigd naar de board. Dat verschuift het gesprek van "wie heeft gelijk" naar "willen we dit echt door de board laten beslissen" — en dat lost verrassend veel op.',
      notes: 'Dit is de meest praktisch bruikbare regel van de hele dag.' },
    { t: 'table', kicker: 'BOUWSTEEN 5', titel: 'Niet alles is beleid', sub: 'Wie alles beleid noemt, moet voor elke wijziging naar het bestuur.',
      head: ['Niveau', 'Beantwoordt', 'Vastgesteld door', 'Afwijken'],
      rows: [
        ['Beleid', 'Wat willen we en waarom', 'Bestuur', 'Alleen via bestuursbesluit'],
        ['Standaard', 'Welke norm geldt verplicht', 'Governance board', 'Waiver met einddatum'],
        ['Richtlijn', 'Wat adviseren we', 'Domeinraad', 'Motiveren volstaat'],
        ['Procedure', 'Hoe verloopt het proces', 'Proceseigenaar', 'Niet van toepassing'],
        ['Werkinstructie', 'Wie doet wat, waar, wanneer', 'Teamleider', 'Niet van toepassing'],
      ], colW: [2.3, 4.0, 3.0, 2.6], rowH: 0.46, size: 13,
      foot: 'Geef elke waiver een einddatum en een eigenaar.',
      notes: 'Rapporteer aantal en leeftijd van openstaande waivers per kwartaal.' },
    { t: 'cards', kicker: 'BOUWSTEEN 6', titel: 'Governanceprocessen zijn processen', sub: 'De notatiekeuze is geen smaakkwestie: hij volgt uit de aard van het werk.',
      items: [
        { h: 'BPMN', b: 'De volgorde ligt vast, duidelijk begin en eind, afwijkingen zijn uitzondering. Voorbeeld: een begripsdefinitie wijzigen en publiceren.' },
        { h: 'CMMN', b: 'De volgorde is onbekend of hangt van het geval af; de behandelaar bepaalt wat nodig is. Voorbeeld: een kwaliteitsincident onderzoeken.' },
        { h: 'DMN', b: 'Een herhaalbaar besluit op grond van expliciete regels, los van wie het uitvoert. Voorbeeld: de classificatie van een dataset bepalen.' },
      ], cols: 3, y: 2.55, h: 2.9, hSize: 24, bSize: 13,
      notes: 'Deze drie slides zijn de kern voor deze doelgroep.' },
    { t: 'table', kicker: 'BOUWSTEEN 6 — DMN', titel: 'Beslistabel: classificatie', sub: 'Dezelfde invoer hoort altijd tot dezelfde uitkomst te leiden.',
      head: ['#', 'Persoonsgegevens', 'Bijzondere categorie', 'Extern gedeeld', 'Classificatie', 'Toegangsregime'],
      rows: [
        ['1', 'nee', '—', 'nee', 'Intern', 'Domeinbreed, op aanvraag'],
        ['2', 'nee', '—', 'ja', 'Extern deelbaar', 'Contractueel vastgelegd'],
        ['3', 'ja', 'nee', 'nee', 'Vertrouwelijk', 'Named access, jaarlijkse review'],
        ['4', 'ja', 'nee', 'ja', 'Vertrouwelijk — extern', 'Verwerkersovereenkomst vereist'],
        ['5', 'ja', 'ja', '—', 'Bijzonder', 'Named access + DPIA + logging'],
      ], colW: [0.55, 2.15, 2.25, 1.85, 2.4, 2.7], rowH: 0.44, size: 12,
      foot: 'Hit policy: Unique — elke combinatie valt onder precies één regel.',
      notes: 'Bij First verbergt de volgorde de overlap in plaats van hem te melden.' },
    { t: 'statement', kicker: 'VUISTREGEL',
      big: 'Acht exclusieve gateways achter elkaar? Dan teken je een besluit als een proces.',
      small: 'Haal de logica eruit en zet hem in een DMN-beslistabel. Het BPMN-model houdt één beslistaak over en wordt weer leesbaar. Kun je de gateways niet vooraf benoemen omdat het van het geval afhangt — dan is het geen BPMN maar CMMN.',
      notes: 'Laat tijdens opdracht 4 de gateways tellen.' },
    { t: 'cards', kicker: 'DE KEUZE', titel: 'Vier inrichtingsmodellen', sub: 'Geen ideologie maar een afweging tussen snelheid en uniformiteit.',
      items: [
        { h: 'Centraal', b: 'Eén team stelt normen én voert uit. Risico: bottleneck, business voelt zich geen eigenaar.' },
        { h: 'Decentraal', b: 'Domeinen bepalen zelf, geen centrale norm. Risico: definities lopen uiteen, ketenrapportage klopt niet.' },
        { h: 'Federatief', b: 'Centrale normstelling, decentrale uitvoering. Risico: onduidelijkheid over wat centraal is.' },
        { h: 'Hub-and-spoke', b: 'Klein centraal team ondersteunt domeinstewards. Risico: de hub wordt uitvoerder in plaats van enabler.' },
      ], cols: 4, y: 2.5, h: 2.7, hSize: 17, bSize: 12,
      foot: 'Criteria: omvang · homogeniteit van domeinen · volwassenheid · toezichtsdruk · staat van het IT-landschap.',
      notes: 'Presenteer de criteria vóór de conclusie.' },
    { t: 'twocol', kicker: 'ADOPTIE EN METING', titel: 'Een ontwerp dat niet landt is een mislukking met goede documentatie',
      leftH: 'Adoptie', left: ['Sluit aan op bestaande overleggen', 'Zichtbare winst binnen negentig dagen', 'Stewardrollen mét uren in het functieprofiel', 'Maak besluiten vindbaar — anders worden ze opnieuw genomen'],
      rightH: 'Meten', right: ['Dekking eigenaarschap op kritieke domeinen', 'Definitiedekking van kritieke begrippen', 'Mediane doorlooptijd per besluittype', 'Aantal en leeftijd van openstaande waivers', 'Kwaliteitsscore op kritieke data-elementen'],
      foot: 'Meet gedrag en uitkomst, nooit activiteit. Het aantal gehouden vergaderingen zegt niets.',
      notes: 'Vraag welke KPI de groep als eerste zou rapporteren aan de CFO van Meridiaan.' },
    { t: 'twocol', kicker: 'UIT HET VELD', titel: 'Tien fouten die je gaat tegenkomen',
      leftH: 'De eerste vijf', left: ['Organen zonder besluitrechten', 'Eigenaarschap op systemen in plaats van domeinen', 'Stewardrollen zonder uren of mandaat', 'Escalatiepaden zonder termijn', 'Alles "beleid" noemen'],
      rightH: 'Nog vijf', right: ['Waivers zonder einddatum', 'Een board die operationele uitzonderingen behandelt', 'Governanceprocessen die nergens gemodelleerd zijn', 'KPI’s die activiteit meten in plaats van uitkomst', 'Een raamwerk overnemen zonder het te snoeien'],
      notes: 'Laat iedereen de twee aankruisen die bij de eigen opdrachtgever spelen.' },
    { t: 'exam', titel: 'CDMP-specialist Data Governance', sub: 'Dit deel vormt samen met deel 11 de kern van de voorbereiding.',
      left: ['Ken het onderscheid owner / steward / custodian in DMBOK-bewoordingen', 'Governance versus stewardship: waar houdt besluitrecht op?', 'Beleid, standaard en richtlijn — en wie welk niveau vaststelt', 'De verhouding tot security, privacy, architectuur en risk', 'Engelse termen: decision rights, stewardship, charter, escalation path'],
      notes: 'Wees hier expliciet. Deelnemers vragen elk jaar of dit als officiële examentraining telt. Het antwoord is nee.' },
    { t: 'cards', kicker: 'AAN HET WERK', titel: 'Wat we vandaag doen', dark: true,
      items: [
        { n: '4', h: 'BPMN', b: 'Het begripswijzigingsproces voor "actieve deelnemer". 50 minuten, in tweetallen.' },
        { n: '5', h: 'CMMN', b: 'Het onderzoek naar een kwaliteitsincident. 40 minuten, in tweetallen.' },
        { n: '6', h: 'DMN', b: 'De classificatiebeslistabel, met hit policy. 45 minuten, in tweetallen.' },
      ], cols: 3, y: 2.6, h: 2.7,
      foot: 'Huiswerk: opdracht 7 (inrichtingsmodel), opdracht 8 (adoptieplan) en de zelftoets van twaalf vragen.',
      notes: 'Verdeel de tweetallen zelf en meng ervaring.' },
  ],
};
