import { readFile, stat } from 'node:fs/promises';
import { extname } from 'node:path';
import { ToolExecutionError } from '../errors.js';

const MAX_TRANSCRIPT_CHARS = 500;
const MAX_SAMPLE_BYTES = 10 * 1024 * 1024;

const MIME_FROM_EXT: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

const MIME_FROM_CONTENT_TYPE: Record<string, string> = {
  'audio/mpeg': 'audio/mpeg',
  'audio/mp3': 'audio/mpeg',
  'audio/wav': 'audio/wav',
  'audio/wave': 'audio/wav',
  'audio/x-wav': 'audio/wav',
};

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

function toSampleData(bytes: Uint8Array, mime: string): { dataUrl: string; bytes: Uint8Array; mime: string } {
  if (bytes.length === 0) {
    throw new ToolExecutionError('Voice sample is empty.', 'validation');
  }
  if (bytes.length > MAX_SAMPLE_BYTES) {
    throw new ToolExecutionError('Voice sample exceeds 10 MB.', 'validation');
  }

  const b64 = Buffer.from(bytes).toString('base64');
  return {
    dataUrl: `data:${mime};base64,${b64}`,
    bytes,
    mime,
  };
}

export async function parseVoiceSamplePath(
  voiceSamplePath: string
): Promise<{ dataUrl: string; bytes: Uint8Array; mime: string }> {
  const rawPath = voiceSamplePath.trim();
  if (!rawPath) {
    throw new ToolExecutionError('voiceSamplePath cannot be empty.', 'validation');
  }

  const ext = extname(rawPath).toLowerCase();
  const mime = MIME_FROM_EXT[ext];
  if (!mime) {
    throw new ToolExecutionError(
      `voiceSamplePath has unsupported extension "${ext}". Use .mp3 or .wav.`,
      'validation'
    );
  }

  let sampleStat;
  try {
    sampleStat = await stat(rawPath);
  } catch {
    throw new ToolExecutionError('voiceSamplePath does not exist or is not accessible.', 'validation');
  }

  if (!sampleStat.isFile()) {
    throw new ToolExecutionError('voiceSamplePath is not a regular file.', 'validation');
  }
  if (sampleStat.size === 0) {
    throw new ToolExecutionError('voiceSamplePath file is empty.', 'validation');
  }
  if (sampleStat.size > MAX_SAMPLE_BYTES) {
    throw new ToolExecutionError('voiceSamplePath file exceeds 10 MB.', 'validation');
  }

  let fileBytes: Buffer;
  try {
    fileBytes = await readFile(rawPath);
  } catch {
    throw new ToolExecutionError('voiceSamplePath cannot be read.', 'validation');
  }

  return toSampleData(Uint8Array.from(fileBytes), mime);
}

export async function parseVoiceSampleUrl(
  voiceSampleUrl: string
): Promise<{ dataUrl: string; bytes: Uint8Array; mime: string }> {
  const rawUrl = voiceSampleUrl.trim();
  if (!rawUrl) {
    throw new ToolExecutionError('voiceSampleUrl cannot be empty.', 'validation');
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new ToolExecutionError('voiceSampleUrl must be a valid URL.', 'validation');
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new ToolExecutionError('voiceSampleUrl must use http or https.', 'validation');
  }

  let response: Response;
  try {
    response = await fetch(url, { redirect: 'follow' });
  } catch {
    throw new ToolExecutionError('voiceSampleUrl could not be fetched.', 'validation');
  }

  if (!response.ok) {
    throw new ToolExecutionError(
      `voiceSampleUrl fetch failed with status ${response.status}.`,
      'validation'
    );
  }

  const contentLength = response.headers.get('content-length');
  if (contentLength) {
    const size = Number.parseInt(contentLength, 10);
    if (Number.isFinite(size) && size > MAX_SAMPLE_BYTES) {
      throw new ToolExecutionError('voiceSampleUrl file exceeds 10 MB.', 'validation');
    }
  }

  let mime: string | undefined;
  const contentTypeHeader = response.headers.get('content-type');
  if (contentTypeHeader) {
    const normalized = contentTypeHeader.split(';')[0]?.trim().toLowerCase();
    mime = normalized ? MIME_FROM_CONTENT_TYPE[normalized] : undefined;
  }

  if (!mime) {
    const ext = extname(url.pathname).toLowerCase();
    mime = MIME_FROM_EXT[ext];
  }

  if (!mime) {
    throw new ToolExecutionError(
      'voiceSampleUrl must point to an mp3 or wav file.',
      'validation'
    );
  }

  let buffer: ArrayBuffer;
  try {
    buffer = await response.arrayBuffer();
  } catch {
    throw new ToolExecutionError('voiceSampleUrl response body could not be read.', 'validation');
  }

  return toSampleData(new Uint8Array(buffer), mime);
}

export function extensionFromFormat(format: string): string {
  if (format === 'pcm' || format === 'pcm16') {
    return 'pcm';
  }
  return format;
}
