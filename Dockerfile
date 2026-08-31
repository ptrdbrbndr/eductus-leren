# Statische Eductus-site — nginx serveert twee vhosts uit één image:
# cursus.eductus.nl (oude documentstijl, alle bestaande cursussen) en
# leren.eductus.nl (nieuwe hub + cursussen in de sap-fundamenten-vormgeving).
# Zie nginx.conf voor de server_name-routering.
FROM nginx:alpine

# htpasswd-tool voor Basic Auth (wachtwoord komt uit env vars, nooit uit deze image/repo)
RUN apk add --no-cache apache2-utils

# Eigen configuratie (caching, security headers, SPA-vrij: gewone statische bestanden)
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
COPY generate-admin.sh /generate-admin.sh
RUN chmod +x /docker-entrypoint.sh /generate-admin.sh

# ---- cursus.eductus.nl — oude vormgeving, ongewijzigd per cursus -----------
COPY index.html /usr/share/nginx/html/cursus/
COPY sap-*.html /usr/share/nginx/html/cursus/
COPY courses.json /usr/share/nginx/html/cursus/
COPY whoami /usr/share/nginx/html/cursus/
COPY domain-driven-design/ /usr/share/nginx/html/cursus/domain-driven-design/
COPY enterprise-integration-patterns/ /usr/share/nginx/html/cursus/enterprise-integration-patterns/
COPY sap-voor-business-analysts/ /usr/share/nginx/html/cursus/sap-voor-business-analysts/
COPY businessanalyse/ /usr/share/nginx/html/cursus/businessanalyse/
COPY testen-en-kwaliteitsborging/ /usr/share/nginx/html/cursus/testen-en-kwaliteitsborging/
COPY informatiebeveiliging/ /usr/share/nginx/html/cursus/informatiebeveiliging/
COPY requirementsmanagement/ /usr/share/nginx/html/cursus/requirementsmanagement/
COPY risicomanagement/ /usr/share/nginx/html/cursus/risicomanagement/
COPY outsystems/ /usr/share/nginx/html/cursus/outsystems/
COPY databasemanagement/ /usr/share/nginx/html/cursus/databasemanagement/
COPY project-en-programmamanagement/ /usr/share/nginx/html/cursus/project-en-programmamanagement/
COPY pensioenverzekeringen/ /usr/share/nginx/html/cursus/pensioenverzekeringen/
COPY enterprise-architectuur/ /usr/share/nginx/html/cursus/enterprise-architectuur/
COPY btabok/ /usr/share/nginx/html/cursus/btabok/
COPY datamanagement/ /usr/share/nginx/html/cursus/datamanagement/
COPY bpmn-cmmn-dmn/ /usr/share/nginx/html/cursus/bpmn-cmmn-dmn/
COPY software-architectuur/ /usr/share/nginx/html/cursus/software-architectuur/

# ---- leren.eductus.nl — nieuwe hub + cursussen in de nieuwe vormgeving -----
# Eén COPY: nieuwe cursussen/pagina's zijn een submap onder leren-hub/, geen
# aparte Dockerfile-regel per cursus nodig zoals bij cursus/ hierboven.
COPY leren-hub/ /usr/share/nginx/html/leren/

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
