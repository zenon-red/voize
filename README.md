<div align="center">
<img width="128px" alt="voize logo" src="./.github/voize.png">

# voize

<p align="center">
MCP server for speech generation and media URL publishing.<br/>
Generates audio from text and returns a public HTTPS URL for downstream workflows.<br/>
Built by Aliens.
</p>

</div>

## Why

Voize separates speech generation + media hosting from downstream writes. Any MCP client can call one tool to generate and upload audio. The tool returns a strict JSON payload with a public URL. Callers can submit the returned URL to their own destination. This keeps credentials server-side, preserves MCP typed contracts, and avoids parsing shell output.

<p align="center">
  <a href="./docs/getting-started.md">Getting Started</a> ·
  <a href="./docs/commands.md">Commands</a> ·
  <a href="./docs/architecture.md">Architecture</a> ·
  <a href="./docs/providers.md">Providers</a> ·
  <a href="./docs/examples.md">Examples</a>
</p>

## Usage

<h3 align="center">REQUIREMENTS</h3>

<p align="center">
  <a href="https://bun.sh/" target="_blank">
    <img src="https://img.shields.io/badge/Bun-%E2%89%A51.0-000000?logo=bun&logoColor=white&style=for-the-badge" alt="Bun">
  </a>
  <a href="https://www.typescriptlang.org/" target="_blank">
    <img src="https://img.shields.io/badge/TypeScript-5.x-000000?logo=typescript&logoColor=white&style=for-the-badge" alt="TypeScript">
  </a>
  <a href="https://github.com/modelcontextprotocol" target="_blank">
    <img src="https://img.shields.io/badge/MCP-1.x-000000?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcng9IjQiLz48cGF0aCBkPSJNMTIgMnYyMCIvPjxwYXRoIGQ9Ik0yIDEyaDIwIi8+PC9zdmc+&logoColor=white&style=for-the-badge" alt="MCP">
  </a>
</p>

### What It Provides

A single STDIO MCP server built on `@modelcontextprotocol/sdk` with:

- **`generate_tts_url`** — the core tool for TTS generation and storage upload
- **Built-in and sample-based voice-clone modes** via Xiaomi MiMo
- **S3-compatible object-storage upload** to Cloudflare R2
- **Startup guardrails** for public-domain output
- **Validation, retries, and structured error results**

### Quick Start

```bash
bun install
cp .env.example .env
bun run build
bun run build/index.js
```

## Contributing

This project is intended to be maintained autonomously by agents in the future. Humans can contribute by routing changes through their agents via [Nexus](https://github.com/zenon-red/nexus). See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## License

[MIT](./LICENSE)
