# Stage 9 — SEO audit

Method: read what `@salla.sa/twilight-theme-engine` (v1.0.168, this repo's pinned version)
actually emits per route — straight from its shipped `dist/` bundle, not from memory or the
docs index — before writing anything, per Stage 9's own instruction ("add only what is
missing; never duplicate a tag or schema the engine outputs"). Then fixed the real gaps
found, and fetched the live Twig site for a before/after comparison.

**Dev server**: not running when this audit was first written (checked several common ports
— all refused); confirmed up during Stage 10, on `localhost:5173`, path-prefixed
(`/theplayroom.sa/ar/...`). Everything below was re-verified by `curl`-ing that server, not
just by reading the engine's compiled output — see the "Verified live" addendum at the
bottom, including one real bug the static read missed.

## What the engine already does by default (no code needed)

Read from `node_modules/@salla.sa/twilight-theme-engine/dist`:

- **Title / meta description / canonical / hreflang** — every route's own `head()`
  (`routes/{home,product,product-listing,account,blog,brands,cart,loyalty,page,
  testimonials,thank-you}.js`) calls `buildHreflangAlternates(ctx.settings,
  ctx.location.pathname)` and sets `canonical`. `withHead()` (`tanstack/head.ts`, used by
  every route file in `app/routes/`) also runs `withPageUrl()` on top, which fills in
  `canonical` from the router's own pathname even for a route with no `head()` at all. Every
  alternate list includes `x-default` + every store language, built from the same
  `settings.languages`, so ar↔en is reciprocal by construction.
- **Product structured data** — `routes/product.js` → `head()` builds a full `Product`
  JSON-LD: `offers` (price, currency, availability, `priceValidUntil`, seller), `brand`,
  `aggregateRating`/`review` when the product has ratings, `gtin8`, `mpn`. Checklist item 4
  ("Product: price, availability, SKU, brand, rating") is satisfied by the engine, unchanged.
- **BreadcrumbList** — the shared `Breadcrumb` component (`Breadcrumb-2VTKPEDN.js`) renders
  both inline `itemscope`/`itemtype="https://schema.org/BreadcrumbList"` microdata *and* a
  separate `<script type="application/ld+json">` BreadcrumbList block. It's already mounted
  on product (`ProductPage.tsx`), category/tag/brand/search/offers
  (`ProductListPage.tsx`), cart (`CartPage.tsx`) and static pages (`PageSingle.tsx`) —
  confirmed by grepping `app/components` for the import, not assumed.
- **Images** — the engine's `<Image>` (`components/common/Image.tsx`) always routes `src`
  through `getCdnImageUrl()` (the Salla CDN resizer, `/cdn-cgi/image/...`), sets
  `loading="lazy"`/`decoding="async"` by default and switches to
  `loading="eager"`/`fetchPriority="high"`/`decoding="sync"` when `priority` is passed.
  Checked every usage in `app/components` (both the `<Image>` wrapper and the ~13 places
  that build a raw `<img>` by hand, e.g. `home/Brands.tsx`, `home/EnhancedSlider.tsx`): all
  of them call the same `getCdnImageUrl()` helper and set `width`/`height` and an explicit
  `loading`/`fetchPriority`. `priority`/`eager` is used correctly and sparingly: header logo,
  first gallery image, `CategoryHero`'s banner, first home-slider slide. No gap found —
  checklist item 7 needed no code change.
- **Category-page product links** — checked, not assumed, since this is the one place a
  client-only data flow would silently empty the HTML: `ProductListPage.tsx` destructures
  `products` directly from `ProductListLoaderData` (the route's own loader data, "same data
  flow as upstream" per its own doc comment) and passes it straight into `<ItemsList items=
  {products}>`. `useCatalogLoader`'s `loader` function (`product.list(...)`) only runs for
  *subsequent* infinite-scroll pages — its own comment says so ("the route already loaded
  the first page"). So the first page of `ProductCard`s, each a real `Link` to `/{slug}/p
  {id}`, is in the SSR HTML, not fetched client-side. No gap.

## What this stage found and fixed

### 1. Four duplicate `<h1>` bugs (checklist item 2)

`MobilePageTitleBar` (`app/components/layout/MobilePageTitleBar.tsx`) renders a real `<h1>`
on every route except home and product, sourced from that route's own loader data
(`page.title`) wherever the loader sets one — present in the SSR HTML (just `md:hidden` in
CSS, not removed from the DOM) for any such route, not only on the client. Confirmed this is
true for all three routes this stage touches: the engine's own cart loader sets `page:
{title: i18n.t('common.titles.cart')}` (`dist/routes/cart.js`); `ProductListPage.tsx` and
`PageSingle.tsx` both already read `page.title` directly in their own markup, so their
loaders must supply it too. (Where a route's loader carries no `page.title` at all — not
checked for blog/brands/loyalty/testimonials this stage, out of scope — `MobilePageTitleBar`
falls back to `document.title` read in a `useEffect`, which is client-only; any such route
would have *no* `<h1>` in SSR HTML, a separate, pre-existing question this stage didn't
touch.) Three of our own forked components rendered a *second* `<h1>` with the same text on
the three routes above, and a brand-listing page had two unconditionally-visible `<h1>`s at
once:

- `ProductListPage.tsx` — `<h1 id="page-main-title">` (category/tag/search/brand/offers
  listing pages) duplicated the title bar's `<h1>` on every one of those route types.
- `ProductListPage.tsx`'s `BrandHeader` — on a `/brands/{id}` page specifically, this
  rendered its *own* `<h1>{brand.name}</h1>` **and** the generic `#page-main-title` `<h1>`
  right after it, both real and visible at the same time — two `<h1>`s on screen, not just in
  the DOM, on every brand page.
- `CartPage.tsx` — `<h1 className="sr-only">` on the non-empty-cart view duplicated the title
  bar's `<h1>` (sr-only either way, but still a second `<h1>` element in the markup).
- `PageSingle.tsx` — `<h1>{page.title}</h1>` on every static page (About Us, FAQ, etc.)
  duplicated the title bar's `<h1>` the same way.

Fix: demoted all four to `<h2>` (kept every class/behaviour, including the existing
`mobile-page-title.scss` media query that hides `#page-main-title` below 768px so the visible
title doesn't repeat on a phone — that CSS was already correct, it just didn't make the
heading level correct too). `ProductListSkeleton.tsx`'s loading placeholder was changed to
match. `MobilePageTitleBar.tsx` itself is unchanged — it's already the one real `<h1>` on
every route it covers. Updated `tests/components/page/PageSingle.test.tsx`'s three heading
assertions from `h1` to `h2`; no other test asserted on these headings.

Home and product pages were already correct (one real `<h1>` each — home's from the Stage-8
commit below, product's from `ProductDetails.tsx`) and needed no change.

### 2. FAQ now reaches View Source (checklist item 1)

`ProductFaq.tsx` read the store-wide FAQ with a client-only `useQuery(home.queries.
components())` — correct on screen, but invisible to View Source and to any crawler that
doesn't execute JS, same gap Stage 5 flagged and left for this stage. Fixed by moving the
fetch to the product route's own loader:

- `app/routes/$slug.p$id.tsx` passes an `extend` callback to `Product.loader()` — the
  engine's own, documented extension point (`routes/product/index.d.ts`:
  `loader(ctx, extend?)`, already merges `{...data, ...extra}`) — that calls
  `queryClient.ensureQueryData(home.queries.components())` via `getTwilightContext()`,
  exactly the pattern `Home`'s own loader uses (`chunk-W2TVQNZT.js`:
  `homeLoader`). This both SSRs the data and keeps the TanStack Query cache warm for the
  same query key, so a client-side re-render doesn't refetch.
- `ProductFaq` now takes `components` as a prop instead of running its own query.
- `app/lib/faqJsonLd.ts` — extracted `buildFaqJsonLd()` out of `app/lib/homeJsonLd.ts` (same
  function, same behaviour, now shared) and reused it in the product route's `head()` to add
  FAQPage JSON-LD on the product page too, scoped to the product's own canonical URL —
  satisfies checklist item 12's "only where the FAQ is actually visible on that page" the
  same structural way the home page already does (no block on the page, or an empty one,
  means no FAQPage schema; checked by `tests/lib/faqJsonLd.test.ts`).

**Facts remain client-only, by design, not fixed here.** Phase 0 (binding, `docs/
MIGRATION-PLAN.md` §5B) established there is no server-side metadata API — confirmed again
this stage: nothing in the shipped engine exposes a server-callable equivalent of
`Salla.metadata.fetchValues` (searched the whole `dist/` tree). The sanctioned answer is
"SEO text also goes in the description," which is a content task, not a code task — carried
forward to Stage 10's content-suggestions list (products whose description doesn't already
restate the facts).

### 3. `robots.txt` — a confirmed, reportable bug (checklist item 8, report only)

```
Sitemap: https://theplayroom.sa/sitemap.xml
User-agent: *
Allow: /
Disallow: /*<iframe
```

The file genuinely ends there — `cat -A` shows no trailing newline, this isn't a fetch
truncation. The last `Disallow` directive is cut off mid-pattern (`/*<iframe` matches nothing
real; it looks like an attempt at `/*<iframe>*` or similar that got truncated). This is served
by Salla, not by this theme — per the stage's own instruction, reported here for the owner,
not changed. `sitemap.xml` itself is fine: a 3-file index
(`ar/sitemap-1.xml`, `ar/sitemap-2.xml`, `ar/blog-1.xml`) with ar and en URLs interleaved in
the same files (not split by locale — a valid, if slightly unusual, pattern; each URL's own
page carries the real hreflang pair, which is what matters).

### 4. URL parity (checklist item 5) and D6 (owner, checklist item 6)

Checked `docs/legacy/data/urls.json`'s 43 product + 59 category URL shapes against
`app/routeTree.gen.ts`: products (`/{slug}/p{id}`) and categories (`/{slug}/c{id}`) both match
real route patterns (`$slug.p$id.tsx`, the engine's own default `$slug.c$id.tsx`). One
apparent mismatch turned out not to be one: the live sitemap lists static pages at
`/{locale}/p/{slug}` (no id) — confirmed by curl that this 301s (Salla platform-level, not
theme) to the real canonical `/{locale}/{slug}/page-{id}`, which is exactly `$slug.page-
$id.tsx`'s own path. No gap.

The two URLs named "Gallery" (`c1241225104`) and "All Products" (`c2118208525`) in
`urls.json` are **not** dead pseudo-categories — `docs/legacy/data/categories.csv` shows both
are live, "renamed" categories with real content, already live-redirecting old-slug → new-
slug on the Twig site today. They render through the same generic category route as every
other category; D3 (no `/gallery` route) was about something else entirely (the home page's
gallery-section block) and doesn't apply here. No gap.

**D6 is still open** — this stage confirmed (not newly discovered) that `app/lib/
productNotFound.ts`'s `redirectHomeIfNotFound()` is exactly the mechanism already silently
bouncing the 29 dead sitemap products to the home page today (both on the live Twig site —
confirmed live, see table below — and, by the same code path, on the new theme). The
destination for each (delete, restore, or redirect to a relevant category) is still the
owner's call per the decisions table in `TASK.md`; this stage does not change that behaviour
since no decision exists yet to implement.

### 5. Structured data: Organization (checklist item 4) — a deliberate difference from Twig, not a gap

The live Twig theme emits `Organization` + `WebPage` JSON-LD on **every** page (home,
category, product — confirmed by curl, see table). The new theme (Stage 8-era commit
`9326175`, unchanged this stage) emits `Organization`/`WebSite`/`WebPage`/`FAQPage` **once**,
on the home page only, cross-referenced by `@id` from pages that need it. This is the
pattern Schema.org/Google's own guidance recommends (one canonical `Organization` entity, not
one per page) and is not a regression: category and product pages still carry their own
`BreadcrumbList` and (product) `Product` schema, which is what Google's structured-data
requirements for those page types actually check. Left as-is; noted here so it isn't
mistaken for an oversight.

**Not run through Google's Rich Results Test** (checklist item 4's literal instruction) —
there is no public URL yet (staging is Stage 14). The JSON-LD shapes above were checked
against schema.org's own field requirements by reading the code that builds them; a real
Rich Results Test pass belongs with Stage 14's "re-run Stages 9–12 against the staging URL."

## Before (live Twig) vs after (this theme, pending the owner's dev-server pass)

| | Home (`/ar`) | Product — خدمة التركيب (`/ar/خدمة-التركيب/p1385822926`) | Category — بيت التسلق (`/ar/بيت-التسلق/c964705694`) |
|---|---|---|---|
| **Title** (live) | "غرفة الألعاب   أفضل متجر..." | "خدمة التركيب \| غرفة الألعاب" | "بيت التسلق \| غرفة الألعاب" |
| **Canonical** (live) | self | self (slug matches) | self |
| **H1** (live) | *(none found in the fetched HTML)* | "خدمة التركيب" | "بيت التسلق" (`id="page-main-title"` — same id convention this theme already uses) |
| **JSON-LD** (live) | Organization, WebPage | Organization, WebPage, Product (`@graph`) | Organization, WebPage |
| **After (this theme, code-confirmed)** | Organization, WebSite, WebPage, FAQPage (if the home FAQ block has questions); one real `<h1>` (sr-only, Stage 8) | Title/canonical/hreflang per-route default; Product JSON-LD (offers/brand/rating) per engine default; BreadcrumbList; FAQPage if the product's FAQ block has questions (this stage); one real `<h1>` (`ProductDetails.tsx`) | Title/canonical/hreflang per-route default; BreadcrumbList; `CategoryHero` (Stage 4); one real `<h1>` (`MobilePageTitleBar`, always in the HTML) + `<h2 id="page-main-title">` (this stage's fix) |
| **Owner to confirm on localhost** | h1/JSON-LD above actually render | same, plus: FAQ text in View Source if that product's FAQ-visible page has one | h1 fix (`view-source`, confirm only one `<h1>` tag) |

One live-site quirk worth noting, not fixing (Twig, out of scope): the "بيت الألعاب" product
(`c1246641851`) and a handful of others in `urls.json` return HTTP 200 with the *home page's*
title/content at their own URL — no redirect header, just silently serving the wrong page.
These are exactly Phase 0b's "29 of 43 sitemap products redirect to home" — D6.

## Checklist

- [x] View Source (not DevTools) contains product name, price, description, category text
      and product links (engine default, confirmed); **FAQ now included** (this stage); facts
      remain client-only by design (Phase 0, binding) — carried to Stage 10
- [x] One `<h1>` per page; heading order sensible; internal links use the engine `Link` and
      are real `<a href>` in HTML (confirmed — only `tel:`/`mailto:`/one external `noscript`
      link are raw `<a>`)
- [x] Titles and meta descriptions come from the store's SEO fields; canonical and `hreflang`
      (ar/en) present and reciprocal (engine default on every route, confirmed by reading the
      shipped bundle)
- [x] Structured data: Product (price, availability, SKU, brand, rating), BreadcrumbList,
      Organization — all present (engine default + Stage 8 commit); **not** run through
      Google's Rich Results Test (no public URL yet — Stage 14)
- [x] URL parity: every live URL shape in `docs/legacy/data/urls.json` matches a real route;
      old Gallery/"All products" URLs confirmed as ordinary live categories, not dead ends
- [ ] D6 handled (OWNER) — still open, see `TASK.md`'s decisions table
- [x] Images: width/height, lazy below the fold, eager + high priority for the LCP image,
      CDN resizer — confirmed on every usage, no code change needed
- [x] `sitemap.xml` and `robots.txt` checked — sitemap fine; `robots.txt` has a truncated
      `Disallow` line, reported above for the owner (Salla-served, not theme-controlled)

Result: six of eight items done from static analysis + live-Twig comparison; D6 stays with
the owner. `pnpm build`, `pnpm typecheck`, `pnpm check:manifest` all green; `pnpm test`: 10
failed / 846 passed — the same pre-existing `PageAdvertisements`/`ProductDetails`/
`ProductGallery` failures every prior stage documented, confirmed unchanged; 6 net new tests
this stage (`tests/lib/faqJsonLd.test.ts` ×2, `ProductFaq.test.tsx` +1, `PageSingle.test.tsx`
unchanged count after its 3 assertions were updated to `h2`). D6 stays with the owner.

## Verified live (Stage 10, once the dev server came up)

`curl`-ed `localhost:5173` directly (home, a product, a category — the same three page
types as the table above) instead of relying only on the engine-bundle read:

- **Home: found a real bug the static read missed.** Two `<h1>`s, not one —
  `Header.tsx`'s `BrandName`/`HeaderIntro` had their own pre-existing (Stage 2) logic making
  the store name an `<h1>` on home whenever no page-level one was accounted for, which this
  file's own "home... already correct" line (above) didn't catch since it spans two
  components from different stages. Fixed on `stage-10-geo`: both are now always a non-
  heading tag (`span`/`p`); the page's own `<h1>` (`app/routes/index.tsx`) is the only one.
  Re-curled after the fix — confirmed exactly one `<h1>` on home.
- Product (`/ar/خدمة-التركيب/p1385822926`): one `<h1>`, canonical correct, Product +
  AggregateRating + Review + BreadcrumbList JSON-LD all present, description text present —
  everything this file claimed, confirmed.
- Category (`/ar/بيت-التسلق/c964705694`): one `<h1>`, and real `<a href>` product links in
  the raw HTML (not client-fetched) — confirmed the `ProductListPage` SSR claim above with
  live data, not just code reading.
- Images: CDN-resized URLs (`cdn-cgi/image/fit=scale-down,...`) and correct
  `loading`/`fetchPriority` on every `<img>` checked.

D6 is still the only open item.
