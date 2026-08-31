#!/bin/sh
# Genereert admin.html vanuit de drie pipe-gescheiden access-logs op het
# persistente volume (leren/cursus/traden-access.log). Draait als achter-
# grondlus vanuit docker-entrypoint.sh (elke 300s, en meteen bij opstart) en
# wordt bij ELKE run volledig vanaf nul herschreven — geen append-logica,
# dus geen stale/dubbele rijen na een herstart.
#
# Zichtbaar op alle drie de domeinen (leren.eductus.nl, cursus.eductus.nl,
# traden.eductus.nl) op /admin.html — fysiek maar twee bestanden nodig omdat
# leren.eductus.nl en traden.eductus.nl dezelfde documentroot delen.
# Toegang wordt uitsluitend door nginx afgedwongen (auth_basic + auth_request
# + $remote_user-check op elk serverblok) — dit script doet geen eigen
# toegangscontrole.
set -eu

LOG_DIR="/var/log/nginx-persist"
LOG_LEREN="$LOG_DIR/leren-access.log"
LOG_CURSUS="$LOG_DIR/cursus-access.log"
LOG_TRADEN="$LOG_DIR/traden-access.log"

OUT_CURSUS="/usr/share/nginx/html/cursus/admin.html"
OUT_LEREN="/usr/share/nginx/html/leren/admin.html"   # dient ook traden.eductus.nl (gedeelde root)

mkdir -p "$LOG_DIR"
for f in "$LOG_LEREN" "$LOG_CURSUS" "$LOG_TRADEN"; do
  [ -f "$f" ] || : > "$f"
done

GENERATED_AT=$(date '+%Y-%m-%d %H:%M:%S %Z')

AWK_OUT=$(awk -F'|' '
  function htmlesc(s) {
    gsub(/&/, "\\&amp;", s)
    gsub(/</, "\\&lt;", s)
    gsub(/>/, "\\&gt;", s)
    gsub(/"/, "\\&quot;", s)
    return s
  }
  function domainOf(fn) {
    if (fn ~ /leren-access\.log$/)  return "leren.eductus.nl"
    if (fn ~ /cursus-access\.log$/) return "cursus.eductus.nl"
    if (fn ~ /traden-access\.log$/) return "traden.eductus.nl"
    return fn
  }
  {
    user = $1; t = $2; req = $3; status = $4
    if (user == "" || user == "-") next
    if (status !~ /^2[0-9][0-9]$/) next
    dom = domainOf(FILENAME)
    n = split(req, parts, " ")
    path = (n >= 2) ? parts[2] : req
    key = user "\t" dom
    count[key]++
    last[key] = t
    lastpath[key] = path
    userSeen[user] = 1
    total++
    domTotal[dom]++
    idx = domTotal[dom]
    recentTime[dom, idx] = t
    recentUser[dom, idx] = user
    recentPath[dom, idx] = path
  }
  END {
    print "===SUMMARY==="
    for (k in count) {
      split(k, parr, "\t")
      printf "%s\t%s\t%s\t%s\t%s\n", htmlesc(parr[1]), htmlesc(parr[2]), htmlesc(last[k]), count[k], htmlesc(lastpath[k])
    }
    print "===RECENT_LEREN==="
    n = domTotal["leren.eductus.nl"] + 0
    start = (n > 50) ? n - 49 : 1
    for (i = n; i >= start; i--) printf "%s\t%s\t%s\n", htmlesc(recentTime["leren.eductus.nl", i]), htmlesc(recentUser["leren.eductus.nl", i]), htmlesc(recentPath["leren.eductus.nl", i])
    print "===RECENT_CURSUS==="
    n = domTotal["cursus.eductus.nl"] + 0
    start = (n > 50) ? n - 49 : 1
    for (i = n; i >= start; i--) printf "%s\t%s\t%s\n", htmlesc(recentTime["cursus.eductus.nl", i]), htmlesc(recentUser["cursus.eductus.nl", i]), htmlesc(recentPath["cursus.eductus.nl", i])
    print "===RECENT_TRADEN==="
    n = domTotal["traden.eductus.nl"] + 0
    start = (n > 50) ? n - 49 : 1
    for (i = n; i >= start; i--) printf "%s\t%s\t%s\n", htmlesc(recentTime["traden.eductus.nl", i]), htmlesc(recentUser["traden.eductus.nl", i]), htmlesc(recentPath["traden.eductus.nl", i])
    print "===COUNTS==="
    nu = 0
    for (u in userSeen) nu++
    printf "%d\t%d\n", total, nu
  }
' "$LOG_LEREN" "$LOG_CURSUS" "$LOG_TRADEN")

extract() {
  # extract($1=start marker, $2=end marker) uit $AWK_OUT
  printf '%s\n' "$AWK_OUT" | awk -v s="$1" -v e="$2" '$0==s{f=1;next} $0==e{f=0} f'
}

SUMMARY_BLOCK=$(extract "===SUMMARY===" "===RECENT_LEREN===")
RECENT_LEREN_BLOCK=$(extract "===RECENT_LEREN===" "===RECENT_CURSUS===")
RECENT_CURSUS_BLOCK=$(extract "===RECENT_CURSUS===" "===RECENT_TRADEN===")
RECENT_TRADEN_BLOCK=$(extract "===RECENT_TRADEN===" "===COUNTS===")
COUNTS_LINE=$(printf '%s\n' "$AWK_OUT" | awk '/^===COUNTS===$/{f=1;next}f')
TOTAL_REQ=$(printf '%s\n' "$COUNTS_LINE" | cut -f1)
TOTAL_USERS=$(printf '%s\n' "$COUNTS_LINE" | cut -f2)
[ -n "${TOTAL_REQ:-}" ] || TOTAL_REQ=0
[ -n "${TOTAL_USERS:-}" ] || TOTAL_USERS=0

rows_or_empty() {
  # $1 = tab-gescheiden blok, $2 = aantal kolommen (4 of 3), $3 = lege-tekst
  block="$1"; cols="$2"; emptytxt="$3"
  if [ -z "$block" ]; then
    printf '<tr><td colspan="%s">%s</td></tr>\n' "$cols" "$emptytxt"
    return
  fi
  if [ "$cols" = "4" ]; then
    printf '%s\n' "$block" | awk -F'\t' '{printf "<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>\n", $1, $2, $3, $4}'
  else
    printf '%s\n' "$block" | awk -F'\t' '{printf "<tr><td>%s</td><td>%s</td><td>%s</td></tr>\n", $1, $2, $3}'
  fi
}

SUMMARY_ROWS=$(rows_or_empty "$SUMMARY_BLOCK" 4 "Nog geen geslaagde requests gelogd op geen van de drie domeinen.")
RECENT_LEREN_ROWS=$(rows_or_empty "$RECENT_LEREN_BLOCK" 3 "Nog geen activiteit op leren.eductus.nl.")
RECENT_CURSUS_ROWS=$(rows_or_empty "$RECENT_CURSUS_BLOCK" 3 "Nog geen activiteit op cursus.eductus.nl.")
RECENT_TRADEN_ROWS=$(rows_or_empty "$RECENT_TRADEN_BLOCK" 3 "Nog geen activiteit op traden.eductus.nl.")

build_page() {
  cat <<HTMLEOF
<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Eductus — admin</title>
<meta name="robots" content="noindex, nofollow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
<style>
:root{
  --paper:#FBFAF7;--paper-2:#F1EEE4;--ink:#14213D;--ink-soft:#3E4A66;--ink-faint:#7C86A0;
  --line:#DDE1EA;--blue:#2563A8;--blue-deep:#14213D;--amber:#E9A13B;--oxblood:#9A3B2E;
  --blue-tint:#E4ECF6;--amber-tint:#FBF0DC;
  --shadow:0 1px 2px rgba(20,33,61,.06),0 10px 30px -12px rgba(20,33,61,.20);
  --maxw:1180px;
}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:"DM Sans",system-ui,sans-serif;font-size:16px;line-height:1.6}
h1,h2{font-family:"Cormorant Garamond",Georgia,serif;color:var(--blue-deep);font-weight:600}
.wrap{max-width:var(--maxw);margin:0 auto;padding:40px 28px 60px}
.eyebrow{font-size:12px;letter-spacing:3px;text-transform:uppercase;color:var(--amber);font-weight:700;margin:0 0 12px}
h1{font-size:clamp(28px,4vw,42px);margin:0 0 8px}
.meta{color:var(--ink-faint);font-size:13px;margin:0 0 30px}
.stats{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:30px}
.stat{background:var(--paper-2);border:1px solid var(--line);border-radius:14px;padding:14px 18px;min-width:120px;box-shadow:var(--shadow)}
.stat b{display:block;font-family:"Cormorant Garamond",serif;font-size:24px;color:var(--blue)}
.stat span{font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--ink-faint)}
h2{font-size:22px;margin:36px 0 14px}
h3{font-family:"Cormorant Garamond",Georgia,serif;font-size:18px;margin:24px 0 10px;color:var(--blue-deep)}
.tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);background:var(--paper);margin-bottom:8px}
table{border-collapse:collapse;width:100%;font-size:14px}
th,td{text-align:left;padding:10px 14px;border-bottom:1px solid var(--line);vertical-align:top}
thead th{background:var(--blue-deep);color:#eef2f8;font-size:11px;letter-spacing:1px;text-transform:uppercase}
tbody tr:nth-child(even){background:var(--paper-2)}
tbody tr:last-child td{border-bottom:none}
.note{margin-top:30px;font-size:13px;color:var(--ink-faint)}
</style>
</head>
<body>
<div class="wrap">
  <p class="eyebrow">Eductus &middot; Admin</p>
  <h1>Wie deed wat, wanneer</h1>
  <p class="meta">Gegenereerd: ${GENERATED_AT} &middot; Alleen zichtbaar voor pieter.de.brabander@ductus.nl, op leren.eductus.nl, cursus.eductus.nl en traden.eductus.nl</p>

  <div class="stats">
    <div class="stat"><b>${TOTAL_REQ}</b><span>Geslaagde requests</span></div>
    <div class="stat"><b>${TOTAL_USERS}</b><span>Actieve accounts</span></div>
  </div>

  <h2>Per gebruiker en domein</h2>
  <div class="tablewrap"><table>
    <thead><tr><th>Gebruiker</th><th>Domein</th><th>Laatst gezien</th><th>Aantal requests</th><th>Laatst bezochte pagina</th></tr></thead>
    <tbody>
${SUMMARY_ROWS}
    </tbody>
  </table></div>

  <h2>Recente activiteit per domein (max. 50 per domein)</h2>
  <h3>leren.eductus.nl</h3>
  <div class="tablewrap"><table>
    <thead><tr><th>Tijdstip</th><th>Gebruiker</th><th>Pad</th></tr></thead>
    <tbody>
${RECENT_LEREN_ROWS}
    </tbody>
  </table></div>
  <h3>cursus.eductus.nl</h3>
  <div class="tablewrap"><table>
    <thead><tr><th>Tijdstip</th><th>Gebruiker</th><th>Pad</th></tr></thead>
    <tbody>
${RECENT_CURSUS_ROWS}
    </tbody>
  </table></div>
  <h3>traden.eductus.nl</h3>
  <div class="tablewrap"><table>
    <thead><tr><th>Tijdstip</th><th>Gebruiker</th><th>Pad</th></tr></thead>
    <tbody>
${RECENT_TRADEN_ROWS}
    </tbody>
  </table></div>

  <p class="note">Gebaseerd op geslaagde Basic Auth-requests (HTTP 2xx) op alle drie de domeinen. Mislukte inlogpogingen (401, verkeerd wachtwoord) loggen geen bruikbare gebruikersnaam en staan hier niet in. Regenereert elke 5 minuten vanaf nul.</p>
</div>
</body>
</html>
HTMLEOF
}

mkdir -p "$(dirname "$OUT_CURSUS")" "$(dirname "$OUT_LEREN")"
build_page > "${OUT_CURSUS}.tmp.$$"
mv "${OUT_CURSUS}.tmp.$$" "$OUT_CURSUS"
build_page > "${OUT_LEREN}.tmp.$$"
mv "${OUT_LEREN}.tmp.$$" "$OUT_LEREN"
