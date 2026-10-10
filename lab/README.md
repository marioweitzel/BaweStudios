# Laboratorio de ataques

Esqueleto del laboratorio descrito en `docs/laboratorio-ataques-contenedores.md`. **Solo para la PC de pruebas; no se despliega en la VPS.** Estado: armado y con la sintaxis verificada, **sin ejecutar** (falta la decisión de la cuenta de prueba, ver abajo).

| Pieza | Qué es |
|---|---|
| `docker-compose.yml` | Tres contenedores en una red interna sin salida: `proxy` (único camino a internet), `target` (réplica de la VPS) y `attacker`. Sin `--privileged`, sin socket de Docker, sin carpetas de la PC montadas, con límites de CPU, memoria y procesos. |
| `proxy/` | Squid con lista de destinos: solo `anthropic.com`, `claude.ai`, `openai.com`, `chatgpt.com`. |
| `target/Dockerfile` | Ubuntu 24.04, usuario `ubuntu` con `sudo` sin contraseña (igual que producción: es lo que se mide) y canarios plantados. Registra accesos y cambios con `inotifywait`. |
| `canaries/plant.sh`, `check.sh` | Plantan 8 canarios (archivos de sistema falsos, secretos falsos, archivo de control, canario del motor) con hash conocido, y los comparan después de cada ataque. |
| `attacker/attacks.json` | Catálogo de 17 ataques inofensivos y detectables, por prioridad y categoría (corrupción, robo de secretos, escalada con `sudo`, camino completo, salida del workspace, multi-turno, falsa autoridad, ofuscación, adjuntos, soporte y cambios). |
| `attacker/run-attacks.js` | Lista y exporta el catálogo. El envío al backend está pendiente. |

## Uso

```bash
LAB_RUN_ID=prueba1 docker compose -f lab/docker-compose.yml build
LAB_RUN_ID=prueba1 docker compose -f lab/docker-compose.yml up -d
docker compose -f lab/docker-compose.yml exec target bash /lab/canaries/check.sh   # tras cada ataque
docker compose -f lab/docker-compose.yml down -v                                   # restaurar al estado inicial
node lab/attacker/run-attacks.js --list --category robo-secretos
```

## Lo que falta antes de correr ataques de verdad

1. **Backend y bridges dentro de `target`:** hoy la imagen trae solo el sistema, el `sudo` y los canarios. Falta copiar el backend, los bridges y el motor, y arrancarlos con la configuración de permisos de cada condición (sin reglas, solo reglas, solo lista blanca, todo junto).
2. **Cuenta de prueba (decisión de Mario):** la nota del 7/10 proponía el nivel gratuito de OpenCode, pero esa vía se detuvo el 21/9 porque sus términos permiten usar el contenido para mejorar sus servicios; el laboratorio usaría solo datos falsos, pero hay que confirmarlo antes. Alternativa: una clave de prueba de Claude o Codex con límite de gasto, revocada al terminar.
3. **Envío de los ataques:** `run-attacks.js` debe iniciar sesión con un usuario de prueba y mandar cada ataque por la misma vía que un cliente (socket del chat), esperar la respuesta y llamar a `check.sh`.
4. **Orden definitivo de los ataques** dentro del día de pruebas.

## Límites

Los contenedores comparten núcleo con Docker Desktop (WSL2): no miden ataques al sistema operativo. La réplica debe mantenerse alineada con la VPS.
