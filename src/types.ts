export type ToolStage = 'validation' | 'tts' | 'upload';

export type ToolError = {
  error: string;
  stage: ToolStage;
};

export type ToolSuccess = Record<string, unknown> & {
  audioUrl: string;
  transcript: string;
  voice: string;
  durationMs: number;
};
