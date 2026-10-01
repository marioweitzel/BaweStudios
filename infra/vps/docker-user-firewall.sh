#!/bin/sh
# docker-user-firewall.sh -- bloquea desde internet cualquier puerto publicado
# por contenedores Docker, salvo 80 y 443 (Traefik).
#
# Por que existe: UFW filtra el trafico que llega al host (cadena INPUT), pero
# Docker publica los puertos de sus contenedores con reglas propias (NAT +
# FORWARD) que se evaluan antes y saltean a UFW. Verificado el 1/10/2026: con
# UFW activo, un contenedor con `0.0.0.0:10600->10600` respondia 200 desde
# internet. La cadena DOCKER-USER es el lugar que Docker deja para reglas del
# administrador: se evalua primero en FORWARD y Docker nunca la modifica.
#
# Que hace: sobre el trafico que entra por la interfaz de internet,
#   - deja pasar lo que ya es una conexion en curso (RELATED, ESTABLISHED);
#   - deja pasar conexiones nuevas cuyo puerto ORIGINAL de destino es 80 o 443
#     (se mira el puerto original porque Docker ya lo cambio por el del
#     contenedor al hacer DNAT);
#   - descarta cualquier otra conexion nueva.
# No toca el trafico entre contenedores, ni el de los contenedores hacia
# afuera, ni el SSH (que no pasa por FORWARD).
#
# Es idempotente: se puede correr varias veces. Se instala como unidad systemd
# (docker-user-firewall.service) para que se reaplique en cada arranque.
set -eu

CHAIN=DOCKER-USER
EXT_IF="${EXT_IF:-$(ip route get 1.1.1.1 | awk '{for (i = 1; i <= NF; i++) if ($i == "dev") { print $(i + 1); exit }}')}"

if [ -z "$EXT_IF" ]; then
  echo "docker-user-firewall: no pude determinar la interfaz de internet" >&2
  exit 1
fi

iptables -N "$CHAIN" 2>/dev/null || true
iptables -F "$CHAIN"
iptables -A "$CHAIN" -m conntrack --ctstate RELATED,ESTABLISHED -j RETURN
iptables -A "$CHAIN" -i "$EXT_IF" -p tcp -m conntrack --ctorigdstport 80 -j RETURN
iptables -A "$CHAIN" -i "$EXT_IF" -p tcp -m conntrack --ctorigdstport 443 -j RETURN
iptables -A "$CHAIN" -i "$EXT_IF" -m conntrack --ctstate NEW -j DROP
iptables -A "$CHAIN" -j RETURN

echo "docker-user-firewall: reglas aplicadas sobre $EXT_IF (solo 80 y 443 desde internet hacia contenedores)"
