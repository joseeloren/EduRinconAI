---
name: tdd-red
description: Fase 1 del TDD Workflow. Escribir tests que fallen antes de la implementación.
---

# TDD Workflow: Fase 1 (Roja)

Esta fase se centra en escribir las pruebas antes de escribir el código funcional.

## Instrucciones
1. Analiza cuidadosamente la especificación o el plan aprobado (`implementation_plan.md`).
2. Escribe **únicamente** las pruebas (tests unitarios/integración) que cubran la nueva especificación. **No toques el código de producción aún.**
3. Ejecuta la suite de pruebas usando el comando adecuado del proyecto envuelto en Git Bash (ej: `& "C:\Program Files\Git\bin\bash.exe" -c "npx vitest run"`). RECUERDA: Como tu `run_command` usa PowerShell por defecto y está prohibido por las reglas, **DEBES** forzar la ejecución en Git Bash prefijando el comando con el binario explícito y el operador de llamada `&`.
4. **Validación:** Comprueba en los logs que el test **FALLA** (estado Rojo). Si el test pasa sin hacer nada, el test está mal diseñado; debes arreglarlo. Si hay errores de sintaxis en el test, corrígelos.
5. **Transición:** Una vez los tests fallen de manera legítima, invoca y ejecuta la skill **`tdd-green`**.
