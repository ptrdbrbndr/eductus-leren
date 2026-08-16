#!/bin/sh
set -eu

if [ -n "${BASIC_AUTH_USER:-}" ] && [ -n "${BASIC_AUTH_PASS:-}" ]; then
  htpasswd -cb /etc/nginx/.htpasswd "$BASIC_AUTH_USER" "$BASIC_AUTH_PASS"
else
  echo "WAARSCHUWING: BASIC_AUTH_USER/BASIC_AUTH_PASS niet gezet — leeg .htpasswd, niemand kan inloggen (fail-closed)." >&2
  : > /etc/nginx/.htpasswd
fi

exec "$@"
