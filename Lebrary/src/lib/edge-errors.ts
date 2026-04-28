/**
 * Extracts a human-readable error message from a `supabase.functions.invoke`
 * failure. When the Edge Function returns a non-2xx, supabase-js wraps the
 * Response in `error.context` — reading that body is what actually tells us
 * what the server complained about.
 */
export async function extractEdgeFunctionError(
  error: unknown,
  fallback = 'Edge Function invocation failed.',
): Promise<string> {
  if (!error) return fallback;

  const anyErr = error as {
    context?: unknown;
    message?: string;
    name?: string;
  };

  // Newer supabase-js: `error.context` is the raw fetch Response.
  const ctx = anyErr.context;
  if (ctx && typeof ctx === 'object') {
    // Case 1: Response with async json()
    if ('json' in ctx && typeof (ctx as { json: () => Promise<unknown> }).json === 'function') {
      try {
        const cloned = 'clone' in ctx && typeof (ctx as { clone: () => Response }).clone === 'function'
          ? (ctx as Response).clone()
          : (ctx as Response);
        const body = await cloned.json().catch(() => null);
        if (body && typeof body === 'object' && 'error' in body) {
          const e = (body as { error?: unknown }).error;
          if (typeof e === 'string' && e.length > 0) return e;
        }
        // Some servers return a string body.
        const text = await (ctx as Response).text().catch(() => '');
        if (text) return tryParseErrorField(text) ?? text;
      } catch {
        // fall through
      }
    }

    // Case 2: already-decoded body field
    if ('body' in ctx) {
      const b = (ctx as { body?: unknown }).body;
      if (typeof b === 'string') return tryParseErrorField(b) ?? b;
      if (b && typeof b === 'object' && 'error' in b) {
        const e = (b as { error?: unknown }).error;
        if (typeof e === 'string') return e;
      }
    }
  }

  if (typeof anyErr.message === 'string' && anyErr.message.length > 0) {
    return anyErr.message;
  }

  return fallback;
}

function tryParseErrorField(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw) as { error?: unknown };
    if (typeof parsed.error === 'string') return parsed.error;
  } catch {
    // not JSON
  }
  return null;
}
