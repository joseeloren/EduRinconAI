---
name: tdd-integration
description: Fase 5 del TDD Workflow. Commit y Push de los cambios.
---

# TDD Workflow: Fase 5 (Integración)

Esta es la última fase del ciclo TDD. Integra los cambios al repositorio y genera el reporte.

## Instrucciones
1. **REGLA CRÍTICA:** Por reglas del proyecto, no puedes usar PowerShell. Como tu herramienta `run_command` en Windows arranca PowerShell por defecto, **DEBES** envolver todos los comandos usando explícitamente el ejecutable de Git Bash (ej. `& "C:\Program Files\Git\bin\bash.exe" -c "git status"`).
2. Ejecuta `& "C:\Program Files\Git\bin\bash.exe" -c "git status"` y `& "C:\Program Files\Git\bin\bash.exe" -c "git diff"` para revisar los cambios.
3. **Commits Atómicos:** Separa lógicamente los cambios en la medida de lo posible si has tocado cosas no relacionadas. Añade los cambios relevantes agrupados con `& "C:\Program Files\Git\bin\bash.exe" -c "git add <archivos>"`.
4. **Mensajes de Commit Convencionales:** Haz el commit usando un esquema formal en mayúsculas (ej: `FEAT: <descripción>`, `FIX: <descripción>`, `DOCS: <descripción>`, `TEST: <descripción>`, `REFACTOR: <descripción>`).
   - Comando: `& "C:\Program Files\Git\bin\bash.exe" -c "git commit -m 'FEAT: añade [feature] (Closes #<IssueID>)'"`.
5. **Subida de la Rama:** Sube la rama actual al repositorio remoto: `& "C:\Program Files\Git\bin\bash.exe" -c "git push -u origin <nombre_de_la_rama>"`.
6. **Creación del Pull Request:** Utiliza la herramienta del MCP de GitHub (ej. `github_create_pull_request`) para abrir un PR de tu rama hacia `main`. Asegúrate de enlazar la issue en la descripción (ej: `Resolves #<IssueID>`).
7. **Transición:** Una vez creado el PR, invoca y ejecuta la skill **`tdd-merge`**.
