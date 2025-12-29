
import { GenerationConfig, ImageSize } from "../../types";

// Note: Direct import of GoogleGenAI removed to prevent client-side SDK usage for secrets.
// We now fetch from /api/generate

export const generateAppCode = async (
  prompt: string, 
  config: GenerationConfig,
  currentCode?: string,
  image?: string
): Promise<string> => {
  
  // Construct dependencies string
  const dependenciesList = config.dependencies && config.dependencies.length > 0
    ? `\n    IMPORTANTE - DEPENDENCIAS EXTERNAS REQUERIDAS:\n    ${config.dependencies.map(d => `- ${d}`).join('\n    ')}`
    : '';

  const systemInstruction = `
    Eres el HGI (Human Grounded Intelligence) Builder.
    Tu objetivo es construir aplicaciones web de una sola página, robustas, éticas y funcionales.
    IDIOMA: Español (México).
    ESTRATEGIA TÉCNICA:
    1. ARTEFACTO ÚNICO: HTML, CSS y JS en un solo archivo.
    2. REACT: Usa React 18 CDN si es necesario.
    3. TAILWIND: Usa Tailwind CDN.
    4. ACCESIBILIDAD Y ÉTICA: Prioridad alta.
    ${dependenciesList}
  `;

  const requestBody = {
    model: config.model,
    prompt: `${currentCode ? `CONTEXTO CÓDIGO ACTUAL:\n${currentCode}\n\n` : ''}SOLICITUD USUARIO: ${prompt}`,
    systemInstruction,
    temperature: config.temperature,
    image // Base64 string if present
  };

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.text || '';
    
    // Parse markdown code blocks
    const codeBlockMatch = text.match(/```html([\s\S]*?)```/);
    return codeBlockMatch ? codeBlockMatch[1].trim() : text;

  } catch (error) {
    console.error("Gemini Gen Error:", error);
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
  } catch (e) {
      console.error(e);
      return null;
  }
};

export const validateCodeEthics = async (code: string): Promise<string> => {
    // Reuses the text generation endpoint with specific system prompt
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gemini-3-flash-preview',
                prompt: `Analiza éticamente el siguiente código:\n\n${code}`,
                systemInstruction: "Eres un auditor de ética de código. Busca problemas de a11y, privacidad y seguridad.",
                temperature: 0.1
            })
        });
        const data = await response.json();
        return data.text;
    } catch (e) {
        return "Error en auditoría.";
    }
};

// NOTE: transcribeAudio functionality for Live API currently requires 
// Client-Side key or a WebSocket proxy (complex). 
// For this V1 production release, we will disable server-side transcription 
// or require the user to input a key for 'Advanced Live Mode'.
