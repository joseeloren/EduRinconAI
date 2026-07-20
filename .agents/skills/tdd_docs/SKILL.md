---
name: tdd-docs
description: Fase 4 del TDD Workflow. Genera o actualiza la documentación del proyecto con la nueva funcionalidad.
---

# TDD Workflow: Fase 4 (Documentación)

Esta fase se centra en mantener la documentación técnica y de usuario actualizada antes de integrar el código.

## Instrucciones
1. Analiza la funcionalidad que acabas de implementar con éxito (las fases Roja, Verde y de Refactorización ya han concluido).
2. Determina el lugar apropiado para documentar la funcionalidad. Puedes crear un nuevo archivo `.md` en la carpeta `docs/` o actualizar uno existente, usando la herramienta adecuada (`write_to_file` o edición de archivos).
3. **Contenido:** El archivo de documentación debe incluir:
   - Título de la funcionalidad.
   - Descripción breve de lo que hace y para qué sirve.
   - Detalles técnicos relevantes o cómo invocarla/usarla (ej. esquemas de base de datos añadidos, funciones creadas).
4. **Validación:** Asegúrate de que el documento `.md` ha sido guardado correctamente.
5. **Transición:** Una vez la documentación esté lista y guardada en el disco, invoca y ejecuta la skill final **`tdd-integration`**.
