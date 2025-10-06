export async function withRetry(
  fn,
  { retries = 3, baseDelayMs = 300, only5xx = false } = {}
) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status =
        err?.statusCode || err?.response?.status || err?.status || null;
      const shouldRetry =
        (!only5xx && (status == null || status >= 500)) ||
        (only5xx && status >= 500);
      if (i < retries - 1 && shouldRetry) {
        await new Promise(r => setTimeout(r, baseDelayMs * Math.pow(2, i)));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}
