# Architecture

## Summary

`voize` exposes a single MCP tool, `generate_tts_url`, that:

1. Validates transcript and optional voice sample
2. Calls the configured TTS backend
3. Uploads bytes to the configured object-storage backend
4. Returns a public HTTPS URL as structured JSON

## Project Structure

```
src/
├── index.ts
├── lib/
│   ├── provider.ts
│   └── storage.ts
├── tools/
│   └── generateTtsUrl.ts
├── types.ts
└── utils/
    ├── env.ts
    ├── log.ts
    ├── retry.ts
    └── validate.ts
```

## Tool Contract

Input:

- `transcript` (required, non-empty, <= 500 chars)
- `voice` (optional built-in voice)
- `voiceSample` (optional base64 mp3/wav, <= 10 MB decoded)
- `context` (optional style prompt)
- `responseFormat` (optional, defaults `mp3` built-in / `wav` clone)

Output (success):

- `audioUrl`
- `transcript`
- `voice`
- `durationMs`

Output (failure):

- `error`
- `stage` in `validation | tts | upload`

## Mode Selection

- No `voiceSample` -> built-in mode
- With `voiceSample` -> sample-based voice-clone mode

## Backend Notes

Current implementation uses one chat-completions endpoint for both modes:

- Provider: Xiaomi MiMo
- Built-in: `model: mimo-v2-tts`, backend voice identifier
- Clone: `model: mimo-v2.5-tts-voiceclone`, inline audio sample data URL

In both modes, synthesis text is placed in an `assistant` role message.

## Storage Notes

- Backend: Cloudflare R2 (S3-compatible)
- Endpoint: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- Region: implementation default is `auto`
- Key format: `voice/YYYY-MM-DD/<id>.<ext>`
- Public URL: `https://audio.zenon.red/<key>`

## Security

- Secrets are read from env vars only.
- `R2_PUBLIC_DOMAIN` / `PUBLIC_AUDIO_DOMAIN` must equal `audio.zenon.red`; server exits otherwise.
- Logs are emitted to stderr only.
- Base64 sample payload is never logged unless `VOIZE_DEBUG` is set.

## Extensibility

- `src/lib/provider.ts` is the TTS integration seam.
- `src/lib/storage.ts` is the object-storage integration seam.
- `src/tools/generateTtsUrl.ts` remains backend-agnostic and only orchestrates validation, generation, upload, and response formatting.

## Boundaries

This server does not call downstream application databases directly.
