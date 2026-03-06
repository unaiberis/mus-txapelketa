Playwright visual tests (MCP / Playwright)

Purpose
- Basic visual smoke tests to capture screenshots of key pages: homepage and the bracket viewer.

Running
- Preferred: Use the project's configured MCP Playwright test runner (microsoft/playwright-mcp) as described in your MCP environment.
- Local fallback (if Playwright is installed locally):

```bash
# set BASE_URL if your dev server runs on a different port
BASE_URL=http://localhost:4321 npx playwright test tests/mcp/playwright-visual.spec.ts
```

Notes
- Tests save screenshots to `tests/mcp/screenshots/` for visual inspection.
- In CI or MCP agents, ensure the app is reachable at `BASE_URL` before running the tests.
