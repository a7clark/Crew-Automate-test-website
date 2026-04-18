# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dev Server & Screenshots

```bash
node serve.mjs          # Start local server at http://localhost:3000
node screenshot.mjs http://localhost:3000 label   # Save screenshot to ./temporary screenshots/screenshot-N-label.png
```

`serve.mjs` decodes URL-encoded paths — required for video files with spaces (e.g. `Crew%20Automate.mp4`).

## Deployment

The site is deployed to **crewautomate.ai** via Vercel (project: `crew-automate`, org: `a7clarks-projects`). Every `git push` to `main` auto-deploys.

```bash
npx vercel --prod   # Manual deploy if needed
```

DNS is managed via Cloudflare. The `CLOUDFLARE_API_TOKEN` in `~/.env` is scoped to Workers only — it cannot edit DNS records. DNS changes must be made in the Cloudflare dashboard.

## Architecture

Single `index.html` — all HTML, CSS, and JS inline. No build step, no framework, no dependencies beyond Google Fonts (CDN).

**Design system** (CSS variables in `:root`):
- Dark theme: `--bg #080807`, `--text #F0EDE8`, `--gold #A8874A`, `--stone #8C7B68`, `--muted #6A6760`
- Fonts: Cormorant Garamond (serif, headings/display) + Syne (sans, labels/UI)

**Page sections in order:** Full-viewport hero video → Selected Work (project list + featured image) → Visual Archive (3-card hover-to-play reel) → Stats Bar → Studio/About → Footer

**Hero video:** `Crew Automate.mp4`, full `100vw × 100vh`, `object-fit: cover`. Nav floats transparently over it and gains a frosted-glass background (`.scrolled` class) after the user scrolls 60% past the fold.

**Visual Archive reel:** `mouseenter` → `video.play()`, `mouseleave` → `video.pause()` + reset. Cards use `preload="none"` to avoid loading all videos on page load.

## Video Assets

| File | Used in |
|------|---------|
| `Crew Automate.mp4` | Hero (autoplay, fullscreen) |
| `Crew Automate.mp4` | Visual Archive card 1 |
| `Real Life Skycraper.mp4` | Visual Archive card 2 |
| `Skycraper.mp4` | Visual Archive card 3 |
| `Highrise.mp4` | Unused (previously hero) |

## Seedance Skill

`.claude/SKILL.md` (skill name: `seedance-loop-prompt`) generates Seedance 2 looping video prompts. Trigger it when the user asks for video prompts, background loops, or mentions Seedance.

Calibration examples are in `example-prompts.md` — three complete prompt outputs showing expected structure and detail level (headphones deconstruction, luxury watch, sports car city flythrough).

## Brand Assets

`Architecture.png` and `Blueprint.png` are project images available for use in the site. `dribbble.com_shots_*.png` is a design reference screenshot.
