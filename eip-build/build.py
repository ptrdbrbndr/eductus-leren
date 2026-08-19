#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build tool: converts the "Enterprise Integration Patterns" course (static HTML
source at enterprise-integration-patterns/niveau-{1,2,3}/deel-NN/{reader,werkboek}.html)
into the flat leren.eductus.nl hub-style pages under leren-hub/enterprise-integration-patterns/.
Mirrors bpmn-build/build.py (same niveau split, same restyle-not-content-generation
approach), adapted to EIP's own werkboek structure.

This is a RESTYLE, not content generation: reader prose is carried over verbatim
per <h2> block. Unlike BPMN, EIP's werkboek DOES contain embedded model answers
("Uitwerking N.x" per "Opdracht N.x", plus a "Zelftoets"/"Antwoorden zelftoets"
pair) for 27 of the 30 delen, so those become genuine reveal-answer quiz blocks,
verbatim from the werkboek, with a source citation. Three delen break the normal
pattern and get bespoke handling:
  - Deel 10 and 22 (capstone/examentraining): werkboek is a "Proefexamen" (MC
    questions) + "Antwoordsleutel" (letter key) + "Voorbereidingschecklist",
    no per-question prose uitwerking. MC questions become reveal-quiz items
    with the answer letter from the Antwoordsleutel; the checklist becomes a
    plain (non-quiz) callout list.
  - Deel 30 (masterproef): werkboek explicitly states "geen uitwerkingen" --
    no reveal quiz is fabricated; werkboek content is carried over as plain
    informational blocks, verbatim.

Level ranges are NOT 10/10/10: niveau-1 = deel 1-10, niveau-2 = deel 11-22,
niveau-3 = deel 23-30. Use explicit lo<=n<=hi ranges everywhere.

Run: python3 build.py
"""
import re
import json
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString, Tag

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "enterprise-integration-patterns"
OUT = ROOT / "leren-hub" / "enterprise-integration-patterns"
FIG_SRC = SRC / "figuren"
FIG_OUT = OUT / "figuren"

KEY_ABBR = "eip"
CAPSTONE_DELEN = {10, 22}
MASTERPROEF_DELEN = {30}

NIVEAUS = [
    {"n": 1, "lo": 1, "hi": 10, "label": "Fundament"},
    {"n": 2, "lo": 11, "hi": 22, "label": "Het landschap"},
    {"n": 3, "lo": 23, "hi": 30, "label": "Event streaming en stelselschaal"},
]

TITLES = {
    1: "Van synchroon naar asynchroon: waarom messaging",
    2: "Messagingfundamenten: kanaal, bericht, endpoint",
    3: "Message Construction: command, event, document en request-reply",
    4: "Basisrouting: content-based router en message filter",
    5: "Basistransformatie: translator, envelope wrapper, normalizer",
    6: "Point-to-point vs. publish-subscribe kanalen, verdiept",
    7: "Betrouwbaarheid I: garanties en idempotentie",
    8: "Betrouwbaarheid II: volgorde en guaranteed delivery",
    9: "Foutafhandeling basis: dead letter channel en invalid message channel",
    10: "Examentraining en capstone: de verdediging",
    11: "Integratiearchitectuurstijlen: punt-tot-punt vs. broker vs. event backbone",
    12: "Routing-patroonfamilie diepgaand: dynamic router, recipient list, splitter/aggregator",
    13: "Transformatie diepgaand: content enricher, content filter, claim check",
    14: "Endpoint-patronen: messaging gateway, messaging mapper, service activator",
    15: "Systeembeheerpatronen: control bus, wire tap, detour, message history, smart proxy",
    16: "Messaging-infrastructuur: broker-architecturen en exchange/queue-modellen",
    17: "Orkestratie versus choreografie",
    18: "Distributed transactions in async context: saga's en compenserende transacties",
    19: "Outbox-pattern en transactional messaging",
    20: "Contractbeheer voor asynchrone koppelingen",
    21: "Observability in ketens: distributed tracing, correlation, message history in productie",
    22: "Capstone: verdediging vanuit rollen — integratieontwerp voor het Mutatieplatform",
    23: "Event-driven architectuur en event streaming fundamenten",
    24: "Event sourcing als drager",
    25: "Complexe eventketens: de event backbone voor invaren en datakwaliteit",
    26: "Poison messages en retry-topologie op schaal",
    27: "Resilience patterns in ketens: circuit breaker, bulkhead, backpressure",
    28: "Governance en lifecycle van een event backbone",
    29: "Auditability en verantwoording richting DNB/AFM vanuit messaging-logs",
    30: "Masterproef: de verdwenen bevestiging",
}


def pad(n):
    return f"{n:02d}"


def niveau_for(n):
    for lv in NIVEAUS:
        if lv["lo"] <= n <= lv["hi"]:
            return lv
    raise ValueError(n)


def niveau_dir(n):
    return f"niveau-{niveau_for(n)['n']}"


def escape_html(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;").replace("'", "&#39;"))


# ---------- figure/table fixups (verbatim content, only path/wrapper changes) ----------

def fix_table(table_tag):
    rows = table_tag.find_all("tr", recursive=False)
    doc = BeautifulSoup("", "html.parser")
    if not rows:
        wrapper = doc.new_tag("div")
        wrapper["class"] = "tablewrap"
        wrapper.append(table_tag.extract())
        return wrapper
    new_table = doc.new_tag("table")
    first_row = rows[0]
    is_header = first_row.find("th") is not None
    if is_header:
        thead = doc.new_tag("thead")
        thead.append(first_row.extract())
        new_table.append(thead)
        body_rows = rows[1:]
    else:
        body_rows = rows
    if body_rows:
        tbody = doc.new_tag("tbody")
        for r in body_rows:
            tbody.append(r.extract())
        new_table.append(tbody)
    wrapper = doc.new_tag("div")
    wrapper["class"] = "tablewrap"
    wrapper.append(new_table)
    return wrapper


def fix_figure(fig_tag):
    img = fig_tag.find("img")
    if img and img.get("src"):
        basename = img["src"].split("/")[-1]
        img["src"] = "figuren/" + basename
    if fig_tag.has_attr("class"):
        del fig_tag["class"]
    return fig_tag


def render_block_children(tag):
    out = []
    for child in list(tag.children):
        if isinstance(child, NavigableString):
            if child.strip():
                out.append(str(child))
            continue
        if not isinstance(child, Tag):
            continue
        if child.name == "table":
            out.append(str(fix_table(child)))
        elif child.name == "figure":
            out.append(str(fix_figure(child)))
        else:
            out.append(str(child))
    return "\n".join(out)


def split_into_h2_blocks(article):
    """Ordered list of {title, content_html} per <h2>, dropping h1/hr/aside
    as block boundaries (only h2 starts a new block)."""
    children = [c for c in article.children if isinstance(c, Tag)]
    blocks = []
    preamble_nodes = []
    cur_title = None
    cur_nodes = []

    def flush():
        if cur_title is not None:
            frag = BeautifulSoup("", "html.parser")
            div = frag.new_tag("div")
            for n in cur_nodes:
                div.append(n)
            blocks.append({"title": cur_title, "content_html": render_block_children(div)})

    for c in children:
        if c.name == "h2":
            flush()
            cur_title = c.get_text(strip=True)
            cur_nodes = []
        elif c.name in ("h1", "hr", "aside"):
            continue
        else:
            if cur_title is None:
                preamble_nodes.append(c)
            else:
                cur_nodes.append(c)
    flush()
    return preamble_nodes, blocks


def first_long_paragraph(sections, min_len=80):
    for s in sections:
        soup = BeautifulSoup(s["content_html"], "html.parser")
        for p in soup.find_all("p"):
            txt = p.get_text(strip=True)
            if len(txt) >= min_len:
                return txt
    for s in sections:
        soup = BeautifulSoup(s["content_html"], "html.parser")
        p = soup.find("p")
        if p:
            return p.get_text(strip=True)
    return ""


NUM_RE = re.compile(r"^(\d+\.\d+)\b")


def parse_reader(n):
    path = SRC / niveau_dir(n) / f"deel-{pad(n)}" / "reader.html"
    soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
    article = soup.select_one("article.eip-article")
    _, blocks = split_into_h2_blocks(article)

    sections = []
    for b in blocks:
        # Drop empty "DAGDEEL A"/"DAGDEEL B" scheduling markers (deel 15, 19):
        # bare h2 immediately followed by <hr>, no own prose content.
        if not b["content_html"].strip():
            continue
        m = NUM_RE.match(b["title"])
        sections.append({
            "num": m.group(1) if m else None,
            "title": b["title"],
            "content_html": b["content_html"],
        })

    n_figs = sum(s["content_html"].count("<figure") for s in sections)
    return {"title": TITLES[n], "sections": sections, "n_figs": n_figs}


def parse_werkboek_standard(n, blocks):
    opdrachten = {}
    opdracht_order = []
    uitwerkingen = {}
    zelftoets_q = []
    zelftoets_a = []
    for b in blocks:
        m = re.match(r"^Opdracht\s+(\d+\.\d+)\s*(?:—\s*(.*))?$", b["title"])
        if m:
            num = m.group(1)
            opdrachten[num] = {"num": num, "subtitle": m.group(2) or "", "content_html": b["content_html"]}
            opdracht_order.append(num)
            continue
        m = re.match(r"^Uitwerking\s+(\d+\.\d+)$", b["title"])
        if m:
            uitwerkingen[m.group(1)] = b["content_html"]
            continue
        if b["title"].startswith("Zelftoets deel"):
            li_soup = BeautifulSoup(b["content_html"], "html.parser")
            zelftoets_q = [li.decode_contents() for li in li_soup.find_all("li")]
            continue
        if b["title"] == "Antwoorden zelftoets":
            li_soup = BeautifulSoup(b["content_html"], "html.parser")
            zelftoets_a = [li.decode_contents() for li in li_soup.find_all("li")]
            continue
    return {
        "type": "standard",
        "opdrachten": opdrachten,
        "opdracht_order": opdracht_order,
        "uitwerkingen": uitwerkingen,
        "zelftoets_q": zelftoets_q,
        "zelftoets_a": zelftoets_a,
    }


QNUM_RE = re.compile(r"^\s*<strong>(\d+)\.</strong>\s*")


def parse_werkboek_capstone(n, blocks):
    questions = []  # ordered list of {num, html}
    checklist_title = None
    checklist_html = ""
    key_map = {}
    zelfeval_html = ""
    for b in blocks:
        if b["title"].startswith("Proefexamen") or b["title"].startswith("Aanvullende scenariovragen"):
            frag = BeautifulSoup(b["content_html"], "html.parser")
            for p in frag.find_all("p", recursive=False):
                strong = p.find("strong")
                if not strong:
                    continue
                mnum = re.match(r"^(\d+)\.$", strong.get_text(strip=True))
                if not mnum:
                    continue
                qnum = mnum.group(1)
                strong.extract()
                qhtml = p.decode_contents().strip()
                qhtml = re.sub(r"^\s*", "", qhtml)
                questions.append({"num": qnum, "html": qhtml})
            continue
        if b["title"] == "Antwoordsleutel":
            frag = BeautifulSoup(b["content_html"], "html.parser")
            paras = frag.find_all("p")
            if paras:
                for mm in re.finditer(r"(\d+)-([A-D])", paras[0].get_text()):
                    key_map[mm.group(1)] = mm.group(2)
            if len(paras) > 1:
                zelfeval_html = "".join(str(p) for p in paras[1:])
            continue
        if b["title"].startswith("Voorbereidingschecklist"):
            checklist_title = b["title"]
            checklist_html = b["content_html"]
            continue
    return {
        "type": "capstone",
        "questions": questions,
        "key_map": key_map,
        "checklist_title": checklist_title,
        "checklist_html": checklist_html,
        "zelfeval_html": zelfeval_html,
    }


def parse_werkboek_masterproef(n, blocks):
    info_blocks = [b for b in blocks if b["content_html"].strip()]
    return {"type": "masterproef", "blocks": info_blocks}


def parse_werkboek(n):
    path = SRC / niveau_dir(n) / f"deel-{pad(n)}" / "werkboek.html"
    soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
    article = soup.select_one("article.eip-article")
    _, blocks = split_into_h2_blocks(article)
    if n in CAPSTONE_DELEN:
        return parse_werkboek_capstone(n, blocks)
    if n in MASTERPROEF_DELEN:
        return parse_werkboek_masterproef(n, blocks)
    return parse_werkboek_standard(n, blocks)


CSS = """
:root{
  --paper:#f4ede0;--paper-2:#ece2d1;--ink:#211c17;--ink-soft:#544a3e;--ink-faint:#857a6b;
  --line:#d8cbb4;--teal:#0e5a51;--teal-deep:#0a423b;--ochre:#bd7d27;--oxblood:#8a3324;
  --teal-tint:#e2ece8;--ochre-tint:#f3e7cf;
  --shadow:0 1px 2px rgba(33,28,23,.06),0 10px 30px -12px rgba(33,28,23,.22);
  --shadow-lg:0 2px 4px rgba(33,28,23,.08),0 24px 60px -20px rgba(33,28,23,.32);
  --maxw:1180px;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:90px}
body{margin:0;background:var(--paper);
  background-image:radial-gradient(1200px 600px at 80% -10%,rgba(14,90,81,.06),transparent 60%),radial-gradient(900px 500px at -10% 10%,rgba(189,125,39,.06),transparent 55%);
  color:var(--ink);font-family:"Spectral",Georgia,serif;font-size:18px;line-height:1.7;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
body::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:1;opacity:.5;mix-blend-mode:multiply;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.035'/%3E%3C/svg%3E")}
a{color:var(--teal);text-decoration:none}a:hover{text-decoration:underline}
.progress-rail{position:fixed;top:0;left:0;right:0;height:4px;z-index:60}
.progress-rail__fill{height:100%;width:0;background:linear-gradient(90deg,var(--teal),var(--ochre));transition:width .35s ease}
.topbar{position:sticky;top:0;z-index:50;backdrop-filter:saturate(140%) blur(10px);background:rgba(244,237,224,.82);border-bottom:1px solid var(--line)}
.topbar__inner{max-width:var(--maxw);margin:0 auto;padding:12px 28px;display:flex;align-items:center;gap:18px}
.brand{display:flex;align-items:baseline;gap:10px;font-family:"Fraunces",serif;font-weight:600;letter-spacing:.5px}
.brand .dot{color:var(--ochre)}
.brand small{font-family:"IBM Plex Mono",monospace;font-weight:500;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--ink-faint)}
.topbar__meta{margin-left:auto;display:flex;align-items:center;gap:16px;font-family:"IBM Plex Mono",monospace;font-size:12px;color:var(--ink-soft)}
.pct{font-weight:600;color:var(--teal)}
.btn-reset{font-family:"IBM Plex Mono",monospace;font-size:11px;text-transform:uppercase;letter-spacing:1px;border:1px solid var(--line);background:transparent;color:var(--ink-soft);padding:6px 10px;border-radius:999px;cursor:pointer;transition:.2s}
.btn-reset:hover{border-color:var(--teal);color:var(--teal)}
.hero{max-width:var(--maxw);margin:0 auto;padding:64px 28px 40px;position:relative;z-index:2}
.eyebrow{font-family:"IBM Plex Mono",monospace;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:var(--ochre);font-weight:600;margin:0 0 18px}
.hero h1{font-family:"Fraunces",serif;font-weight:600;font-size:clamp(32px,5.4vw,64px);line-height:1.06;margin:0;letter-spacing:-1px}
.hero h1 em{font-style:italic;color:var(--teal)}
.hero__lead{max-width:62ch;margin:24px 0 0;font-size:21px;color:var(--ink-soft)}
.hero__stats{display:flex;flex-wrap:wrap;gap:14px;margin-top:34px}
.stat{background:var(--paper-2);border:1px solid var(--line);border-radius:14px;padding:14px 18px;min-width:120px;box-shadow:var(--shadow)}
.stat b{display:block;font-family:"Fraunces",serif;font-size:26px;line-height:1;color:var(--teal)}
.stat span{font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--ink-faint)}
.disclaimer{margin-top:34px;border-left:3px solid var(--ochre);background:var(--ochre-tint);padding:14px 20px;border-radius:0 12px 12px 0;font-size:16px;color:var(--ink-soft)}
.trail{margin-top:20px;font-family:"IBM Plex Mono",monospace;font-size:12px;color:var(--ink-faint);letter-spacing:.5px}
.trail b{color:var(--teal)}
.oldlinks{margin-top:18px;display:flex;flex-wrap:wrap;gap:8px}
.oldlinks a{font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:var(--ink-soft);border:1px solid var(--line);background:var(--paper-2);padding:6px 12px;border-radius:999px;transition:.2s}
.oldlinks a:hover{border-color:var(--teal);color:var(--teal);text-decoration:none}
.shell{max-width:var(--maxw);margin:0 auto;padding:20px 28px 100px;display:grid;grid-template-columns:248px 1fr;gap:48px;position:relative;z-index:2}
@media(max-width:920px){.shell{grid-template-columns:1fr;gap:0}}
.toc{position:sticky;top:84px;align-self:start;max-height:calc(100vh - 110px);overflow:auto}
.toc h2{font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--ink-faint);margin:0 0 14px;padding-left:14px}
.toc ol{list-style:none;margin:0;padding:0;counter-reset:t}
.toc li{counter-increment:t;margin:1px 0}
.toc a{display:flex;gap:10px;align-items:flex-start;padding:9px 12px 9px 14px;border-radius:10px;color:var(--ink-soft);font-size:15px;line-height:1.3;border-left:2px solid transparent;transition:.18s}
.toc a::before{content:counter(t,decimal-leading-zero);font-family:"IBM Plex Mono",monospace;font-size:11px;color:var(--ink-faint);padding-top:2px}
.toc a:hover{background:var(--paper-2);text-decoration:none}
.toc a.active{background:var(--teal-tint);color:var(--teal-deep);border-left-color:var(--teal);font-weight:600}
.toc a.done::after{content:"\\2713";margin-left:auto;color:var(--teal);font-weight:700}
@media(max-width:920px){.toc{display:none}}
.content{min-width:0}
.section{padding:30px 0 12px;border-top:1px solid var(--line);margin-top:28px;scroll-margin-top:80px}
.section:first-child{border-top:none;margin-top:0}
.section__head{display:flex;align-items:flex-start;gap:18px;flex-wrap:wrap}
.section__num{font-family:"IBM Plex Mono",monospace;font-size:13px;font-weight:600;color:#fff;background:var(--teal);width:38px;height:38px;border-radius:10px;display:grid;place-items:center;flex:none;box-shadow:var(--shadow)}
.section__titles{flex:1;min-width:240px}
.section h2.t{font-family:"Fraunces",serif;font-weight:600;font-size:clamp(24px,3.2vw,34px);margin:0;line-height:1.1;letter-spacing:-.5px}
.chip{display:inline-flex;align-items:center;gap:6px;font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;background:var(--paper-2);border:1px solid var(--line);color:var(--ink-soft);padding:5px 11px;border-radius:999px;margin-top:8px}
.chip.time{color:var(--ochre);border-color:#e3cfa6;background:var(--ochre-tint)}
.done-toggle{margin-left:auto;display:inline-flex;align-items:center;gap:9px;font-family:"IBM Plex Mono",monospace;font-size:11px;text-transform:uppercase;letter-spacing:1px;cursor:pointer;color:var(--ink-soft);user-select:none;border:1px solid var(--line);padding:8px 12px;border-radius:999px;background:var(--paper);transition:.2s}
.done-toggle:hover{border-color:var(--teal)}
.done-toggle input{accent-color:var(--teal);width:16px;height:16px}
.done-toggle.is-done{background:var(--teal-tint);border-color:var(--teal);color:var(--teal-deep);font-weight:600}
.prose{margin-top:26px}
.prose h3{font-family:"Fraunces",serif;font-weight:600;font-size:23px;margin:34px 0 10px;letter-spacing:-.3px}
.prose h4{font-family:"IBM Plex Mono",monospace;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:var(--teal);margin:26px 0 8px}
.prose p{margin:12px 0}.prose ul,.prose ol{margin:12px 0;padding-left:22px}.prose li{margin:6px 0}
.prose li::marker{color:var(--ochre)}.prose strong{color:var(--ink);font-weight:600}
.prose code{background:var(--paper-2);border:1px solid var(--line);border-radius:5px;padding:1px 6px;font-family:"IBM Plex Mono",monospace;font-size:.86em}
.prose pre{background:var(--teal-deep);color:#eaf2ef;border-radius:14px;padding:16px 18px;overflow-x:auto;box-shadow:var(--shadow);margin:16px 0}
.prose pre code{background:none;border:none;padding:0;color:inherit;font-size:14.5px;line-height:1.6}
.prose blockquote{margin:18px 0;padding:14px 20px;border-left:3px solid var(--ochre);background:var(--ochre-tint);border-radius:0 12px 12px 0;color:var(--ink-soft)}
.prose blockquote p{margin:6px 0}
.prose blockquote strong{color:#9a6418}
figure{margin:22px 0}
figure img{max-width:100%;display:block;margin:0 auto;border-radius:14px;border:1px solid var(--line);box-shadow:var(--shadow);background:#fff}
figcaption{margin-top:10px;text-align:center;font-family:"IBM Plex Mono",monospace;font-size:12.5px;color:var(--ink-faint);letter-spacing:.3px}
.tablewrap{overflow-x:auto;margin:20px 0;border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);background:var(--paper)}
table{border-collapse:collapse;width:100%;font-size:15.5px}
th,td{text-align:left;padding:12px 16px;border-bottom:1px solid var(--line);vertical-align:top}
thead th{background:var(--teal-deep);color:#eef5f2;font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:600}
tbody tr:nth-child(even){background:var(--paper-2)}tbody tr:last-child td{border-bottom:none}
td strong{color:var(--teal-deep)}
.callout{margin:20px 0;padding:16px 20px 16px 22px;border-radius:0 14px 14px 0;border-left:4px solid var(--teal);background:var(--teal-tint)}
.callout.warn{border-left-color:var(--oxblood);background:#f4e2dd}
.callout.note{border-left-color:var(--ochre);background:var(--ochre-tint)}
.callout .lbl{font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;display:block;margin-bottom:5px}
.callout.tip .lbl{color:var(--teal-deep)}.callout.warn .lbl{color:var(--oxblood)}.callout.note .lbl{color:#9a6418}
.callout p{margin:4px 0}
.quiz{margin:30px 0 6px;background:var(--paper-2);border:1px solid var(--line);border-radius:16px;padding:8px 22px 18px;box-shadow:var(--shadow)}
.quiz__h{font-family:"IBM Plex Mono",monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:var(--ochre);font-weight:600;margin:18px 0 6px;display:flex;align-items:center;gap:9px}
.quiz__h::before{content:"?";display:grid;place-items:center;width:22px;height:22px;border-radius:6px;background:var(--ochre);color:#fff;font-family:"Fraunces",serif;font-size:14px}
.quiz__src{font-family:"IBM Plex Mono",monospace;font-size:10.5px;color:var(--ink-faint);margin:-4px 0 4px}
.quiz .card{border-bottom:1px solid var(--line);padding:14px 0}
.quiz .card:last-child{border-bottom:none}
.quiz .card h4{font-family:"Fraunces",serif;font-weight:600;font-size:18px;margin:0 0 8px;color:var(--teal-deep)}
details.q{border-bottom:1px solid var(--line)}details.q:last-child{border-bottom:none}
details.q>summary{list-style:none;cursor:pointer;padding:14px 4px;display:flex;gap:12px;align-items:flex-start;font-weight:500}
details.q>summary::-webkit-details-marker{display:none}
details.q>summary .qn{font-family:"IBM Plex Mono",monospace;font-size:13px;color:var(--teal);font-weight:600;flex:none;padding-top:1px}
details.q>summary .qx{margin-left:auto;flex:none;font-family:"IBM Plex Mono",monospace;font-size:11px;color:var(--ink-faint);text-transform:uppercase;letter-spacing:1px;transition:.2s}
details.q[open]>summary .qx{color:var(--teal)}
details.q .ans{padding:2px 4px 18px 36px;color:var(--ink-soft);font-size:16px;animation:fade .3s ease}
details.q .ans strong{color:var(--teal-deep)}
@keyframes fade{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.finish{margin-top:40px;text-align:center;padding:46px 28px;border-radius:20px;background:linear-gradient(135deg,var(--teal-deep),var(--teal));color:#eef5f2;box-shadow:var(--shadow-lg);position:relative;overflow:hidden}
.finish::after{content:"";position:absolute;inset:0;background:radial-gradient(400px 200px at 80% 0,rgba(189,125,39,.35),transparent 60%);pointer-events:none}
.finish h3{font-family:"Fraunces",serif;font-size:30px;margin:0 0 10px;color:#fff;position:relative}
.finish p{margin:6px auto;max-width:54ch;color:#cfe2dc;position:relative}
.finish a.btn{display:inline-block;margin-top:20px;font-family:"IBM Plex Mono",monospace;font-size:13px;letter-spacing:1px;text-transform:uppercase;font-weight:600;background:#fff;color:var(--teal-deep);border-radius:999px;padding:13px 26px;position:relative}
footer{max-width:var(--maxw);margin:0 auto;padding:30px 28px 60px;color:var(--ink-faint);font-family:"IBM Plex Mono",monospace;font-size:12px;letter-spacing:.5px;position:relative;z-index:2;border-top:1px solid var(--line)}
footer a{margin:0 2px}
.toTop{position:fixed;right:22px;bottom:22px;z-index:55;width:46px;height:46px;border-radius:50%;border:1px solid var(--line);background:var(--paper);color:var(--teal);cursor:pointer;font-size:18px;box-shadow:var(--shadow);opacity:0;transform:translateY(10px);transition:.25s;pointer-events:none}
.toTop.show{opacity:1;transform:none;pointer-events:auto}
"""


def opdracht_quiz_block(n, opdracht, uitwerking_html):
    label = f"Opdracht {opdracht['num']}" + (f" — {opdracht['subtitle']}" if opdracht["subtitle"] else "")
    return f"""      <div class="quiz">
        <div class="quiz__h">Controlevraag — {escape_html(label)}</div>
        <p class="quiz__src">Uit Werkboek deel {n}, {escape_html(label)}</p>
        <div class="card">
          <div class="prose">
{opdracht['content_html']}
          </div>
          <details class="q"><summary><span class="qn">&rarr;</span><span>Uitwerking tonen</span><span class="qx">Toon</span></summary><div class="ans">
{uitwerking_html}
          </div></details>
        </div>
      </div>"""


def qa_quiz_block(heading, src, qa_pairs):
    """qa_pairs: list of (qn_label, question_html, answer_html)."""
    items = []
    for qn_label, qhtml, ahtml in qa_pairs:
        items.append(
            f'        <details class="q"><summary><span class="qn">{qn_label}</span><span>{qhtml}</span>'
            f'<span class="qx">Toon antwoord</span></summary><div class="ans">{ahtml}</div></details>'
        )
    return f"""      <div class="quiz">
        <div class="quiz__h">{escape_html(heading)}</div>
        <p class="quiz__src">{escape_html(src)}</p>
{chr(10).join(items)}
      </div>"""


def build_deel_page(n, reader, werkboek):
    lv = niveau_for(n)
    sections = reader["sections"]

    for i, s in enumerate(sections, start=1):
        s["id"] = f"s{i}"

    # ---- match Opdracht/Uitwerking pairs onto reader sections by decimal num ----
    extra_html_parts = []  # appended to the "Samenvatting" section
    matched_nums = set()
    if werkboek["type"] == "standard":
        for s in sections:
            if not s["num"]:
                continue
            num = s["num"]
            opd = werkboek["opdrachten"].get(num)
            uit = werkboek["uitwerkingen"].get(num)
            if opd and uit:
                s["quiz_html"] = opdracht_quiz_block(n, opd, uit)
                matched_nums.add(num)
        remaining = [num for num in werkboek["opdracht_order"] if num not in matched_nums]
        if remaining:
            qa = []
            for num in remaining:
                opd = werkboek["opdrachten"][num]
                uit = werkboek["uitwerkingen"].get(num, "<p><em>Geen modelantwoord beschikbaar.</em></p>")
                label = f"Opdracht {num}" + (f" — {opd['subtitle']}" if opd["subtitle"] else "")
                extra_html_parts.append(opdracht_quiz_block(n, opd, uit))
        if werkboek["zelftoets_q"]:
            qa = []
            for i, q in enumerate(werkboek["zelftoets_q"]):
                a = werkboek["zelftoets_a"][i] if i < len(werkboek["zelftoets_a"]) else "<p><em>Geen antwoord beschikbaar.</em></p>"
                qa.append((str(i + 1), q, a))
            extra_html_parts.append(qa_quiz_block(f"Zelftoets deel {n}", f"Uit Werkboek deel {n}, Zelftoets (letterlijk overgenomen)", qa))
    elif werkboek["type"] == "capstone":
        qa = []
        for q in werkboek["questions"]:
            letter = werkboek["key_map"].get(q["num"])
            ahtml = f"<p><strong>Correct antwoord: {escape_html(letter)}</strong></p>" if letter else "<p><em>Geen antwoordsleutel beschikbaar voor deze vraag.</em></p>"
            qa.append((q["num"], q["html"], ahtml))
        extra_html_parts.append(qa_quiz_block(
            f"Proefexamen deel {n}",
            f"Uit Werkboek deel {n}, Proefexamen + Aanvullende scenariovragen (letterlijk overgenomen, antwoord uit de Antwoordsleutel)",
            qa,
        ))
        if werkboek["zelfeval_html"]:
            extra_html_parts.append(f'      <div class="callout note"><span class="lbl">Zelfevaluatie</span>{werkboek["zelfeval_html"]}</div>')
        if werkboek["checklist_html"]:
            extra_html_parts.append(
                f'      <div class="callout tip"><span class="lbl">{escape_html(werkboek["checklist_title"])}</span>\n'
                f'{werkboek["checklist_html"]}\n      </div>'
            )
    elif werkboek["type"] == "masterproef":
        for b in werkboek["blocks"]:
            extra_html_parts.append(
                f'      <div class="card"><h4>{escape_html(b["title"])}</h4><div class="prose">\n{b["content_html"]}\n</div></div>'
            )
        extra_html_parts.insert(0,
            '      <div class="callout note"><span class="lbl">Over dit werkboek</span>'
            '<p>De masterproef kent geen modelantwoorden — alleen beter en slechter onderbouwde adviezen. '
            'Het volledige scenariodossier en de voorbereidingsopdracht staan hieronder, letterlijk uit het werkboek.</p></div>'
        )

    # attach extras to the "Samenvatting van deel N" section (fallback: last section)
    if extra_html_parts:
        target = next((s for s in sections if s["title"].startswith("Samenvatting")), sections[-1])
        target["extra_html"] = "\n".join(extra_html_parts)

    total_sections = len(sections)

    # ---- TOC ----
    toc_items = "\n".join(
        f'      <li><a href="#{s["id"]}" data-target="{s["id"]}">{escape_html(s["title"])}</a></li>'
        for s in sections
    )

    # ---- section HTML ----
    section_html_parts = []
    for i, s in enumerate(sections, start=1):
        quiz_html = s.get("quiz_html", "")
        extra_html = s.get("extra_html", "")
        section_html_parts.append(f"""    <article class="section" id="{s['id']}">
      <div class="section__head"><div class="section__num">{pad(i)}</div>
        <div class="section__titles"><h2 class="t">{escape_html(s['title'])}</h2><span class="chip time">Sectie {i} van {total_sections}</span></div>
        <label class="done-toggle" data-done="{s['id']}"><input type="checkbox">Afgerond</label></div>
      <div class="prose">
{s['content_html']}
      </div>
{quiz_html}
{extra_html}
    </article>""")

    all_sections_html = "\n".join(section_html_parts)

    n_quiz_items = len(re.findall(r'<details class="q"', all_sections_html))
    n_kernzin = len(re.findall(r"Kernzin \d+ van de cursus", all_sections_html))

    hero_lead = first_long_paragraph(sections)
    meta_desc = (hero_lead[:250] + "…") if len(hero_lead) > 250 else hero_lead

    circled = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "⑪", "⑫"]
    trail_items = []
    for idx, dn in enumerate(range(lv["lo"], lv["hi"] + 1)):
        marker = circled[idx] if idx < len(circled) else str(idx + 1)
        title = TITLES[dn]
        if dn == n:
            trail_items.append(f"<b>{marker} {escape_html(title)} (hier)</b>")
        else:
            trail_items.append(f"{marker} {escape_html(title)}")
    trail = f'<div class="trail">Niveau {lv["n"]}: ' + " → ".join(trail_items) + "</div>"

    next_n = n + 1 if n < 30 else None
    if next_n is not None:
        finish_title = f"Verder naar deel {next_n}"
        finish_p = f"Deel {next_n} — {escape_html(TITLES[next_n])} — bouwt voort op wat hier is behandeld."
        finish_btn = f'<a class="btn" href="deel-{pad(next_n)}.html">Deel {next_n} openen →</a>'
    else:
        finish_title = "Cursus afgerond"
        finish_p = "Dit was het laatste deel van Enterprise Integration Patterns. Terug naar het cursusoverzicht voor een herhaling of naar alle Eductus-cursussen."
        finish_btn = '<a class="btn" href="index.html">Terug naar cursusoverzicht →</a>'

    key = f"eductus_{KEY_ABBR}{n}_progress_v1"
    sections_js = ", ".join(f'"{s["id"]}"' for s in sections)

    old_dir = f"{niveau_dir(n)}/deel-{pad(n)}"
    old_base = f"https://cursus.eductus.nl/enterprise-integration-patterns/{old_dir}"
    oldlinks = "".join(
        f'<a href="{old_base}/{slug}.html">{label}</a>'
        for slug, label in [("reader", "Reader"), ("werkboek", "Werkboek"),
                             ("docentenhandleiding", "Docentenhandleiding"), ("slidedeck", "Slidedeck")]
    )

    html = f"""<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Deel {n} — {escape_html(reader['title'])} | Eductus</title>
<meta name="description" content="Cursus Enterprise Integration Patterns, Deel {n} (Niveau {lv['n']} — {lv['label']}): {escape_html(meta_desc)}">
<link rel="canonical" href="https://leren.eductus.nl/enterprise-integration-patterns/deel-{pad(n)}.html">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400&family=Spectral:ital,wght@0,300;0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>{CSS}</style>
</head>
<body>
<div class="progress-rail"><div class="progress-rail__fill" id="rail"></div></div>
<header class="topbar">
  <div class="topbar__inner">
    <div class="brand">Eductus<span class="dot">.</span><small>Enterprise Integration Patterns · Deel {n}</small></div>
    <div class="topbar__meta"><span>Voortgang <span class="pct" id="pct">0%</span></span>
      <button class="btn-reset" id="reset" title="Voortgang wissen">Reset</button></div>
  </div>
</header>

<section class="hero">
  <p class="eyebrow">Cursus Enterprise Integration Patterns · Niveau {lv['n']} ({lv['label']}) · Deel {n} van 30</p>
  <h1>{escape_html(reader['title'])}</h1>
  <p class="hero__lead">{escape_html(hero_lead)}</p>
  <div class="hero__stats">
    <div class="stat"><b>{total_sections}</b><span>secties</span></div>
    <div class="stat"><b>{reader['n_figs']}</b><span>figuren</span></div>
    <div class="stat"><b>{n_quiz_items}</b><span>controlevragen</span></div>
    <div class="stat"><b>{n_kernzin}</b><span>kernzinnen</span></div>
  </div>
  {trail}
  <div class="oldlinks">{oldlinks}</div>
</section>

<div class="shell">
  <nav class="toc" aria-label="Inhoudsopgave">
    <h2>Inhoud</h2>
    <ol id="tocList">
{toc_items}
    </ol>
  </nav>

  <main class="content">

{all_sections_html}

    <div class="finish">
      <h3>{finish_title}</h3>
      <p>{finish_p}</p>
      {finish_btn}
    </div>

  </main>
</div>

<button class="toTop" id="toTop" aria-label="Naar boven">↑</button>
<footer>Eductus · Cursus Enterprise Integration Patterns · Deel {n} · <a href="index.html">terug naar cursusoverzicht</a> · oude vormgeving (incl. docentenhandleiding en slidedeck): {oldlinks} · Voortgang lokaal in je browser (localStorage).</footer>

<script>
(function(){{
  var SECTIONS=[{sections_js}];
  var KEY="{key}";
  function load(k){{try{{return JSON.parse(localStorage.getItem(k)||"{{}}")}}catch(e){{return {{}}}}}}
  function save(k,v){{try{{localStorage.setItem(k,JSON.stringify(v))}}catch(e){{}}}}
  var state=load(KEY);
  function updateProgress(){{
    var done=SECTIONS.filter(function(s){{return state[s]}}).length;
    var pct=Math.round(done/SECTIONS.length*100);
    document.getElementById("pct").textContent=pct+"%";
    document.getElementById("rail").style.width=pct+"%";
    SECTIONS.forEach(function(s){{
      var link=document.querySelector('.toc a[data-target="'+s+'"]');if(link)link.classList.toggle("done",!!state[s]);
      var tog=document.querySelector('.done-toggle[data-done="'+s+'"]');
      if(tog){{tog.classList.toggle("is-done",!!state[s]);var cb=tog.querySelector("input");if(cb)cb.checked=!!state[s];}}
    }});
  }}
  document.querySelectorAll(".done-toggle").forEach(function(tog){{
    var id=tog.getAttribute("data-done");
    tog.querySelector("input").addEventListener("change",function(){{state[id]=this.checked;save(KEY,state);updateProgress();}});
  }});
  document.getElementById("reset").addEventListener("click",function(){{state={{}};save(KEY,state);updateProgress();}});
  var spy=document.querySelectorAll(".section");
  var obs=new IntersectionObserver(function(entries){{
    entries.forEach(function(en){{if(en.isIntersecting){{
      document.querySelectorAll(".toc a").forEach(function(a){{a.classList.remove("active")}});
      var link=document.querySelector('.toc a[data-target="'+en.target.id+'"]');if(link)link.classList.add("active");
    }}}});
  }},{{rootMargin:"-45% 0px -50% 0px"}});
  spy.forEach(function(s){{obs.observe(s)}});
  var toTop=document.getElementById("toTop");
  window.addEventListener("scroll",function(){{toTop.classList.toggle("show",window.scrollY>700)}});
  toTop.addEventListener("click",function(){{window.scrollTo({{top:0,behavior:"smooth"}})}});
  updateProgress();
}})();
</script>
</body>
</html>"""
    return html


def copy_figures():
    FIG_OUT.mkdir(parents=True, exist_ok=True)
    n = 0
    for svg in sorted(FIG_SRC.glob("deel-*/*.svg")):
        dest = FIG_OUT / svg.name
        dest.write_bytes(svg.read_bytes())
        n += 1
    print(f"Figuren gekopieerd: {n}")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    copy_figures()

    for n in range(1, 31):
        reader = parse_reader(n)
        werkboek = parse_werkboek(n)
        html = build_deel_page(n, reader, werkboek)
        (OUT / f"deel-{pad(n)}.html").write_text(html, encoding="utf-8")
        n_quiz = len(re.findall(r'<details class="q"', html))
        n_sections = len(re.findall(r'<article class="section"', html))
        print(f"deel-{pad(n)}: {n_sections} secties, {reader['n_figs']} figuren, {n_quiz} controlevragen ({werkboek['type']})")


if __name__ == "__main__":
    main()
