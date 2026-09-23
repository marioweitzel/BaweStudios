# Bridges de huésped — BaweStudio (variante Linux)

Procesos Node standalone que corren en el host, **fuera de Docker**, porque
el backend de BaweStudio corre en un contenedor y no tiene acceso directo al
filesystem/PATH del host. Cada bridge expone HTTP y ejecuta el CLI de un
huésped concreto (Codex, Claude, etc.); `host-detect.js` es la excepción —
no ejecuta ningún CLI, solo informa cuáles están instalados.

Ver también:
- `backend/src/host-runtimes/README.md` — límite entre orquestación de
  BaweStudio y ejecución específica de cada huésped.
- `backup-pre_mejora_bridge/REVERSION.md` — historial de cómo se agregó el
  bridge de Claude en paralelo al de Codex, y cómo revertirlo.

## Tabla de puertos (fuente de verdad)

Cualquier puerto usado por un bridge o por el detector debe estar acá.
Si vas a agregar un huésped nuevo, reservá su puerto en esta tabla antes de
escribir código.

| Puerto | Servicio | Archivo | Estado |
|---|---|---|---|
| 5000 | codex-bridge | `bridge/src/codex-bridge.js` | activo |
| 5001 | claude-bridge | `bridge/src/claude-bridge.js` | activo |
| 5002 | opencode-bridge | `bridge/src/opencode-bridge.js` | activo |
| 5003 | gemini-bridge | — | futuro, no implementado |
| 5004 | otro-bridge | — | futuro, no implementado |
| 5010 | host-detect | `bridge/src/host-detect.js` | activo |

`host-detect.js` está deliberadamente fuera del rango 5000-5004 de los
bridges: es un puerto de control (informa qué hay instalado), no un bridge
de ejecución, y así nunca colisiona cuando se agregue un 5to o 6to huésped
al bloque de bridges.

Desde dentro de un contenedor Docker, estos puertos se acceden como
`http://host.docker.internal:<puerto>` — nunca `localhost` (eso apunta al
propio contenedor, no al host). En Docker Engine nativo de Linux esto
requiere `extra_hosts: - "host.docker.internal:host-gateway"` en el compose
(no es automático como en Docker Desktop).

## Qué hace cada proceso

### `codex-bridge.js` (puerto 5000)

Ejecuta el CLI de Codex (`codex exec --json ...`). Mantiene sesión por
`threadId` (`exec resume <threadId> <mensaje>`). Contrato HTTP:
`GET /health`, `GET /codex/status?sessionId=`, `POST /codex`, `POST /stop`.

### `claude-bridge.js` (puerto 5001)

Hermano paralelo de `codex-bridge.js`, mismo contrato HTTP
(`GET /health`, `GET /claude/status?sessionId=`, `POST /claude`,
`POST /stop`), pero ejecuta Claude Code (`claude -p <mensaje>
--output-format json [--resume <sessionId>]`). Resuelve `claude` por PATH
(`spawn` con `shell:false` funciona sin problema en Linux) y chequea que
esté instalado con `which claude` antes de abrir su puerto.

### `opencode-bridge.js` (puerto 5002)

Hermano paralelo de `codex-bridge.js`/`claude-bridge.js`, mismo contrato
HTTP (`GET /health`, `GET /opencode/status?sessionId=`, `POST /opencode`,
`POST /stop`), pero ejecuta OpenCode (`opencode run <mensaje> --format json
--auto [--session <sessionId>]`). A diferencia de los otros dos, `--format
json` no imprime un JSON único al final — imprime un evento por línea
(NDJSON: `step_start`, `tool_use`, `text`, `step_finish`, `error`); el
bridge junta el texto de los eventos `text` y trata cualquier `error` como
fallo. Resuelve `opencode` por PATH, mismo mecanismo que `claude`. Probado
con el modelo gratuito por defecto de
OpenCode Zen (`opencode/big-pickle`, sin login ni tarjeta) — para otro
modelo/provider hace falta autenticar con `opencode providers login` antes
de levantar el bridge.

### `host-detect.js` (puerto 5010)

No ejecuta ningún CLI para atender requests — solo informa qué hay
instalado en este host. `GET /health`, `GET /detect` →
`{ runtimes: { codex: {...}, claude: {...} } }` con `installed`, `version`
(ejecutando `<cli> --version` una vez y cacheando el resultado en memoria)
y `bridgeUrl`. **No lo consulta nadie en el flujo real hoy** — el modo
`HOST_ADAPTER=auto` (`backend/src/host-runtimes/HostRuntimeDetector.ts`)
resuelve pegándole directo a `/health` de cada bridge, no a `/detect` de
este proceso. Queda igual disponible como servicio de diagnóstico manual.

## Cómo levantarlos (Linux, fuera de Docker)

Cada uno es un proceso Node independiente — se autoubica solo (usa su
propio `__dirname` para calcular `root/bawestudios` si no se le pasa un cwd
explícito), así que alcanza con setear el puerto y correrlo:

```bash
CODEX_BRIDGE_PORT=5000 node bridge/src/codex-bridge.js &
CLAUDE_BRIDGE_PORT=5001 node bridge/src/claude-bridge.js &
OPENCODE_BRIDGE_PORT=5002 node bridge/src/opencode-bridge.js &
HOST_DETECT_PORT=5010 node bridge/src/host-detect.js &
```

Ninguno depende de que los otros estén arriba.

## Como servicio systemd (recomendado en un servidor)

Unidades ya escritas en `bridge/systemd/` (una por bridge + host-detect).
Corren como `User=ubuntu`, **no root** — Claude Code se niega a correr con
`--dangerously-skip-permissions` si el proceso es root/sudo (confirmado en
vivo, ver `docs/instalador-vm-diseno-linux.md`). Por eso también asumen el
repo clonado en `/home/ubuntu/BaweStudiosLinux` (no `/root/...` — ese
directorio es `700`, `ubuntu` ni puede entrar). Si termina en otra ruta, hay
que editar `User`/`WorkingDirectory`/`ExecStart` de cada `.service` antes de
instalarlo (queda pendiente automatizar esto en un instalador real).

```bash
cp bridge/systemd/*.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now bawestudio-codex-bridge bawestudio-claude-bridge bawestudio-opencode-bridge bawestudio-host-detect
```

Logs de cada proceso: `journalctl -u bawestudio-claude-bridge -f` (etc.) —
aparte del log estructurado propio que cada bridge ya escribe en
`logs/<nombre>-bridge.log` vía `writeBridgeLog`.

`Restart=on-failure` los revive solos si mueren; sobreviven a un reinicio
del servidor porque están `enable`d (`WantedBy=multi-user.target`).
