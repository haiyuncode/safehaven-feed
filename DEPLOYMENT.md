## Deployment, Domains, and Costs

This guide explains how to deploy, customize the URL, connect a custom domain, and understand costs.

### 1) Current Production URL

- After the latest push, Vercel auto‑deployed your app to:
  - `https://safehaven-feed-khwsksk68-acloudseas-projects.vercel.app/feed/positivity`
- This is free on the Vercel Hobby plan.

### 2) Get a cleaner free URL on vercel.app

You can rename the Vercel project to claim a shorter `*.vercel.app` hostname.

Steps:

1. Open Vercel dashboard → your project → Settings → General.
2. Change "Project Name" to `safehaven-feed` (or any available name).
3. Vercel assigns `https://<project-name>.vercel.app` automatically if the name is unique.
4. Update any bookmarks and references.

Notes:

- Renaming is free and immediate. If the name is taken, try a variant (e.g., `safehaven-feed-app`).

### 3) Connect your own custom domain (optional)

Connecting a domain you own is free; buying/registering a domain costs money (via any registrar). If you already own a domain, you can point it to Vercel.

Steps:

1. Vercel → your project → Settings → Domains → Add.
2. Enter your domain, e.g., `safehaven.example` or `feed.safehaven.example`.
3. Vercel shows required DNS records (A/AAAA/CNAME). Apply them at your registrar or DNS host.
4. Wait for DNS to propagate (typically minutes to a few hours).
5. Vercel will auto‑issue HTTPS certificates.

Costs:

- Connecting is free on Hobby. Buying a domain costs whatever your registrar charges.

### 4) Recommended redirects and canonical URL

After you set a canonical domain, redirect alternate hostnames to it for consistency.

Option A: Configure redirects in Vercel UI (Project → Settings → Redirects).

Option B: Add `vercel.json` in repo root:

```json
{
  "redirects": [
    { "source": "/", "destination": "/feed/positivity", "permanent": false }
  ]
}
```

You can also add host‑based redirects if you want to force a specific domain.

### 5) Caching `public/feeds/*.json`

To balance freshness and performance, add headers via `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/public/feeds/(.*).json",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=300, stale-while-revalidate=60"
        }
      ]
    }
  ]
}
```

This sets a 5‑minute CDN TTL with a short stale window. Adjust to preference.

### 6) CI/CD flow recap

- GitHub Actions builds feeds every 6 hours and commits `public/feeds/*.json`.
- On commit to `main`, Vercel auto‑deploys.
- If direct push conflicts occur, the workflow retries and falls back to an automated PR if needed.

### 7) Verifying everything

1. Trigger the workflow (scheduled or manual) and check successful completion in GitHub Actions.
2. Watch the Vercel deployment; a new deployment should appear after the commit.
3. Open `/feed/positivity`, `/feed/narcissism`, and `/feed/fitness` and verify latest content.

### 8) Cost overview (Hobby plan)

- Vercel hosting: free for Hobby projects within fair‑use limits.
- GitHub Actions: free for public repos (private repos include a monthly free tier).
- RSS parsing: uses public endpoints, no API costs.
- Custom domain: free to connect; domain purchase costs extra (registrar dependent).
