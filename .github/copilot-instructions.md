# Instrucciones Copilot (MCP Playwright) ✅

**Objetivo:** Después de cada cambio de código, validar el cambio con el agente de pruebas MCP usando Playwright para detectar regresiones o problemas en la UI.

## Flujo recomendado

1. Levantar la app en modo desarrollo:

```bash
npm run dev
```

> Asegúrate de que el servidor dev esté accesible en la URL/puerto que usarán las pruebas (por defecto Astro suele servir en http://localhost:3000).

2. Ejecutar las pruebas E2E usando únicamente el *agente* MCP Playwright:

> **Importante:** No ejecutar pruebas locales con `npx playwright test` ni crear tests E2E locales en este repositorio. Todas las verificaciones E2E deben realizarse mediante el agente MCP Playwright (MCP), que ejecutará Playwright de forma controlada en el entorno de pruebas.

Si necesitas que el repositorio incluya artefactos de prueba o ejemplos para el agente (por ejemplo fragmentos de Playwright o `playwright.config.*`), podemos añadirlos como referencia, pero no se deben ejecutar localmente en CI o por desarrolladores con `npx playwright test`.

> Nota: este repositorio incluye pruebas de ejemplo destinadas únicamente al agente MCP Playwright (ubicadas en `tests/mcp/`). **No** ejecutes estas pruebas localmente; deben ser ejecutadas por MCP en el entorno de pruebas controlado.

## Buenas prácticas

- Ejecuta `npm run dev` antes de lanzar las pruebas para que la suite tenga el backend disponible.
- Si las pruebas fallan, reproduce localmente, corrige y vuelve a ejecutar las pruebas antes de abrir el PR o subir los cambios.
- Mantén los tests E2E pequeños y enfocados: cada prueba debe verificar únicamente el comportamiento añadido o modificado.

Si necesitas que añada un `script` en `package.json` para facilitar la ejecución (por ejemplo `test:e2e` o `pw:test`), puedo añadirlo y documentarlo aquí.