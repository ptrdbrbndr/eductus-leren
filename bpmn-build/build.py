#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build tool: converts the "BPMN, CMMN & DMN" course (static HTML source at
bpmn-cmmn-dmn/niveau-{1,2,3}/deel-NN/{reader,werkboek}.html) into the flat
leren.eductus.nl hub-style pages under leren-hub/bpmn-cmmn-dmn/.

This is a RESTYLE, not content generation: reader prose is carried over
verbatim per <h2> block. The werkboek has no embedded model-answer / "Uitwerking"
content anywhere in this course (verified across all 30 delen) -- unlike the
OutSystems precedent, so instead of fabricating quiz "reveal answer" panels we
group all werkboek assignments verbatim into one closing "Werkboek" section per
deel, each opdracht rendered as its own card (title + verbatim body), no
invented answers.

Level ranges are NOT 10/10/10: niveau-1 = deel 1-10, niveau-2 = deel 11-22,
niveau-3 = deel 23-30. Use explicit lo<=n<=hi ranges everywhere (never
(n-1)//10) so the 10<->11 and 22<->23 links are correct.

Run: python3 build.py
"""
import re
import shutil
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString, Tag

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "bpmn-cmmn-dmn"
OUT = ROOT / "leren-hub" / "bpmn-cmmn-dmn"
FIG_SRC = SRC / "figuren"
FIG_OUT = OUT / "figuren"

KEY_ABBR = "bcd"

NIVEAUS = [
    {"n": 1, "lo": 1, "hi": 10, "label": "Fundament", "cert": "OCEB 2 Fundamental"},
    {"n": 2, "lo": 11, "hi": 22, "label": "Praktijk", "cert": "OCEB 2 Business Intermediate + BPM+ Certificate"},
    {"n": 3, "lo": 23, "hi": 30, "label": "Meesterschap", "cert": "OCEB 2 Business Advanced + ABPMP CBPP"},
]

TITLES = {
    1: "Procesdenken en drie standaarden",
    2: "BPM als managementdiscipline",
    3: "BPMN basis I: de descriptive subclass",
    4: "BPMN basis II: de analytic subclass",
    5: "Modelleerdiscipline en stijl",
    6: "DMN basis",
    7: "CMMN basis",
    8: "De drie talen samen",
    9: "Tooling, uitwisseling en beheer",
    10: "Examentraining en capstone",
    11: "Procesarchitectuur en modelleerconventies",
    12: "Procesanalyse en -ontwerp",
    13: "BPMN gevorderd I: samenwerking en uitzonderingen",
    14: "BPMN gevorderd II: data, resources en semantiek",
    15: "DMN gevorderd",
    16: "Beslismanagement en regelbeheer",
    17: "CMMN gevorderd",
    18: "Combineren in architectuurpatronen",
    19: "Van model naar uitvoering",
    20: "Procesmining: model versus werkelijkheid",
    21: "Governance van modellen",
    22: "Examentraining en capstone niveau 2",
    23: "Enterprise-procesarchitectuur",
    24: "Referentiemodellen en sectorstandaarden",
    25: "Procesmining verdiept",
    26: "Compliance, risk en control in modellen",
    27: "Beslisautomatisering op schaal",
    28: "Adaptive case management en kenniswerk",
    29: "Transformatie leiden",
    30: "Masterproef",
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
            .replace(">", "&gt;").replace('"', "&quot;"))


NUM_PREFIX_RE = re.compile(r"^\d+(\.\d+){1,3}\.?\s+")


def strip_num_prefix(title):
    return NUM_PREFIX_RE.sub("", title).strip()


def fix_table(table_tag):
    """Wrap a raw <table> (tr/th or tr/td only) into thead/tbody so the hub
    CSS (thead th{...}) applies, and return a tablewrap wrapper div."""
    rows = table_tag.find_all("tr", recursive=False)
    if not rows:
        wrapper = BeautifulSoup('<div class="tablewrap"></div>', "html.parser").div
        wrapper.append(table_tag.extract())
        return wrapper
    soup = table_tag  # reuse same soup context via .wrap
    doc = BeautifulSoup("", "html.parser")
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


def fix_figure(fig_tag, depth_prefix="figuren/"):
    img = fig_tag.find("img")
    if img and img.get("src"):
        basename = img["src"].split("/")[-1]
        img["src"] = depth_prefix + basename
    if fig_tag.has_attr("class"):
        del fig_tag["class"]
    return fig_tag


def render_block_children(tag):
    """Render the HTML of a tag's block-level content, fixing tables/figures."""
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
    """Return ordered list of {title, content_html, node_h2} for each <h2>
    block inside `article`, plus the 'preamble' content before the first h2
    (h1/p/hr/blockquote etc)."""
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
        elif c.name in ("h1", "hr"):
            if cur_title is None:
                continue  # drop from preamble, not needed
        elif c.name == "aside":
            continue  # "Dit deel downloaden" box -- handled separately
        else:
            if cur_title is None:
                preamble_nodes.append(c)
            else:
                cur_nodes.append(c)
    flush()
    return preamble_nodes, blocks


def extract_disclaimer(preamble_nodes):
    for n in preamble_nodes:
        if n.name == "blockquote":
            p = n.find("p")
            return (p.get_text() if p else n.get_text()).strip()
    return None


def first_long_paragraph(blocks, min_len=80):
    for b in blocks:
        soup = BeautifulSoup(b["content_html"], "html.parser")
        for p in soup.find_all("p"):
            txt = p.get_text(strip=True)
            if len(txt) >= min_len:
                return txt
    for b in blocks:
        soup = BeautifulSoup(b["content_html"], "html.parser")
        p = soup.find("p")
        if p:
            return p.get_text(strip=True)
    return ""


def parse_reader(n):
    path = SRC / niveau_dir(n) / f"deel-{pad(n)}" / "reader.html"
    soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
    article = soup.select_one("article.bcd-article")
    h1 = article.find("h1")
    full_title = h1.get_text(strip=True)
    intro_p = article.find("p")
    intro_text = intro_p.get_text() if intro_p else ""
    m = re.search(r"studielast\s*±\s*(\d+)\s*uur", intro_text)
    studielast = m.group(1) if m else None

    preamble, blocks = split_into_h2_blocks(article)
    disclaimer = extract_disclaimer(preamble)

    n_figs = sum(b["content_html"].count("<figure") for b in blocks)
    return {
        "full_title": full_title,
        "title": TITLES[n],
        "studielast": studielast,
        "disclaimer": disclaimer,
        "sections": blocks,
        "n_figs": n_figs,
    }


def parse_werkboek(n):
    path = SRC / niveau_dir(n) / f"deel-{pad(n)}" / "werkboek.html"
    soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
    article = soup.select_one("article.bcd-article")
    preamble, blocks = split_into_h2_blocks(article)
    intro_p = None
    for nd in preamble:
        if nd.name == "p":
            txt = nd.get_text(strip=True)
            if txt.startswith("Werkboek ") or txt.startswith("Reader "):
                continue  # metadata line, e.g. "Werkboek · ... · deel N van 30"
            intro_p = txt
            break
    return {"intro": intro_p, "cards": blocks}


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
.prose blockquote{margin:18px 0;padding:14px 20px;border-left:3px solid var(--line);background:var(--paper-2);border-radius:0 12px 12px 0;color:var(--ink-soft)}
.prose blockquote p{margin:6px 0}
.prose blockquote strong{color:var(--ink)}
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
.finish{margin-top:40px;text-align:center;padding:46px 28px;border-radius:20px;background:linear-gradient(135deg,var(--teal-deep),var(--teal));color:#eef5f2;box-shadow:var(--shadow-lg);position:relative;overflow:hidden}
.finish::after{content:"";position:absolute;inset:0;background:radial-gradient(400px 200px at 80% 0,rgba(189,125,39,.35),transparent 60%);pointer-events:none}
.finish h3{font-family:"Fraunces",serif;font-size:30px;margin:0 0 10px;color:#fff;position:relative}
.finish p{margin:6px auto;max-width:54ch;color:#cfe2dc;position:relative}
.finish a.btn{display:inline-block;margin-top:20px;font-family:"IBM Plex Mono",monospace;font-size:13px;letter-spacing:1px;text-transform:uppercase;font-weight:600;background:#fff;color:var(--teal-deep);border-radius:999px;padding:13px 26px;position:relative}
footer{max-width:var(--maxw);margin:0 auto;padding:30px 28px 60px;color:var(--ink-faint);font-family:"IBM Plex Mono",monospace;font-size:12px;letter-spacing:.5px;position:relative;z-index:2;border-top:1px solid var(--line)}
.toTop{position:fixed;right:22px;bottom:22px;z-index:55;width:46px;height:46px;border-radius:50%;border:1px solid var(--line);background:var(--paper);color:var(--teal);cursor:pointer;font-size:18px;box-shadow:var(--shadow);opacity:0;transform:translateY(10px);transition:.25s;pointer-events:none}
.toTop.show{opacity:1;transform:none;pointer-events:auto}
"""


def build_deel_page(n, reader, werkboek):
    lv = niveau_for(n)
    sections = list(reader["sections"])
    n_reader_sections = len(sections)

    # Build ids
    for i, s in enumerate(sections, start=1):
        s["id"] = f"s{i}"
        s["display_title"] = strip_num_prefix(s["title"])

    wb_id = f"s{n_reader_sections + 1}"
    total_sections = n_reader_sections + 1

    # ---- TOC ----
    toc_items = "\n".join(
        f'      <li><a href="#{s["id"]}" data-target="{s["id"]}">{escape_html(s["display_title"])}</a></li>'
        for s in sections
    )
    toc_items += f'\n      <li><a href="#{wb_id}" data-target="{wb_id}">Werkboek — opdrachten</a></li>'

    # ---- Reader sections HTML ----
    section_html_parts = []
    for i, s in enumerate(sections, start=1):
        section_html_parts.append(f"""    <article class="section" id="{s['id']}">
      <div class="section__head"><div class="section__num">{pad(i)}</div>
        <div class="section__titles"><h2 class="t">{escape_html(s['display_title'])}</h2><span class="chip time">Sectie {i} van {total_sections}</span></div>
        <label class="done-toggle" data-done="{s['id']}"><input type="checkbox">Afgerond</label></div>
      <div class="prose">
{s['content_html']}
      </div>
    </article>""")

    # ---- Werkboek section ----
    wb_cards = []
    for c in werkboek["cards"]:
        wb_cards.append(f"""        <div class="card">
          <h4>{escape_html(c['title'])}</h4>
          <div class="prose">
{c['content_html']}
          </div>
        </div>""")
    wb_intro_html = f"<p>{escape_html(werkboek['intro'])}</p>" if werkboek.get("intro") else ""
    wb_section = f"""    <article class="section" id="{wb_id}">
      <div class="section__head"><div class="section__num">{pad(total_sections)}</div>
        <div class="section__titles"><h2 class="t">Werkboek — opdrachten</h2><span class="chip time">Sectie {total_sections} van {total_sections}</span></div>
        <label class="done-toggle" data-done="{wb_id}"><input type="checkbox">Afgerond</label></div>
      <div class="prose">
        {wb_intro_html}
      </div>
      <div class="quiz">
        <div class="quiz__h">Werkboekopdrachten</div>
        <p class="quiz__src">Uit Werkboek deel {n}, letterlijk overgenomen — geen modelantwoorden ingevuld, dit is klassikaal/individueel werk</p>
{chr(10).join(wb_cards)}
      </div>
    </article>"""

    all_sections_html = "\n".join(section_html_parts) + "\n" + wb_section

    # ---- hero stats ----
    n_werkboek_opdrachten = len(werkboek["cards"])
    studielast = reader["studielast"] or "?"
    hero_lead = first_long_paragraph(sections)
    disclaimer_html = f'<div class="disclaimer"><strong>Positionering.</strong> {escape_html(reader["disclaimer"])}</div>' if reader.get("disclaimer") else ""

    # ---- trail (deel-titles within niveau) ----
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

    # ---- next within explicit level ranges (1<=n<=10 / 11<=n<=22 / 23<=n<=30);
    # deliberately NOT (n-1)//10 -- the boundaries are skewed (10<->11, 22<->23) ----
    next_n = n + 1 if n + 1 <= 30 else None
    if next_n is not None:
        finish_title = f"Verder naar deel {next_n}"
        finish_p = f"Deel {next_n} — {escape_html(TITLES[next_n])} — bouwt voort op wat hier is behandeld."
        finish_btn = f'<a class="btn" href="deel-{pad(next_n)}.html">Deel {next_n} openen →</a>'
    else:
        finish_title = "Cursus afgerond"
        finish_p = "Dit was het laatste deel van BPMN, CMMN &amp; DMN. Terug naar het cursusoverzicht voor een herhaling of naar alle Eductus-cursussen."
        finish_btn = '<a class="btn" href="index.html">Terug naar cursusoverzicht →</a>'

    meta_desc = (hero_lead[:250] + "…") if len(hero_lead) > 250 else hero_lead
    key = f"eductus_{KEY_ABBR}{n}_progress_v1"
    sections_js = ", ".join(f'"{s["id"]}"' for s in sections + [{"id": wb_id}])

    old_style_url = f"https://cursus.eductus.nl/bpmn-cmmn-dmn/{niveau_dir(n)}/deel-{pad(n)}/reader.html"

    html = f"""<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Deel {n} — {escape_html(reader['title'])} | Eductus</title>
<meta name="description" content="Cursus BPMN, CMMN &amp; DMN, Deel {n} (Niveau {lv['n']} — {lv['label']}): {escape_html(meta_desc)}">
<link rel="canonical" href="https://leren.eductus.nl/bpmn-cmmn-dmn/deel-{pad(n)}.html">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400&family=Spectral:ital,wght@0,300;0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>{CSS}</style>
</head>
<body>
<div class="progress-rail"><div class="progress-rail__fill" id="rail"></div></div>
<header class="topbar">
  <div class="topbar__inner">
    <div class="brand">Eductus<span class="dot">.</span><small>BPMN, CMMN &amp; DMN · Deel {n}</small></div>
    <div class="topbar__meta"><span>Voortgang <span class="pct" id="pct">0%</span></span>
      <button class="btn-reset" id="reset" title="Voortgang wissen">Reset</button></div>
  </div>
</header>

<section class="hero">
  <p class="eyebrow">Cursus BPMN, CMMN &amp; DMN · Niveau {lv['n']} ({lv['label']}) · Deel {n} van 30</p>
  <h1>{escape_html(reader['title'])}</h1>
  <p class="hero__lead">{escape_html(hero_lead)}</p>
  <div class="hero__stats">
    <div class="stat"><b>{total_sections}</b><span>secties</span></div>
    <div class="stat"><b>&plusmn;{studielast}u</b><span>studielast</span></div>
    <div class="stat"><b>{n_werkboek_opdrachten}</b><span>werkboekopdrachten</span></div>
    <div class="stat"><b>{reader['n_figs']}</b><span>figuren</span></div>
  </div>
  {disclaimer_html}
  {trail}
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
<footer>Eductus · Cursus BPMN, CMMN &amp; DMN · Deel {n} · <a href="index.html">terug naar cursusoverzicht</a> · <a href="{old_style_url}">bekijk de oude vormgeving van dit deel (incl. downloads)</a> · Voortgang lokaal in je browser (localStorage).</footer>

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
    return html, total_sections


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    FIG_OUT.mkdir(parents=True, exist_ok=True)

    section_counts = {}
    for n in range(1, 31):
        reader = parse_reader(n)
        werkboek = parse_werkboek(n)
        html, total_sections = build_deel_page(n, reader, werkboek)
        (OUT / f"deel-{pad(n)}.html").write_text(html, encoding="utf-8")
        section_counts[n] = total_sections
        print(f"deel-{pad(n)}: {total_sections} secties, {reader['n_figs']} figuren, {len(werkboek['cards'])} werkboekopdrachten")

    return section_counts


if __name__ == "__main__":
    main()
