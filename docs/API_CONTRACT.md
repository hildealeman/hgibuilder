
# Contrato de API

El backend se sirve bajo la ruta `/api`.

## 1. Generar Contenido
**Endpoint:** `POST /api/generate`

**Request Body:**
```json
{
  "prompt": "string (Requerido)",
  "model": "string (Opcional, default: gemini-1.5-flash)",
  "systemInstruction": "string (Opcional)",
  "temperature": "number (0.0 - 2.0)",
  "image": "string (Base64 data URI, Opcional)"
}
```

**Response (200 OK):**
```json
{
  "text": "Contenido generado (HTML/Markdown)..."
}
```

## 2. Generar Imagen
**Endpoint:** `POST /api/image`

**Request Body:**
```json
{
  "prompt": "string (Requerido)",
  "size": "string (1K, 2K...)",
  "inputImage": "string (Base64, Opcional para edición)"
}
```

**Response (200 OK):**
```json
{
  "image": "data:image/png;base64,..."
}
```

## 3. Publicar a GitHub
**Endpoint:** `POST /api/publish`

**Request Body:**
```json
{
  "token": "string (GitHub PAT)",
  "owner": "string (Usuario)",
  "repo": "string (Nombre repo)",
  "branch": "string (default: main)",
  "path": "string (default: index.html)",
  "message": "string (Commit msg)",
  "content": "string (Raw HTML content)"
}
```

**Response (200 OK):**
```json
{
  "content": { "name": "...", "sha": "..." },
  "commit": { ... }
}
```
