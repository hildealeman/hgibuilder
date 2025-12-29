
export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  image?: string; // base64
  isThinking?: boolean;
}

export interface Artifact {
  id: string;
  title: string;
  code: string; // Full HTML/CSS/JS content
  version: number;
  timestamp?: number;
}

export enum AppMode {
  CHAT = 'CHAT',
  PREVIEW = 'PREVIEW',
  CODE = 'CODE'
}

export enum ImageSize {
  SIZE_1K = '1K',
  SIZE_2K = '2K',
  SIZE_4K = '4K'
}

export interface GenerationConfig {
  useSearch: boolean;
  useThinking: boolean;
  imageSize: ImageSize;
  model: string;
  temperature: number;
  dependencies: string[]; // List of CDN URLs
}
