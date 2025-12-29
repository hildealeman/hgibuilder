
# Handoff para Windsurf AI

Este documento guía a la IA (Windsurf/Cursor) para continuar el desarrollo del proyecto.

## Estado Actual
*   **Stack:** React 19, Vite, Tailwind, IndexedDB.
*   **Backend:** Vercel Serverless Functions (`/api`).
*   **Seguridad:** API Keys ocultas en backend. Sandbox estricto.

## Checklist de Conexión
1.  **Leer Configuración:** Revisa `vite.config.ts` y `tsconfig.json` para entender los alias (`@/`).
2.  **Leer API:** Antes de modificar servicios frontend, revisa `docs/API_CONTRACT.md` para respetar los payloads del backend.
3.  **Variables:** Asegúrate de que el entorno tenga `.env` con `GEMINI_API_KEY` si vas a ejecutar tests de backend.

## Tareas Pendientes / Roadmap
1.  **Tests E2E:** Implementar Playwright para probar el flujo de generación -> preview.
2.  **Mejora de Editor:** Añadir autocompletado básico al `CodeEditor` (actualmente solo highlight).
3.  **Live API Proxy:** Investigar implementación de WebSocket Relay en un servicio externo (ej: Cloudflare Workers) para soportar Gemini Live sin exponer keys en el cliente (actualmente deshabilitado/limitado).

## Reglas de Edición
*   **NO** importar `@google/genai` en archivos dentro de `src/` (cliente). Úsalo solo en `api/`.
*   **NO** relajar el `sandbox` del iframe en `AppPreview.tsx`.
*   Mantén la UI oscura y el estilo "Cyberpunk/Industrial" definido en `index.html`.
