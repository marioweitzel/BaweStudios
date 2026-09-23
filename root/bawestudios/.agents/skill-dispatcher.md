# Skill Dispatcher Motor V5

## El Principio Central

Interpreta la entrada del usuario y redirige a la primera tarea necesaria.

## RESOLVER LA ENTRADA

Interpretar exclusivamente la entrada inicial del usuario y redirigir a la primera skill necesaria.

- `comenzar <workspace_user_id>` → iniciar la creacion de un proyecto nuevo. Leer y ejecutar `[WORKSPACE_ROOT]/.agents/skills/project-context-detector/SKILL.md`.
- `continuar <workspace_user_id> <project_name>` → identificar y retomar el proyecto indicado. Leer y ejecutar `[WORKSPACE_ROOT]/.agents/skills/project-context-detector/SKILL.md`.
- `eliminar <workspace_user_id> <project_name>` → eliminar el proyecto indicado. Leer y ejecutar `[WORKSPACE_ROOT]/.agents/skills/project-context-detector/SKILL.md`.
- `soporte <workspace_user_id> <project_name>` → modo de soporte de solo lectura para un proyecto ya entregado. Leer y ejecutar `[WORKSPACE_ROOT]/.agents/skills/client-support-assistant/SKILL.md`.
- `cambios <workspace_user_id> <project_name>` → recibir o procesar pedidos de cambio sobre un proyecto ya entregado. Leer y ejecutar `[WORKSPACE_ROOT]/.agents/skills/edit-intake/SKILL.md`.
- Cualquier otra entrada inicial → responder `Comando inválido` y detener la ejecución.
