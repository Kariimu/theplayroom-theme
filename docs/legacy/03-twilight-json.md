# 03 — twilight.json (theme manifest)

Root file, ~127KB, valid JSON required. Top-level keys: `name {ar,en}`, `description {ar,en}`, `repository`, `author_email`, `support_url`, `features[]`, `settings[]`, `components[]`.
(There is no `type: "react"` key; that is the React engine. This is a Twig theme.)

Salla reads this file to build the dashboard UI. Changes to settings/components only show up for merchants after the theme version is synced/published through the Partners Portal (GitHub sync).

## Features (17) — platform-provided, turned on by name
`mega-menu`, `fonts`, `color`, `breadcrumb`, `unite-cards-height`, `menu-images`, `filters`, and home components: `component-featured-products`, `component-fixed-banner`, `component-fixed-products`, `component-products-slider`, `component-photos-slider`, `component-parallax-background`, `component-testimonials`, `component-square-photos`, `component-store-features`, `component-youtube`.
Each `component-*` feature maps to a stock Raed twig in `src/views/components/home/` (e.g. `component-youtube` → `youtube.twig`). `fonts` and `color` expose `theme.font.*` and `theme.color.*`.

## Settings (50 entries)
Shape of an entry: `{ id, type, format, label, value, required, … }`.
- `type: boolean`, `format: switch` → read with `theme.settings.get('id', default)`.
- `type: string`, `format: text|textarea|image|url`, optionally `multilanguage: true` (value then comes as `{ar, en}`).
- `type: items`, `format: dropdown-list`, with `source: categories|products|Manual`, `multichoice` true/false. Returned shape varies, see "Defensive patterns" in 02.
- `type: collection`: repeater. `fields[]` have ids prefixed `<collection_id>.<field>` (e.g. `footer_links1.title`). In Twig you iterate `{% for item in theme.settings.get('footer_links1') %}` and read `item.title`, `item.link` (prefix dropped).
- `type: static`, `format: title|line`: dashboard decoration only (ids like `static-line1`).

### Settings inventory (id → where used)
| id | type | Used in |
|---|---|---|
| show_whatsapp, whatsapp_number | boolean, number | master.twig floating WhatsApp button |
| categories_whatsapp | items (categories, multi) | master.twig body attr `whatscatgory`; product-card.js + product/single.twig swap Add-to-cart for WhatsApp button |
| category_all, category_all_desc, subcategories | items, string, collection | product/index.twig: "All products" landing mode with sub-category cards |
| categories_banners | collection | product/index.twig (per-category desktop/mobile banner) |
| gallery_page_category, gallery_page_title, gallery_page_desc, gallery_images, gallery_videos_sec_title, gallery_videos | mixed | product/index.twig "Gallery" page mode |
| squar_photo_bg_image_size | items (contain/cover) | home/square-photos.twig |
| vertical_fixed_products | boolean | home/fixed-products.twig, featured-products-style2.twig, landing-page.twig |
| special_features | collection (per-product) | product/single.twig |
| universal_features | collection | product/single.twig |
| slider_in_products | collection | product/single.twig "card slider" |
| slider_background_size, imageZoom | items, boolean | product image slider fit / zoom (`window.imageZoom`) |
| products_settings | collection (≤90) | product/single.twig per-product info (box contents, material, …) |
| products_questions | collection (≤500) | product FAQ accordion (supports "all products" switch) |
| products_play_games | collection | product/single.twig "play games / Swedish ladder" related items |
| products_in_cart | items (products) | cart.twig upsell slider |
| search_texts | collection | header.twig (suggested search words) |
| menu_links | collection | header.twig (menu category links) |
| footer_logo, footer_description, footer_title1-3, footer_links1-3 | string/collection | footer.twig (links3 = payment method images) |
| enable_add_product_toast | boolean (default true) | master.twig, add-product-toast bundle |
| static-* / *_label | static | dashboard grouping only |

Settings read in Twig but **not declared** in twilight.json (always return the fallback, so either dead code or a missing declaration): `sticky_add_to_cart`, `footer_is_dark`, `topnav_is_dark`, `important_links`, `show_tags`, `is_more_button_enabled`, `enable_more_menu` (and `my_var` which is just a docblock example). Check before relying on them.

## Home components (18 registered)
`components[]` entry: `{ key (UUID), title {en,ar}, icon, path, image, fields[] }`. `path` = `home.<twig-file-name>` → `src/views/components/home/<name>.twig`. Fields become properties of `component` inside that twig.

| path | Key fields |
|---|---|
| home.enhanced-slider | slides[] (image, title, description, without_overlay …) |
| home.main-links | title, merge_with_top_component, show_controls, show_cats, categories, links[] |
| home.slider-products-with-header | background, title, description, products, display_all_url |
| home.enhanced-square-banners | banners[] |
| home.brands | title, brands |
| home.custom-testimonials | items[] |
| home.banner-section | image_desktop/_mobile (+descriptions), top_margin |
| home.reviews-section | title, description, button_text, link, rating_count, total_reviews |
| home.custom-brands-section | display_as_grid, brands[] |
| home.shopping1-section | title, subtitle, items[] |
| home.products-section | title_section, desc_section, desc2_section, products, btn_text, button_url |
| home.reels-section | title_section, desc_section, all_products, reels[] |
| home.features-section | title_section, features[] |
| home.gallery-section | title_section, desc_section, gallery[], btn_text, button_url |
| home.modern-banner-section | 14 fields: text_icon, title/desc, image, text_on_image, features[], footer text, WhatsApp msg/number/btn, all_products, hotspots[] |
| home.features2-section | fatures[] (sic, typo is the real field id, don't "fix") |
| home.common-questions-section | title_section, questions[] |
| home.instagram-section | page_img/name/link, posts[], follower counts, follow_btn, showing-btn |

Twig files in `components/home/` that are NOT in the list above are stock-Raed blocks driven by `features` (e.g. `youtube`, `fixed-banner`, `parallax-background`, `photos-slider`, `square-photos`, `store-features`, `testimonials`, `latest-products`, `featured-products-style1-3`, `products-slider`, `fixed-products`).

## Rules when editing
1. Never change an existing `id` or component `key`. Add new ones instead.
2. New component: new UUID `key`, `path` matching a new twig file, `fields` with unique ids, ar+en `label`s, an `icon` (`sicon-*`).
3. New setting inside a collection: id must be `<collection>.<field>`.
4. Keep Arabic labels for merchant-facing text (the dashboard is Arabic-first). Add English where the schema supports `{ar,en}`.
5. After editing, validate JSON and mention in the summary that the merchant/Partners Portal must resync.
