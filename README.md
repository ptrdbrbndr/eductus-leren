# Eductus — SAP-fundamenten voor Business Analysts

Statische leerreeks (8 modules) over de SAP-wereld, van overzicht tot BTX in FS-PM.
Zelfstandige HTML-bestanden, geen build-stap. Startpagina: `index.html`.

## Modules
- `index.html` — cursusoverzicht met voortgang
- `sap-module-0-overzicht.html` … `sap-module-6-ba-werkstroom.html` — fundamenten
- `sap-fs-pm-btx-module.html` — capstone (BTX in FS-PM)

## Deploy
Docker/nginx (zie `Dockerfile`). Coolify serveert dit op **leren.eductus.nl**
via de Cloudflare-tunnel naar Beelink 1. Los van de bestaande app op `eductus.nl`.
