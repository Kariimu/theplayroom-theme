# 06 — Store-specific features (what is NOT stock Raed)

Line numbers are approximate (files change). Search by the quoted ids/strings.

## 1. Custom product card — `<custom-salla-product-card>`
- Code: `src/assets/js/partials/product-card.js` → `public/product-card.js`, loaded on every page from `master.twig`.
- Used through `product-card-component="custom-salla-product-card"` on every `<salla-products-list>` / `<salla-products-slider>`. Lists also pass `includes='["images", "category"]'`: the card needs both (hover image, WhatsApp category check).
- Behaviour: click on `.add-btn` → if product has options go to product page, else `salla.cart.addItem({id, quantity: 1})`. Hover shows second image on desktop only (`loadSecondaryImage`, skipped under 768px / no-hover devices). Images are rewritten to Cloudflare `cdn-cgi/image/width=…,format=auto,quality=80` (`optimizeImageUrl`).
- The whole file is the live `ProductCard` class ending in `customElements.define('custom-salla-product-card', ProductCard)`; the old commented-out card that used to sit at the bottom was removed in Phase 2 (`12d558d`).

## 2. "WhatsApp instead of Add to cart" categories
Purpose: products in chosen categories can't be bought online; the buy button becomes a WhatsApp enquiry button.
- Setting: `categories_whatsapp` (multi category dropdown).
- `master.twig`: prints the setting on `<body whatscatgory='…'>`, then inline JS builds a list of product ids: `parseWhatsappCategoryIds()` → `collectProductIdsFromCategoryTree()` + `fetchWhatsappProductsFromApi()` (`salla.product.fetch({source:'categories'})`, all pages) → `window.whatsappProductIds`, cached in `localStorage.whatsapp_product_ids`, then fires `whatsappProductsLoaded`. The build is deferred to window `load` / `requestIdleCallback`.
- Consumers: `product-card.js` (`getProductbutton`, `updateWhatsappButton`) and `product/single.twig` (server-side category match sets `is_whatsapp_category`, plus an inline script that swaps `#add-to-cart-wrapper` / `#whatsapp-btn-wrapper` after the event).
- The enquiry number comes from the `whatsapp_number` setting (fix 09 #1 `d7e6e57`), like the floating button. `product/single.twig` reads it directly; `product-card.js` reads it from `<body data-whatsapp-number>` (set in master.twig). The enquiry message is `common.whatsapp_enquiry_message` (ar+en).

## 3. Floating WhatsApp button
`master.twig`, after the footer: shown when `show_whatsapp`; number from `whatsapp_number`. Class `.wa-float-btn`.

## 4. Header and menu
- `components/header/header.twig`: the live header is at the top of the file (the commented Raed copy that used to precede it was removed in Phase 2, `c2dfccf`). Logo resized via `cdn-cgi/image/width=175`. Side menu links from setting `menu_links`; suggested search words from `search_texts`; inline `<script>` handles open/close/scroll-lock of the side menu and search suggestions.
- `<custom-main-menu>` (`partials/main-menu.js`) builds the menu from `salla.api.component.getMenus()`.
- `window.updateCategoryLinks()` (master.twig) rewrites links that carry a category id to the real category URL once menus/categories are loaded.

## 5. Category / listing page modes — `pages/product/index.twig`
One template, four branches chosen by comparing `category.id` with settings:
| Branch | Condition | What it shows |
|---|---|---|
| "All products" | `category_all` matches | Hero with `category_all_desc`, sub-category cards from `subcategories`, sort, product list |
| Sub-category | category is listed in `subcategories` | Same layout with that sub-category's title/description, sibling cards |
| Gallery | `gallery_page_category` matches | Not a product list: photo grid (`gallery_images`, each linked to a product, opens `window.openGalleryPhotoModal`) and video reels (`gallery_videos`, YouTube poster auto-derived, opens `window.dispatchReelModal` with a product panel) |
| Default | otherwise | Optional per-category banner from `categories_banners`, `<salla-filters>`, sort, product list, then `home.testimonials` component |
The modals' JS is inline in `{% block scripts %}` of the same file (guards: `window.__galleryPhotoModalInit`, `window.__reelModalInit`).

## 6. Tag-based custom filters — `src/assets/js/products.js`
Live code is `class Products` (now at the top of the file; the old ~580-line commented legacy block above it was removed in Phase 2, `1a5e000`). After the first `salla-products-list::products.fetched` it builds its own filter UI from **product tags named `Group-Value`** (e.g. `الفئة العمرية-١-٣ سنوات`, `Age Range-7 months - 5 years`); Arabic vs English tags are detected by script of the group name. `DEFAULT_FILTERS` (ar/en) holds fallback groups. Also updates `#products-count-number` and syncs sort to the URL. Merchants must keep the tag naming convention or filters break.

## 7. Product page — `pages/product/single.twig` (1,776 lines)
Top to bottom:
1. `head_scripts`: LCP image preload with Cloudflare resize (700/400 widths).
2. Gallery slider (`slider_background_size`, `imageZoom`, 3D model via `<model-viewer>` when `product.has_3d_image`), thumbnails.
3. Info column: promotion title, rating summary, price, description/read-more, tags, sold/remaining, availability, SKU, digital files, options form (`pages.partials.product.options` between `product:single.form.*` hooks), quantity + `<salla-add-product-button>` **or** WhatsApp block, "available, ready to ship" line, payment/trust badges from `footer_links3`.
4. Per-product info from `products_settings` (matched by `item.product[0].id`): `for_who`, `material`, `inner_box` (ar/en, one line per row), `image_dimensions` (shown in the "dimensions" tab).
5. "Suggested games" from `products_play_games` (`target_product` → `products`).
6. `special_features` (per product) grid; tabs (description / dimensions); `slider_in_products` card slider.
7. Reviews: a hidden `<salla-comments>` fetches data; custom inline JS (`extractReviewsSummary`, `renderReviewsSummary`, `createReviewCardHtml`, `handleLoadMoreReviews`) renders `#reviews-summary` / `#reviews-container`; custom rating modal `#product-rating-modal`. Listens to `comment::list`.
8. `universal_features` (all products), FAQ accordion from `products_questions` (`all_products` switch or product match), related products slider.
9. `scripts`: reviews JS, accordion, tabs, then `product.js` (+ model-viewer from unpkg, + `digital-files.js` when needed).

## 8. Cart page — `pages/cart.twig` + `js/cart.js`
Custom layout around stock Salla pieces: free-shipping progress bar (`cart.free_shipping_bar`, `#free-shipping`), loyalty panel, gifting, `<salla-cart-coupons>`, `<salla-cart-summary-card>`, `<salla-tiered-offer>`, upsell slider fed by setting `products_in_cart`. Loads `checkout.js` (cart.js + thankyou.js). It no longer loads `product-card.js` itself (fix 09 #6 `1dab752`); master.twig's deferred copy registers the custom card before the upsell slider renders.

## 9. Add-to-cart toast
`partials/add-product-toast.js` registers `<salla-add-product-toast>` (theme version). `master.twig` renders one instance (`#custom-product-toast`) and shows it for 4s on `salla.cart.event.onItemAdded`. Toggle: `enable_add_product_toast`.

## 10. Side cart drawer — CODE PRESENT, NOT WIRED
`partials/cart-drawer.js` (`class CartDrawer`) and `04-components/cart-drawer.scss` exist and `app.js` calls `new CartDrawer().init()`, but **no twig file contains the `#cart-drawer` markup**, so `init()` exits immediately. The cart icon currently behaves as stock (goes to the cart page). To enable: add the drawer markup (ids listed in `_cacheElements()`) to `master.twig`. Ask the owner before doing so.

## 11. Custom home components (18)
Listed in 03-twilight-json.md. Notable: `reels-section` and `instagram-section` (15KB each, own inline JS/modals), `modern-banner-section` (hotspots + WhatsApp CTA with its own number fields), `common-questions-section`, `custom-testimonials`.

## 12. Footer
`components/footer/footer.twig`: three link columns + logo/description from settings; `footer_links3` doubles as payment/trust badges and is reused on the product page.

## 13. Image optimisation convention
Everywhere an image comes from `cdn.files.salla.network` or `cdn.salla.sa`, twig/JS insert `/cdn-cgi/image/width=N,format=auto,quality=NN/` after the host (guarded by `'cdn-cgi/image' not in url`). Follow the same pattern for new images; don't apply it to other hosts.
