# Getting Started

## Prerequisites

- Bun 1.0+
- Xiaomi MiMo API credentials
- Cloudflare R2 credentials
- Public domain configured for hosted audio URLs

## Install

```bash
bun install
```

## Configure Environment

```bash
cp .env.example .env
```

Required variables (current implementation):

- `MIMO_API_KEY`
- `R2_ACCOUNT_ID`
- `R2_BUCKET`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_PUBLIC_DOMAIN=audio.zenon.red`

Optional:

- `MIMO_BASE_URL` (default `https://token-plan-ams.xiaomimimo.com/v1`)
- `MIMO_VOICE` (default `mimo_default`)
- `MIMO_TIMEOUT_MS` (default `30000`)
- `R2_REGION` (default `auto`)

Compatibility aliases are supported (`TTS_API_KEY`, `STORAGE_*`, `PUBLIC_AUDIO_DOMAIN`, `DEFAULT_VOICE`, `TTS_TIMEOUT_MS`, `STORAGE_REGION`) to ease future backend expansion.

## Build and Run

```bash
bun run build
bun run build/index.js
```

The server uses MCP stdio transport and does not print protocol output to stdout.

## Optional Smoke Tests

- Validation-only (no external API calls):
  ```bash
  bun run smoke
```
- Live end-to-end call (requires valid backend credentials in `.env`):
  ```bash
  bun run smoke:live
  ```
