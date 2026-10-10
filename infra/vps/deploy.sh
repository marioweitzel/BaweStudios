#!/usr/bin/env bash
# Despliegue de BaweStudio en la VPS en un solo paso (ver docs/Despliegue en la VPS.md, seccion 16).
# Se corre EN LA VPS, como el usuario dueño del repo (ubuntu):
#
#   cd /home/ubuntu/BaweStudiosLinux && bash infra/vps/deploy.sh
#
# Hace, en orden: git pull (solo avance rapido), reconstruye las imagenes, redespliega el stack,
# fuerza el reinicio de backend y frontend, actualiza las unidades de systemd de los bridges y
# los reinicia, y verifica el resultado. No borra datos, volumenes ni proyectos.
#
# Variables opcionales:
#   BRANCH=master        rama a desplegar
#   SKIP_PULL=1          no hace git pull (despliega lo que hay en disco)
#   SKIP_BRIDGES=1       no toca los bridges
set -euo pipefail

REPO_DIR="${REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
BRANCH="${BRANCH:-master}"
STACK="bawestudioslinux"
BRIDGES=(bawestudio-claude-bridge bawestudio-codex-bridge)
OTHER_UNITS=(bawestudio-host-detect bawestudio-docker-teardown-adapter)

step() { printf '\n== %s\n' "$1"; }
fail() { printf '\nERROR: %s\n' "$1" >&2; exit 1; }

cd "$REPO_DIR"
[ -f docker-compose-vps.yml ] || fail "no es la carpeta del repo: $REPO_DIR"
[ -f .env ] || fail "falta .env en $REPO_DIR (ver seccion 3 del documento de despliegue)"

step "1/6 Codigo"
if [ "${SKIP_PULL:-0}" = "1" ]; then
  echo "SKIP_PULL=1: se despliega lo que hay en disco"
else
  git fetch origin "$BRANCH"
  if ! git diff --quiet || ! git diff --cached --quiet; then
    fail "hay cambios locales sin commitear en la VPS; resolverlos antes (git status)"
  fi
  git pull --ff-only origin "$BRANCH"
fi
echo "commit desplegado: $(git rev-parse --short HEAD) - $(git log -1 --pretty=%s)"

step "2/6 Imagenes"
docker build -t bawestudioslinux-backend:latest ./backend
docker build -t bawestudioslinux-frontend:latest ./frontend

step "3/6 Stack"
set -a
# shellcheck disable=SC1091
. ./.env
set +a
docker stack deploy -c docker-compose-vps.yml "$STACK" --resolve-image never --detach=true
# Reconstruir con el mismo tag no reinicia el servicio: se fuerza.
docker service update --force --no-resolve-image "${STACK}_backend" --detach=true >/dev/null
docker service update --force --no-resolve-image "${STACK}_frontend" --detach=true >/dev/null

step "4/6 Bridges y servicios del host"
if [ "${SKIP_BRIDGES:-0}" = "1" ]; then
  echo "SKIP_BRIDGES=1: no se tocan"
else
  changed=0
  for unit in "${BRIDGES[@]}" "${OTHER_UNITS[@]}"; do
    src="bridge/systemd/${unit}.service"
    dst="/etc/systemd/system/${unit}.service"
    if [ -f "$src" ] && ! sudo cmp -s "$src" "$dst"; then
      sudo cp "$src" "$dst"
      changed=1
      echo "unidad actualizada: $unit"
    fi
  done
  [ "$changed" = "1" ] && sudo systemctl daemon-reload
  for unit in "${BRIDGES[@]}" "${OTHER_UNITS[@]}"; do
    sudo systemctl restart "$unit" || echo "AVISO: no se pudo reiniciar $unit"
  done
fi

step "5/6 Esperando a que los servicios queden listos"
ok=0
for _ in $(seq 1 30); do
  pending=$(docker service ls --filter "name=${STACK}_" --format '{{.Name}} {{.Replicas}}' | awk '{split($2,a,"/"); if (a[1]!=a[2]) print $1}')
  if [ -z "$pending" ]; then ok=1; break; fi
  sleep 5
done
[ "$ok" = "1" ] || { docker service ls; fail "algun servicio no llego a sus replicas (ver docker service ps)"; }

step "6/6 Verificacion"
docker service ls
if [ "${SKIP_BRIDGES:-0}" != "1" ]; then
  curl -fsS localhost:5001/health >/dev/null && echo "bridge Claude: ok" || echo "AVISO: bridge Claude no responde"
  curl -fsS localhost:5000/health >/dev/null && echo "bridge Codex: ok" || echo "AVISO: bridge Codex no responde"
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST localhost:5001/claude -d '{}' || true)
  [ "$code" = "401" ] && echo "bridge sin secreto: 401 (correcto)" || echo "AVISO: el bridge sin secreto devolvio $code (se esperaba 401)"
fi
docker service logs "${STACK}_backend" --tail 15 2>&1 | grep -q "MySQL store listo" && echo "backend: MySQL store listo" || echo "AVISO: no se vio 'MySQL store listo' en el log reciente"
printf '\nListo. Revisar https://bawestudio.com.ar y los eventos de P26 en docs/Pruebas pendientes en corridas.md\n'
