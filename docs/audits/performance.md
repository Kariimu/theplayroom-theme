# Stage 11 — Performance audit

Method: build the production bundle (`pnpm build`), serve it locally (`vite preview`, a
Cloudflare Workers-style local preview, not just dev mode), and measure that — not the dev
server — since `pnpm dev`'s unminified, uncoded-split output would misrepresent real
performance. Cross-checked bundle claims against `dist/stats.html` (the build's own
rollup-plugin-visualizer output) and real browser network traces (`claude-in-chrome`), not
just Lighthouse's JSON, because Lighthouse's absolute scores in this environment are heavily
network-latency-dominated (see caveat below) and would overstate or understate real changes
on their own.

**Important caveat on every Lighthouse number below**: this sandbox calls the real, live
Salla API (`api.salla.dev`) and CDN (`cdn.salla.network`) over whatever network path exists
from here — not Salla's production edge, which is what a real Saudi mobile visitor hits.
Both the new theme's local preview *and* the live Twig site score in the same poor range
(see §1) for metrics that are mostly about round-trip time to that API (LCP, TTI, the overall
score). That means the **score and LCP numbers are not reliable evidence of a regression or
an improvement** — they're similarly bad for both sites, for a reason neither theme's code
controls. What *is* theme-controlled and comparable here: JS/CSS byte weight, chunk
composition, and CLS. Those are what this audit leans on.

## 1. Lighthouse mobile, all four page types (local preview build)

| Page | Score | LCP | CLS | TBT | JS requests / weight |
|---|---|---|---|---|---|
| Home | 41 | 13.6 s | 0 | 890 ms | 102 / 1,393 KiB |
| Category | 46 | 15.1 s | 0 | 510 ms | 84 / 1,370 KiB |
| Product | 23 | 36.2 s | **0.247** | 1,030 ms | 116 / 1,628 KiB |
| Cart | 44 | 17.0 s | 0 | 620 ms | 85 / 1,354 KiB |

**None of the four reach Salla's 85 bar in this environment** — but neither does the live
Twig home page tested the same way (score 41, LCP 6.5s, TBT 2,350ms, 1,695 KiB JS — full
numbers in §2). Both sites are bottlenecked by the same thing: real round trips to
`api.salla.dev` and ~20-45 small Salla Twilight SDK chunks from `cdn.salla.network`
(confirmed by browser network trace, §4) that neither theme's code emits or controls.

**Product page's CLS (0.247, "poor") is the one metric here that isn't explained by network
noise** — CLS measures layout shift, not timing. Flagged for the owner's dev-server visual
pass; not chased further this stage since isolating which element shifts needs a real
browser session with throttled network to watch it happen, not a single automated run. Best
lead from this stage's own network trace: the product page's `metadata/values` API call
(powering `ProductFacts`/similar) resolves client-side and inserts a row above the
description once it does — a client-only insert above other content is a classic CLS source,
and the one place to look first.

## 2. Live Twig home page, same method, for comparison

Score 41, LCP 6.5s, CLS 0.001, TBT 2,350ms, FCP 1.6s, 76 script requests / 1,695 KiB JS,
3,840 KiB total page weight. The new theme's home page: 1,393 KiB JS (102 requests),
total weight not separately measured but its own bundle (§3) is heavier in script, lighter
in images (most product/banner images are the same CDN-resized ones either theme would use).

## 3. Bundle review — one real fix, one real finding reported not fixed

**Fixed: home blocks were a single eager ~580KB chunk loaded on every page, not just home.**
`app/router.tsx` statically imported all ~22 custom home-block components from the
`./components/home` barrel to pass them to `registerHomeComponents`. Confirmed in
`dist/stats.html`: that import graph landed in a chunk named `shared-home` (matching
`vite.config.ts`'s own `manualChunks` label for the *engine's* home-block defaults) — so a
cart, account or blog page, which never renders a single home block, paid for the code of
all 22 anyway. Fixed with a new `app/components/home/lazyHomeBlock.tsx`: each block is now a
separate `import('./components/home/X')` wrapped in its own `<Suspense>` (the engine's
`HomeComponentRenderer` renders the registered component with no `<Suspense>` ancestor of
its own, so a bare `React.lazy()` can't be registered directly — this supplies the boundary
locally instead of forking the engine's renderer). Also removed two remaining imports
through the `./components/home` barrel (`ProductsSlider`/`featuredProductsConfig` in
`router.tsx`, `ProductPage.tsx`, `SuggestedGames.tsx`) — importing anything through a barrel
pulls the whole barrel's module graph in, which would have silently undone the fix.

Verified four ways, not just by reading the config:
1. **Build output**: every converted block now has its own chunk (`BannerSection-*.js`,
   `ModernBannerSection-*.js`, `ReelsSection-*.js`, … 22 files, 53,390 bytes raw combined) —
   confirmed present in `dist/client/assets/` by filename, not merged into `shared-home`
   anymore (checked by `grep`-ing each block's own unique class string across every chunk).
2. **Real browser network trace** (`claude-in-chrome`, not curl — this matters because a
   lazy-loaded chunk is fetched by client JS, not referenced as a `<script src>` in the raw
   HTML, so grepping SSR HTML can't see it): on initial load the home page's above-the-fold
   arrangement fetched only the block chunks actually visible on load, not all 22. The
   product page fetched **zero** home-block chunks.
3. **Full-page scroll trace**: the engine's own `HomeComponentRenderer` already mounts each
   block lazily as it scrolls into view (pre-existing engine behaviour, independent of this
   fix — it's what `registerHomeComponentConfig`'s `height`/`placeholder` entries reserve
   space for). Scrolling the home preview start-to-end and reading
   `performance.getEntriesByType('resource')` (not just the network-request log, which
   missed a few chunks already in this browser's disk cache from testing) showed every one
   of this page's 12 distinct block types fetch its own chunk exactly once, the moment it
   scrolled into view — `BannerSection`, `ReviewsSection`, `CustomBrandsSection`,
   `ShoppingSection`, `ProductsSection`, `FeaturesSection`, `GallerySection`,
   `InstagramSection`, `Features2Section`, `CommonQuestionsSection`, `ModernBannerSection`,
   `CustomTestimonials` — confirming the two lazy mechanisms (viewport mount + code-split
   fetch) compound correctly rather than conflicting.
4. **No hydration regression**: `read_console_messages` across that same full scroll (and a
   fresh reload, tracked from before first paint) found no React hydration-mismatch warnings
   (`#418`/`#425`/`#423`) and no thrown errors — the `<Suspense fallback={null}>` boundary
   added per block doesn't cause a hydration bail-out or a visible content flash.
5. **SSR still works**: the home page's server-rendered HTML still contains the real block's
   markup (`aspect-[12/5]`, `BannerSection`'s own class, present in the raw HTML on a page
   that uses it) — the `<Suspense fallback={null}>` doesn't break content in View Source.

**What this fix doesn't touch, and can't**: `shared-home` only shrank by ~49 KB raw
(582,711 → 533,557 bytes) — it's now almost entirely the *engine's own* `DefaultHomeComponents`
(its bundled fallback block implementations), which `registerHomeComponents({...
DefaultHomeComponents, ...overrides})` must import eagerly to keep the defaults (AGENTS.md:
"Keep the spread, or you lose the defaults") — that's an engine-side cost every route pays,
not something fixable from theme code without forking the registration mechanism.
`tests/components/home/lazyHomeBlock.test.tsx` added; `tests/components/product/
SuggestedGames.test.tsx`'s mock path updated for the new import target.

**CSS: 564,600 bytes raw is misleading on its own.** Lighthouse's `resource-summary`
reported the single `app-*.css` file at its full raw size because this local preview server
doesn't compress responses (confirmed: no `Content-Encoding` header on a direct request) —
production, behind Salla's Cloudflare, will. Gzip: 76,454 bytes (76 KiB). Brotli: 56,798
bytes (55 KiB) — a typical, unremarkable size for a full Tailwind build across every page
type this theme has. Not a finding; reported so the raw number in Lighthouse's own report
isn't mistaken for one.

**No other heavy dependency found for a small feature**: `fslightbox` (product gallery
zoom) is 30.6 KB raw / 10 KB gzip — proportionate to what it does, and already deferred past
initial load: the product page's 96-request network trace (§4) has no `fslightbox-*.js`
request, confirming it only loads on the zoom interaction, not on page load. `lite-youtube`
(description video embeds) is 9.7 KB raw / 3.3 KB gzip. Neither is a concern.

## 4. Third-party scripts — mostly the Salla SDK itself, not this theme's calls

A real browser network trace of the product page (`claude-in-chrome`) found:

- **~45 separate `cdn.salla.network/js/twilight/.../p-*.js` / `*.entry.js` requests** — the
  Salla Twilight SDK's own Stencil web-component runtime, one small chunk per `<salla-*>`
  component actually used on the page (trust badges, payments, rating stars, comments,
  social share, metadata, installment, quick-order, offer, filters, breadcrumb…). This is
  the SDK's own lazy-loading strategy, loaded from Salla's CDN, not something this theme's
  code requests or can consolidate — confirmed by checking what calls each: every one is the
  SDK bootstrapping itself after `twilight.esm.js` loads, not an import in `app/`.
- **Two separate Google Tag Manager containers** (`GTM-TGFC6FV`, `GTM-52WZ58CL`), each
  loading its own `gtm.js`. Two containers both firing is a real, reportable finding — worth
  the owner confirming both are intentional (e.g., one store-wide, one from an installed
  app) rather than a leftover duplicate, since this theme's own code doesn't choose which
  GTM containers load (that's store/app configuration, `lib/analytics/gtm.ts` in the engine
  reads it from settings).
- **`fast-checkout-widget` (Salla, ~2 files) and the Apple Pay SDK** (3 files,
  `applepay.cdn-apple.com`) — both load on idle/interaction for the Buy Now / Apple Pay
  flow, justified by the feature; not something to defer further without breaking the
  feature they're for.
- **One installed app's snippet** (`cdn.portal.files.salla.network/snippets/...`) — a
  merchant-installed app (chat, reviews, etc. per Stage 8's installed-apps check), loaded by
  the engine's own app-scope mechanism, not theme code.

Nothing here is a theme-side third-party script to pin, defer, or remove — the theme itself
adds no third-party script beyond what the engine's root head already loads (documented in
Stage 9's audit: Twilight SDK, GTM proxy, ticketing). The two-GTM-containers point is the one
item to flag to the owner.

## 5. Fonts

`font-display: swap` is already correct everywhere: the engine's own root head sets it for
the merchant's chosen theme font (`buildRootStyles`, confirmed reading the engine's shipped
`head.ts` equivalent in Stage 9), and this theme's own self-hosted Dongol font-face
declarations (`app/styles/01-settings/fonts.scss`) set it explicitly too. No FOIT risk found.

**One real, reportable finding**: the `dongol`/`Dongol` font (two self-hosted `.ttf` files,
`public/fonts/`) is declared in `tailwind.config.cjs` as `font-dongol` but — checked with a
repo-wide search, not assumed — the `font-dongol` utility class is applied **nowhere** in
`app/`. Stage 2's own comment already flagged this as deliberate ("available... not applied
globally... apply where a display heading wants it" — reserved for a future design choice,
not a bug to silently delete). Not removed here, same reasoning Stage 8 used for similarly
owner-flagged, not-yet-decided items: this is a content/design decision, not a code defect.
Flagged so the owner knows two font files are shipped for a utility class nothing currently
uses.

## Checklist

- [x] Lighthouse mobile on home, category, product, cart: recorded LCP, CLS, TBT (INP needs
      real interaction, not a cold Lighthouse run — not measured), total JS — **none reach
      85** in this environment, but neither does the live Twig site tested the same way;
      product's CLS (0.247) is the one metric not explained by network noise, flagged for
      the owner's visual pass
- [x] Bundle review (`stats.html`): found and fixed home blocks loading on every page
      regardless of use; confirmed via build output, live browser network trace (full-page
      scroll, not just initial viewport), and SSR content check. Modals/lightboxes checked
      too: `fslightbox` already only loads on interaction (no `fslightbox-*.js` in the
      product page's network trace) — no other heavy dependency found for a small feature
- [x] Fonts: `font-display: swap` already correct everywhere; one real finding reported
      (two Dongol font files shipped for an unused utility class), not removed — owner's
      design call per Stage 2
- [x] Third-party scripts: inventoried via a real browser network trace; all are the Salla
      SDK's own lazy-loading, installed apps, or feature-justified (fast checkout, Apple
      Pay) — one item flagged for the owner (two GTM containers, confirm both intentional)

Result: one real, verified bundle-splitting fix (`app/components/home/lazyHomeBlock.tsx` +
22 converted imports in `app/router.tsx`, barrel imports removed from `ProductPage.tsx`/
`SuggestedGames.tsx` too, and the now-unused `app/components/home/index.ts` barrel file
deleted — nothing imports it anymore, checked repo-wide); everything else this stage found is
reported, not code-fixable from here (engine-side `DefaultHomeComponents` cost, the Salla
SDK's own chunk count, two GTM containers, the unused Dongol utility, product-page CLS).
`pnpm build`, `pnpm typecheck`, `pnpm check:manifest` all green; `pnpm test`: 10 failed / 852
passed — the same pre-existing `PageAdvertisements`/`ProductDetails`/`ProductGallery` failures
every prior stage documented, confirmed unchanged; +2 new tests this stage
(`lazyHomeBlock.test.tsx`), 1 test file's mock path updated (`SuggestedGames.test.tsx`, same
test count). **Verified live** (dev server up this session, same as Stages 9/10): scrolled
the full home page in a real browser and confirmed, via `performance.getEntriesByType
('resource')`, that each of its 12 distinct block types fetches its own chunk exactly once,
the moment it scrolls into view, with no console hydration warnings or errors — the fix is
real on a live page, not just in the build config. **Owner action needed**: confirm the two
GTM containers are both intentional; visually check the product page for the layout shift
behind its 0.247 CLS (prime suspect: the client-only `metadata/values` fetch inserting a row
above the description); when Stage 14's staging URL exists, re-run Lighthouse against Salla's
real edge for numbers not dominated by this sandbox's network path to the live API.
