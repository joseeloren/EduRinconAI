---
name: tdd-green
description: Fase 2 del TDD Workflow. Escribir la implementación mínima para pasar los tests.
---

# TDD Workflow: Fase 2 (Verde)

Esta fase se centra en escribir el código de producción estrictamente necesario para pasar las pruebas.

## Instrucciones
1. Escribe el código de producción **mínimo y necesario** exclusivamente para hacer que el test de la fase anterior pase. No añadas lógica extra "por si acaso" que no esté cubierta por el test.
2. Ejecuta la suite de pruebas nuevamente envolviendo el comando en Git Bash (ej: `& "C:\Program Files\Git\bin\bash.exe" -c "npx vitest run"`). RECUERDA: no uses comandos directos en tu herramienta `run_command` ya que lanza PowerShell. Debes usar la ruta completa a Git Bash.
3. **Validación:** Comprueba en los logs que los tests ahora **PASAN** (estado Verde). Si los tests siguen fallando, itera en tu implementación hasta que todos pasen.
4. **Transición:** Una vez los tests pasen en verde, invoca y ejecuta la skill **`tdd-refactor`**.
