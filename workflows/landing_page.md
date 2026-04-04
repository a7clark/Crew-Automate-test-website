# Workflow: Landing Page — Build, Screenshot, and Polish

## Objective
Build a professional landing page (`index.html`), verify it visually using automated screenshots, and iteratively polish until the output matches the brief.

---

## Required Inputs
| Input | Description |
|---|---|
| `brand_assets/` | Logo image(s) and brand guidelines PNG |
| Design brief | Sections needed, copy, target audience |
| `node_modules/puppeteer` | Installed via `npm install puppeteer` in repo root |

---

## Phase 1 — Write index.html

### Step 1.1 — Read brand guidelines
Before writing a single line of CSS, read the brand guidelines image:
```
Read: brand_assets/Crew Automate Brand Guidelines.png
```
Extract and note:
- Hex color palette (background, primary accent, secondary accent, text, orange CTA)
- Font families and weights
- Logo usage rules (clearspace, allowed backgrounds)

### Step 1.2 — Define sections
Standard landing page structure for a community/product:
1. Nav (fixed, blur backdrop)
2. Hero (full-screen, headline + CTA + animated background)
3. Stats Bar (animated counters)
4. About / Mission (two-column, logo + copy)
5. Benefits / Features (card grid)
6. How It Works (numbered steps)
7. Testimonials (quote cards)
8. CTA Section (join prompt)
9. Footer (brand + links)

Adjust sections to match the brief. Document any section changes here.

### Step 1.3 — Write the page
- Single-file HTML with inline `<style>` and `<script>` blocks
- Use CSS custom properties for all brand colors — change one variable, update everywhere
- Roboto Mono for headings/labels, Montserrat for body copy
- Canvas particle animation for background (nodes + connecting lines)
- `.reveal` class + IntersectionObserver for scroll-in animations
- Animated counters on stats bar
- Fully responsive: collapse to 1-column on `max-width: 900px`

### Step 1.4 — Open in browser to confirm it loads
```bash
open index.html
```

---

## Phase 2 — Start Local Server and Take Screenshots

> ⚠️ Always run against a local server, not a bare `file://` URL, when the page loads external resources (fonts, APIs). For self-contained pages, `file://` is fine.

### Step 2.1 — Start local server (optional but recommended)
```bash
bash tools/serve_local.sh 8080
# Serves on http://localhost:8080
```
Leave the server running in the background for the rest of the session.

### Step 2.2 — Capture initial screenshots (Pass 1)
```bash
node tools/screenshot_review.mjs --pass=1
```
Output: `temporary screenshots/pass1/` — one PNG per section at 1440×900px, 2x pixel density.

If you need a quick flat capture without pass tracking:
```bash
node tools/screenshot_sections.mjs
```
Output: `temporary screenshots/` — flat directory, labeled `01 - Nav.png` through `09 - Footer.png`.

### Step 2.3 — Review Pass 1 screenshots
Open the output folder and check each section for:
- [ ] Brand colors match guidelines
- [ ] Fonts rendering correctly (Roboto Mono, Montserrat)
- [ ] Logo appears in nav, hero, about, footer
- [ ] Spacing and alignment look intentional
- [ ] Cards and grids are balanced
- [ ] Mobile breakpoints (re-run at 375px width if needed)
- [ ] Text is readable against background contrast
- [ ] CTAs are prominent and clear

---

## Phase 3 — Two-Pass Polish

### Pass 1 → Polish → Pass 2

After reviewing Pass 1:

**Step 3.1 — Note all issues**
List every issue found. Group by severity:
- **Critical** — broken layout, missing logo, illegible text
- **Major** — wrong colors, poor spacing, misaligned elements
- **Minor** — copy tweaks, subtle spacing adjustments

**Step 3.2 — Apply fixes**
Edit `index.html` directly. Fix in priority order: Critical → Major → Minor.

Common fixes and where to look:
| Issue | Location in file |
|---|---|
| Wrong background color | `:root` CSS variables |
| Font not loading | `<link>` in `<head>`, or font-family fallback in CSS |
| Logo path broken | `src="brand_assets/..."` attributes — must be relative to `index.html` |
| Section padding off | `.section-inner` padding values |
| Card hover not visible | `.benefit-card:hover` border-color and box-shadow |
| Stats counter not animating | `.stat-number[data-target]` — verify IntersectionObserver threshold |
| Reveal animation not firing | `.reveal` + `.visible` — check observer threshold and z-index |

**Step 3.3 — Capture Pass 2**
```bash
node tools/screenshot_review.mjs --pass=2
```

**Step 3.4 — Compare passes**
```bash
node tools/screenshot_review.mjs --diff
```
This prints a side-by-side file path table. Open both `pass1/` and `pass2/` in Finder or your IDE to compare.

**Step 3.5 — Confirm or iterate**
If the page looks good → done.
If issues remain → repeat Step 3.1 through 3.4 until resolved.

---

## Tools Reference

| Tool | Purpose |
|---|---|
| `tools/serve_local.sh [port]` | Start Python HTTP server on localhost |
| `tools/screenshot_sections.mjs [file] [outDir]` | Flat single-pass screenshot of all sections |
| `tools/screenshot_review.mjs --pass=1` | Screenshot into `pass1/` subfolder |
| `tools/screenshot_review.mjs --pass=2` | Screenshot into `pass2/` subfolder |
| `tools/screenshot_review.mjs --diff` | Print comparison table of pass1 vs pass2 |

---

## Expected Outputs
- `index.html` — final landing page
- `temporary screenshots/pass1/*.png` — baseline screenshots
- `temporary screenshots/pass2/*.png` — post-polish screenshots

---

## Edge Cases and Known Issues

| Situation | Fix |
|---|---|
| Google Fonts don't load in `file://` screenshots | Use local server (`serve_local.sh`) and update the puppeteer URL to `http://localhost:8080` |
| Canvas animation not visible in screenshot | Add a `setTimeout(2500)` delay before screenshotting — already in tools |
| `.reveal` elements still hidden in screenshot | Tool calls `page.evaluate()` to force `.visible` class — already handled |
| Logo broken after moving files | All `src` paths must be relative to `index.html` location, not the repo root |
| Puppeteer not found | Run `npm install puppeteer` from repo root |
