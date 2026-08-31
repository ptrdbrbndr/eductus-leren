#!/bin/sh
# Genereert traden-admin.html vanuit het pipe-gescheiden traden-access.log op
# het persistente volume. Draait als achtergrondlus vanuit docker-entrypoint.sh
# (elke 300s) en wordt bij ELKE run volledig vanaf nul herschreven — geen
# append-logica, dus geen stale/dubbele rijen na een herstart.
#
# Alleen leesbaar via https://traden.eductus.nl/traden-admin.html, en zelfs
# dan alleen voor pieter.de.brabander@ductus.nl — zie de $remote_user-check
# in nginx.conf. Dit script zelf doet geen toegangscontrole, dat is nginx' taak.
set -eu

LOG="/var/log/nginx-persist/traden-access.log"
OUT="/usr/share/nginx/html/leren/traden-admin.html"
TMP="${OUT}.tmp.$$"

mkdir -p "$(dirname "$LOG")"
[ -f "$LOG" ] || : > "$LOG"

GENERATED_AT=$(date '+%Y-%m-%d %H:%M:%S %Z')

AWK_OUT=$(awk -F'|' '
  function htmlesc(s) {
    gsub(/&/, "\\&amp;", s)
    gsub(/</, "\\&lt;", s)
    gsub(/>/, "\\&gt;", s)
    gsub(/"/, "\\&quot;", s)
    return s
  }
  {
    user=$1; t=$2; req=$3; status=$4
    if (user == "" || user == "-") next
    if (status !~ /^2[0-9][0-9]$/) next
    n = split(req, parts, " ")
    path = (n >= 2) ? parts[2] : req
    count[user]++
    last[user] = t
    lastpath[user] = path
    total++
    recentUser[total] = user
    recentTime[total] = t
    recentPath[total] = path
    recentStatus[total] = status
  }
  END {
    print "===SUMMARY==="
    for (u in count) {
      printf "%s\t%s\t%s\t%s\n", htmlesc(u), htmlesc(last[u]), count[u], htmlesc(lastpath[u])
    }
    print "===RECENT==="
    start = (total > 100) ? total - 99 : 1
    for (i = total; i >= start; i--) {
      printf "%s\t%s\t%s\t%s\n", htmlesc(recentTime[i]), htmlesc(recentUser[i]), htmlesc(recentPath[i]), recentStatus[i]
    }
    print "===COUNTS==="
    printf "%d\t%d\n", total, length(count)
  }
' "$LOG")

SUMMARY_BLOCK=$(printf '%s\n' "$AWK_OUT" | awk '/^===SUMMARY===$/{f=1;next}/^===RECENT===$/{f=0}f')
RECENT_BLOCK=$(printf '%s\n' "$AWK_OUT" | awk '/^===RECENT===$/{f=1;next}/^===COUNTS===$/{f=0}f')
COUNTS_LINE=$(printf '%s\n' "$AWK_OUT" | awk '/^===COUNTS===$/{f=1;next}f')
TOTAL_REQ=$(printf '%s\n' "$COUNTS_LINE" | cut -f1)
TOTAL_USERS=$(printf '%s\n' "$COUNTS_LINE" | cut -f2)
[ -n "${TOTAL_REQ:-}" ] || TOTAL_REQ=0
[ -n "${TOTAL_USERS:-}" ] || TOTAL_USERS=0

SUMMARY_ROWS=""
if [ -n "$SUMMARY_BLOCK" ]; then
  SUMMARY_ROWS=$(printf '%s\n' "$SUMMARY_BLOCK" | awk -F'\t' '{printf "<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>\n", $1, $2, $3, $4}')
fi
if [ -z "$SUMMARY_ROWS" ]; then
  SUMMARY_ROWS='<tr><td colspan="4">Nog geen geslaagde requests gelogd.</td></tr>'
fi

RECENT_ROWS=""
if [ -n "$RECENT_BLOCK" ]; then
  RECENT_ROWS=$(printf '%s\n' "$RECENT_BLOCK" | awk -F'\t' '{printf "<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>\n", $1, $2, $3, $4}')
fi
if [ -z "$RECENT_ROWS" ]; then
  RECENT_ROWS='<tr><td colspan="4">Nog geen activiteit.</td></tr>'
fi

cat > "$TMP" <<HTMLEOF
<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Eductus Trading — admin</title>
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
.tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);background:var(--paper)}
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
  <p class="eyebrow">Eductus Trading &middot; Admin</p>
  <h1>Wie deed wat, wanneer</h1>
  <p class="meta">Gegenereerd: ${GENERATED_AT} &middot; Alleen zichtbaar voor pieter.de.brabander@ductus.nl</p>

  <div class="stats">
    <div class="stat"><b>${TOTAL_REQ}</b><span>Geslaagde requests</span></div>
    <div class="stat"><b>${TOTAL_USERS}</b><span>Actieve accounts</span></div>
  </div>

  <h2>Per gebruiker</h2>
  <div class="tablewrap"><table>
    <thead><tr><th>Gebruiker</th><th>Laatst gezien</th><th>Aantal requests</th><th>Laatst bezochte pagina</th></tr></thead>
    <tbody>
${SUMMARY_ROWS}
    </tbody>
  </table></div>

  <h2>Recente activiteit (max. 100)</h2>
  <div class="tablewrap"><table>
    <thead><tr><th>Tijdstip</th><th>Gebruiker</th><th>Pad</th><th>Status</th></tr></thead>
    <tbody>
${RECENT_ROWS}
    </tbody>
  </table></div>

  <p class="note">Gebaseerd op geslaagde Basic Auth-requests (HTTP 2xx) naar traden.eductus.nl. Mislukte inlogpogingen (401, verkeerd wachtwoord) loggen geen bruikbare gebruikersnaam en staan hier niet in. Regenereert elke 5 minuten vanaf nul.</p>
</div>
</body>
</html>
HTMLEOF

mv "$TMP" "$OUT"
