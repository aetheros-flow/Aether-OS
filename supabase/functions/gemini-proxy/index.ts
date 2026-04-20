// Supabase Edge Function: gemini-proxy
// -----------------------------------------------------------------------------
// Proxies requests to Google Gemini so the API key never ships to the browser.
//
// Deployment:
//   1. supabase secrets set GEMINI_API_KEY=<key>
//   2. supabase functions deploy gemini-proxy
//
// Client calls:
//   POST /functions/v1/gemini-proxy
//   Body: { prompt: string, systemInstruction?: string, responseMimeType?: string, model?: string }
//
// The function validates the Supabase auth JWT (enforced by platform) and
// forwards a structured request to Gemini's generateContent endpoint.
// -----------------------------------------------------------------------------

// @ts-ignore Deno runtime import
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// @ts-ignore Deno runtime
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
// @ts-ignore Deno runtime
const DEFAULT_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ProxyRequest {
  prompt: string;
  systemInstruction?: string;
  responseMimeType?: 'text/plain' | 'application/json';
  model?: string;
  temperature?: number;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }
  if (!GEMINI_API_KEY) {
    return json({ error: 'GEMINI_API_KEY not configured on server.' }, 500);
  }

  let body: ProxyRequest;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }
  if (!body.prompt || typeof body.prompt !== 'string') {
    return json({ error: 'Missing required "prompt" (string).' }, 400);
  }

  const model = body.model ?? DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${GEMINI_API_KEY}`;

  const payload: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: body.prompt }] }],
    generationConfig: {
      temperature: body.temperature ?? 0.2,
      responseMimeType: body.responseMimeType ?? 'text/plain',
    },
  };
  if (body.systemInstruction) {
    payload.systemInstruction = { parts: [{ text: body.systemInstruction }] };
  }

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const raw = await upstream.text();
    if (!upstream.ok) {
      return json({ error: 'Gemini upstream error.', status: upstream.status, details: raw.slice(0, 2000) }, 502);
    }
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch {
      return json({ error: 'Upstream returned non-JSON.' }, 502);
    }
    const text = parsed?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? '';
    return json({ text, raw: parsed });
  } catch (err) {
    return json({ error: 'Network error calling Gemini.', message: (err as Error).message }, 502);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
