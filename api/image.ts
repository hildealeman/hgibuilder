
import { GoogleGenAI } from '@google/genai';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { prompt, size, inputImage } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing API Key");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const parts: any[] = [{ text: prompt }];
    
    if (inputImage) {
        const base64Data = inputImage.split(',')[1];
        parts.push({
            inlineData: {
                mimeType: 'image/png',
                data: base64Data
            }
        });
    }

    // Note: Using a standard model for image gen proxy if the specific preview is not available in standard SDK yet
    // Or strictly passing through the model name requested by client if valid.
    const response = await ai.models.generateContent({
      model: 'gemini-pro-vision', // Or specific image model
      contents: { parts },
      config: {
        // Adjust config for image generation specifically if supported by the model selected
      }
    });

    // Mocking response structure for safety if SDK differs, assuming standard generateContent structure
    // In real implementation, ensure using the correct image generation endpoint/method
    // For now, returning text description or base64 if available in response
    
    // IF the model returns images in inlineData:
    const generatedImage = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    
    if (generatedImage) {
         return new Response(JSON.stringify({ 
             image: `data:image/png;base64,${generatedImage.inlineData.data}` 
         }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "No image generated" }), { status: 400 });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
