import { withRetries } from '../utils/retry.js';
import { ToolExecutionError } from '../errors.js';

export type ResponseFormat = 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm' | 'pcm16';

type BuiltInArgs = {
  transcript: string;
  voice: string;
  context?: string;
  responseFormat: ResponseFormat;
  timeoutMs: number;
};

type VoiceCloneArgs = {
  transcript: string;
  context?: string;
  voiceDataUrl: string;
  responseFormat: ResponseFormat;
  timeoutMs: number;
};

type GenerateArgs = {
  model: string;
  transcript: string;
  context?: string;
  voice: string;
  responseFormat: ResponseFormat;
  timeoutMs: number;
};

const BASE_URL = process.env.MIMO_BASE_URL ?? 'https://token-plan-ams.xiaomimimo.com/v1';

async function postJson(path: string, apiKey: string, body: object, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new ToolExecutionError(
        `TTS provider request failed (${response.status}): ${text.slice(0, 300)}`,
        'tts'
      );
    }

    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

function extractAudioData(payload: unknown): string {
  const root = payload as {
    choices?: Array<{ message?: { audio?: { data?: string } } }>;
  };

  const data = root.choices?.[0]?.message?.audio?.data;
  if (!data) {
    throw new ToolExecutionError('TTS provider response missing choices[0].message.audio.data', 'tts');
  }
  return data;
}

async function generateTts(apiKey: string, args: GenerateArgs): Promise<Uint8Array> {
  const payload = {
    model: args.model,
    messages: [
      ...(args.context ? [{ role: 'user', content: args.context }] : []),
      { role: 'assistant', content: args.transcript },
    ],
    audio: {
      format: args.responseFormat,
      voice: args.voice,
    },
  };

  const result = await withRetries(
    async () => postJson('/chat/completions', apiKey, payload, args.timeoutMs),
    2
  );
  const b64 = extractAudioData(result);
  return Uint8Array.from(Buffer.from(b64, 'base64'));
}

export async function generateBuiltInTts(apiKey: string, args: BuiltInArgs): Promise<Uint8Array> {
  return generateTts(apiKey, {
    model: 'mimo-v2-tts',
    transcript: args.transcript,
    context: args.context,
    voice: args.voice,
    responseFormat: args.responseFormat,
    timeoutMs: args.timeoutMs,
  });
}

export async function generateVoiceCloneTts(apiKey: string, args: VoiceCloneArgs): Promise<Uint8Array> {
  return generateTts(apiKey, {
    model: 'mimo-v2.5-tts-voiceclone',
    transcript: args.transcript,
    context: args.context,
    voice: args.voiceDataUrl,
    responseFormat: args.responseFormat,
    timeoutMs: args.timeoutMs,
  });
}
