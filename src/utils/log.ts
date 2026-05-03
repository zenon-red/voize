export function logStage(stage: string, status: 'ok' | 'error', extra: Record<string, unknown> = {}): void {
  console.error(
    JSON.stringify({
      stage,
      status,
      ...extra,
    })
  );
}
