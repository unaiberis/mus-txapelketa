Instrucciones Copilot (MCP + Playwright) ✅
Objetivo

Después de cada cambio de código, validar la funcionalidad y la UI utilizando el agente de pruebas MCP basado en microsoft/playwright-mcp, con el fin de detectar regresiones o comportamientos inesperados.

Flujo recomendado
1. Levantar la aplicación en modo desarrollo

Si la aplicación ya está corriendo en el puerto 4321, úsala (localhost:4321/mus-txapelketa).

Comandos de ejemplo:

- PowerShell (Windows):

  if (Get-NetTCPConnection -LocalPort 4321 -ErrorAction SilentlyContinue) { Write-Host "Usando http://localhost:4321" } else { npm run dev }

- macOS/Linux:

  if lsof -i :4321 >/dev/null 2>&1; then echo "Usando localhost:4321/mus-txapelketa"; else npm run dev; fi


Asegúrate de que la aplicación esté accesible y funcionando correctamente antes de continuar.

2. Ejecutar el agente de pruebas MCP (Playwright)

Utiliza exclusivamente el agente MCP oficial basado en microsoft/playwright-mcp para ejecutar las pruebas automatizadas de UI.

⚠️ Importante:

No ejecutes el agente usando npx mcp-playwright.

No instales ni invoques variantes no oficiales.

El agente correcto ya está disponible como playwright dentro del entorno MCP y corresponde a microsoft/playwright-mcp.

Debe usarse directamente a través del MCP configurado.

Buenas prácticas

Ejecuta las pruebas después de cada cambio relevante en el código.

Presta especial atención a:

Flujos críticos de usuario

Cambios visuales inesperados

Errores de consola o fallos intermitentes

Si una prueba falla, corrige el problema antes de continuar con nuevos cambios.