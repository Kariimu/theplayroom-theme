# 09 — Known issues, tech debt, gotchas

Found by reading the source (Nov 2026). Live site https://theplayroom.sa/ar runs this same code as theme version 1.37.0 (issues 4 and 6 and the dev build were confirmed there). **A Status column was added Nov 2026** as items get fixed (git is now initialised — see the maintainability section). Don't "clean up" anything still marked open as a side effect of another task; fix only when asked, one item per change. Fixed items' hashes are in this repo's git history.

## Likely bugs
| # | Issue | Where | Status |
|---|---|---|---|
| 1 | Product/enquiry WhatsApp number hard-coded `966532603300`, ignores setting `whatsapp_number`. Message text is Arabic-only | `product/single.twig` (~548), `partials/product-card.js` (~805) | ✅ Fixed `d7e6e57` — number now from `whatsapp_number` (reaches JS via `<body data-whatsapp-number>`), message in `common.whatsapp_enquiry_message` (ar+en) |
| 2 | `console.log({{ cart|json_encode|raw }})` prints the full cart on every cart page view | `pages/cart.twig` `{% block scripts %}` | ✅ Fixed `baef796` |
| 3 | Debug logs left in: `ALL PRODUCTS`, `FILTERED IDS`, `ACTIVE FILTERS`, `SAMPLE PRODUCT TAGS` | `js/products.js` (~638, ~947) | ✅ Fixed `cc619da` (commented copies in the dead legacy block remain until that block is removed) |
| 4 | Side cart drawer never initialises: JS + SCSS shipped, no `#cart-drawer` markup in any twig | 06 §10 | ⏳ Open — Phase 3, needs owner decision (wire up or remove) |
| 5 | `thank-you.twig` loads no script, so `thankyou.js` (in `checkout.js`) never runs there | `pages/thank-you.twig`, `webpack.config.js` | ✅ Fixed `c688ba7` — checkout bundle now loaded; `thankyou.js` gated to slug `thank-you`. NB its `.thanks-item`/`#invoice-form` targets aren't in the current markup (dormant; see Phase 3 list) |
| 6 | `product-card.js` is requested with `?v=<current timestamp>` → never cached; on the cart page it is loaded twice (deferred in master + blocking in cart `head_scripts`) | `layouts/master.twig` (88), `pages/cart.twig` (53) | ✅ Fixed `1dab752` |
| 7 | Settings read but not declared in `twilight.json` (always fallback): `sticky_add_to_cart`, `footer_is_dark`, `topnav_is_dark`, `important_links`, `show_tags`, `is_more_button_enabled`, `enable_more_menu` | several twig files | ✅ Fixed `06dbe8e` — 5 live ones declared as boolean switches (behaviour-preserving defaults); dead `important_links` `{% set %}` removed; `show_tags` was already comment-only. **Merchant must re-sync the theme in the dashboard for the new settings to appear.** |
| 8 | Locale keys out of sync: `common.empty_cart`, `common.empty_cart_message`, `common.start_shopping` only in `ar.json`; `common.contact_us_on_whatsapp_for_details` only in `en.json` | `src/locales/` | ✅ Fixed `26176ed` — key sets now identical; also corrected two English values that held Arabic text |
| 9 | Duplicate `class` attribute on `<salla-gifting>` | `pages/cart.twig` (~301) | ✅ Fixed `1c33479` |
| 10 | `<model-viewer>` loaded from `unpkg.com` without a version pin | `product/single.twig` (end) | ✅ Fixed `b7704b0` — pinned `@4.4.0` |
| 11 | Reviews UI depends on scraping a hidden `<salla-comments>` when the API call fails ("falling back to DOM extract"); fragile against component updates | `product/single.twig` scripts | ⏳ Open — Phase 3 |

## Performance (a Lighthouse report of the live site is in `playrooms.html`)
- `public/` is a **development build**, and that is what the live site serves (checked on theplayroom.sa, theme version 1.37.0, 11 Nov 2026: `app.css` 1.1MB unminified, `app.js` 383KB and `product-card.js` 111KB with webpack's "eval devtool" banner). Ship `pnpm production` output.
- Product cards and the main menu render client-side only (no SSR HTML) → slower LCP, weaker SEO on listing pages.
- WhatsApp product-id build pages through *all* products of the chosen categories via the API on first visit (then cached in `localStorage` with no expiry: newly added products stay "buyable" until the list is rebuilt on the next load).
- `master.twig` inlines `window.themeCategories` (full category tree JSON) plus a large `<style>` token block on every page.
- Very large inline scripts in `product/single.twig` (~500 lines), `product/index.twig` (~590 lines), `header.twig` (~280 lines).

## Maintainability
- ~~Dead code: commented-out original header/footer; `products.js` lines 1–~580; old card at the bottom of `product-card.js`; commented blocks in `product/index.twig` scripts and `cart.twig`.~~ ✅ Removed in Phase 2 (`1a5e000` products.js legacy block, `12d558d` product-card.js old card, `c2dfccf` header/footer copies, `29fb29a` cart/index comment blocks). Note: removing dead commented markup purged 10 bare Tailwind utilities that lived only in those comments; live code uses their variant forms, so no rendered class was lost.
- ~~~50 hard-coded `is_rtl ? 'عربي' : 'English'` strings instead of locale keys.~~ ✅ Twig side done `0dc21f2` — ~45 translatable ternaries across 10 twig files converted to `trans('common.*')` (24 new keys in ar/en). Intentionally kept: `dir`/`direction` `rtl`/`ltr` ternaries, the `flip-x` class ternary, and the `item.title` language-pick. The `cart-drawer.js` strings are untouched (that file is not wired up — see §4/06 §10).
- ~~Leftover `data-loc="client/src/…tsx"` attributes (markup pasted from a React prototype) in `master.twig` and `modern-banner-section.twig`. Harmless.~~ ✅ Removed in Phase 2.
- Field id typos that are now data keys and must stay: `squar_photo_bg_image_size`, `fatures`, body attribute `whatscatgory`.
- Odd setting ids `footer_links1.link26` / `footer_links1.link2` at top level are static separators, not real links.
- Mixed indentation (tabs/2/4 spaces); `product/single.twig` has extremely deep tab indentation in places.
- `README.md` and `CHANGELOG.md` are upstream Theme Raed's, not this store's. `package.json` still says `theme-raed` 1.0.3.
- ~~`.gitignore` lists `pnpm-lock.yaml` (twice) although the file is in the folder.~~ ✅ Fixed in Phase 2: both lines removed, `pnpm-lock.yaml` now tracked. Git is initialised (baseline commit `2dea074`), so there is history to diff against.
- No tests, no lint, no CI build.

## Platform direction
Salla announced (15 Oct 2026) that themes are moving to React: only React themes can be published from 1 Nov 2026, and Twig support for merchants runs "until at least the end of the year". Before fixing anything in this file, confirm with the owner that Twig updates can still be published; otherwise put the effort into the rebuild (11-react-migration.md), where items 1, 4, 6, 7, 11 and the performance items are resolved by design.
