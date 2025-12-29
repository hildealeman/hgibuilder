
import { GoogleGenAI } from '@google/genai';

export const config = {
  runtime: 'edge', // Use Edge runtime for speed
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { model, prompt, systemInstruction, temperature, image } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Server configuration error: Missing API Key' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Construct contents
    const contents: any[] = [{ role: 'user', parts: [{ text: prompt }] }];
    
    // Handle image input if present (base64)
    if (image) {
      // Assuming image comes as "data:image/png;base64,..."
      const base64Data = image.split(',')[1]; 
      if (base64Data) {
          contents[0].parts.push({
            inlineData: {
              mimeType: 'image/png',
              data: base64Data
            }
          });
      }
    }

    const response = await ai.models.generateContent({
      model: model || 'gemini-1.5-flash', // Fallback to a stable model if requested one is weird
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: temperature || 0.7,
      }
    });

    return new Response(JSON.stringify({ text: response.text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
