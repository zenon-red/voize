#!/usr/bin/env bun

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {
    live: false,
    transcript: 'Smoke test transcript from voize.',
    voice: 'default_voice',
    voiceSamplePath: undefined,
    voiceSampleUrl: undefined,
  };

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--live') out.live = true;
    if (args[i] === '--transcript' && args[i + 1]) out.transcript = args[i + 1];
    if (args[i] === '--voice' && args[i + 1]) out.voice = args[i + 1];
    if (args[i] === '--voiceSamplePath' && args[i + 1]) out.voiceSamplePath = args[i + 1];
    if (args[i] === '--voiceSampleUrl' && args[i + 1]) out.voiceSampleUrl = args[i + 1];
  }

  return out;
}

async function main() {
  const opts = parseArgs();

  const transport = new StdioClientTransport({
    command: 'bun',
    args: ['build/index.js'],
    env: opts.live
      ? process.env
      : {
          ...process.env,
          TTS_API_KEY: process.env.TTS_API_KEY ?? 'smoke-key',
          STORAGE_ACCOUNT_ID: process.env.STORAGE_ACCOUNT_ID ?? 'smoke-account',
          STORAGE_BUCKET: process.env.STORAGE_BUCKET ?? 'smoke-bucket',
          STORAGE_ACCESS_KEY_ID: process.env.STORAGE_ACCESS_KEY_ID ?? 'smoke-access',
          STORAGE_SECRET_ACCESS_KEY: process.env.STORAGE_SECRET_ACCESS_KEY ?? 'smoke-secret',
          PUBLIC_AUDIO_DOMAIN: process.env.PUBLIC_AUDIO_DOMAIN ?? 'audio.zenon.red',
        },
  });

  const client = new Client(
    { name: 'voize-smoke-client', version: '1.0.0' },
    { capabilities: {} }
  );

  try {
    await client.connect(transport);
    console.log('Connected to MCP server.');

    const callArgs = opts.live
      ? {
          transcript: opts.transcript,
          voice: opts.voice,
          responseFormat: opts.voiceSamplePath || opts.voiceSampleUrl ? 'wav' : 'mp3',
          ...(opts.voiceSamplePath ? { voiceSamplePath: opts.voiceSamplePath } : {}),
          ...(opts.voiceSampleUrl ? { voiceSampleUrl: opts.voiceSampleUrl } : {}),
        }
      : {
          transcript: '   ',
        };

    const result = await client.callTool({
      name: 'generate_tts_url',
      arguments: callArgs,
    });

    console.log(JSON.stringify(result, null, 2));

    const text = result.content?.[0]?.type === 'text' ? result.content[0].text : '';
    const payload = text ? JSON.parse(text) : null;

    if (!opts.live) {
      const ok = Boolean(result.isError) && payload?.stage === 'validation';
      if (!ok) {
        throw new Error('Validation smoke test failed. Expected stage="validation" and isError=true.');
      }
      console.log('Validation-only smoke test passed.');
      return;
    }

    if (result.isError) {
      throw new Error(`Live smoke test returned error: ${text}`);
    }

    const expectedDomain = process.env.PUBLIC_AUDIO_DOMAIN ?? 'audio.zenon.red';
    if (!payload?.audioUrl || !String(payload.audioUrl).startsWith(`https://${expectedDomain}/`)) {
      throw new Error(`Live smoke test failed: missing valid ${expectedDomain} URL.`);
    }

    console.log('Live smoke test passed.');
  } finally {
    await client.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
