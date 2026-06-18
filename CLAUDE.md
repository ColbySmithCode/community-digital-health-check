# Digital Health Check

A free digital presence audit for small businesses, nonprofits, and community organizations who can't afford an agency. No signup required. Nothing is stored.

## How It Works

```
frontend/index.html   ← single HTML file, calls the worker
worker/src/index.js   ← Cloudflare Worker: POST /audit → Claude Haiku → JSON
```

User enters org name, city, and type. The worker calls Claude Haiku with a structured system prompt that enforces a specific JSON schema. The frontend renders the result.

## Key Commands

```bash
# Worker — local dev
cd worker && npm install && wrangler dev

# Worker — deploy
wrangler deploy

# Frontend — deploy to Cloudflare Pages (free)
wrangler pages deploy frontend/ --project-name digital-health-check
```

## Secrets

```bash
# Only one secret needed
wrangler secret put ANTHROPIC_API_KEY
```

## After Deploying

Update the `WORKER_URL` constant at the top of `frontend/index.html`:

```js
const WORKER_URL = 'https://digital-health-check.YOUR_SUBDOMAIN.workers.dev';
```

## JSON Schema

The worker enforces this output shape from Claude:

```json
{
  "organization": "string",
  "city": "string",
  "type": "string",
  "overall_grade": "A | B | C | D | F",
  "grade_summary": "string",
  "score": 0-100,
  "quick_wins": [{ "action", "why", "cost", "time" }],
  "website": { "assessment", "key_issues", "missing_elements", "priority_fix" },
  "social_media": { "assessment", "platforms_to_prioritize", "what_to_post" },
  "local_seo": { "assessment", "google_business_priority", "google_business_tips", "search_visibility_gap" },
  "recommended_steps": [{ "step", "action", "impact", "cost", "time_to_complete", "details" }],
  "encouragement": "string"
}
```

The worker strips markdown fences if Claude wraps the JSON anyway (defensive parse).

## Customizing the Audit

To tune the advice for a specific sector (e.g. healthcare nonprofits, faith organizations):

1. Edit the `SYSTEM_PROMPT` in `worker/src/index.js`
2. Add sector-specific guidance after "Be direct and specific."
3. Redeploy: `wrangler deploy`

## Why Claude Haiku (not Sonnet)

This tool is free to use. Haiku is ~15x cheaper than Sonnet per token. The structured JSON prompt doesn't need Sonnet's reasoning depth — Haiku handles it reliably and responds in 5–10 seconds instead of 20–30.

## Extending

To add a new audit section (e.g. "email marketing"):
1. Add the section to the JSON schema in `SYSTEM_PROMPT`
2. Add a renderer for it in the `renderResults()` function in `frontend/index.html`
3. The worker automatically passes the new field through — no other changes needed

## License

MIT. Fork it, deploy it, adapt it for your community.
