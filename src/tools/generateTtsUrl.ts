import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { generateBuiltInTts, generateVoiceCloneTts, type ResponseFormat } from '../lib/provider.js';
import { uploadToStorage } from '../lib/storage.js';
import { logStage } from '../utils/log.js';
import { extensionFromFormat, normalizeTranscript, parseBase64Sample } from '../utils/validate.js';
import { ToolExecutionError } from '../errors.js';
import type { ToolError, ToolSuccess } from '../types.js';
import type { S3Client } from '@aws-sdk/client-s3';

const inputSchema = z.object({
  transcript: z.string(),
  voice: z.string().optional(),
  voiceSample: z.string().optional(),
  context: z.string().optional(),
  responseFormat: z.enum(['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm', 'pcm16']).optional(),
});

const outputSchema = z.object({
  audioUrl: z.string(),
  transcript: z.string(),
  voice: z.string(),
  durationMs: z.number(),
});

type EnvConfig = {
  ttsApiKey: string;
  defaultVoice: string;
  ttsTimeoutMs: number;
  storageBucket: string;
  publicDomain: string;
};

function textResult(payload: ToolSuccess, structured?: Record<string, unknown>): { content: { type: 'text'; text: string }[]; structuredContent?: Record<string, unknown> };
function textResult(payload: ToolError, isError: true): { content: { type: 'text'; text: string }[]; isError: true };
function textResult(payload: ToolError | ToolSuccess, structuredOrIsError?: Record<string, unknown> | true): { content: { type: 'text'; text: string }[]; structuredContent?: Record<string, unknown>; isError?: true };
function textResult(payload: ToolError | ToolSuccess, structuredOrIsError?: Record<string, unknown> | true) {
  const base = { content: [{ type: 'text' as const, text: JSON.stringify(payload) }] };
  if (structuredOrIsError === true) {
    return { ...base, isError: true };
  }
  if (structuredOrIsError && typeof structuredOrIsError === 'object') {
    return { ...base, structuredContent: structuredOrIsError };
  }
  return base;
}

function mimeTypeFromFormat(format: string): string {
  const map: Record<string, string> = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    opus: 'audio/opus',
    aac: 'audio/aac',
    flac: 'audio/flac',
    pcm: 'audio/L16',
    pcm16: 'audio/L16',
  };
  return map[format] ?? 'application/octet-stream';
}

export function registerGenerateTtsUrlTool(server: McpServer, env: EnvConfig, storageClient: S3Client): void {
  server.registerTool(
    'generate_tts_url',
    {
      title: 'Generate TTS URL',
      description: 'Generates TTS audio, uploads to storage, returns a public URL.',
      inputSchema,
      outputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args) => {
      const start = Date.now();
      try {
        const transcript = normalizeTranscript(args.transcript);
        const voiceSample = args.voiceSample?.trim();

        const mode = voiceSample ? 'clone' : 'builtin';
        const responseFormat: ResponseFormat =
          args.responseFormat ?? (mode === 'clone' ? 'wav' : 'mp3');

        let audioBytes: Uint8Array;
        let voiceLabel: string;

        const ttsStart = Date.now();
        if (voiceSample) {
          const parsed = parseBase64Sample(voiceSample);
          if (process.env.VOIZE_DEBUG) {
            console.error(
              JSON.stringify({
                stage: 'validation',
                status: 'ok',
                mode,
                sampleBytes: parsed.bytes.length,
                sampleMime: parsed.mime,
              })
            );
          }

          audioBytes = await generateVoiceCloneTts(env.ttsApiKey, {
            transcript,
            context: args.context,
            voiceDataUrl: parsed.dataUrl,
            responseFormat,
            timeoutMs: env.ttsTimeoutMs,
          });
          voiceLabel = 'voiceclone';
        } else {
          const voice = args.voice?.trim() || env.defaultVoice;
          audioBytes = await generateBuiltInTts(env.ttsApiKey, {
            transcript,
            context: args.context,
            voice,
            responseFormat,
            timeoutMs: env.ttsTimeoutMs,
          });
          voiceLabel = voice;
        }

        logStage('tts', 'ok', { durationMs: Date.now() - ttsStart, mode });

        const date = new Date().toISOString().slice(0, 10);
        const ext = extensionFromFormat(responseFormat);
        const key = `voice/${date}/tts_${randomUUID().slice(0, 8)}.${ext}`;

        const uploadStart = Date.now();
        await uploadToStorage(
          storageClient,
          env.storageBucket,
          key,
          audioBytes,
          mimeTypeFromFormat(responseFormat)
        );
        logStage('upload', 'ok', { durationMs: Date.now() - uploadStart, key });

        const audioUrl = `https://${env.publicDomain}/${key}`;
        const successPayload: ToolSuccess = {
          audioUrl,
          transcript,
          voice: voiceLabel,
          durationMs: Date.now() - start,
        };

        return textResult(successPayload, successPayload);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const stage: ToolError['stage'] =
          error instanceof ToolExecutionError ? error.stage : 'tts';

        logStage(stage, 'error', { error: message });
        return textResult({ error: message, stage }, true);
      }
    }
  );
}
