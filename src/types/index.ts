// TypeScript types for the Image to Video Generator

export interface GeneratedVideo {
  id: string;
  videoUrl: string;
  videoBlob: Blob;
  prompt: string;
  step: number;
}

export interface VideoGenerationState {
  isGenerating: boolean;
  currentStep: number;
  totalSteps: number;
  error: string | null;
  videos: GeneratedVideo[];
}

export interface ImageData {
  file?: File;
  preview: string;
  width: number;
  height: number;
  base64?: string;
  mimeType?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  originalWidth?: number;
  originalHeight?: number;
}

export type AspectRatio = '16:9' | '9:16' | '1:1';

// Video duration in seconds - determines number of scenes
export type VideoDuration = 8 | 16 | 24 | 32;

export interface PromptInputs {
  prompt1: string;
  prompt2: string;
  prompt3: string;
  prompt4: string;
}

export interface DialogueRecommendation {
  dialogue: string;
  timingSeconds: number;
  reasoning: string;
}

export interface DialogueAnalysisResult {
  evaluationCriteria: string[];
  recommendations: DialogueRecommendation[];
}

export interface InterviewIdea {
  location: string;           // 장소
  time: string;               // 시간
  situation: string;          // 상황
  reporterDialogue: string;   // 리포터 대사
  gooreumiDialogue: string;   // 구름이 대사 (witty/funny)
}
