# Instrucciones Copilot (MCP Playwright) ✅

**Objetivo:** Después de cada cambio de código, validar el cambio con el agente de pruebas MCP usando Playwright para detectar regresiones o problemas en la UI.

## Flujo recomendado

1. Levantar la app en modo desarrollo:

```bash
npm run dev
```

> Asegúrate de que el servidor dev esté accesible en la URL/puerto que usarán las pruebas (por defecto Astro suele servir en http://localhost:3000).

2. Ejecutar las pruebas E2E con Playwright (MCP):

```bash
# Ejemplo (si Playwright está instalado en el proyecto):
npx playwright test

# Para depuración en modo visible:
npx playwright test --headed
```

> Si el repositorio define un script específico para las pruebas E2E (por ejemplo `npm run test:e2e`), usa ese script en su lugar.

## Buenas prácticas

- Ejecuta `npm run dev` antes de lanzar las pruebas para que la suite tenga el backend disponible.
- Si las pruebas fallan, reproduce localmente, corrige y vuelve a ejecutar las pruebas antes de abrir el PR o subir los cambios.
- Mantén los tests E2E pequeños y enfocados: cada prueba debe verificar únicamente el comportamiento añadido o modificado.

Si necesitas que añada un `script` en `package.json` para facilitar la ejecución (por ejemplo `test:e2e` o `pw:test`), puedo añadirlo y documentarlo aquí.