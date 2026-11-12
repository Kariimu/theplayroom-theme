# TASK.md — The Playroom React theme: everything left to do

One list from today's state to a live, audited theme. Work top to bottom, **one stage per session**.
How to run a stage: tell the agent `Do Stage N of TASK.md`. It ticks the boxes, fills the stage's "Result" line, commits, and stops.

Read first: `AGENTS.md` (engine rules + Playroom section) and `docs/MIGRATION-PLAN.md` (the design; section 5A is binding). This file is the checklist, the plan is the reasoning. If they disagree, stop and ask the owner.

## Rules for every stage
- Branch: create `stage-N-short-name` from `migration`, open a pull request into `migration` when the stage is done (Stage 13 describes the review). Never commit to, merge into, or push `master`. Never publish or change anything in the Salla Partners Portal or the store dashboard. Those are owner steps, marked **OWNER**.
- Look up every engine API in the docs before using it (`https://docs.salla.dev/twilight/react/llms.txt`, add `.md` to page URLs).
- A stage is done only when `pnpm build`, `pnpm typecheck`, `pnpm test` and `pnpm check:manifest` pass, and the owner has looked at `/ar` and `/en` on mobile and desktop. Do not start `pnpm dev`; ask the owner to run `salla theme dev --store <id>` and say exactly which URLs to open and what to look for.
- New component or helper = at least one test in `tests/` (the starter already has Vitest set up; follow its patterns).
- Every string in both `locales/ar.json` and `locales/en.json`. Logical CSS only (`ms-*`, `ps-*`, `text-start`).
- Every forked engine component gets its row in `FORKS.md` in the same commit.
- If something cannot be done as written, do not improvise a workaround: write what blocked you under the stage and stop.

## Status on 12 Nov 2026
- [x] Setup: repo, `migration` branch, docs, dependencies
- [x] Phase 0 spike (report was given in chat; **not yet written into the plan**)
- [x] Phase 0b data extraction: `docs/legacy/data/` (43 sitemap products, only 14 render a product page; 14 products share one 16-question FAQ; 3 products have facts; 4 universal features; no feature badges, cards, suggested games or dimension images found)
- [ ] Everything below. `twilight.json` and `app/` are still the untouched starter.

## Open decisions (OWNER) — answer before the stage named
| # | Decision | Needed by |
|---|---|---|
| D1 | Salla's answers to the questions in plan section 2 (Twig end date for this store, saved-settings migration, framework accepted) | Stage 14 |
| ~~D2~~ | **Resolved 12 Nov 2026: dashboard-editable** through the `common-questions-section` block (and/or product specs), not hard-coded in theme files | Stage 1 |
| D3 | Gallery page: rebuild as `/gallery` from products tagged `gallery`, or drop it and keep the home gallery/reels blocks | Stage 4 |
| D4 | Side cart drawer: skip (as today) or build | Stage 6 |
| D5 | Cloudflare: are AI crawlers allowed on theplayroom.sa? (needed for GEO) | Stage 10 |
| D6 | The 29 sitemap products that redirect to the home page: delete, restore, or redirect each to a relevant category | Stage 9 |

---

## Stage 1 — Plan update and manifest
Goal: the plan reflects what Phase 0 proved, and `twilight.json` is final.
- [ ] Write a "Phase 0 findings" section in `docs/MIGRATION-PLAN.md` (observed data shapes for specs, tags, category fields, menus) and set the final tier for every row of 5A — **BLOCKED**: the spike report lives only in an earlier chat, not this repo (TASK line 19). Owner will paste it; the four 5A verification items are flagged PENDING in the plan and tiers stay provisional until then.
- [x] `app/lib/tags.ts`: the single list of tag conventions (`whatsapp`, `cart-upsell`, `feature:`, `card:`, `set:`, `Group-Value` filter tags) + dev-only unknown-tag warning, with tests
- [x] `twilight.json`: starter base + the Tier-4 "keep" settings (`show_whatsapp`, `whatsapp_number`, `footer_logo`, `footer_description`) with old ids/Arabic labels; no root collections, no root product pickers. `categories_whatsapp` held pending the spike (tags vs fallback dropdown)
- [x] Six shared home blocks: already carry the legacy `key`/`path` in the starter and lack no legacy field (verified) — no change needed
- [x] Twelve custom home blocks declared with exact `key`/`path`/title/icon/fields (incl. `fatures`); two value-only fixes for the React validator (boolean `0→false`, collection `maxLength` string→int), no ids touched
- [x] Stub component per new block (`app/components/home/stubs.tsx`), registered in `app/router.tsx` after `...DefaultHomeComponents`, with tests
- [x] `twilight.preview.json`: kept + documented (dev-server home preview layout; starter default for now, real arrangement rebuilt in Stage 3)
Done when: all 18 blocks can be added in the dev settings panel and render (stubs show their data keys).
Result: **Partial — mechanical manifest + code complete, Phase 0 findings blocked on the owner's spike report.** `pnpm build`, `typecheck`, `check:manifest` green; all new tests pass; no new test failures (10 pre-existing failures in PageAdvertisements/ProductDetails/ProductGallery exist on the `migration` base, unrelated to this stage). twilight.json: 23 components (11 starter + 12 custom), 33 settings. OWNER: (1) paste the Phase 0 spike report so the findings section + final tiers can be written; (2) run `salla theme dev --store <store-id>` and add each of the 18 blocks in the settings panel at `/ar` and `/en`, confirming each renders its data keys. PR into `migration` after the report lands and tiers are locked.

## Stage 2 — Foundation
- [ ] Design tokens, body background, custom fonts (`dongol`), Tailwind config ported from the old theme (`docs/legacy/06` §13–14, old `master.twig` `:root`, old `styles.scss`)
- [ ] Layout and header: logo, menu from the dashboard menu, side menu, search with suggestions from `locales`
- [ ] Footer: dashboard footer menu, logo/description settings, native payment and trust components
- [ ] Floating WhatsApp button through the `body:end` hook slot (`show_whatsapp`, `whatsapp_number`)
- [ ] Product card: wrap the engine card, register as `product:card`; WhatsApp button for products tagged `whatsapp`, number from the setting
- [ ] Store-wide content into `locales`: 4 universal features, search suggestions, FAQ per D2 (source: `docs/legacy/data/store-wide.json`)
Done when: home, a category and a product page show the Playroom header, footer, colours, fonts and card in both languages.
Result:

## Stage 3 — Home blocks
Build the twelve stubs into real blocks, simplest first; one commit per block, each with a test.
- [ ] `banner-section` - [ ] `features-section` - [ ] `features2-section` - [ ] `common-questions-section`
- [ ] `products-section` - [ ] `shopping1-section` - [ ] `custom-brands-section` - [ ] `reviews-section`
- [ ] `gallery-section` - [ ] `modern-banner-section` - [ ] `reels-section` - [ ] `instagram-section`
- [ ] Extend the six shared blocks for the extra fields
- [ ] Reserve height for each block with `registerHomeComponentConfig` (no layout shift)
Done when: the owner rebuilds the live home page arrangement in the dev panel and it matches the live site.
Result:

## Stage 4 — Category / listing page
- [ ] Hero from the category's own image and description; sub-category cards from `sub_categories`
- [ ] Filters: native `SallaFilters` first; add the tag-group filter only for what native filters cannot do
- [ ] Sort, product count, infinite list with the Playroom card
- [ ] Gallery per D3
- [ ] Re-render the listing page's hook slots in the fork
Done when: every live category URL renders with the right hero, products and filters in both languages.
Result:

## Stage 5 — Product page
One section per commit, in this order:
- [ ] Gallery (fit, zoom, thumbnails), title, rating summary, price, description
- [ ] Add-to-cart form and sticky bar; WhatsApp block for `whatsapp`-tagged products
- [ ] Product facts from specs (for who, material, box contents); specs accordion
- [ ] Universal features, trust/payment badges
- [ ] FAQ accordion (per D2)
- [ ] Suggested games from the shared `set:` tag; related products
- [ ] Reviews from engine data (no DOM scraping)
- [ ] Hook slots of the product page preserved
Done when: the three products with facts and one plain product match the live pages, and name, price, description, facts and FAQ are in View Source.
Result:

## Stage 6 — Cart and remaining pages
- [ ] Cart layout, free-shipping bar, coupons, upsell slider (products tagged `cart-upsell`)
- [ ] Add-to-cart toast styling
- [ ] Thank-you, wishlist, account pages: restyle only what differs from the starter
- [ ] Cart drawer per D4
- [ ] 404 and empty states
Done when: a full test order on the preview store works in both languages (add, change quantity, coupon, checkout hand-off, thank-you).
Result:

## Stage 7 — Data entry (OWNER, can start now, in parallel)
The old theme ignores this data, so it is safe to enter while the Twig theme is live.
- [ ] Enter facts as specs on the 3 products listed in `docs/legacy/data/products.csv`
- [ ] Add tags where needed (`whatsapp`, `cart-upsell`, `set:<name>`) per `app/lib/tags.ts`
- [ ] Category images and descriptions for categories that had banners (`docs/legacy/data/categories.csv`)
- [ ] Header and footer menus in the dashboard match the old side menu and footer columns
- [ ] Screenshot the current home page setup and every theme setting screen (rollback reference)
Agent task: produce a one-page checklist `docs/DATA-ENTRY.md` from the CSVs so the owner can tick products off.
Result:

## Stage 8 — Quality pass
- [ ] Accessibility: keyboard reach for menus, modals, accordions, sliders; focus visible; alt text; colour contrast; `lang`/`dir` correct; form labels
- [ ] RTL and LTR visual check of every page type at 360px, 768px, 1280px
- [ ] Every merchant setting changed once in the dev panel and its effect confirmed
- [ ] Route transitions: navigate between all page types without a full reload and without stale state
- [ ] Installed store apps still load after client-side navigation (chat, analytics, reviews translator)
- [ ] Remove dead code, stubs, dev notes, console output; `FORKS.md` complete
Result:

## Stage 9 — SEO
First record what the engine already emits (title, meta, canonical, hreflang, JSON-LD) on home, category and product pages. Add only what is missing; never duplicate a tag or schema the engine outputs.
- [ ] View Source (not DevTools) contains product name, price, description, facts, FAQ, category text and product links
- [ ] One `<h1>` per page; heading order sensible; internal links use the engine `Link` and are real `<a href>` in HTML
- [ ] Titles and meta descriptions come from the store's SEO fields; canonical and `hreflang` (ar/en) present and reciprocal
- [ ] Structured data valid in Google's Rich Results Test: Product (price, availability, SKU, brand, rating), BreadcrumbList, Organization
- [ ] URL parity: every live URL in `docs/legacy/data/urls.json` returns the same page type on the new theme; old Gallery/"All products" pseudo-category URLs have a destination
- [ ] D6 handled (OWNER) so the sitemap has no URLs that bounce to the home page
- [ ] Images: width/height set, lazy below the fold, eager + high priority for the LCP image, served through the CDN resizer
- [ ] `sitemap.xml` and `robots.txt` checked (these are served by Salla; report anything wrong to the owner, do not try to override)
Deliverable: `docs/audits/seo.md` with before (live Twig) vs after (staging) for 3 URLs.
Result:

## Stage 10 — GEO (visibility in AI search and assistants)
- [ ] Each product page answers, in plain server-rendered text: what it is, age range, material, dimensions/box contents, price, availability, delivery and returns
- [ ] FAQ rendered as real text in HTML with FAQPage structured data (only where the FAQ is visible on that page)
- [ ] Organization data: brand name in Arabic and English, logo, contact, social profiles (`sameAs`)
- [ ] Arabic and English pages carry the same facts
- [ ] Reviews and ratings present in HTML where the store shows them
- [ ] D5 (OWNER): confirm in Cloudflare that AI crawlers are not blocked for theplayroom.sa, if the owner wants AI visibility
- [ ] `llms.txt`: check whether a file in `public/` is served at the site root on Salla; add a short one only if it is, and note that its effect is unproven
- [ ] Content suggestions for the owner: a list of products whose descriptions lack the facts above (do not rewrite store content yourself)
Deliverable: `docs/audits/geo.md`.
Result:

## Stage 11 — Performance
- [ ] Lighthouse mobile on home, category, product, cart: Performance above 85 (Salla's bar); record LCP, CLS, INP, total JS
- [ ] Bundle review (`stats.html` from the build): no heavy dependency for a small feature; lazy-load below-the-fold blocks and modals
- [ ] Fonts: preload only what the first screen needs, `font-display: swap`
- [ ] Third-party scripts pinned, deferred, and justified
Deliverable: `docs/audits/performance.md` with numbers against the live Twig site.
Result:

## Stage 12 — Security audit (Cloudflare security-audit skill)
- [ ] Install the skill in this repo if missing: `npx skills add https://github.com/cloudflare/security-audit-skill --skill security-audit`
- [ ] Run it on this codebase ("security audit this codebase"), output to `docs/audits/security/`
- [ ] Give special attention to: any `dangerouslySetInnerHTML` (product description, specs, setting text), links built from settings or tags (WhatsApp number, `set:`/`feature:` values), external scripts and embeds (YouTube, Instagram), data kept in `localStorage`, anything in `public/_headers`
- [ ] `pnpm audit`; no secrets in the repo or its history; `.env` stays ignored
- [ ] Fix every confirmed finding of medium severity or above, each in its own commit with a test; list accepted lows with the reason
- [ ] Re-run the audit to confirm fixes
Scope note: the skill reviews this code. Cloudflare account settings for theplayroom.sa (WAF, bot rules, SSL mode, DNS, email records) are an OWNER review, not something to change from here.
Result:

## Stage 13 — Pull request review
Applies to every stage PR, and in full to the final PR `migration` → `master`.
- [ ] One-time: add a GitHub Actions workflow that runs build, typecheck, test and check:manifest on every PR (ask the owner first: confirm that an extra workflow file does not interfere with Salla's build)
- [ ] PR description: what changed, how it was verified, screenshots ar/en mobile/desktop, forks added, settings/tags added
- [ ] Review by a **fresh agent session that did not write the code**, against this checklist: follows `AGENTS.md`; no root collections or product pickers; no engine internals imported; no manual DOM edits or `window.*` globals; strings in both locales; tests exist and are meaningful; no dead code; `FORKS.md` updated; nothing from `docs/legacy/09-known-issues.md` reintroduced
- [ ] Findings fixed or answered in the PR; reviewer re-checks
- [ ] OWNER approves and merges. The agent never merges into `master`
Result:

## Stage 14 — Staging preview
Goal: the owner clicks through the real theme on a real store before the live store changes.
- [ ] OWNER: create a demo store for this theme in the Partners Portal (each theme needs its own preview store)
- [ ] OWNER: in the theme's portal page set "GitHub Branch" to `migration`, so the staging build comes from `migration` and `master` stays untouched; confirm the build log is green
- [ ] OWNER: install the theme on the demo store ("Send Installation Request") and set up the home page and settings from the Stage 7 screenshots
- [ ] Agent: write `docs/STAGING-CHECKLIST.md`, a click-through script covering every page type, both languages, a test order, each setting, each home block, and the installed apps
- [ ] Owner walk-through; issues logged in TASK.md and fixed through normal stage PRs
- [ ] Re-run Stages 9 to 12 checks against the staging URL (they were run locally before)
Result:

## Stage 15 — Go live and rollback (OWNER, agent prepares)
- [ ] Agent: `docs/GO-LIVE.md` with the exact order of steps, a 15-minute smoke test, and the rollback steps (re-activate the Twig theme)
- [ ] D1 answered; final PR `migration` → `master` reviewed (Stage 13) and merged by the owner
- [ ] Publish in the portal; activate on the live store at a quiet hour
- [ ] Smoke test: home, category, product, add to cart, checkout hand-off, thank-you, language switch, WhatsApp button, search
- [ ] Analytics and ad pixels receiving events; Search Console: submit sitemap, inspect 3 URLs
- [ ] Keep the Twig theme installed until Stage 16 is finished
Result:

## Stage 16 — After launch
- [ ] Week 1: daily check of orders, Search Console coverage and errors, Core Web Vitals, console errors on key pages
- [ ] Week 2–4: compare organic traffic and conversion with the month before; fix regressions
- [ ] Engine upgrades: monthly, bump `@salla.sa/twilight-theme-engine`, follow "Upgrading the engine" in `FORKS.md`, run all checks, staging first
- [ ] Archive the old Twig folder once the owner confirms no rollback is needed
Result:
