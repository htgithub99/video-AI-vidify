import React from 'react';

export enum WizardStep {
  SourceInput = 0,
  Storyboard = 1,
  AssetManager = 2,
  SEOBoost = 3,
  Export = 4,
}

export interface ProjectInput {
  type: 'script' | 'idea';
  content: string;
}

export interface ProjectConfig {
  genre: string;
  language: 'vi' | 'en';
  duration: string; 
  targetDuration?: string;
  rewriteLevel: number; 
  similarityReduction: number; 
  creativityLevel: number; 
  factCheck: boolean;
  audience: string;
  writingStyle: string;
  format?: string;
  splitStrategy?: string;
}

export interface HookVersion {
  id: string;
  content: string;
  type: string;
  selected: boolean;
}

export interface HookConfig {
  type: string; 
  duration: number; 
  count: number; 
  positions: 'start' | 'mid' | 'all';
  versions: HookVersion[];
}

export interface VoiceConfig {
  provider: string; 
  audioType: 'tts' | 'clone' | 'upload' | 'generated' | 'simulated';
  voiceName?: string;
  gender: 'male' | 'female' | 'neutral';
  age: 'child' | 'teen' | 'adult' | 'senior';
  emotion: string; 
  speed: number; 
  pitch?: number; 
  volume?: number; 
  voiceURI?: string;
  previewUrl?: string;
  audioUrl?: string;
  audioBase64?: string;
  uploadedAudioName?: string;
  subtitleFiles?: string[]; 
  timingLog?: string; 
}

export interface VisualConfig {
  source: string; 
  style: string; 
  quality: string; 
  density: number; 
  characterConsistency: boolean;
  assetsMode: 'user_only' | 'user_first' | 'mixed';
  stylePreset?: string;
  aspectRatio?: string;
  imageQuality?: string;
  characterConsistencyLevel?: string;
  contextConsistencyLevel?: string;
  negativePrompt?: string;
  imageGeneratorEngine?: 'imagen' | 'veo3' | 'labs-sandbox';
  thumbnailCount?: number;
  thumbnailReferenceImage?: string;
  thumbnailReferenceImages?: string[];
  thumbnailReferencePrompt?: string;
  referenceImage?: string;
  referenceImages?: string[];
  referencePrompt?: string;
  generateType?: 'image' | 'video';
  generateCount?: number;
  promptInputMethod?: 'type' | 'paste';
  characterImages?: string[];
  characterPrompt?: string;
  characterAnalysis?: string;
  characterExtracted?: boolean;
  characters?: CharacterConfig[];
  chromeHeadless?: boolean;
}

export interface CharacterConfig {
  id: string;
  name: string;
  description: string;
  images: string[];
  prompt?: string;
  extracted?: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  scriptSegment: string;
}

export interface StoryboardScene {
  id: string;
  chapterId: string;
  startTime: string; 
  endTime: string; 
  duration: number; 
  script: string;
  subtitle: string;
  prompt: string;
  assetName?: string;
  assetType?: 'image' | 'video';
  assetUrl?: string; 
  assetUrls?: string[]; 
  audioUrl?: string; 
  cameraMotion: string; 
  effects?: string;
  transition?: string;
}

export interface ThumbnailItem {
  id: string;
  prompt: string;
  style: string; 
  hasText: boolean;
  textText?: string;
  layout?: string;
  typography?: string;
  colorSuggestion?: string;
  subjectFocus?: string;
  imageUrl?: string;
}

export interface SEOMetadata {
  text: string;
  searchScore: number;
  ctrScore: number;
  compScore: number;
  seoScore: number;
}

export interface SEOPackage {
  titles: SEOMetadata[];
  descriptions: SEOMetadata[];
  hashtags: string[];
  tags: string[];
}

export interface SavedAsset {
  id: string;
  name: string;
  type: string;
  url: string;
  sceneId?: string;
}

export interface ProjectVersion {
  id: string;
  timestamp: string;
  note: string;
  scriptPreview: string;
}

export interface SEOConfig {
  numTitles: number;
  numDescriptions: number;
  numHashtags: number;
  numTags: number;
}

export interface VideoProject {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  input: ProjectInput;
  config: ProjectConfig;
  hookConfig: HookConfig;
  voiceConfig: VoiceConfig;
  visualConfig: VisualConfig;
  seoConfig?: SEOConfig;
  output?: {
    audioBase64?: string;
  };
  
  
  scriptRewritten?: string;
  factCheckNotes?: string;
  chapters?: Chapter[];
  storyboard?: StoryboardScene[];
  thumbnails?: ThumbnailItem[];
  seo?: SEOPackage;
  assets?: SavedAsset[];
  
  creditsUsed: number;
  currentStep?: WizardStep;
  versionHistory?: ProjectVersion[];
}

export interface PipelineWizardProps {
  theme?: string;
  currentLang?: string;
  project: VideoProject;
  setProject: (p: VideoProject) => void;
  onSaveProject: (p: VideoProject) => Promise<void> | void;
  onBackToDashboard: () => void;
  costTracker?: any;
  setCostTracker?: any;
  credits?: any;
  setCredits?: any;
}

export interface IBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | React.ReactNode;
  children?: React.ReactNode;
  maxWidth?: string;
}

export interface ITooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export interface IBaseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  isLoading?: boolean;
}

export interface Voice { voiceURI: string; name: string; lang: string; localService: boolean; default: boolean; gender?: string; [key: string]: any; }
