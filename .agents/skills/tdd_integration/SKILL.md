---
name: tdd-integration
description: Fase 4 del TDD Workflow. Commit y Push de los cambios.
---

# TDD Workflow: Fase 4 (Integración)

Esta es la última fase del ciclo TDD. Integra los cambios al repositorio y genera el reporte.

## Instrucciones
1. **REGLA CRÍTICA:** Debes usar Git Bash o ejecutar los comandos estrictamente de manera secuencial sin usar `&&` (ya que Windows PowerShell falla).
2. Ejecuta `git status` y `git diff` para revisar los cambios.
3. Añade los cambios relevantes con `git add <archivos>`.
4. Haz un commit con un mensaje convencional y descriptivo (ej: `feat: add [feature] using TDD`).
5. Sube los cambios al repositorio remoto ejecutando `git push`.
   - *Nota: Si `git push` se queda colgado pidiendo contraseña por no tener llaves SSH configuradas, aborta el push y avisa al usuario.*
6. **Reporte:** Responde al usuario confirmando que el ciclo se completó exitosamente y crea un artefacto de tipo `walkthrough.md` si estás en el modo de planificación. Proporciona un breve resumen de los archivos modificados y el mensaje del commit realizado.
