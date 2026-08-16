# Statische Eductus SAP-leerreeks — nginx serveert de HTML-modules
FROM nginx:alpine

# Eigen configuratie (caching, security headers, SPA-vrij: gewone statische bestanden)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Alle site-bestanden
COPY index.html /usr/share/nginx/html/
COPY sap-*.html /usr/share/nginx/html/
COPY courses.json /usr/share/nginx/html/

EXPOSE 80
