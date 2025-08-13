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
