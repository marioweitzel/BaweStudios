# nginx.conf Pattern — BaWe Frontend (v4.7)

## Propósito  
Template de nginx para servir el frontend estático como reverse proxy hacia el backend.
El AD usa este documento para generar `frontend/nginx.conf` durante `dockerfile-builder`.

Aplica igual a cualquier otro output servido como build web desde este motor —
por ejemplo un `mobile/`, que en este motor siempre es un build web (export de
Expo u otro), nunca una app nativa instalada fuera de una página web: generar
su `nginx.conf` con el mismo patrón, nunca dejarlo llamar al backend directo.

## Template base (adaptar `BACKEND_SERVICE` al nombre real del servicio en docker-compose)

```nginx
user nginx;
worker_processes auto;

error_log /var/log/nginx/error.log warn;
pid       /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include      /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent"';

    access_log /var/log/nginx/access.log main;

    sendfile       on;
    tcp_nopush     on;
    tcp_nodelay    on;
    keepalive_timeout 65;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript
               application/xml+rss font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;

    charset utf-8;

    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        # Security headers
        add_header X-Frame-Options      "SAMEORIGIN"            always;
        add_header X-Content-Type-Options "nosniff"             always;
        add_header X-XSS-Protection     "1; mode=block"         always;
        add_header Referrer-Policy      "no-referrer-when-downgrade" always;

        # DNS resolver de Docker (necesario para $backend_upstream variable)
        resolver 127.0.0.11 valid=10s;

        # API Proxy → backend
        location /api/ {
            set $backend_upstream [BACKEND_SERVICE_NAME]:[BACKEND_PORT];
            proxy_pass         http://$backend_upstream;
            proxy_http_version 1.1;
            proxy_set_header   Upgrade    $http_upgrade;
            proxy_set_header   Connection 'upgrade';
            proxy_set_header   Host       $host;
            proxy_set_header   X-Real-IP  $remote_addr;
            proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_cache_bypass $http_upgrade;
        }

        # Repetir este bloque para CADA otro prefijo backend-facing que use
        # el proyecto (ej. /uploads/, /media/) — no asumir que /api/ es el
        # unico. Revisar api-schema.json y las rutas de archivos declaradas
        # para identificarlos todos antes de dar el nginx.conf por completo.
        # location /uploads/ {
        #     set $backend_upstream [BACKEND_SERVICE_NAME]:[BACKEND_PORT];
        #     proxy_pass http://$backend_upstream;
        #     proxy_set_header Host $host;
        # }

        # Static files — SPA fallback
        location / {
            try_files $uri $uri/ /index.html;

            # HTML: no cache (app updates se ven inmediato)
            location ~* \.html$ {
                expires -1;
                add_header Cache-Control "no-store, no-cache, must-revalidate";
            }
        }

        # Assets con hash en nombre → cache largo
        location ~* \.(js|css)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        location ~* \.(woff|woff2|ttf|otf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header Access-Control-Allow-Origin "*";
        }

        # Deny dot files (hidden)
        location ~ /\. {
            deny all;
        }
    }
}
```

## Instrucciones de personalización

| Placeholder | Reemplazar con |
|---|---|
| `[BACKEND_SERVICE_NAME]` | Nombre del servicio backend en docker-compose (ej: `myapp_api`, `project_backend`) |
| `[BACKEND_PORT]` | Puerto interno del backend (ej: `3000`) |

Lee `docker-compose.yml` generado por `docker-compose-generator` para obtener el nombre real del servicio.

## React Router / Next.js SPA

El `try_files $uri $uri/ /index.html;` es **obligatorio** para SPAs — sin él, refrescar en una ruta como `/dashboard` da 404.

## Verificación antes de declarar completed

```
# Verificar que el resolver de Docker está presente:
grep -n "resolver 127.0.0.11" frontend/nginx.conf   → debe aparecer

# Verificar que el proxy está correctamente configurado:
grep -n "proxy_pass" frontend/nginx.conf            → debe apuntar al nombre de servicio, no a IP hardcodeada

# Verificar que TODOS los prefijos backend-facing del proyecto tienen su
# propio bloque de proxy, no solo /api/ (comparar contra api-schema.json y
# cualquier ruta de archivos/uploads declarada):
grep -n "location /" frontend/nginx.conf

# Verificar que el build no tiene una URL absoluta de backend horneada
# (bundle, .env de build, args de Dockerfile como *_API_BASE_URL) apuntando
# a un host distinto del propio origen — si aparece, el frontend/mobile está
# hablando directo al backend en vez de usar el proxy:
grep -rn "API_BASE_URL\|API_URL" frontend/ mobile/ 2>/dev/null
```
