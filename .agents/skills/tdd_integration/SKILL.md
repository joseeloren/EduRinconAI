---
name: tdd-integration
description: Fase 5 del TDD Workflow. Commit y Push de los cambios.
---

# TDD Workflow: Fase 5 (Integración)

Esta es la última fase del ciclo TDD. Integra los cambios al repositorio y genera el reporte.

## Instrucciones
1. **REGLA CRÍTICA:** Por reglas del proyecto, no puedes usar PowerShell. Como tu herramienta `run_command` en Windows arranca PowerShell por defecto, **DEBES** envolver todos los comandos usando explícitamente el ejecutable de Git Bash (ej. `& "C:\Program Files\Git\bin\bash.exe" -c "git status"`).
2. Ejecuta `& "C:\Program Files\Git\bin\bash.exe" -c "git status"` y `& "C:\Program Files\Git\bin\bash.exe" -c "git diff"` para revisar los cambios.
3. Añade los cambios relevantes con `& "C:\Program Files\Git\bin\bash.exe" -c "git add <archivos>"`.
4. Haz un commit con `& "C:\Program Files\Git\bin\bash.exe" -c "git commit -m 'feat: add [feature] using TDD'"`.
5. Sube los cambios con `& "C:\Program Files\Git\bin\bash.exe" -c "git push"`.
   - *Nota: Si `git push` se queda colgado pidiendo contraseña por no tener llaves SSH configuradas, aborta el push y avisa al usuario.*
6. **Reporte:** Responde al usuario confirmando que el ciclo se completó exitosamente y crea un artefacto de tipo `walkthrough.md` si estás en el modo de planificación. Proporciona un breve resumen de los archivos modificados y el mensaje del commit realizado.
