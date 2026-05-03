#!/usr/bin/env bun

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createStorageClient } from './lib/storage.js';
import { registerGenerateTtsUrlTool } from './tools/generateTtsUrl.js';
import { loadOptionalDotEnv } from './utils/env.js';

function fromEnv(primary: string, alias?: string): string | undefined {
  return process.env[primary] ?? (alias ? process.env[alias] : undefined);
}

function required(primary: string, alias?: string): string {
  const value = fromEnv(primary, alias);
  if (!value) {
    throw new Error(
      alias
        ? `Missing required environment variable: ${String(primary)} (or ${String(alias)})`
        : `Missing required environment variable: ${String(primary)}`
    );
  }
  return value;
}

function readConfig() {
  const requiredVars = {
    ttsApiKey: required('MIMO_API_KEY', 'TTS_API_KEY'),
    storageAccountId: required('R2_ACCOUNT_ID', 'STORAGE_ACCOUNT_ID'),
    storageBucket: required('R2_BUCKET', 'STORAGE_BUCKET'),
    storageAccessKeyId: required('R2_ACCESS_KEY_ID', 'STORAGE_ACCESS_KEY_ID'),
    storageSecretAccessKey: required('R2_SECRET_ACCESS_KEY', 'STORAGE_SECRET_ACCESS_KEY'),
    publicDomain: required('R2_PUBLIC_DOMAIN', 'PUBLIC_AUDIO_DOMAIN'),
  };

  if (requiredVars.publicDomain !== 'audio.zenon.red') {
    throw new Error('PUBLIC_AUDIO_DOMAIN must be exactly audio.zenon.red');
  }

  return {
    ...requiredVars,
    defaultVoice: fromEnv('MIMO_VOICE', 'DEFAULT_VOICE') ?? 'mimo_default',
    ttsTimeoutMs: Number(fromEnv('MIMO_TIMEOUT_MS', 'TTS_TIMEOUT_MS') ?? '30000'),
    storageRegion: fromEnv('R2_REGION', 'STORAGE_REGION') ?? 'auto',
  };
}

async function main(): Promise<void> {
  loadOptionalDotEnv();
  const config = readConfig();

  const server = new McpServer(
    {
      name: '@zenon-red/voize',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
      instructions: 'Generates TTS audio, uploads to object storage, and returns a public URL.',
    }
  );

  const storageClient = createStorageClient({
    accountId: config.storageAccountId,
    bucket: config.storageBucket,
    accessKeyId: config.storageAccessKeyId,
    secretAccessKey: config.storageSecretAccessKey,
    region: config.storageRegion,
  });

  registerGenerateTtsUrlTool(server, config, storageClient);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
