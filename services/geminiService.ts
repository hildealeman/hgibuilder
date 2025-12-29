
import { GenerationConfig, ImageSize } from "../types";

export const generateAppCode = async (
  prompt: string, 
  config: GenerationConfig,
  currentCode?: string,
  image?: string
): Promise<string> => {
  const dependenciesList = config.dependencies && config.dependencies.length > 0
    ? `\n    IMPORTANTE - DEPENDENCIAS EXTERNAS REQUERIDAS:\n    El usuario ha solicitado explícitamente incluir las siguientes librerías vía CDN. Inyéctalas en el <head>:\n    ${config.dependencies.map(d => `- ${d}`).join('\n    ')}`
    : '';

  const systemInstruction = `
    Eres el HGI (Human Grounded Intelligence) Builder.
    Tu objetivo es construir aplicaciones web de una sola página, robustas, éticas y funcionales.
    
    IDIOMA: Español (México).
    
    ESTRATEGIA TÉCNICA (IMPORTANTE):
    1. ARTEFACTO ÚNICO: Genera SIEMPRE un único archivo HTML que contenga todo (HTML, CSS en <style>, JS en <script>).
    
    2. REACT & PERSISTENCIA (Si el usuario pide React, Apps complejas o Guardar datos):
       - Usa React 18 y ReactDOM 18 vía CDN (unpkg).
       - Usa Babel standalone vía CDN para compilar JSX en el navegador.
       - Estructura:
         <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
         <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
         <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
         <style>/* Tailwind classes or custom CSS */</style>
         <div id="root"></div>
         <script type="text/babel">
            const { useState, useEffect } = React;
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(<App />);
         </script>
    
    3. ESTILO:
       - Usa Tailwind CSS (vía CDN) por defecto para el diseño.
       - Diseño moderno, oscuro (dark mode) por defecto o limpio.
    
    4. ÉTICA HGI:
       - Prioriza accesibilidad (ARIA, contrastes).
       - Si usas LocalStorage, avisa visualmente al usuario que sus datos se guardan localmente.

    ${dependenciesList}
  `;

  const requestBody = {
    model: config.model,
    prompt: `${currentCode ? `Aquí está el código actual:\n\`\`\`html\n${currentCode}\n\`\`\`\n` : ''}Solicitud: ${prompt}`,
    systemInstruction,
    temperature: config.temperature,
    image
  };

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.text || '';
    const codeBlockMatch = text.match(/```html([\s\S]*?)```/);
    return codeBlockMatch ? codeBlockMatch[1].trim() : text;
  } catch (error) {
    console.error("Gemini Code Gen Error:", error);
    return `<!-- Error al generar código: ${error} -->`;
  }
};

export const generateImage = async (prompt: string, size: ImageSize, inputImage?: string): Promise<string | null> => {
  try {
    const response = await fetch('/api/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, size, inputImage })
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.image || null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    return null;
  }
};

export const validateCodeEthics = async (code: string): Promise<string> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-3-flash-preview',
        prompt: `Analiza éticamente el siguiente código:\n\n\`\`\`html\n${code}\n\`\`\``,
        systemInstruction: 'Eres el Auditor de Ética HGI. Busca problemas de accesibilidad, privacidad y seguridad y devuelve un reporte en Markdown.',
        temperature: 0.1
      })
    });

    const data = await response.json();
    return data.text || "No se pudo generar el reporte de ética.";
  } catch (e) {
    console.error("Ethics Audit Error:", e);
    return "Error técnico al realizar la auditoría.";
  }
};

export const transcribeAudio = async (audioBase64: string): Promise<string> => {
  return "";
};
