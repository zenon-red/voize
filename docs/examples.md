# Examples

## Built-in Voice Example

Input:

```json
{
  "transcript": "Build completed. Validation checks passed.",
  "voice": "default_voice",
  "responseFormat": "mp3"
}
```

Output:

```json
{
  "audioUrl": "https://media.example.com/voice/2026-04-29/tts_7f3a9c2e.mp3",
  "transcript": "Build completed. Validation checks passed.",
  "voice": "default_voice",
  "durationMs": 1420
}
```

## Voice Clone Example

Input:

```json
{
  "transcript": "Please pause for a short status update.",
  "voiceSampleUrl": "https://audio.zenon.red/voice/samples/zoe-sample.mp3",
  "context": "Calm and clear.",
  "responseFormat": "wav"
}
```

Alternative input (local file path):

```json
{
  "transcript": "Please pause for a short status update.",
  "voiceSamplePath": "/tmp/sample.wav",
  "context": "Calm and clear.",
  "responseFormat": "wav"
}
```

Output:

```json
{
  "audioUrl": "https://media.example.com/voice/2026-04-29/tts_2ab54d77.wav",
  "transcript": "Please pause for a short status update.",
  "voice": "voiceclone",
  "durationMs": 1987
}
```

## Validation Failure Example

```json
{
  "error": "Transcript exceeds 500 characters.",
  "stage": "validation"
}
```
