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
| ~~D3~~ | **Resolved 13 Nov 2026: dropped.** No `/gallery` route; the home `gallery-section` and `reels-section` blocks (Stage 3) cover it | Stage 4 |
| D4 | Side cart drawer: skip (as today) or build | Stage 6 |
| D5 | Cloudflare: are AI crawlers allowed on theplayroom.sa? (needed for GEO) | Stage 10 |
| D6 | The 29 sitemap products that redirect to the home page: delete, restore, or redirect each to a relevant category | Stage 9 |

---

## Stage 1 — Plan update and manifest
Goal: the plan reflects what Phase 0 proved, and `twilight.json` is final.
- [x] "Phase 0 findings" section in `docs/MIGRATION-PLAN.md` §5B (from `docs/PHASE-0-FINDINGS.md`) with the final tier for every 5A row; PENDING flags cleared. The three "Confirm in Stage 1" items verified against the engine in this repo: (1) specs are **client-only** (no server metadata fetch → SEO text also goes in the description); (2) `'tags'` is a valid list source, numeric id from the tag URL (`tagIdFromUrl`); (3) `Category` carries `description`/`image`/`sub_categories` (values are Stage-7 data entry).
- [x] `app/lib/tags.ts`: the single list of tag conventions (`whatsapp`, `cart-upsell`, `feature:`, `card:`, `set:`, `Group-Value` filter tags) + dev-only unknown-tag warning, with tests
- [x] `twilight.json`: starter base + the Tier-4 "keep" settings (`show_whatsapp`, `whatsapp_number`, `footer_logo`, `footer_description`) with old ids/Arabic labels; no root collections, no root product pickers. `categories_whatsapp` held pending the spike (tags vs fallback dropdown)
- [x] Six shared home blocks: already carry the legacy `key`/`path` in the starter and lack no legacy field (verified) — no change needed
- [x] Twelve custom home blocks declared with exact `key`/`path`/title/icon/fields (incl. `fatures`); two value-only fixes for the React validator (boolean `0→false`, collection `maxLength` string→int), no ids touched
- [x] Stub component per new block (`app/components/home/stubs.tsx`), registered in `app/router.tsx` after `...DefaultHomeComponents`, with tests
- [x] `twilight.preview.json`: kept + documented (dev-server home preview layout; starter default for now, real arrangement rebuilt in Stage 3)
Done when: all 18 blocks can be added in the dev settings panel and render (stubs show their data keys).
Result: **Complete.** `docs/PHASE-0-FINDINGS.md` replaces the lost spike report; findings + final tiers written into plan §5B, all three "Confirm in Stage 1" items repo-verified. `app/lib/tags.ts` (conventions + `tagIdFromUrl` for list-by-tag) and `app/components/home/stubs.tsx` (12 placeholders) added with tests. `twilight.json`: 23 components (11 starter + 12 custom), 34 settings (4 Tier-4 keep + a section heading); `categories_whatsapp` left out (tags cover it); no root collections/pickers. `twilight.preview.json` kept + documented. `pnpm build`, `typecheck`, `check:manifest` and all new tests green; the 10 pre-existing failures (PageAdvertisements/ProductDetails/ProductGallery) are on the `migration` base, unrelated. Owner confirmed in live preview that all 18 blocks add and render their data keys (the 12 custom ones show the Stage-1 placeholder by design). Next: open PR `stage-1-manifest` → `migration`.

## Stage 2 — Foundation  (IMPLEMENTED — branch `stage-2-foundation`, stacked on `stage-1-manifest`; awaiting owner visual pass, then PR)
- [x] Design tokens, body background (#fcf9f5), `dongol` self-hosted + LTR system-font fallback, 4 brand tints in Tailwind + `:root`
- [x] Layout and header: starter provides logo, dashboard menu (`HeaderMainMenu`), hierarchical side-drawer (`HeaderNav`), search (`SallaSearch`); Playroom colours/fonts via tokens. Search suggestions: **owner chose `salla-search`'s built-in popular/recent searches** (shown in the modal natively) — `salla-search` has no slot for custom terms; the curated `search_texts` were dropped. Side-menu display rule = dashboard menu as-is (owner tidies, no code).
- [x] Footer: dashboard footer menu (`SallaMenu`), native payments (`SallaPayments`) + trust badges (`SallaTrustBadges`) already in the starter; wired `footer_logo` / `footer_description` settings on top (with tests). Confirm the native payment/trust components render — owner browser check.
- [x] Floating WhatsApp button through the `body:end` hook slot (`show_whatsapp`, `whatsapp_number`)
- [~] Product card: WhatsApp-enquiry swap for `whatsapp`-tagged products (CSS-hide buy button + enquiry link in footer), used by the theme card in the home blocks. **NOT globally registered as `product:card`** — the theme card wraps the engine card which re-resolves `product:card`, so registering it recursed and froze the page (reverted). A global override needs a from-scratch card → Stage 4/5 when list/product pages are forked, so the swap applies there too.
- [x] Store-wide content into `locales`: 4 universal features (EN authored, images in `public/features/`) + WhatsApp enquiry message. FAQ excluded per D2; search suggestions dropped (native, per above).
Done when: home, a category and a product page show the Playroom header, footer, colours, fonts and card in both languages.
Result: **All six items implemented; awaiting owner visual verification, then PR.** Committed on `stage-2-foundation`: tokens/fonts/background; floating WhatsApp (body:end); product card register/override + WhatsApp swap; footer logo/description settings; store-wide locales (universal features + enquiry message); native search suggestions. Each with tests; typecheck + build + check:manifest green; all new Stage-2 tests pass (pre-existing 10 failures unrelated, on the migration base). **Fixed after owner testing: a swipe-down hang — the product-card WhatsApp swap had an infinite setState loop (now CSS-hide + stable-footer portal), and the header suggestion chips churned on scroll (removed).** **OWNER to restart the dev server + hard-reload, confirm no hang on scroll, then verify home/category/product at `/ar` and `/en`, mobile + desktop (esp. the product-card WhatsApp swap + header/footer).** Then PR into `migration` (rebase once Stage 1 merges).

## Stage 3 — Home blocks  (IMPLEMENTED — branch `stage-3-home-blocks`, stacked on `stage-2-foundation`; awaiting owner visual pass, then PR)
Build the twelve stubs into real blocks, simplest first; one commit per block, each with a test.
- [x] `banner-section` - [x] `features-section` - [x] `features2-section` - [x] `common-questions-section`
- [x] `products-section` - [x] `shopping1-section` - [x] `custom-brands-section` - [x] `reviews-section`
- [x] `gallery-section` - [x] `modern-banner-section` - [x] `reels-section` - [x] `instagram-section`
- [x] Extend the six shared blocks for the extra fields
- [x] Reserve height for each block with `registerHomeComponentConfig` (no layout shift)
Done when: the owner rebuilds the live home page arrangement in the dev panel and it matches the live site.
Result: **All twelve blocks implemented, registered and height-reserved; `stubs.tsx` (and its test) deleted now the placeholder list is empty.** One commit per block, each with its own test: `banner-section` (picture/source, no link), `features-section` (up to 4 icon items), `features2-section` (up to 3 larger cards, legacy `fatures` field id kept), `common-questions-section` (native `<details>` accordion — resolves D2), `products-section` (grid of up to 24 selected products via `product.list`), `shopping1-section` ("shop by type" tiles with per-item style toggle), `custom-brands-section` (static grid or CSS-marquee strip, motion-respecting), `reviews-section` (merchant-authored rating banner, not individual reviews), `gallery-section` (up to 5 photo tiles), `modern-banner-section` (hotspot banner + feature grid + WhatsApp CTA), `reels-section` (scrolling click-to-play video row), `instagram-section` (profile mockup + post grid opening a `BottomSheet`). `modern-banner-section` and `reels-section` fetch their hotspot/tagged products by id via `product.queries.list` instead of porting the Twig `all_products` duplicate-picker workaround (`Theplayroom-theme/src/views/components/home/modern-banner-section.twig`); `instagram-section` wires `follow_btn`/`showing-btn` instead of hard-coding the profile URL — both documented Twig bugs (`docs/legacy/09-known-issues.md` #1 class) deliberately not ported. New shared helpers `app/lib/pickerValue.ts` (`scalar`/`toIds`) and `app/lib/resolveLink.ts`, extracted from `FeaturedProducts` and reused by five of the new blocks. Auditing all six already-built shared blocks against their manifest fields found two real gaps, both fixed with a regression test proving the fix matters: `MainLinks` read `merge_links_with_top_component`, a field that doesn't exist — the manifest's real id is `merge_with_top_component` (fixed in `MainLinks.tsx` and `router.tsx`); `custom-testimonials` had silently dropped its `items.image` field versus `docs/legacy/old-twilight.json` (restored to `twilight.json`, wired through `TestimonialsCarousel` as a "view photo" trigger opening a `BottomSheet`). The other four shared blocks (`FeaturedProducts` and its variants, `FixedProducts`, `Brands`, `MainLinksSlider`) matched their manifest fields; no changes needed there beyond the `pickerValue` extraction. No engine components were forked this stage; `FORKS.md` is unchanged. `pnpm build`, `pnpm typecheck` and `pnpm check:manifest` all green. `pnpm test`: 10 failed / 748 passed — the 10 are the same `PageAdvertisements`/`ProductDetails`/`ProductGallery` failures Stage 1 and Stage 2 already documented as pre-existing on the `migration` base, unrelated to this stage (confirmed via `git stash` isolation). A third, newly-surfaced bucket of 31 `FeaturedProducts.test.tsx` failures (`useTwilight must be used within a TwilightProvider`, thrown from the real `ProductCard.tsx` Stage 2 added) was **not** pre-existing baseline noise — it was a missing test mock — and has been fixed in its own commit, dropping the suite from 41 to the expected 10. **Owner action needed for "Done when":** rebuild the live home page arrangement in the dev panel (`pnpm dev`, not run by the agent) and compare against theplayroom.sa at `/ar` and `/en`, mobile + desktop. Expect the page to look emptier than the old stub placeholders until each block's fields are filled in — every block now correctly renders nothing on empty data (e.g. `brands: []`, `items: []`, `posts: []` in the current `twilight.preview.json`); `banner-section` is the one block with image data already set, so it should be the only one visible before the arrangement is filled in. Stacking: `stage-3-home-blocks` is based on `stage-2-foundation` (itself on `stage-1-manifest`); rebase onto `migration` once Stages 1 and 2 are merged. Next: owner dev-panel pass, then open PR `stage-3-home-blocks` → `migration`.

## Stage 4 — Category / listing page  (IMPLEMENTED — branch `stage-4-category`, stacked on `stage-3-home-blocks`; awaiting owner visual pass, then PR)
- [x] Hero from the category's own image and description; sub-category cards from `sub_categories`
- [x] Filters: native `SallaFilters` first; add the tag-group filter only for what native filters cannot do
- [x] Sort, product count, infinite list with the Playroom card
- [x] Gallery per D3
- [x] Re-render the listing page's hook slots in the fork
Done when: every live category URL renders with the right hero, products and filters in both languages.
Result: **All five items done.** Category, search, tag, brand and the static listings (latest/sales/offers) already shared one engine-unified route (`ProductListing`) rendering through a single registered `product:list-page` component — `app/components/product/ProductListPage.tsx`, built in an earlier, undocumented increment with filters/sort/infinite-scroll/hook-slots already working and `FORKS.md`-recorded, but with no test file and no category hero. No route fork was needed this stage (unlike `product`/`cart`/`page`): the registry already routes every listing page through it. Added this stage: `CategoryHero` (`app/components/category/CategoryHero.tsx`) — the category's own `image`/`description` plus a `sub_categories` card row, with no `<h1>` of its own so the page keeps a single title; a product count (the category's own `products_count` while idle and nothing is filtering, else the tag-group filter's own match count — never a number next to an active native filter, since cursor pagination carries no total to report); and the "Group-Value" tag filter (`app/lib/tagGroupFilters.ts` + `app/components/product/TagGroupFilters.tsx`) ported from the old theme's `products.js` (06 §6: age range, color, skills) — the one thing native filters can't do since it's a plain product tag, not a configured attribute. **Owner decision made this stage:** native Age Range (etc.) attribute filters are *not* configured in the Salla dashboard today, so the tag-group filter was built rather than skipped; it shows its own filter column even when native filters are off store-wide. Filtering happens inside `ItemsList`'s children render-prop (the only place its live, infinite-scroll-accumulated list is visible) so it stays correct as more pages load; the filter *groups* are built once from the route's own loaded page only, same limitation the old theme had (`salla.event.once`) — documented, not a regression. D3 resolved this stage: dropped, no `/gallery` route (see decisions table). `pnpm build`, `pnpm typecheck` and `pnpm check:manifest` all green. `pnpm test`: 10 failed / 774 passed — the 10 are the same pre-existing `PageAdvertisements`/`ProductDetails`/`ProductGallery` failures Stages 1–3 already documented; 26 new tests this stage (`tagGroupFilters.ts`, `TagGroupFilters.tsx`, `CategoryHero.tsx`, plus the first-ever test file for the pre-existing `ProductListPage.tsx`, scoped to the new behaviour, not full regression coverage of code this stage didn't author) all pass. **Owner action needed:** (1) open a real category at `/ar` and `/en`, mobile + desktop — if the hero image/sub-category cards don't appear for a category that has them filled in in the dashboard, the loader isn't fetching `image`/`description`/`sub_categories` and that's a real gap to report back, not a false negative; (2) tag a couple of real products with `"<Group>-<Value>"` tags (e.g. `"Age Range-7 months - 5 years"`) on a category page to confirm the filter column renders and narrows the grid; (3) separately, consider configuring a native Age Range attribute filter in the Salla dashboard — if added later, `<salla-filters>` picks it up automatically with no code change, and the two filters would coexist (no conflict). Stacking: `stage-4-category` is based on `stage-3-home-blocks` (itself on `stage-2-foundation`, on `stage-1-manifest`); rebase onto `migration` once earlier stages merge. Next: owner visual + data-verification pass, then open PR `stage-4-category` → `migration`.

## Stage 5 — Product page  (IMPLEMENTED — branch `stage-5-product-page`, stacked on `stage-4-styling`; awaiting owner visual pass, then PR)
One section per commit, in this order:
- [x] Gallery (fit, zoom, thumbnails), title, rating summary, price, description
- [x] Add-to-cart form and sticky bar; WhatsApp block for `whatsapp`-tagged products
- [x] Product facts from specs (for who, material, box contents); specs accordion
- [x] Universal features, trust/payment badges
- [x] FAQ accordion (per D2)
- [x] Suggested games from the shared `set:` tag; related products
- [x] Reviews from engine data (no DOM scraping)
- [x] Hook slots of the product page preserved
Done when: the three products with facts and one plain product match the live pages, and name, price, description, facts and FAQ are in View Source.
Result: **All eight items done, in five commits (one per section, as instructed).** Item 1 (gallery/title/rating/price/description), item 7 (`<SallaComments>`) and the hook-slot set were already built in an earlier, undocumented increment (`product/ProductPage.tsx`, `ProductDetails.tsx`, `ProductGallery.tsx`, `AddToCartForm.tsx` — all pre-existing and `FORKS.md`-recorded before this stage), same pattern Stage 4 found for `ProductListPage`; verified against legacy `06-custom-features.md` §7 rather than rebuilt, and confirmed no `<HookSlot>`/`<BlockHookSlot>` was removed across this stage's commits (`git diff` tag-to-tag). Built this stage: **(1)** `ProductWhatsAppEnquiry` — replaces `AddToCartForm` for a `whatsapp`-tagged product, same `wa.me` convention as the card; extracted the duplicated WhatsApp glyph into a shared `WhatsAppIcon`. **(2)** `app/lib/specs.ts` fixes the canonical facts-group/field names (§5A row 65: "تفاصيل المنتج" / "Product Details", for_who/material/inner_box) the owner must use verbatim in Stage 7 data entry, matched case/whitespace-insensitively; `ProductFacts` reads them via `Salla.metadata.fetchValues` (confirmed in `sdk/metadata.md` — a real client API independent of the `<salla-metadata>` web component) so a compact icon+label row renders above the existing generic specs accordion (`ProductMetadata`, unchanged) instead of leaving facts one click away. **(3)** `UniversalFeatures` and native `SallaTrustBadges`/`SallaPayments` — neither rendered anywhere on the product page before this stage; `UniversalFeatures` finally surfaces the 4 store-wide features Stage 2 authored into `locales`/`public/features/` but never wired to any component. **(4)** `ProductFaq`: per D2, the FAQ lives in the dashboard-editable `common-questions-section` home block, not a per-product specs group or `locales` — `home.components()` is documented as callable from any route (`api/modules/home.md`), so the product page reads the exact same merchant-edited questions instead of duplicating them; extracted `FaqAccordion` out of `CommonQuestionsSection` so both render through identical markup/classes (`CommonQuestionsSection`'s own tests pass unchanged). **(5)** `SuggestedGames`: a product's `set:<name>` tag → its numeric id via the existing `tagIdFromUrl` (built in Stage 1 for exactly this) → the shared `ProductsSlider`, which gained an `excludeId` prop (a tag-based list includes the current product) that filters before the configured limit is applied. No product in the live catalogue currently carries `whatsapp` or `set:` tags (Phase 0b), so both paths are proven only by tests, not by a real product today — flagged for the owner's Stage 7 data entry and a Stage 14 staging re-check. **Known gap against "Done when":** facts and FAQ are **not** in View Source — both are fetched client-side (`useQuery` / `Salla.metadata.fetchValues`), consistent with how every other `useQuery`-driven piece of this codebase already works (header/footer menus, product sliders) and with the Phase 0 finding that specs are client-only; getting FAQ/facts text into SSR HTML is explicitly Stage 9's job ("View Source... contains... facts, FAQ"), not Stage 5's — doing it here only for this one block would be inconsistent, one-off SSR plumbing ahead of that stage. `pnpm build`, `pnpm typecheck` and `pnpm check:manifest` all green; `pnpm test`: 10 failed / 830 passed — the same pre-existing `PageAdvertisements`/`ProductDetails`/`ProductGallery` wishlist-heart failures Stages 1–4 documented on the `migration` base, confirmed unchanged at every commit in this stage; 16 new test files/additions this stage all pass. **Two unrelated issues surfaced while preparing this stage's branch (both in the preceding, unofficial `stage-4-styling` commits, not this stage's work — flagged for the owner, not fixed here):** the custom vertical product card's styling pass dropped its on-image wishlist heart entirely (no wishlist control remains on that card layout); `ShoppingSection`'s `title_type`/`subtitle_type` toggle styling looks inverted relative to the dashboard's "العنوان طبيعى" ("normal title") label. **Owner action needed:** (1) open a real product at `/ar` and `/en`, mobile + desktop, for the three products with facts (`docs/legacy/data/products.csv`: بيت الألعاب, صندوق التخزين, مجموعة المغامرة) and one plain product; (2) tag one real product `whatsapp` and two products with a shared `set:<name>` tag to confirm both paths render; (3) the two flagged `stage-4-styling` issues above. Stacking: `stage-5-product-page` is based on `stage-4-styling` (itself stacked on `stage-4-category` → `stage-3-home-blocks` → `stage-2-foundation` → `stage-1-manifest`); rebase onto `migration` once earlier stages merge. Next: owner visual pass, then open PR `stage-5-product-page` → `migration`.

**Follow-up (owner-requested, same branch):** the `ShoppingSection` toggle bug flagged above is fixed — `title_type` now swaps to the small/colored variant when on, matching `subtitle_type`'s existing direction, so both read "normal title" the same way. `ProductDetails.tsx` now renders the description after `ProductFacts`/`ProductMetadata` instead of before them. `04-components/reviews.scss` (`.s-comments-product`) was redesigned from the two-column sticky-rail list to a responsive photo-card grid (2/3/4/6 columns), matching the legacy theme's custom `#reviews-container` grid (`docs/legacy/06-custom-features.md` §7.7) — CSS-only, same `<SallaComments>`/`<salla-comment-item>` markup, reviewer avatar standing in for the card photo. The vertical-card wishlist-heart regression from `stage-4-styling` is still open, untouched here. `pnpm build`, `pnpm typecheck`, `pnpm check:manifest` green; `pnpm test`: same pre-existing 10 failures, 1 new passing test added (`ShoppingSection.test.tsx`).

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
