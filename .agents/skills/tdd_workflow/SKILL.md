---
name: tdd-workflow
description: Orquestador principal del ciclo de Test-Driven Development (Red-Green-Refactor). Coordina las sub-skills de TDD en orden.
---

# TDD Workflow (Orquestador)

Esta skill es el punto de entrada para aplicar el ciclo TDD. Ya no contiene las instrucciones de las fases directamente, sino que delega en una cadena de sub-skills especializadas.

## Instrucciones de Orquestación

Cuando el usuario te pida ejecutar `tdd-workflow` o realizar TDD para una especificación, debes iniciar el proceso invocando mentalmente y ejecutando la skill apropiada para empezar, y asegurarte de seguir la cadena hasta el final.

### Flujo de Ejecución:
1. **Decisión Inicial:** 
   - Si la petición es **compleja o ambigua** (ej. requiere nuevas tablas de base de datos, arquitectura incierta), inicia la cadena ejecutando la skill **`tdd-plan`**.
   - Si la petición es **sencilla y clara** (ej. una función matemática, validación de un string), puedes saltarte la planificación e iniciar la cadena directamente ejecutando la skill **`tdd-red`**.
2. **Cadena de Transición:** A partir del punto de inicio, asegúrate de que cada skill invoque secuencialmente a la siguiente: 
   - `tdd-plan` -> `tdd-red`
   - `tdd-red` -> `tdd-green`
   - `tdd-green` -> `tdd-refactor`
   - `tdd-refactor` -> `tdd-docs`
   - `tdd-docs` -> `tdd-integration`
   - `tdd-integration` -> `tdd-merge`

¡No te detengas hasta llegar al reporte final de `tdd-merge`, a menos que se requiera la intervención explícita del usuario (ej. para aprobar el plan en `tdd-plan`, o esperar a que acabe la CI)!
