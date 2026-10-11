// Cloudflare Pages "advanced mode": este archivo NO se sirve al público.
// La API key vive solo en la variable secreta GEMINI_API_KEY (Cloudflare).
const SYS = 'Eres el asistente de una calculadora. Resuelves cálculos, porcentajes, conversiones de unidades y finanzas básicas. ' +
  'Responde SOLO JSON: {"result": "resultado final corto (número con punto decimal si es numérico)", "explanation": "explicación breve en español, máximo 3 frases"}. ' +
  'Si la pregunta no es de cálculo, deja result vacío y pide en explanation una pregunta de cálculo.';
const j = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/ask') return env.ASSETS.fetch(request); // archivos estáticos
    if (request.method !== 'POST') return j({ error: 'Método no permitido' }, 405);
    if (request.headers.get('Origin') !== url.origin) return j({ error: 'Acceso denegado' }, 403);
    if (!env.GEMINI_API_KEY) return j({ error: 'Falta configurar GEMINI_API_KEY' }, 500);
    let q;
    try { q = String((await request.json()).q || '').trim().slice(0, 400); } catch { return j({ error: 'Petición inválida' }, 400); }
    if (!q) return j({ error: 'Pregunta vacía' }, 400);
    const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYS }] },
        contents: [{ role: 'user', parts: [{ text: q }] }],
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 600, temperature: 0.2 }
      })
    });
    if (!r.ok) return j({ error: r.status === 429 ? 'Límite de uso alcanzado, prueba en un minuto' : 'La IA no respondió' }, 502);
    const d = await r.json();
    const t = (d.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
    try { const o = JSON.parse(t); return j({ result: String(o.result ?? ''), explanation: String(o.explanation ?? '') }); }
    catch { return j({ result: '', explanation: t.slice(0, 600) }); }
  }
};
