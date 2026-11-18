# Phase 0 findings (replacement for the lost spike report)

Measured on 12 Nov 2026 against the live store's Store API through the Twilight SDK on https://theplayroom.sa (the React engine reads the same API), plus a read of the type definitions in `@salla.sa/twilight-theme-engine` 1.0.173. Test product: 1571449334 (السلم السويدي).

"Observed" = seen in a real response. "Engine" = present in the engine's public types, **not exercised in this repo yet**. Each engine item has a confirm step for Stage 1.

## 1. Product specs (metadata) — readable as data: YES (observed)
- `salla.metadata.api.fetchValues('product', [id])` returns:
  `[{ entity_id, sections: [{ id, name, fields: [{ id, name, type, value }] }] }]`
- Field `type` values seen: `text` (value = string) and `file` (value = file URL, here a PDF).
- This product has sections "دليل التركيب" (1 file field), "مميزات المنتج" and "إستخدامات المنتج" (text fields whose `name` is "." and whose text is in `value`).
- So facts and FAQ **can** be stored as spec sections and read as structured data.
- Engine: there is no dedicated metadata module under `/api/*`. The product has `has_metadata: boolean`; the starter renders specs with the client-side `SallaMetadata` component. The engine exports a generic HTTP client (`api` from `/api/client`).
- **Confirm in Stage 1:** can a route loader fetch the metadata values on the server (generic client or documented helper) so the facts are in View Source? If not, specs are client-rendered only: keep product facts in specs anyway (they are per-product data), and keep SEO-critical text in the product description.
- Convention needed: section names are free text, so the theme must match by exact section name. Define the names in one place (`app/lib/specs.ts`): e.g. "لمن هذا المنتج؟", "المادة", "محتويات العلبة".

## 2. Tags — on list responses: YES; list by tag: YES (observed)
- `salla.product.fetch({ source: 'latest' })`: every product carries `tags` without asking for it (first product: 7 tags).
- Tag object shape: `{ name, url }`. On list responses `url` can be `null`; on the detail response it is the tag page URL ending in `tag-<id>`. **There is no `id` field**: match tags by `name`.
- `salla.product.fetch({ source: 'tags', source_value: [1143764859] })` returned the 5 products tagged "مجموعة التسلق". Engine: `'tags'` is a valid `ProductsListSource`.
- Category on list responses is only `{ name, url: null }`, **no id**. Deciding WhatsApp-only by category id on a product card is therefore not possible; a tag is the right mechanism.
- Final tier: `whatsapp`, `cart-upsell`, `set:` rows stay Tier 2. `categories_whatsapp` is **not** needed as a fallback setting; leave it out of the manifest.
- Note for lists by tag: the source needs the numeric tag id (from the tag URL), not the name. `app/lib/tags.ts` should hold `{ name, id }` for tags used as list sources.

## 3. Category description and image — available: YES in engine types, values not observed
- Engine: `Category { id, name, description?, url, icon?, image?, products_count?, sub_categories?, items? }`; `CategoryPageProps.category: Category`; `category.find(id)` and `category.list()` exist under `/api/category`.
- Product detail's `category` has `name, id, sub_categories, url, icon, image`.
- Not verified: whether this store's categories have images/descriptions filled in (that is Stage 7 data entry), and whether `description` is populated in the listing loader or needs `category.find`.
- **Confirm in Stage 1:** log `category` in the listing page for c1247595628. Tier stays 1.

## 4. Menus — sufficient: YES for footer, PARTLY for header (observed)
- `getMenus('footer')`: 7 items (المدونة, سياسة الخصوصية, الإستبدال والإسترجاع, الأسئلة الشائعة, أيش هي تمارا؟, من نحن, أعمالنا). Enough for the footer link columns as one list. Two separately titled columns are not expressible unless the menu supports children; show one "important links" column.
- `getMenus('header')`: 62 items, shape `{ id, order, title, url, image, target, has_children, children[] }`. It is the full category/menu list, not the short curated side menu the old `menu_links` setting gave.
- Final tier: footer links Tier 1. Side menu Tier 1 using the header menu, but it needs a rule for which items to show (e.g. top-level only, first N, or items with children). OWNER to tidy the header menu in the dashboard; no setting.
- Engine: a `menu` module exists under `/api/menu`.

## Final tier per 5A row
| Row | Final tier | Note |
|---|---|---|
| Product facts (for_who, material, inner_box) | 1 (specs) | 3 products today; section names fixed in `app/lib/specs.ts`; server-read to confirm |
| Dimensions image | 1 (description) | none exist today; build nothing until one does |
| FAQ | per D2: 3 (locales) or the `common-questions-section` block | one store-wide list of 16; not per product |
| Feature badges, cards | deferred | none exist today; do not build the library until needed |
| Suggested games | 2 (`set:` tag → list by tag id) | proven with "مجموعة التسلق" |
| Universal features (4) | 3 (locales + `public/`) | |
| WhatsApp-only | 2 (tag `whatsapp`) | no fallback setting |
| Cart upsell | 2 (tag `cart-upsell`) | |
| Sub-categories, category hero | 1 (category data) | values to confirm in Stage 1 |
| Gallery | per D3 | |
| Side menu | 1 (header menu) | needs a display rule |
| Footer links | 1 (footer menu) | one column |
| Payment / trust badges | 1 (native components) | not tested here; confirm the components render in Stage 2 |
| Search suggestions | 3 (locales) | |
| footer_logo, footer_description, show_whatsapp, whatsapp_number | 4 (settings) | |
