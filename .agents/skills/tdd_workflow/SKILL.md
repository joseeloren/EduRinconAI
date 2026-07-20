---
name: tdd-workflow
description: Ejecuta un ciclo completo de Test-Driven Development (Red-Green-Refactor) a partir de una especificación, finalizando con commit y push.
---

# TDD Workflow (Red-Green-Refactor)

Cuando el usuario te pida aplicar esta skill, hacer "TDD", o implementar una funcionalidad con este flujo, debes seguir **ESTRICTAMENTE** y en orden las siguientes fases, sin saltarte ningún paso ni realizar implementaciones prematuras:

## 0. Fase de Planificación (Plan - Sólo para tareas complejas o ambiguas)
1. Si la especificación es ambigua o requiere cambios grandes (ej. diseño de base de datos, arquitectura), debes usar tu **Planning Mode** ANTES de escribir tests.
2. Investiga la base de código.
3. Crea un archivo `implementation_plan.md` con tus preguntas abiertas para el usuario y el diseño propuesto.
4. Pide la aprobación del usuario antes de pasar a la Fase Roja.

## 1. Fase Roja (Red - Escribir el Test)
1. Analiza cuidadosamente la especificación o el plan aprobado.
2. Escribe **únicamente** las pruebas (tests unitarios/integración) que cubran la nueva especificación. **No toques el código de producción aún.**
3. Ejecuta la suite de pruebas usando el comando adecuado del proyecto (ej: `npm test`, `npx jest`, etc.).
4. **Validación:** Comprueba en los logs que el test **FALLA** (estado Rojo). Si el test pasa sin hacer nada, el test está mal diseñado; debes arreglarlo. Si hay errores de sintaxis en el test, corrígelos.

## 2. Fase Verde (Green - Escribir la Implementación)
1. Escribe el código de producción **mínimo y necesario** exclusivamente para hacer que el test anterior pase. No añadas lógica extra "por si acaso" que no esté cubierta por el test.
2. Ejecuta la suite de pruebas nuevamente.
3. **Validación:** Comprueba en los logs que los tests ahora **PASAN** (estado Verde). Si los tests siguen fallando, itera en tu implementación hasta que todos pasen.

## 3. Fase de Refactorización (Refactor)
1. Revisa el código que acabas de escribir (tanto pruebas como implementación). 
2. Limpia el código: elimina redundancias, mejora nombres de variables, abstrae funciones complejas y mejora la legibilidad aplicando buenas prácticas.
3. Ejecuta la suite de pruebas otra vez.
4. **Validación:** Asegúrate de que los tests **SIGUEN PASANDO** en Verde. Si algo se rompe, revierte el refactor o arréglalo antes de continuar.

## 4. Fase de Integración (Commit & Push)
1. Ejecuta `git status` y `git diff` para revisar los cambios.
2. Añade los cambios relevantes con `git add`.
3. Haz un commit con un mensaje convencional y descriptivo (ej: `feat: add [feature] using TDD`).
4. Sube los cambios al repositorio remoto ejecutando `git push`.

## 5. Reporte al Usuario
1. Responde al usuario confirmando que el ciclo se completó exitosamente.
2. Proporciona un breve resumen de los archivos modificados y el mensaje del commit realizado.
