# 11 — Migration plan: Twig theme → Salla React theme

Status: React theme created in the Partners Portal on 11 Nov 2026 (name `Theplayroom_theme`, Theme ID `1869420365`, type store, status Development). Repo: `github.com/Kariimu/theplayroom-theme` (private, branch `master`, starts as the React Raed starter `@salla.sa/theme-raed` 1.0.57). Local folder: `Documents/Theplayroom_react_theme`. No migration work done yet. Plan written 11 Nov 2026.
Portal rule: only `master` is submitted for publication. **Work on a branch (`migration`), merge to `master` only when the owner says so.**
Sources: Salla's announcement (https://salla.dev/blog/salla-themes-react/, 15 Oct 2026), the React theme docs (https://docs.salla.dev/twilight/react/), and Salla's official starter `SallaApp/theme-raed-react` (read at commit `7ba8979`, 10 Nov 2026, engine `^1.0.168`). The stack is moving fast: **re-check the starter and docs before relying on any API named here.**

## 1. Why
Salla is retiring Twig themes. Per the announcement: from 1 Nov 2026 only React themes can be published; Twig support for merchants continues "until at least the end of the year"; every theme must be rebuilt in React and is published as a **new** theme. The announcement addresses marketplace partners and does not say how private single-store themes are handled.

## 2. Questions the owner must get answered by Salla first (they change the plan)
1. Can this private Twig theme still receive updates? Until what date does it keep running?
2. Who owns the theme in the Partners Portal (repo is `codlop21/plays-room`)? The React theme must be created by an account the owner controls.
3. Will merchant-saved settings and home-page arrangement carry over to the linked React theme? (Salla says a method is being tested on Raed and recommends keeping setting ids and component keys/names identical.) After 5A this only matters for the home blocks.
5. Can a theme read product specs (metadata) as data on the server, and does product import/export cover specs and tags?
4. Framework: the announcement says Next.js + `salla-next-sdk`; the docs and the starter are **TanStack Start** on `@salla.sa/twilight-theme-engine` with Next.js "planned". This plan follows the docs/starter. Confirm that is what review accepts.

## 3. Strategy
- **Rebuild, don't convert.** New repository created from the React Raed starter. This Twig repo stays untouched as the reference and keeps serving the live store until cut-over.
- **Customise the engine, don't fork it.** Order of preference: merchant setting → hook slot → registry override / home block → fork a route (last resort; every fork is logged in `FORKS.md` and maintained by hand).
- This theme is a fork of *Twig* Raed; the starter is *React* Raed. Stock pages (account, orders, blog, brands, loyalty, thank-you, wishlist, static pages) come from the engine for free. **Only the store-specific work in 06-custom-features.md has to be rebuilt.**
- The new repo ships its own `AGENTS.md` (from the starter). Follow it there; copy this file and 03, 06, 09 into the new repo's `docs/legacy/` as the spec.

## 4. New stack in one table
| Concern | Twig theme (now) | React theme (target) |
|---|---|---|
| Rendering | Twig on Salla servers + client-side custom elements | React 19 SSR (TanStack Start, workerd) + hydration |
| Build | webpack → committed `public/` | Vite; Salla builds on push. No committed build output |
| Entry/layout | `layouts/master.twig` | `app/routes/__root.tsx` + `app/components/layout/ThemeLayout.tsx` |
| Pages | `src/views/pages/*.twig` | engine routes; override via `app/routes.ts` + `app/routes/*.tsx` |
| Home blocks | `components/home/*.twig`, `component.x` | `app/components/home/*.tsx` (`{ data }` prop), bound in `app/router.tsx` with `registerHomeComponents({...DefaultHomeComponents, 'name': X})` |
| Settings | `theme.settings.get('id')` | `const { settings } = useTheme(); settings?.id` (plain object) |
| Twig hooks | `{% hook 'x' %}` | hook slots: `hookRegistry.register(HookName.X, fn)` in `app/hooks/index.tsx`, `<HookSlot>` |
| Product card | `<custom-salla-product-card>` (client only) | wrap engine `ProductCard`; `registry.register` + `registry.override('product:card', X)` |
| Listing page | `product/index.twig` + `products.js` | fork `ProductListPage`, `registry.register('product:list-page', X)` |
| Product page | `product/single.twig` | `app/routes/$slug.p$id.tsx` → `components/product/ProductPage.tsx` (+ `ProductDetails`, `ProductGallery`, `AddToCartForm`) |
| Cart | `cart.twig` + `cart.js` | `app/routes/cart.tsx` → `components/cart/CartPage.tsx` |
| Web components | raw `<salla-*>` tags | engine component first, then `@salla.sa/twilight-components-react` wrapper, raw tag last |
| SDK | global `salla` | `window.salla`, subscribe/unsubscribe inside `useEffect` cleanup |
| Translations | `src/locales/*.json`, `trans()` | `locales/*.json`, `useTranslation().t()` |
| Styles | `src/assets/styles` (ITCSS) + Tailwind 3.4 | `app/styles` (same ITCSS layout) + Tailwind 3.4; logical CSS (`ms-*`, `ps-*`, `text-start`) |
| Images | manual `cdn-cgi/image` string replace | `getCdnImageUrl()` / engine `Image` |
| Checks | none | `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm check:manifest` |
Tooling: pnpm 10; Node 22.22.2+ or 24.15+ (starter README; the docs quick start says 20.19+, use the stricter one). Create with `salla theme create --type react`, run with `salla theme dev` (`--store <id>` for real store data).

## 5. twilight.json migration
Rules: add `"type": "react"`; **keep every setting `id`, component `key` (UUID) and `path` exactly as today**, including the typos (`squar_photo_bg_image_size`, `fatures`); run `pnpm check:manifest` after every edit.

**Home components (18).** Six already exist in the starter with the *same UUID keys*: `enhanced-slider`, `main-links`, `slider-products-with-header`, `enhanced-square-banners`, `brands`, `custom-testimonials`. For these, diff the field lists (this store added fields, e.g. `main-links` has `show_cats`, `categories`, `links`) and extend the starter component. The other twelve must be built: `banner-section`, `reviews-section`, `custom-brands-section`, `shopping1-section`, `products-section`, `reels-section`, `features-section`, `gallery-section`, `modern-banner-section`, `features2-section`, `common-questions-section`, `instagram-section`.

**Settings.** Already present in the starter (take its declaration, keep our values): `squar_photo_bg_image_size`, `vertical_fixed_products`, `enable_add_product_toast`, `slider_background_size`, `imageZoom`. The seven ids the Twig code reads but never declared (09 #7) are all real starter settings: `sticky_add_to_cart`, `footer_is_dark`, `topnav_is_dark`, `important_links`, `show_tags`, `is_more_button_enabled`, `enable_more_menu`; they come with the starter. Everything else in the 03 inventory is store-specific; where it goes is decided in 5A.

**Do not carry the data-heavy settings over as they are.** Section 5A replaces them. Only ids listed there as "keep" stay in the new `twilight.json`.

## 5A. Data relocation: get content out of theme settings
Problem today: 14 root-level `collection` settings hold store content, seven of them tied to individual products (`products_questions` allows 500 rows, `products_settings` 90). That data is invisible to Salla's product tools, is lost if the theme is replaced, depends on a setting type the React starter never uses at root level, and must be re-entered by hand in any new theme.

Target rule: **the theme stores configuration, never content about a product or category.** Each piece of data moves to the highest tier that can hold it:
- **Tier 1, native Salla data:** product description / subtitle / specs (the data behind `product.has_metadata`, rendered by `SallaMetadata`), product tags, category name / description / image / sub-categories, dashboard menus, store payment and trust data.
- **Tier 2, tag convention:** a product tag links the product to shared content or to a list (`key:value` style, same idea the store already uses for filter tags). Tags travel with the product and survive any theme change.
- **Tier 3, theme code:** fixed store-wide copy lives in `locales/ar.json` + `en.json` and images in `public/`. This is a private single-store theme, so a text change is a small commit, not a merchant setting.
- **Tier 4, small setting:** a plain switch, number, text or single dropdown. No root collections, no product pickers.

| Current setting | What it holds | New home | Tier |
|---|---|---|---|
| `products_settings` (for_who, material, inner_box) | Per-product facts | Product specs, one group (e.g. "تفاصيل المنتج") with three fields | 1 |
| `products_settings.image_dimensions` | Per-product dimensions picture | An image inside the product description, or the last gallery image marked by its alt text; pick one in Phase 0 | 1 |
| `products_questions` (per product) | Product FAQ | Product specs group "الأسئلة الشائعة" (field = question, value = answer). Fallback: an FAQ block at the end of the description | 1 |
| `products_questions` (`all_products` rows) | Store-wide FAQ | `locales` keys rendered by one `ProductFaq` component | 3 |
| `special_features` | Up to 4 image+title badges per product | Feature library in code (`app/lib/features.ts`: key, icon, ar/en title); product gets tags `feature:<key>` | 2+3 |
| `slider_in_products` | Per-product image cards | Same library pattern with tags `card:<key>`; if the cards are truly unique per product, they belong in the description | 2+3 |
| `products_play_games` | "Suggested games" for a product | Shared tag `set:<name>` on the product and its companions; block lists products with the same `set:` tag. Fallback: Salla's related-products list already on the page | 2 |
| `universal_features` | 4 store-wide features | `locales` + icons in `public/` | 3 |
| `categories_whatsapp` | Categories sold by enquiry | Tag `whatsapp` on those products. Fallback: one `items`/categories dropdown setting | 2 (4) |
| `products_in_cart` | Cart upsell products | Tag `cart-upsell`, product list by tag | 2 |
| `category_all`, `subcategories` (+desc) | Hand-built category tree | The real category tree: parent category with `sub_categories`, each with its own description | 1 |
| `category_all_desc`, `categories_banners` (image, title, desc) | Per-category hero | Category `image` + `description`. One image only: serve desktop/mobile sizes through `getCdnImageUrl`; separate mobile artwork is dropped | 1 |
| `gallery_page_category`, `gallery_*` | Gallery pseudo-category with photos/videos linked to products | Owner decision: (a) real `/gallery` route fed by products tagged `gallery` using their own images/videos, or (b) drop the page and keep the existing `gallery-section` and `reels-section` home blocks | 2 or removed |
| `menu_links` | Side-menu category links | Salla header menu from the dashboard | 1 |
| `footer_links1`, `footer_links2`, `footer_title1/2` | Footer link columns | Salla footer menu (engine footer "important links") | 1 |
| `footer_links3`, `footer_title3` | Payment / trust badges | Engine payments and trust-badge components | 1 |
| `search_texts` | Suggested search words | `locales` list | 3 |
| `footer_logo`, `footer_description` | Footer branding | Keep as settings (single image, single text) | 4 |
| `show_whatsapp`, `whatsapp_number`, switches, the dropdowns shared with the starter | Configuration | Keep | 4 |

Result: zero root-level collections and zero product pickers in `twilight.json`. Home blocks keep their collections (that is the supported place for them).

**Must be verified in Phase 0 before committing to a row** (I could confirm the fields exist in the engine's types, not how they behave):
- Specs: can a theme read spec groups/fields as data on the server (so FAQ and facts are in View Source), or only through the client-side `SallaMetadata` component? What field types and lengths does the dashboard allow? If client-only, FAQ falls back to the description block.
- Tags: `product.tags` is present on product-list responses (needed by the card for `whatsapp`), and a product list can be fetched by tag.
- Category `description` and `image` are present in the listing page's loader data.
- Dashboard menus can express the current side menu and footer columns.
If a Tier 1 row fails, drop that row one tier down; do not fall back to a root collection without asking the owner.

**Moving the existing data (owner task, agent prepares it):**
1. Agent writes a read-only script that walks the live sitemap and extracts, per product, what the current theme renders (facts, FAQ, features, cards, suggested games, WhatsApp-only) into one spreadsheet, plus a sheet for categories (banner, description, sub-category text).
2. Owner reviews the sheet: it shows how much is really in use, which decides between the primary and fallback options above.
3. Owner (or a bulk import, if Salla's product import covers specs and tags) enters the data on the products and categories **while the Twig theme is still live**. The old theme ignores it, so there is no downtime and no big-bang switch.
4. Old settings are left untouched until cut-over, for rollback.

**Phase 0b extraction result (owner-verified on the live site, 11 Nov 2026 — `scripts/extract-legacy-data.mjs`, data in `docs/legacy/data/`):**
- **Catalogue is 14 products, not 43.** Of the 43 sitemap products, only 14 render a product page; the other 29 (including the flagship climbing products) 302-redirect to the storefront home. Rows for those are marked `redirected` in `products.csv`. Treat the 14 as the live catalogue.
- **FAQ is store-wide, not per-product.** All 14 render the same 16 questions, so row 67 (per-product FAQ → specs) has no data; everything goes through row 68 (Tier 3, one `locales` list). The 16 Qs are **Arabic only** — EN product pages do not render the FAQ, so the English copy must be written for the migration, not extracted. Captured in `store-wide.json`; `faq.csv` is header-only by design.
- **Facts (row 65):** only 3 of the 14 carry for_who / material / inner_box (بيت الألعاب, صندوق التخزين, مجموعة المغامرة). All 14 already have Salla spec groups.
- **No product is WhatsApp-only today** (`categories_whatsapp`, row 73, is effectively unused on the catalogue).
- **Not observed on the 14** (all zero in the sheet): dimensions image, feature badges, image cards, suggested games — the products that would carry these are mostly among the 29 that redirect. Re-check if any of those 29 are later unhidden.
- **Category banners (row 76): none configured today.** 0 of the 52 rendering categories emit the `<picture>` banner markup (`categories_banners` is unused on the live store). The extractor's selector matches the old theme's `pages/product/index.twig` (`section.container picture`) exactly — the empty column is absence of data, not a bad selector — so row 76 has nothing to migrate unless the owner adds category banners. Category titles extract fine (52/52).

## 6. Feature mapping (store-specific work, see 06 for current behaviour)
| # | Feature | Target implementation | Notes |
|---|---|---|---|
| 1 | Custom product card | `components/product/ProductCard.tsx` wrapping the engine card; registered as `product:card` | Now server-rendered: fixes the SEO/LCP issue in 09 |
| 2 | WhatsApp-instead-of-cart products | `isWhatsappProduct(product)` = product has tag `whatsapp` (5A); used by card and product page | Drop the global product-id crawl, `localStorage` cache and `window.*` helpers. Number from `whatsapp_number` (fixes 09 #1) |
| 3 | Floating WhatsApp button | `hookRegistry.register(HookName.BODY_END, …)` | |
| 4 | Header, side menu, search suggestions | Theme-owned `components/layout/Header*.tsx`; menu from the dashboard menu, suggestions from `locales` (5A) | Starter header already has more-menu, sticky, topnav |
| 5 | Footer (link columns, logo, payment badges) | Engine/starter footer with the dashboard footer menu and native payment/trust components (5A); restyle | Fork only if styling cannot be done from outside |
| 6 | Category page: hero banner, sub-category cards | One layout in the forked `ProductListPage`, driven by the category's own `image`, `description` and `sub_categories` (5A) | The four hand-wired modes collapse into one; Gallery per owner decision in 5A |
| 7 | Tag-based filters (`Group-Value` tags) | Component inside `ProductListPage` | First check whether native `SallaFilters` covers the need; client-side filtering only sees loaded pages |
| 8 | Product page extras: product facts, FAQ, feature badges, cards, suggested games, dimensions, trust badges | Separate small components rendered from the forked `ProductPage`/`ProductDetails`, each reading the product's own specs/tags/description (5A) | Keep product name, price, description, facts and FAQ in SSR HTML |
| 9 | Custom reviews UI | Use engine reviews data/components | Do not port the hidden `<salla-comments>` scraping (09 #11) |
| 10 | Cart page layout, free-shipping bar, upsell slider | Fork `CartPage`; upsell = products tagged `cart-upsell` (5A) | |
| 11 | Add-to-cart toast | Starter's `AddProductToast` | Restyle only |
| 12 | Side cart drawer | Not live today (09 #4). Owner decides: skip or build fresh | Do not port the dead code |
| 13 | 3D model viewer, digital files | Starter has `DigitalFilesSettings`; check engine gallery for 3D support before adding `model-viewer` | Pin any external script |
| 14 | Design tokens, colours, custom fonts (`dongol`), body background | Port `:root` tokens from `master.twig` and `05-utilities/styles.scss` into `app/styles` | |
| 15 | Translations (49 keys) | Merge `src/locales/*` into `locales/*`; fix the 4 mismatched keys (09 #8); replace hard-coded ar/en ternaries with keys | |
| 16 | App/tracking hooks | Engine pages keep their slots; in every forked page re-render the slots that page had | Verify installed apps (chat, analytics, reviews translator) after client-side navigation |
Do **not** port: commented-out legacy code, `window.*` globals, inline `<script>` blocks, `console.log`s, direct DOM manipulation, `?v=timestamp` cache busting.

## 7. Phases (each ends with: build + typecheck + test + check:manifest green, checked in /ar and /en, mobile and desktop, committed)
0. **Spike (1 branch, throwaway allowed).** Create starter, run against the real store (`salla theme dev --store <id>`). Verify the four checks in 5A on two or three real products the owner has prepared with specs and tags, that the six shared home blocks render the store's existing data, and that installed apps load. Report findings and the final tier per row before continuing.
0b. **Data sheet.** Write the read-only extraction script (5A, step 1) and hand the spreadsheet to the owner. Data entry then runs in parallel with phases 1 to 6.
1. **Manifest.** Build the new `twilight.json`: starter base + the settings marked "keep" in 5A + the 18 components with unchanged keys/paths. No root collections. Stub the 12 new blocks so the home page renders.
2. **Foundation.** Tokens, fonts, Tailwind config, layout, header, footer, floating WhatsApp, product card (+ WhatsApp logic), translations.
3. **Home.** The 12 custom blocks, simplest first (`banner-section`, `features-section`, `common-questions-section`), heaviest last (`reels-section`, `instagram-section`, `modern-banner-section`). Extend the six shared blocks.
4. **Listing.** Category hero + sub-category cards from category data, filters, Gallery (if kept).
5. **Product page.** One section per commit, in the order of 06 §7.
6. **Cart + remaining touches** (thank-you, toast styling, wishlist card).
7. **Hardening.** View Source shows product/category content; Lighthouse mobile > 85 on home, category, product; RTL/LTR; every setting changed once in the editor and its effect confirmed; route transitions; apps; 404s and old URLs.
8. **Cut-over (owner only).** Create/link the React theme in the Partners Portal, publish, activate on a preview store, then on the live store at a quiet hour; keep the Twig theme available for rollback.

## 8. Risks
- Product specs may be readable only client-side, or too limited for FAQ text → use the description fallback (5A). Decided in Phase 0, not later.
- Data entry is manual work on every product. Size it with the Phase 0b sheet before promising a date.
- Tag conventions are easy to mistype. Keep the list of valid tags in one file (`app/lib/tags.ts`) and show a dev-only warning for unknown `feature:`/`card:`/`set:` tags.
- Saved values of the six shared home blocks may still not carry over to a new theme; screenshot the home page setup before cut-over.
- Engine updates weekly; forks drift. Keep forks few and `FORKS.md` current.
- Timeline pressure: Twig end date for private themes is unknown (§2).
- Feature creep: port behaviour first, redesign later.
