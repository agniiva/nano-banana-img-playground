export interface GeneratedImage {
  id: string;
  base64: string;
  prompt: string;
  timestamp: number;
  selected: boolean;
  aspectRatio: string; // Storing the ratio to display correctly in grid
}

export interface GenerationConfig {
  systemPrompt: string;
  imageCount: number;
  aspectRatio: "1:1" | "3:4" | "4:3" | "16:9" | "9:16" | "4:5";
}

export interface GenerationState {
  isLoading: boolean;
  error: string | null;
  progress: number; // 0 to 100
}