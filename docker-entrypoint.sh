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

exec "$@"
