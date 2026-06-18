/**
 * Digital Health Check — Cloudflare Worker
 *
 * Accepts: POST /audit { name: string, city: string, type: string }
 * Returns: structured JSON audit report
 *
 * No data is stored. Every request is processed fresh.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const SYSTEM_PROMPT = `You are a digital marketing consultant specializing in helping small businesses, nonprofits, and community organizations improve their online presence. You provide honest, practical advice that prioritizes free and low-cost solutions.

Your job is to produce a digital health audit based on an organization's name and city. You will not have direct access to their website — work from what you can reasonably infer and know about common patterns for this type of organization in this location.

Be direct and specific. Avoid vague advice. Every recommendation should be something the person can actually do.

Produce your response as valid JSON in exactly this format:

{
  "organization": "string — the org name as given",
  "city": "string — the city as given",
  "type": "string — the org type",
  "overall_grade": "A | B | C | D | F",
  "grade_summary": "string — 1–2 sentences explaining the grade in plain English, no jargon",
  "score": number between 0 and 100,

  "quick_wins": [
    {
      "action": "string — specific action to take",
      "why": "string — why this matters, in plain English",
      "cost": "Free | Under $20/mo | Varies",
      "time": "string — e.g. '15 minutes' or '1 hour'"
    }
  ],

  "website": {
    "assessment": "string — honest assessment of what their website likely looks like for this type of org",
    "key_issues": ["string"],
    "missing_elements": ["string — things most orgs of this type are missing"],
    "priority_fix": "string — the single most important website fix"
  },

  "social_media": {
    "assessment": "string",
    "platforms_to_prioritize": [
      { "platform": "string", "reason": "string" }
    ],
    "what_to_post": "string — specific content advice for this type of org"
  },

  "local_seo": {
    "assessment": "string",
    "google_business_priority": "High | Medium | Low",
    "google_business_tips": ["string"],
    "search_visibility_gap": "string — what people search for that they probably can't find this org for"
  },

  "recommended_steps": [
    {
      "step": number,
      "action": "string",
      "impact": "High | Medium | Low",
      "cost": "Free | Under $20/mo | Varies",
      "time_to_complete": "string",
      "details": "string — specific how-to, not generic advice"
    }
  ],

  "encouragement": "string — one genuine, specific sentence acknowledging something this type of org does well or a strength they likely already have"
}

Keep quick_wins to 3–5 items. Keep recommended_steps to 4–6 items, ordered by impact (highest first). Be specific to the org type and city — a restaurant in rural New Hampshire gets different advice than a nonprofit food bank in Chicago.`;

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // Health check is a GET — must be handled before the POST-only guard.
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'POST only' }), {
        status: 405,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname !== '/audit') {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const { name, city, type = 'small business' } = body;

    if (!name || !city) {
      return new Response(
        JSON.stringify({ error: 'name and city are required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedName = String(name).trim().slice(0, 120);
    const trimmedCity = String(city).trim().slice(0, 80);
    const trimmedType = String(type).trim().slice(0, 60);

    if (!trimmedName || !trimmedCity) {
      return new Response(
        JSON.stringify({ error: 'name and city cannot be empty' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const userMessage = `Please produce a digital health audit for:

Organization name: ${trimmedName}
City / location: ${trimmedCity}
Organization type: ${trimmedType}

Provide practical, specific recommendations. Prioritize free actions. Be honest about common gaps for this type of organization. Return only the JSON object — no markdown, no explanation, no code fences.`;

    let auditJson;
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMessage }],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Anthropic API error:', response.status, errText);
        return new Response(
          JSON.stringify({ error: 'AI service temporarily unavailable. Please try again in a moment.' }),
          { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const raw = data?.content?.[0]?.text || '';

      // Strip markdown fences if Claude wrapped it anyway
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

      try {
        auditJson = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error('JSON parse failed. Raw response:', raw);
        return new Response(
          JSON.stringify({ error: 'Failed to parse audit results. Please try again.' }),
          { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }
    } catch (fetchErr) {
      console.error('Fetch to Anthropic failed:', fetchErr?.message || fetchErr);
      return new Response(
        JSON.stringify({ error: 'Network error reaching AI service.' }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(auditJson), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  },
};
