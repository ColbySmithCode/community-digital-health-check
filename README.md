# Digital Health Check

A free digital presence audit for small businesses, nonprofits, and community organizations that can't afford an agency.

Enter an organization's name, city, and type. You get a plain-English report with no signup and nothing saved:

- **An overall grade** from A to F, a 0 to 100 score, and a short explanation of where you stand
- **Quick wins**, which are specific things you can fix for free or close to it, with time estimates
- **A website assessment** covering likely issues, missing pages, and the first thing to fix
- **Social media advice** on which platforms matter for your kind of organization and what to post
- **Local search tips**, mostly about your Google Business Profile
- **Recommended next steps**, ordered by impact, with cost and time for each

**How to read the results:** the audit is written by Claude from the name, city, and type you enter. It doesn't crawl your website or look anything up live. Treat it as an informed starting checklist to check against your real site and profiles, not as a measured report.

## Why I built this

Getting an honest read on your online presence usually costs money or means knowing someone in marketing. Nonprofits and small community groups need that advice more than anyone, and they're the least likely to be able to pay for it.

This tool shares a backend with More Than Momentum's Prospect Intelligence tool, which audits prospects for an agency. Here the same kind of audit is free for anyone to use.

## How it works

```
frontend/index.html  ──POST /audit──►  Cloudflare Worker  ──►  Claude Haiku 4.5
  (name, city, type)                   (system prompt with a      │
                                        strict JSON format)       ▼
          ◄──────────────── structured JSON audit, rendered as a report
```

The worker's system prompt forces Claude to answer in a fixed JSON format, so the frontend can always render the same sections. Nothing is stored. Every request is generated fresh.

## Stack

| Layer | Technology |
|---|---|
| Backend | Cloudflare Workers |
| AI | Anthropic Claude Haiku 4.5 |
| Frontend | One HTML file with plain CSS and JavaScript, no build step |
| Hosting | Cloudflare Pages |
| Data stored | None |

## Run it locally

You need Node.js 18 or newer and an Anthropic API key.

```bash
git clone https://github.com/colbysmithcode/community-digital-health-check
cd community-digital-health-check/worker
npm install
cp ../.dev.vars.example .dev.vars   # then paste your Anthropic key into .dev.vars
npx wrangler dev
```

The worker starts at `http://localhost:8787`. Check that it's up:

```bash
curl http://localhost:8787/health
```

Then open `frontend/index.html`, change the `WORKER_URL` value in its script section to `http://localhost:8787`, and open the file in your browser.

## Deploy your own

This runs on Cloudflare's free tier. You need a Cloudflare account and an Anthropic API key.

```bash
cd worker
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler deploy
```

Set `WORKER_URL` in `frontend/index.html` to the URL that `wrangler deploy` printed, then publish the page:

```bash
npx wrangler pages deploy ../frontend --project-name digital-health-check
```

## Project layout

```
community-digital-health-check/
├── frontend/index.html   the form and the report page
├── worker/src/index.js   the API: POST /audit and GET /health
└── mcp/server.js         optional MCP server for local testing: runs a test audit,
                          checks worker health, and shows the system prompt
                          (set WORKER_URL, then `npm install && npm test` in mcp/)
```

## Related

[Main Street AI](https://github.com/colbysmithcode/main-street-ai) is a set of free AI writing tools for small organizations: grant letters, donor letters, volunteer messages, and impact reports.

## Contributing

If you work with nonprofits or underserved communities and want to adapt this, pull requests are welcome. Good starting points are tuning the advice for a specific sector or adding another language.

## License

MIT. See [LICENSE](LICENSE).

---

Built by [Colby Smith](https://github.com/colbysmithcode).
