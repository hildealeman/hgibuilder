
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Message, MessageRole } from '../types';

// Audio Contexts
let inputAudioContext: AudioContext | null = null;
let outputAudioContext: AudioContext | null = null;
let inputSource: MediaStreamAudioSourceNode | null = null;
let outputNode: GainNode | null = null;
let processor: ScriptProcessorNode | null = null;
let nextStartTime = 0;
const sources = new Set<AudioBufferSourceNode>();

interface LiveSessionCallbacks {
  onOpen: () => void;
  onClose: () => void;
  onError: (err: any) => void;
  onTranscription: (user: string, model: string) => void;
}

interface SessionContext {
  code: string;
  history: Message[];
}

export class LiveSession {
  private ai: GoogleGenAI | null = null;
  private session: any = null; // Session object from connect
  private active = false;
  private currentInputTranscription = '';
  private currentOutputTranscription = '';

  constructor() {
    // Client initialized in start() to ensure API_KEY is available
  }

  async start(callbacks: LiveSessionCallbacks, context: SessionContext) {
    if (this.active) return;
    
    // Initialize AI client here to avoid race conditions with API Key selection
    // Ensure API_KEY exists
    if (!process.env.API_KEY) {
        console.error("API_KEY is missing");
        callbacks.onError(new Error("API Key missing"));
        return;
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Reset Audio Contexts
    try {
        inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        outputNode = outputAudioContext.createGain();
        outputNode.connect(outputAudioContext.destination);
    } catch (e) {
        console.error("Audio Context Init Error", e);
        callbacks.onError(e);
        return;
    }

    nextStartTime = 0;
    this.currentInputTranscription = '';
    this.currentOutputTranscription = '';

    let stream: MediaStream;
    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
        console.error("Microphone Access Error", e);
        callbacks.onError(new Error("Microphone access denied"));
        return;
    }
    
    this.active = true;

    // 1. Prepare Context Strings
    // Truncate code to prevent massive payloads disrupting the websocket handshake
    const MAX_CONTEXT_LENGTH = 20000;
    let codeSnippet = context.code || "";
    if (codeSnippet.length > MAX_CONTEXT_LENGTH) {
        codeSnippet = codeSnippet.substring(0, MAX_CONTEXT_LENGTH) + "\n... (Truncated for context limit)";
    }

    const codeContext = codeSnippet
      ? `\n--- CÓDIGO ACTUAL DEL USUARIO ---\n${codeSnippet}\n---------------------------------\n` 
      : "\n--- NO HAY CÓDIGO GENERADO AÚN ---\n";

    const chatContext = context.history.length > 0
      ? `\n--- HISTORIAL DE CHAT RECIENTE ---\n${context.history.slice(-5).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}\n----------------------------------\n`
      : "";

    // 2. Build Dynamic System Instruction
    const systemInstruction = `
      Eres el "Arquitecto HGI" (Human Grounded Intelligence).
      
      TU CONTEXTO ACTUAL:
      Tienes acceso total al código que el usuario está construyendo y al historial de chat.
      ${codeContext}
      ${chatContext}

      TU OBJETIVO:
      1. ANALIZAR: Escucha la solicitud del usuario y compárala con el "CÓDIGO ACTUAL". Detecta problemas, faltas de estilo o errores de lógica.
      2. DEBATIR: Si el usuario pide algo que rompe la ética o la arquitectura, aconséjale.
      3. REDACTAR PROMPTS: Tu función principal es dictar un "Prompt Técnico" perfecto para que el usuario se lo envíe al "Constructor" (la otra IA).
      
      CUANDO EL USUARIO PIDA UN CAMBIO:
      No digas "Claro, lo haré". Di: "Entendido. He detectado que en tu código actual [problema]. Aquí tienes el prompt para arreglarlo: [DICTAR PROMPT TÉCNICO]".
      
      IDIOMA: Español (México). Voz profesional, técnica pero cálida.
    `;

    // Connect to Live API
    try {
        const sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => {
            console.log("Live Session Opened");
            callbacks.onOpen();

            // Setup Audio Streaming
            if (!inputAudioContext) return;
            inputSource = inputAudioContext.createMediaStreamSource(stream);
            processor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
                if (!this.active) return;
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = this.createBlob(inputData);
                
                // Use sessionPromise to ensure we wait for connection
                sessionPromise.then(session => {
                    session.sendRealtimeInput({ media: pcmBlob });
                }).catch(err => {
                    // Prevent unhandled promise rejections during connection phase
                    // Errors are handled by onerror callback
                });
            };

            inputSource.connect(processor);
            processor.connect(inputAudioContext.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContext && outputNode) {
                const audioBuffer = await this.decodeAudioData(
                this.decode(base64Audio),
                outputAudioContext,
                24000,
                1
                );
                
                // Scheduling
                nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNode);
                source.addEventListener('ended', () => sources.delete(source));
                source.start(nextStartTime);
                nextStartTime += audioBuffer.duration;
                sources.add(source);
            }

            // Handle Interruptions
            if (message.serverContent?.interrupted) {
                console.log("Interrupted!");
                sources.forEach(s => { s.stop(); });
                sources.clear();
                nextStartTime = 0;
                this.currentInputTranscription = '';
                this.currentOutputTranscription = '';
            }

            // Handle Transcription Accumulation
            const inputTrans = message.serverContent?.inputTranscription?.text;
            if (inputTrans) {
                this.currentInputTranscription += inputTrans;
            }

            const outputTrans = message.serverContent?.outputTranscription?.text;
            if (outputTrans) {
                this.currentOutputTranscription += outputTrans;
            }

            // Handle Turn Complete (Emit full transcriptions)
            if (message.serverContent?.turnComplete) {
                const userText = this.currentInputTranscription;
                const modelText = this.currentOutputTranscription;
                
                if (userText || modelText) {
                    callbacks.onTranscription(userText, modelText);
                }

                // Reset buffers for next turn
                this.currentInputTranscription = '';
                this.currentOutputTranscription = '';
            }
            },
            onclose: (e) => {
                console.log("Live Session Closed", e);
                this.cleanup();
                callbacks.onClose();
            },
            onerror: (e) => {
                console.error("Live Session Error", e);
                this.cleanup();
                callbacks.onError(e);
            }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {}, // Enable Input Transcription
            outputAudioTranscription: {}, // Enable Output Transcription
            speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            },
            systemInstruction: systemInstruction,
        }
        });

        this.session = sessionPromise;
        
        // Handle initial connection failure explicitly
        sessionPromise.catch(err => {
            console.error("Connection Handshake Failed", err);
            this.cleanup();
            callbacks.onError(err);
        });

    } catch (err) {
        console.error("Failed to initiate connection", err);
        this.cleanup();
        callbacks.onError(err);
    }
  }

  stop() {
    if (this.session) {
      this.session.then((s: any) => s.close()).catch(() => {});
    }
    this.cleanup();
  }

  private cleanup() {
    this.active = false;
    
    // Cleanup Audio
    if (processor) {
        processor.disconnect();
        processor.onaudioprocess = null;
    }
    if (inputSource) inputSource.disconnect();
    if (outputNode) outputNode.disconnect();
    if (inputAudioContext && inputAudioContext.state !== 'closed') inputAudioContext.close();
    if (outputAudioContext && outputAudioContext.state !== 'closed') outputAudioContext.close();
    
    processor = null;
    inputSource = null;
    outputNode = null;
    inputAudioContext = null;
    outputAudioContext = null;
    this.currentInputTranscription = '';
    this.currentOutputTranscription = '';
  }

  private createBlob(data: Float32Array) {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: this.encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000'
    };
  }

  private encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let i = 0; i < numChannels; i++) {
      const channelData = buffer.getChannelData(i);
      for (let j = 0; j < frameCount; j++) {
        channelData[j] = dataInt16[j * numChannels + i] / 32768.0;
      }
    }
    return buffer;
  }
}

export const liveSessionInstance = new LiveSession();
