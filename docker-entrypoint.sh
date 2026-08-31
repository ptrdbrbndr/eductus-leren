#!/bin/sh
set -eu

if [ -n "${BASIC_AUTH_USER:-}" ] && [ -n "${BASIC_AUTH_PASS:-}" ]; then
  htpasswd -cb /etc/nginx/.htpasswd "$BASIC_AUTH_USER" "$BASIC_AUTH_PASS"
else
  echo "WAARSCHUWING: BASIC_AUTH_USER/BASIC_AUTH_PASS niet gezet — leeg .htpasswd, niemand kan inloggen (fail-closed)." >&2
  : > /etc/nginx/.htpasswd
fi

# traden.eductus.nl — eigen multi-user .htpasswd (3 individuele accounts), los van
# het leren/cursus-mechanisme hierboven. Zelfde fail-closed principe: ontbreekt een
# paar, dan wordt dat ene account overgeslagen (niet het hele bestand geweigerd),
# zodat een enkele ontbrekende env var niet meteen alle drie blokkeert; ontbreken ze
# allemaal, dan blijft .htpasswd-traden leeg en kan niemand inloggen.
: > /etc/nginx/.htpasswd-traden
add_traden_user() {
  user="$1"
  pass="$2"
  if [ -n "$user" ] && [ -n "$pass" ]; then
    htpasswd -b /etc/nginx/.htpasswd-traden "$user" "$pass"
  else
    echo "WAARSCHUWING: traden-account overgeslagen — user/pass ontbreekt." >&2
  fi
}
add_traden_user "${TRADEN_USER_PIETER:-}" "${TRADEN_PASS_PIETER:-}"
add_traden_user "${TRADEN_USER_CHRIS:-}" "${TRADEN_PASS_CHRIS:-}"
add_traden_user "${TRADEN_USER_JW:-}" "${TRADEN_PASS_JW:-}"

# Persistent volume voor het traden-access-log (mount_path uit Coolify storage
# 'traden-nginx-logs' — overleeft redeploys, in tegenstelling tot de rest van
# de container). Map moet bestaan en schrijfbaar zijn vóór nginx erin logt.
mkdir -p /var/log/nginx-persist
chmod 755 /var/log/nginx-persist

# Achtergrondlus die admin.html elke 5 minuten vers genereert vanuit de drie
# access-logs (leren/cursus/traden), alleen zichtbaar voor Pieter via de
# nginx-check op elk van de drie serverblokken.
# Draait vóór exec nginx zodat de pagina niet leeg is als iemand meteen na
# een deploy kijkt (eerste run gebeurt meteen, niet pas na 300s).
(
  while true; do
    /generate-admin.sh || echo "WAARSCHUWING: generate-admin.sh mislukt." >&2
    sleep 300
  done
) &

exec "$@"
