## Safehaven Feed — Topic Shorts Feed (AI‑free)

Privacy‑first video feed with topic‑locked streams and continuous playback. No accounts, no AI, no tracking.

### Features (implemented)

- Topic pages at `feed/[topic]` loading from static JSON in `public/feeds/*.json`.
- Player with continuous playback and improved end detection.
- Keyboard shortcuts: Space (Play/Pause), Up (Prev), Down (Next), M (Mute).
- Like/Hide with `localStorage` persistence.
- Quick Exit: opens neutral site in a new tab and redirects home; target can be configured.

### Environment

- `NEXT_PUBLIC_QUICK_EXIT_URL` (optional): neutral destination for Quick Exit.
  - Default: `https://news.ycombinator.com`.

Create `.env.local`:

```
NEXT_PUBLIC_QUICK_EXIT_URL=https://www.weather.com
```

### Getting started

```powershell
npm run dev
# tests (run automatically before build via prebuild)
npm run test
npm run build
```

Open `http://localhost:3000` and choose a topic.

### Roadmap

- Phase 3: feed builder (`rss-parser`) + `scripts/build-feeds.ts` + cron workflow.
- Phase 5: safety/a11y polish (captions default when available, crisis links, color contrast).
- Phase 6: deploy to Vercel; add minimal monitoring.

See `../MVP2_DailyFeed.md` for full plan and `ARCHITECTURE.md` for design and maintenance.

### Live URL & Domains

- Current production URL: `https://safehaven-feed-khwsksk68-acloudseas-projects.vercel.app/feed/positivity`
- You can customize the URL in two ways:
  - Rename the Vercel project to claim a cleaner `*.vercel.app` domain (free). Example: `safehaven-feed.vercel.app` if available.
  - Add your own custom domain (free to connect; domain registration itself costs money if you need to purchase one).

See `./DEPLOYMENT.md` for step‑by‑step instructions.

### Operations (CI/CD)

- Feeds are rebuilt every 6 hours by GitHub Actions and committed to `public/feeds/*.json`.
- The workflow is resilient: retries on push conflicts and falls back to creating a PR if direct push fails.
- Vercel auto‑redeploys on commit to `main`.

### Next steps

1. Choose and set a canonical domain (clean `*.vercel.app` or your own domain) and enforce redirects.
2. Enable auto‑merge in the GitHub repo so the fallback PR flow can complete unattended.
3. Review branch protection and Actions permissions: repository → Settings → Actions → Workflow permissions → "Read and write".
4. Safety/a11y polish (captions, focus order, contrast) per `MVP2_DailyFeed.md`.
5. Optional: add `vercel.json` to fine‑tune CDN caching for `public/feeds/*.json` (e.g., 5‑minute CDN TTL with stale‑while‑revalidate).
