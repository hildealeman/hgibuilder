
# Modelo de Seguridad HGI

## Amenazas Identificadas y Mitigaciones

### 1. Exposición de API Keys (P0)
*   **Riesgo:** La `GEMINI_API_KEY` estaba expuesta en el código cliente.
*   **Mitigación:** Se ha movido toda la interacción con Gemini a funciones Serverless (`/api/generate`). La key vive exclusivamente en las variables de entorno del servidor (Vercel Environment Variables). El cliente nunca ve la key.

### 2. Robo de Token GitHub (P1)
*   **Riesgo:** Almacenamiento de PAT (Personal Access Token) con permisos de escritura en `localStorage`. Vulnerable a XSS.
*   **Mitigación:** 
    *   El token ya no se guarda en `localStorage` ni `IndexedDB` de forma persistente.
    *   Se utiliza `sessionStorage` para persistencia temporal (solo mientras la pestaña está abierta).
    *   El token se envía vía HTTPS al endpoint `/api/publish`, que actúa como proxy y valida la petición antes de contactar a GitHub.

### 3. Ejecución de Código Malicioso (XSS) en Preview (P2)
*   **Riesgo:** El código generado por IA podría contener scripts maliciosos que intenten acceder a cookies o almacenamiento del dominio padre.
*   **Mitigación:** 
    *   El `iframe` de previsualización utiliza el atributo `sandbox`.
    *   Se ha eliminado `allow-same-origin`. Esto fuerza al iframe a ser tratado como un origen único/nulo, impidiendo el acceso al `localStorage` o `cookies` de la aplicación principal (Vibe Builder).

### 4. Sobrescritura de Datos P2P
*   **Riesgo:** Condición de carrera donde un usuario sobrescribe el trabajo de otro sin notarlo.
*   **Mitigación:** Los eventos de sincronización incluyen timestamps. Aunque el modelo es "Last Write Wins", la UI bloquea la edición concurrente si se detecta latencia alta o roles no definidos (Guest vs Host).

## Recomendaciones Futuras
*   Implementar autenticación real (OAuth con GitHub) para eliminar el manejo manual de tokens PAT.
*   Añadir Rate Limiting en los endpoints `/api/` para evitar abuso de cuota de Gemini.
