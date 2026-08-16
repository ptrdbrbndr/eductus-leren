# Statische Eductus SAP-leerreeks — nginx serveert de HTML-modules
FROM nginx:alpine

# htpasswd-tool voor Basic Auth (wachtwoord komt uit env vars, nooit uit deze image/repo)
RUN apk add --no-cache apache2-utils

# Eigen configuratie (caching, security headers, SPA-vrij: gewone statische bestanden)
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Alle site-bestanden
COPY index.html /usr/share/nginx/html/
COPY sap-*.html /usr/share/nginx/html/
COPY courses.json /usr/share/nginx/html/
COPY domain-driven-design/ /usr/share/nginx/html/domain-driven-design/
COPY enterprise-integration-patterns/ /usr/share/nginx/html/enterprise-integration-patterns/
COPY sap-voor-business-analysts/ /usr/share/nginx/html/sap-voor-business-analysts/
COPY businessanalyse/ /usr/share/nginx/html/businessanalyse/
COPY testen-en-kwaliteitsborging/ /usr/share/nginx/html/testen-en-kwaliteitsborging/

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
