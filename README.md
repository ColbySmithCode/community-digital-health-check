# Digital Health Check

> **This is the standalone Presence module from [Main Street AI](https://github.com/colbysmithcode/main-street-ai)** — a free, open-source AI platform built for nonprofits and small businesses. Fork this repo if you just want the audit tool. Visit Main Street AI for the full platform: grant writing, donor letters, volunteer coordination, impact reporting, and more.

**A free digital presence audit for small businesses, nonprofits, and community organizations who can't afford an agency.**

Getting an honest assessment of your organization's online presence normally costs hundreds of dollars or requires knowing someone in marketing. This tool makes that assessment free and instant — no signup, no sales call, no catch.

Enter your organization's name and city. In about 30 seconds, you get a prioritized action plan: what's working, what's broken, what to fix first (for free), and what to invest in when you have resources.

**Try it → [digital-health-check.pages.dev](https://digital-health-check.pages.dev)**

---

## Who This Is For

- A nonprofit director who knows their website is outdated but doesn't know where to start
- A restaurant owner who's never had help with their online presence
- A community organization trying to reach more people on a zero budget
- Any small business that can't afford to hire an agency but wants honest advice

The audit is designed to be understood by someone with no marketing background. Jargon is explained. Recommendations are ordered by impact and cost (free things first).

---

## What You Get

**Overall Digital Health Score** (A–F) with a plain-English summary of where you stand.

**Quick Wins (Free)** — things you can fix today with no budget: Google Business Profile completeness, social media profile optimization, broken links, missing contact info.

**Website Assessment** — page speed estimate, mobile-friendliness, presence of key trust signals (phone number, address, reviews, SSL), missing pages.

**Social Media Presence** — which platforms you're on, activity level, what's missing, what matters most for your type of organization.

**SEO Basics** — whether you show up when people search for what you do, what your biggest visibility gap is.

**Recommended Next Steps** — 3–5 specific actions, ordered by expected impact, with estimated time and cost for each.

---

## How It Works

1. You enter an organization name and city
2. The Worker searches for publicly available information about your organization
3. Claude AI synthesizes the findings into a structured audit
4. Results render in the browser — no account needed, no data stored

Nothing you submit is saved. Results are generated fresh each time.

---

## Deploy Your Own (Free)

This runs entirely on Cloudflare's free tier. You need a Cloudflare account and an Anthropic API key.

```bash
git clone https://github.com/colbysmithcode/community-digital-health-check
cd community-digital-health-check/worker
npm install
wrangler secret put ANTHROPIC_API_KEY
wrangler deploy
```

Then update `frontend/index.html` with your Worker URL and deploy the frontend:

```bash
cd ../frontend
wrangler pages deploy . --project-name digital-health-check
```

That's it. You have a live digital health check tool at `your-project.pages.dev`.

---

## Why I Built This

I run a small AI marketing agency ([More Than Momentum](https://morethanmomentum.com)). The tools I use internally to audit prospects — Prospect Intelligence, Lead Scoring — do exactly what this tool does. The only difference is who gets access.

Nonprofits and small community organizations need honest digital advice more than anyone. They're the ones losing volunteers and donors to groups with better websites. They're the ones invisible on Google when someone searches for local help. But they're also the ones least likely to be able to afford a consultation.

This is the same audit, made free, for them.

---

## Stack

| Layer | Technology |
|---|---|
| Backend | Cloudflare Workers |
| AI | Anthropic Claude claude-haiku-4-5 (fast + affordable) |
| Frontend | Single-page HTML/CSS/JS (no build step, easy to fork) |
| Hosting | Cloudflare Pages (free tier) |
| Data stored | None |

---

## Contributing

This is open source. If you work with nonprofits or underserved communities and want to adapt this for your context — add more languages, tune the recommendations for a specific sector, integrate with local business databases — pull requests are welcome.

---

## License

MIT — fork it, deploy it, adapt it.
