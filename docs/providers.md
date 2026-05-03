# Providers

## Current Support

`voize` is designed with provider/storage abstraction points, but currently ships with one concrete pair:

- TTS provider: Xiaomi MiMo
- Storage backend: Cloudflare R2 (S3-compatible API)

## Why This Is Explicit

- The current implementation uses MiMo-specific model IDs and response structure.
- The current storage client uses Cloudflare R2 endpoint semantics.
- Environment variables are documented with MiMo/R2 names for transparent operations.

## Abstraction Points

- `src/lib/provider.ts`
  - Contains current TTS provider calls and response extraction.
  - Future providers can be introduced behind the same output contract (`Uint8Array` audio bytes).

- `src/lib/storage.ts`
  - Contains storage client creation and object upload behavior.
  - Future storage backends can be added while keeping the upload function contract stable.

## Backward-Compatible Environment Naming

Primary names are MiMo/R2-oriented for operational clarity:

- `MIMO_API_KEY`, `MIMO_VOICE`, `MIMO_TIMEOUT_MS`
- `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_REGION`, `R2_PUBLIC_DOMAIN`

Compatibility aliases are accepted to support future generalization:

- `TTS_API_KEY`, `DEFAULT_VOICE`, `TTS_TIMEOUT_MS`
- `STORAGE_ACCOUNT_ID`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, `STORAGE_REGION`, `PUBLIC_AUDIO_DOMAIN`

## Adding Another Provider or Storage Backend

1. Add a new adapter in `src/lib/` for the provider or storage target.
2. Keep tool input/output contracts unchanged in `src/tools/generateTtsUrl.ts`.
3. Route backend selection through explicit config flags or env vars.
4. Add smoke coverage for both validation and live mode against the new backend.

## Domain Invariant

Current production safety policy enforces `audio.zenon.red` as the only allowed public domain at startup. This is intentional and should be treated as a deployment invariant unless the allowlist policy is deliberately expanded.
