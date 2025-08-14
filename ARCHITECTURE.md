## Architecture and Maintenance

### Overview

Safehaven Feed is a privacy‑first, AI‑free Next.js app that serves topic‑locked short video feeds from static JSON. No backend is required; an optional GitHub Actions workflow can rebuild feeds on a schedule using RSS sources.

### Key Components

- App Router pages:
  - `app/page.tsx`: topic picker → routes to `feed/[topic]`.
  - `app/feed/[topic]/page.tsx`: loads `public/feeds/<topic>.json`, strips BOM, passes `videoIds` to the player.
- Components:
  - `Player.tsx`: YouTube no‑cookie embed with continuous playback, keyboard shortcuts, Like/Hide persistence.
  - `QuickExit.tsx`: safety escape; configurable target via `NEXT_PUBLIC_QUICK_EXIT_URL`.
- Data:
  - `public/feeds/*.json`: generated lists of videos (and optional articles/quotes).
  - `data/*.json`: source configuration and curated quotes.

### Build and Tests

- Tests: Node test runner validates feeds parse and contain at least one `videoId` per topic.
- `prebuild` runs `npm test` automatically before `next build` to prevent deploying empty/bad feeds.

### Feed Generation (optional Phase 3)

- Script: `scripts/build-feeds.ts` uses `rss-parser` to fetch whitelisted YouTube channel RSS and blogs.
- Output: deterministic, deduped, newest‑first `public/feeds/<topic>.json` with capped history.
- CI: `.github/workflows/build-feeds.yml` runs every 6 hours; commits updated feeds and triggers redeploy.
- Push logic: fetch + rebase vs remote, regenerate, retry with exponential backoff; fallback PR with auto‑merge attempt if direct push fails.

### Security and Privacy

- Embeds use `youtube-nocookie.com` and modest branding; start muted, captions when available.
- No user accounts; Like/Hide are stored locally in `localStorage` only.
- Quick Exit clears client storage and opens a neutral site in a new tab while navigating home.

### Accessibility and Safety

- Keyboard controls: Space/Up/Down/M.
- Quick Exit is always visible; color contrast uses neutral palette; add captions preference when supported.
- Crisis/disclaimer links shown on feed pages (Phase 5).

### Long‑term Maintenance

- Keep source lists (`data/sources.json`) small and vetted; review quarterly.
- Monitor feed build failures in CI; on failure, last good `public/feeds/*.json` continues to serve.
- Add lightweight integration tests that sample playability (e.g., HTTP 200 for thumbnails) without external APIs.
- Version feeds by schema if fields change; maintain backward‑compatible loaders in `page.tsx`.
- Document environment flags in `README.md` and ensure safe defaults.

### Domains

- Default deployment uses a generated `*.vercel.app` domain.
- You can rename the project in Vercel to claim a cleaner free `*.vercel.app` URL.
- You can connect a custom domain you own; connecting is free, domain registration costs extra.
- See `DEPLOYMENT.md` for details.

### Roadmap Notes

- Add `articles` and `quotes` panels (Phase 7) to enrich non‑video content.
- Consider preloading next item thumbnails to reduce transition gaps.
- Optional: expose a tiny settings panel for Like/Hide reset and keyboard help.
