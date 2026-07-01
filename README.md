# Willow & Bloom Family Clinic — Vercel Deployment

This version is restructured specifically for **Vercel**: the frontend is
static HTML/CSS/JS at the project root, and the chatbot backend is a
**Vercel Serverless Function** at `/api/chat`. One project, one deploy —
no separate server to host.

```
.
├── index.html, about.html, services.html, contact.html   ← static pages
├── css/style.css
├── js/main.js, chatbot.js         ← chatbot.js calls /api/chat (same origin)
├── robots.txt, sitemap.xml
├── api/
│   ├── chat.js                    ← serverless function, calls Gemini
│   └── health.js                  ← simple health check
├── lib/
│   ├── clinicInfo.js              ← edit this to update hours/services/contact
│   ├── geminiClient.js            ← Gemini API call + system prompt
│   └── rateLimit.js               ← basic in-memory abuse protection
├── package.json
├── vercel.json                    ← tells Vercel: no build step needed
└── .env.example
```

## 1. Push this to GitHub

Commit and push this whole folder as your repo (or replace the contents of
your existing `clinic` repo with these files). Make sure there is **no other
`package.json` with a `react-scripts build` script** anywhere in the repo —
that was the cause of your earlier build error, since this project needs no
build step at all.

## 2. Import into Vercel

- Framework Preset: **Other**
- Root Directory: the repo root (unless you nested this folder — then point to it)
- Build Command: leave **empty** (already set via `vercel.json`)
- Output Directory: `.`

## 3. Add environment variables (this is the part you asked about)

In Vercel → your project → **Settings → Environment Variables**, add:

| Name | Value | Environments |
|---|---|---|
| `GEMINI_API_KEY` | your real key from https://aistudio.google.com/app/apikey | Production, Preview, Development |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Production, Preview, Development |
| `ALLOWED_ORIGINS` | `*` (or lock to `https://your-domain.vercel.app`) | Production, Preview, Development |

Then **redeploy** — env variables only apply to deployments made *after*
they're saved, not retroactively.

## 4. Test after deploy

```bash
curl https://your-project.vercel.app/api/health

curl -X POST https://your-project.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What are your clinic hours?"}'
```

The chat widget on the website itself calls `/api/chat` automatically — no
extra config needed since frontend and API now live on the same domain.

## 5. Local testing (optional)

```bash
npm i -g vercel
cp .env.example .env
vercel dev
```

This runs both the static site and the `/api` functions locally, using the
`.env` values.

## Updating clinic info

Edit `lib/clinicInfo.js` — hours, services, phone, address, insurance note.
The chatbot is instructed to only state facts from this file.

## Note on rate limiting

`lib/rateLimit.js` is an in-memory, best-effort limiter (30 messages per 10
minutes per IP). Serverless functions can run on multiple instances, so this
isn't a perfectly global limit — for strict enforcement at scale, swap it for
Vercel KV or Upstash Redis. It's enough to stop casual abuse and runaway API
costs for a typical clinic site.
