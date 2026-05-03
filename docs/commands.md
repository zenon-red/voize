# Commands

## Local Development

- `bun install` - Install dependencies
- `bun run build` - Compile TypeScript to `build/`
- `bun run dev` - Watch-mode compile
- `bun run lint` - Lint source with oxlint
- `bun run typecheck` - Type-check without emitting files
- `bun run smoke` - Local validation-only MCP smoke test
- `bun run smoke:live` - End-to-end MCP smoke test (current backend)

## Run MCP Server

```bash
bun run build/index.js
```

## Example MCP Client Configuration

```json
{
  "mcpServers": {
    "voice_uploader": {
      "command": "bun",
      "args": ["/absolute/path/to/voize/build/index.js"],
      "env": {
        "MIMO_API_KEY": "...",
        "R2_ACCOUNT_ID": "...",
        "R2_BUCKET": "...",
        "R2_ACCESS_KEY_ID": "...",
        "R2_SECRET_ACCESS_KEY": "...",
        "R2_PUBLIC_DOMAIN": "audio.zenon.red"
      }
    }
  }
}
```

Note: neutral alias env vars are also supported for compatibility.
