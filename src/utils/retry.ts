function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function withRetries<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        break;
      }
      const backoffMs = 200 * 2 ** attempt;
      await sleep(backoffMs);
      attempt += 1;
    }
  }

  throw lastError;
}
