---
name: tdd-merge
description: Fase 6 del TDD Workflow. Verifica que la CI haya pasado y fusiona el Pull Request.
---

# TDD Workflow: Fase 6 (Verificación y Merge)

Esta es la nueva fase final del ciclo TDD. Se encarga de validar que las GitHub Actions (tests) hayan pasado correctamente en el Pull Request recién creado y de fusionarlo en la rama principal.

## Instrucciones
1. **Comprobar CI:** Usa tu herramienta del MCP de GitHub (por ejemplo, obtener los detalles del PR o sus checks) para verificar que la integración continua (tests) ha pasado con éxito en la rama del Pull Request.
   - *Nota:* Si los tests tardan en ejecutarse, informa al usuario de que el PR está en proceso de validación. Puedes detenerte aquí y pedirle al usuario que vuelva a invocarte cuando los tests terminen, o si tienes herramientas de espera, usarlas.
2. **Merge del Pull Request:** Una vez confirmes que los checks están en verde (estado `success`), utiliza la herramienta del MCP de GitHub para fusionar el Pull Request (`github_merge_pull_request` o equivalente).
3. **Reporte:** Responde al usuario confirmando que el ciclo completo se ejecutó con éxito desde la creación de la Issue hasta el Merge en `main`. Crea o actualiza un artefacto `walkthrough.md` si estás en modo de planificación.
