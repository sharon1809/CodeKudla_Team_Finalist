/**
 * API Key Manager with automatic failover rotation & fallback.
 * Supports bracket arrays, comma-separated keys, or numbered keys in .env:
 * - OPENROUTER_API_KEYS=[key1, key2, key3]
 * - OPENROUTER_API_KEY=key1, key2, key3
 * - GEMINI_API_KEYS=[key1, key2, key3]
 * - GEMINI_API_KEY=key1, key2, key3
 */

const sanitizeKey = (k: string): string => {
  return k.replace(/[\[\]'"\s]/g, '').trim();
};

export const getOpenRouterApiKeys = (): string[] => {
  const envKeys = process.env.OPENROUTER_API_KEYS || process.env.OPENROUTER_API_KEY || '';
  const parsed = envKeys
    .split(',')
    .map(sanitizeKey)
    .filter((k) => k.length > 0 && !k.includes('your_openrouter_api_key'));

  // Also check numbered environment variables OPENROUTER_API_KEY_1, OPENROUTER_API_KEY_2, etc.
  for (let i = 1; i <= 10; i++) {
    const rawKey = process.env[`OPENROUTER_API_KEY_${i}`];
    if (rawKey) {
      const key = sanitizeKey(rawKey);
      if (key && !parsed.includes(key)) {
        parsed.push(key);
      }
    }
  }

  return parsed;
};

export const getGeminiApiKeys = (): string[] => {
  const envKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
  const parsed = envKeys
    .split(',')
    .map(sanitizeKey)
    .filter((k) => k.length > 0 && !k.includes('your_gemini_api_key'));

  // Also check numbered environment variables GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.
  for (let i = 1; i <= 10; i++) {
    const rawKey = process.env[`GEMINI_API_KEY_${i}`];
    if (rawKey) {
      const key = sanitizeKey(rawKey);
      if (key && !parsed.includes(key)) {
        parsed.push(key);
      }
    }
  }

  return parsed;
};

/**
 * Executes an async LLM or Vision operation with automatic API key fallback.
 * If the current key fails (429 rate limit, 401 unauthorized, quota, network error),
 * it logs a warning and tries the next API key in the pool array automatically!
 */
export async function executeWithFallback<T>(
  provider: 'openrouter' | 'gemini',
  operation: (apiKey: string) => Promise<T>
): Promise<T> {
  const keys = provider === 'openrouter' ? getOpenRouterApiKeys() : getGeminiApiKeys();

  if (keys.length === 0) {
    throw new Error(`No API keys configured for ${provider.toUpperCase()}. Please check your .env file.`);
  }

  let lastError: any = null;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    try {
      const result = await operation(key);
      if (i > 0) {
        console.log(`✅ [${provider.toUpperCase()}] Succeeded using fallback API key #${i + 1}`);
      }
      return result;
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      console.warn(
        `⚠️ [${provider.toUpperCase()}] API Key ${i + 1}/${keys.length} failed (${errMsg.substring(0, 90)}...). Trying fallback API key #${i + 2}...`
      );
    }
  }

  throw new Error(`All ${keys.length} ${provider.toUpperCase()} API keys failed. Last error: ${lastError?.message || lastError}`);
}
