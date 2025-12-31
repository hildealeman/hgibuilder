
# HGI Vibe Builder

Hecho en Mexico por ingenio 100% Mexicano, VistaDev Mexico. vistadev.mx

Aplicación web (React + Vite) con autenticación y persistencia en Supabase, y generación de código vía API.

## Requisitos

- Node.js (recomendado LTS)
- Una cuenta/proyecto de Supabase
- Una API Key para el endpoint de generación (`GEMINI_API_KEY`)

## Instalación

1. Instala dependencias:
   `npm install`

2. Crea un archivo `.env.local` en la raíz del proyecto.

## Variables de entorno

### Frontend (Vite)

Estas variables se leen desde `import.meta.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### API (server)

Esta variable se lee desde `process.env` (ver `api/generate.ts`):

- `GEMINI_API_KEY`

Ejemplo de `.env.local`:

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
GEMINI_API_KEY=YOUR_API_KEY
```

## Configuración de Supabase

1. Crea un proyecto en Supabase.
2. Activa Auth por email/password y crea usuarios desde el dashboard (la app está en modo **solo login**).
3. Asegúrate de tener estas tablas (según el código):
   - `hgibuilder_projects`
   - `hgibuilder_sessions`
   - `hgibuilder_messages`

## Ejecutar en local

`npm run dev`

Luego abre la URL que imprime Vite (por defecto `http://localhost:5173`).

## Build de producción

`npm run build`

`npm run preview`
