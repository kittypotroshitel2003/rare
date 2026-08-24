# CLAUDE.md — Frontend Website Rules

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.
- **Invoke the relevant Emil Kowalski skills** (installed under `~/.claude/skills/`) at the start of every new request that touches frontend code, before writing or editing anything:
  - `emil-design-eng` and `apple-design` — general polish/craft philosophy, load these first on any UI work.
  - `find-animation-opportunities` — when starting work on a page/section, to spot places that should animate but don't.
  - `animate` — when actually implementing any motion/transition.
  - `review-animations` — after implementing motion, to check it against the standards.
  - `improve-animations` — when asked to audit or improve animation across multiple pages.
  - `animation-vocabulary` — to look up the exact name of an effect being discussed.
  - `pick-ui-library` / `prototype` / `ask-sonner` / `animate-expo` / `write-swift` are installed but not applicable to this project (plain HTML/CSS/JS, no React/Expo/Swift, no toast library) — skip them here.

## Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, generic copy). Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see guardrails below).
- Screenshot your output, compare against reference, fix mismatches, re-screenshot. Do at least 2 comparison rounds. Stop only when no visible differences remain or user says so.

## Local Server
- **Always serve on localhost** — never screenshot a `file:///` URL.
- Start the dev server: `node serve.mjs` (serves the project root at `http://localhost:3000`)
- `serve.mjs` lives in the project root. Start it in the background before taking any screenshots.
- If the server is already running, do not start a second instance.

## Screenshot Workflow
- Puppeteer is installed. Chrome cache is in `~/.cache/puppeteer/`.
- **Always screenshot from localhost:** `node screenshot.mjs http://localhost:3000`
- Screenshots are saved automatically to `./temporary screenshots/screenshot-N.png` (auto-incremented, never overwritten).
- Optional label suffix: `node screenshot.mjs http://localhost:3000 label` → saves as `screenshot-N-label.png`
- `screenshot.mjs` lives in the project root. Use it as-is.
- After screenshotting, read the PNG from `temporary screenshots/` with the Read tool — Claude can see and analyze the image directly.
- When comparing, be specific: "heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px"
- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing

## Output Defaults
- Single `index.html` file, all styles inline, unless user says otherwise
- Tailwind CSS via CDN: `<script src="https://cdn.tailwindcss.com"></script>`
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT`
- Mobile-first responsive

## Brand Assets
- Always check the `brand_assets/` folder before designing. It may contain logos, color guides, style guides, or images.
- If assets exist there, use them. Do not use placeholders where real assets are available.
- If a logo is present, use it. If a color palette is defined, use those exact values — do not invent brand colors.

## Anti-Generic Guardrails
- **Colors:** Never use default Tailwind palette (indigo-500, blue-600, etc.). Pick a custom brand color and derive from it.
- **Shadows:** Never use flat `shadow-md`. Use layered, color-tinted shadows with low opacity.
- **Typography:** Never use the same font for headings and body. Pair a display/serif with a clean sans. Apply tight tracking (`-0.03em`) on large headings, generous line-height (`1.7`) on body.
- **Gradients:** Layer multiple radial gradients. Add grain/texture via SVG noise filter for depth.
- **Animations:** Only animate `transform` and `opacity`. Never `transition-all`. Use spring-style easing.
- **Interactive states:** Every clickable element needs hover, focus-visible, and active states. No exceptions.
- **Images:** Add a gradient overlay (`bg-gradient-to-t from-black/60`) and a color treatment layer with `mix-blend-multiply`.
- **Spacing:** Use intentional, consistent spacing tokens — not random Tailwind steps.
- **Depth:** Surfaces should have a layering system (base → elevated → floating), not all sit at the same z-plane.

## SEO Skills (claude-seo)
- Source: [AgriciDaniel/claude-seo](https://github.com/AgriciDaniel/claude-seo) (MIT). Requires one-time setup before these work: `/plugin marketplace add AgriciDaniel/claude-seo`, then `/plugin install claude-seo@agricidaniel-claude-seo`, then `/seo setup`.
- Entry point: `/seo audit <url>` for a full parallel-subagent site audit; `/seo plan`, `/seo doctor` etc. for other top-level commands. Individual skills below can also be invoked directly when the request matches their trigger.
- Invoke `seo` first for any general SEO question — it's the umbrella skill (industry detection, routes to the right sub-skill).
- Sub-skills, invoke by match:
  - `seo-audit` — full-site crawl + parallel specialist delegation + health score.
  - `seo-technical` — crawlability, indexability, security, URL structure, mobile, Core Web Vitals, structured data, JS rendering, IndexNow.
  - `seo-page` — deep single-page analysis (on-page, meta, schema, images, performance).
  - `seo-content` — E-E-A-T and content-quality analysis, AI citation readiness.
  - `seo-content-brief` — competitive content briefs with word counts and keyword density.
  - `seo-schema` — Schema.org / JSON-LD detection, validation, generation.
  - `seo-local` — Google Business Profile, NAP consistency, citations, local schema, multi-location.
  - `seo-maps` — geo-grid rank tracking, GBP audit, review intelligence, NAP cross-platform checks.
  - `seo-images` — alt text, file size/format, responsive images, lazy loading, CLS, image SERP.
  - `seo-image-gen` — AI-generated OG/hero/schema/product images (needs the `banana` extension).
  - `seo-sitemap` — XML sitemap analysis and generation.
  - `seo-hreflang` — hreflang/i18n audit, validation, generation.
  - `seo-backlinks` — referring domains, anchor text, toxic links, competitor gap (free APIs + optional DataForSEO).
  - `seo-cluster` — SERP-based topic clustering, hub-and-spoke architecture, internal link matrices.
  - `seo-competitor-pages` — "X vs Y" / alternatives / comparison pages.
  - `seo-programmatic` — programmatic/scaled page templates, thin-content and index-bloat safeguards.
  - `seo-ecommerce` — Google Shopping, marketplace intelligence, product schema, pricing/keyword gaps.
  - `seo-geo` — GEO for AI Overviews, ChatGPT, Perplexity (brand mentions, AI crawler access).
  - `seo-sxo` — search-experience optimization: page-type/intent mismatch, persona scoring.
  - `seo-drift` — baseline/diff/track regressions in on-page SEO over time ("git for SEO").
  - `seo-plan` — strategic SEO plan/roadmap for new or existing sites, industry templates.
  - `seo-flow` — FLOW (Find→Leverage→Optimize→Win) framework prompts.
  - `seo-google` — Search Console, PageSpeed/CrUX, Indexing API, GA4 (needs Google API auth).
  - `seo-dataforseo` — live SERP/keyword/backlink/competitor data (needs DataForSEO extension + credentials).
- Paid-API extensions (ahrefs, dataforseo, bing-webmaster, firecrawl, profound, seranking, unlighthouse, banana) are separate opt-in installs, each needing its own credentials — not installed here; only note if the user asks for one specifically.

## Hard Rules
- Do not add sections, features, or content not in the reference
- Do not "improve" a reference design — match it
- Do not stop after one screenshot pass
- Do not use `transition-all`
- Do not use default Tailwind blue/indigo as primary color