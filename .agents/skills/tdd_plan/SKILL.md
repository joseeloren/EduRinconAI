---
name: tdd-plan
description: Fase 0 del TDD Workflow. Se encarga de la planificación y aclaración de requisitos antes de escribir código.
---

# TDD Workflow: Fase 0 (Planificación)

Esta es la primera fase del ciclo TDD para tareas complejas o ambiguas.

## Instrucciones
1. Si la especificación es ambigua o requiere cambios grandes (ej. diseño de base de datos, arquitectura), debes usar tu **Planning Mode** ANTES de escribir tests.
2. Investiga la base de código.
3. Crea un archivo `implementation_plan.md` con tus preguntas abiertas para el usuario y el diseño propuesto.
4. Pide la aprobación explícita del usuario.
5. **Creación de Issue:** Una vez aprobado el plan, usa tu herramienta del servidor MCP de GitHub (ej. `github_create_issue`) para crear una Issue en el repositorio detallando la funcionalidad que vas a implementar.
6. **Creación de Rama:** Basándote en el ID de la Issue generada, crea una nueva rama usando el entorno forzado de Bash: `& "C:\Program Files\Git\bin\bash.exe" -c "git checkout -b feat/issue-<ID>-<nombre>"`.
7. **Transición:** Una vez estés en la nueva rama, invoca mentalmente y ejecuta la skill **`tdd-red`**.
