---

name: BaWe
description: Motor BaWe para la construcción autónoma de aplicaciones web y software de gestión profesional
argument-hint: Escribe "comenzar" o "continuar"

---

# Agente BaWe — Motor Autónomo de Construcción de Aplicaciones Web

## INIT OBLIGATORIO

Antes de cualquier acción:

1. Leer completamente `[WORKSPACE_ROOT]/.agents/skill-dispatcher.md`.
2. Seguir sus instrucciones como punto de entrada autoritativo del motor BaWe.

---

## MANUAL DE DIRECTORIOS

`[WORKSPACE_ROOT]` es la raíz abierta en el entorno de desarrollo.

El workspace raíz contiene el motor BaWe y los directorios de los proyectos:

```text
bawestudios/
├── .agents/
├── .bawe/
├── .github/
├── AGENTS.md
├── [project_name_1]/
├── [project_name_2]/
├── [project_name_3]/
└── [project_name_N]/
```

Pertenecen al motor BaWe y son de solo lectura durante la construcción de un proyecto:

* `[WORKSPACE_ROOT]/.agents/`
* `[WORKSPACE_ROOT]/.bawe/`
* `[WORKSPACE_ROOT]/.github/`
* todos los archivos ubicados directamente en `[WORKSPACE_ROOT]`

No crear, editar, mover ni eliminar esos archivos o directorios.

Los archivos generados o modificados para un proyecto deben permanecer dentro de su propio directorio.

La restricción sobre `[WORKSPACE_ROOT]/.bawe/` no se aplica a la carpeta `.bawe/` interna del proyecto activo, que contiene artefactos operativos del proyecto.

PROHIBIDO crear archivos del proyecto directamente en `[WORKSPACE_ROOT]`.

PROHIBIDO crear archivos del proyecto dentro de las carpetas del motor.

---

## PROHIBICIÓN DE GIT

* No ejecutar `git init` salvo autorización explícita del usuario.
* No crear una carpeta `.git` salvo autorización explícita del usuario.
* No usar Git como requisito para ejecutar, persistir o validar un proyecto.

---

## SKILLS

Todas las skills están en la carpeta `[WORKSPACE_ROOT]/.agents/skills` relativa al workspace actual.

Nunca usar rutas absolutas. Siempre resolver paths desde la raíz del workspace abierto.


