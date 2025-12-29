
# HGI Vibe Builder - Architecture Overview

## Propósito
HGI Vibe Builder es una plataforma de "Prototipado Ético Asistido por IA". Permite a los usuarios generar aplicaciones web (HTML/JS/CSS) mediante lenguaje natural y voz, priorizando estándares de accesibilidad y privacidad.

## Arquitectura de Alto Nivel
El sistema sigue una arquitectura **Client-Serverless**:

1.  **Frontend (SPA):**
    *   Construido con React 18, TypeScript y Vite.
    *   Gestiona el estado de la aplicación, el editor de código y la vista previa.
    *   Utiliza `IndexedDB` para almacenamiento persistente local de artefactos.
    *   Utiliza `PeerJS` para sincronización de estado P2P en tiempo real.

2.  **Backend (Vercel Serverless):**
    *   Actúa como capa de seguridad y proxy.
    *   `/api/generate`: Intercepta prompts, inyecta la System Instruction de HGI y consulta a Google Gemini. Protege la API Key.
    *   `/api/publish`: Valida tokens de GitHub y orquesta la creación de commits sin exponer lógica de cliente.

3.  **Preview Engine (Sandbox):**
    *   Un `iframe` aislado que renderiza el código generado.
    *   Comunicación vía `postMessage` para inyectar logs en las DevTools simuladas.
    *   Sandbox estricto (`allow-scripts`, sin `allow-same-origin`) para prevenir XSS.

## Flujos de Datos Principales

### 1. Generación de Código
`User Prompt` -> `App.tsx` -> `geminiService.ts` -> `POST /api/generate` -> `Google Gemini API` -> `Response` -> `Render en Iframe`.

### 2. Colaboración en Vivo
`Host` inicia sesión -> Genera `PeerID` -> `Guest` conecta con ID.
Sincronización mediante eventos: `SYNC_STATE`, `CODE_UPDATE`, `REMOTE_PROMPT`.
Modelo: Host como fuente de verdad (Source of Truth).

### 3. Publicación
`User` provee GitHub PAT -> `App` cifra en memoria -> `POST /api/publish` -> `GitHub REST API` -> `GitHub Pages`.
