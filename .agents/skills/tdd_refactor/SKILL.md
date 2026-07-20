---
name: tdd-refactor
description: Fase 3 del TDD Workflow. Limpieza y refactorización del código con las pruebas en verde.
---

# TDD Workflow: Fase 3 (Refactor)

Esta fase se centra en mejorar el código sin cambiar su comportamiento.

## Instrucciones
1. Revisa el código que acabas de escribir (tanto pruebas como implementación). 
2. Limpia el código: elimina redundancias, mejora nombres de variables, abstrae funciones complejas y mejora la legibilidad aplicando buenas prácticas.
3. Ejecuta la suite de pruebas otra vez envolviendo el comando en Git Bash (ej: `& "C:\Program Files\Git\bin\bash.exe" -c "npx vitest run"`).
4. **Validación:** Asegúrate de que los tests **SIGUEN PASANDO** en Verde. Si algo se rompe, revierte el refactor o arréglalo antes de continuar.
5. **Transición:** Cuando el código esté limpio y en verde, invoca y ejecuta la skill **`tdd-docs`**.
