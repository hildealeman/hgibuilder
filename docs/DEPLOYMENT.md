
# Guía de Despliegue (Vercel)

Este proyecto está optimizado para Vercel debido al uso de Serverless Functions.

## Prerrequisitos
1.  Cuenta en Vercel.
2.  Cuenta en Google AI Studio (para obtener la API Key de Gemini).
3.  Repositorio en GitHub con este código.

## Paso a Paso

1.  **Importar Proyecto:**
    *   Ve a Vercel Dashboard -> "Add New..." -> "Project".
    *   Selecciona tu repositorio de Git.

2.  **Configuración de Build:**
    *   Framework Preset: **Vite**.
    *   Root Directory: `./` (raíz).
    *   Build Command: `npm run build`.
    *   Output Directory: `dist`.

3.  **Variables de Entorno (Environment Variables):**
    *   Es CRÍTICO configurar esto antes de desplegar.
    *   **NAME:** `GEMINI_API_KEY`
    *   **VALUE:** `tu_clave_de_google_ai_studio`

4.  **Deploy:**
    *   Haz click en "Deploy".
    *   Espera a que finalice el build.

5.  **Verificación:**
    *   Accede a la URL proporcionada.
    *   Abre la consola del navegador.
    *   Intenta generar una app ("Hola mundo").
    *   Verifica en la pestaña Network que la petición va a `/api/generate` y devuelve 200 OK.

## Desarrollo Local
Para correr las funciones serverless localmente, usa `vercel dev`:

```bash
npm install -g vercel
vercel dev
```
Esto levantará el frontend en `localhost:3000` y emulará las rutas `/api/*`.
