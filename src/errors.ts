import type { ToolStage } from './types.js';

export class ToolExecutionError extends Error {
  readonly stage: ToolStage;

  constructor(message: string, stage: ToolStage) {
    super(message);
    this.stage = stage;
  }
}
