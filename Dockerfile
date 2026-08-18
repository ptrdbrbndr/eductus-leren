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
COPY informatiebeveiliging/ /usr/share/nginx/html/informatiebeveiliging/
COPY requirementsmanagement/ /usr/share/nginx/html/requirementsmanagement/
COPY risicomanagement/ /usr/share/nginx/html/risicomanagement/
COPY outsystems/ /usr/share/nginx/html/outsystems/
COPY databasemanagement/ /usr/share/nginx/html/databasemanagement/
COPY project-en-programmamanagement/ /usr/share/nginx/html/project-en-programmamanagement/
COPY pensioenverzekeringen/ /usr/share/nginx/html/pensioenverzekeringen/
COPY enterprise-architectuur/ /usr/share/nginx/html/enterprise-architectuur/
COPY btabok/ /usr/share/nginx/html/btabok/
COPY datamanagement/ /usr/share/nginx/html/datamanagement/
COPY bpmn-cmmn-dmn/ /usr/share/nginx/html/bpmn-cmmn-dmn/
COPY software-architectuur/ /usr/share/nginx/html/software-architectuur/

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
