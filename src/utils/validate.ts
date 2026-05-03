import { ToolExecutionError } from '../errors.js';

const MAX_TRANSCRIPT_CHARS = 500;
const MAX_SAMPLE_BYTES = 10 * 1024 * 1024;

export function normalizeTranscript(input: string): string {
  const transcript = input.trim();
  if (!transcript) {
    throw new ToolExecutionError('Transcript cannot be empty.', 'validation');
  }
  if (transcript.length > MAX_TRANSCRIPT_CHARS) {
    throw new ToolExecutionError('Transcript exceeds 500 characters.', 'validation');
  }
  return transcript;
}

export function parseBase64Sample(voiceSample: string): { dataUrl: string; bytes: Uint8Array; mime: string } {
  const raw = voiceSample.trim();
  const withPrefix = raw.startsWith('data:') ? raw : `data:audio/mpeg;base64,${raw}`;
  const match = withPrefix.match(/^data:(audio\/(mpeg|mp3|wav));base64,(.+)$/i);
  if (!match) {
    throw new ToolExecutionError(
      'voiceSample must be base64 audio (mp3/wav), optionally as a data URL.',
      'validation'
    );
  }

  const mime = match[1].toLowerCase() === 'audio/mp3' ? 'audio/mpeg' : match[1].toLowerCase();
  const b64 = match[3];

  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(Buffer.from(b64, 'base64'));
  } catch {
    throw new ToolExecutionError('voiceSample is not valid base64.', 'validation');
  }

  if (bytes.length === 0) {
    throw new ToolExecutionError('voiceSample is empty after base64 decode.', 'validation');
  }

  if (bytes.length > MAX_SAMPLE_BYTES) {
    throw new ToolExecutionError('voiceSample exceeds 10 MB decoded size.', 'validation');
  }

  return {
    dataUrl: `data:${mime};base64,${b64}`,
    bytes,
    mime,
  };
}

export function extensionFromFormat(format: string): string {
  if (format === 'pcm' || format === 'pcm16') {
    return 'pcm';
  }
  return format;
}
