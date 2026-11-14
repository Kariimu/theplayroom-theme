# Stage 7 — Data entry checklist (OWNER)

Safe to do now: the live Twig theme ignores all of this, so none of it can break
the current site. Tick items off directly in this file (change `[ ]` to `[x]`)
or keep your own copy — either way, note progress back in `TASK.md` Stage 7
when the whole page is done.

Source data: `docs/legacy/data/products.csv`, `products.json`, `categories.csv`,
`store-wide.json`. Where that extraction has a real gap (see each section), it
is called out instead of guessed at.

### Dashboard quick reference

Confirmed against Salla's own help center (links in each section below); exact
labels can shift slightly between dashboard languages/versions — if a label
doesn't match exactly, it's the nearest tab/button, not a different page.

| Data | Dashboard path |
|---|---|
| A. Facts (specs) | **Store settings → Custom fields → Products tab** to create the section once; then open each **product → Custom fields tab** to fill in values |
| B. Tags | **Products → open a product → Product details → tags field** |
| C. Category image / description | **Products → Categories & options → Categories → open a category** |
| D. Header/footer menus | **Store & Channels → Store Design → Customize → Menu Management** |
| E. Home block screenshots | **Store & Channels → Store Design → Customize** → the live editor (block list + each block's Edit panel); theme-wide settings are its **Design Options** tab |

---

## A. Product facts (3 products)

Only these three products have `for_who` / `material` / `inner_box` text captured
from the live site. Enter them as **specs** on the matching product in the
dashboard, using these exact group and field names — `app/lib/specs.ts` matches
them verbatim (case/whitespace-insensitive) to render the dedicated "facts" row
on the product page; any other spelling only shows in the generic specs
accordion, not the dedicated UI.

- Spec group name: **`تفاصيل المنتج`** (or `Product Details` on the English spec set)
- Field names: **`مناسب لـ`** (`Suitable for`) · **`الخامة`** (`Material`) · **`محتويات الصندوق`** (`Box contents`)

**Where:** these are Salla's "Custom fields" (`product.has_metadata`/specs), not a
plain text box. One-time setup, then per-product entry:
1. **Store settings → Custom fields → Products tab → Add new section.** Name it
   `تفاصيل المنتج`, scope "apply to every product" (or just the 3 categories
   these belong to), add the 3 fields above as **text** type, and turn on
   customer visibility so it shows on the storefront.
2. Open each of the 3 products below → **Custom fields tab** → add that
   section → fill in its 3 field values → save.
(Custom fields need the Pro/Special plan — confirm the store is on one.)

| Done | Product (ar) | id | `مناسب لـ` / Suitable for | `الخامة` / Material | `محتويات الصندوق` / Box contents |
|---|---|---|---|---|---|
| [ ] | بيت الألعاب | 1246641851 | مناسب لجميع الفئات العمرية | خشب الزان الصلب | هيكل بيت الالعاب؛ حبال سميكة؛ أدوات التجميع؛ دليل التركيب |
| [ ] | صندوق التخزين | 979102582 | مناسب لجميع الفئات العمرية | خشب الزان الصلب، مسامير من الستانلس ستيل، طلاء زيت خشب طبيعي | هيكل صندوق التخزين؛ مات يتم وضعها فوق الصندوق؛ أدوات التجميع؛ دليل التركيب |
| [ ] | مجموعة المغامرة | 744217497 | للأطفال من عمر 9 اشهر الى 6 سنوات تقريبًا | خشب الزان الصلب | هيكل مجموعة المغامرة؛ لوح تزحلق بوجهين وجه للسلق ووجه للتزحلق؛ ارجوحة اطفال؛ أدوات التجميع؛ دليل التركيب |

No English text was captured for these three (the old site only ever had Arabic
values for these fields) — write the English spec set yourself, or leave it
Arabic-only if the dashboard allows it.

---

## B. Tags (`whatsapp`, `cart-upsell`, `set:<name>`)

**Where:** open the product → **Product details** tab → the **tags** field →
type the exact tag text (`whatsapp`, `cart-upsell`, or `set:<name>`, matching
`app/lib/tags.ts` literally) → **Add**/Enter → **Save product details**. Tags
need the Plus/Pro plan. To tag several products at once faster, the product
list's bulk-actions menu can also set tags across a selection.

Convention source: `app/lib/tags.ts`. **Extraction gap:** the old theme drove
these from three dashboard settings whose *values* (which categories/products
were actually selected) were never captured by the Phase 0b crawl — only the
setting's existence and behaviour were (`docs/legacy/06-custom-features.md`
§2–§5, `03-twilight-json.md`). To find the real values, open the **live**
store's current theme settings (while the Twig theme is still active) and read:

| Old setting | Held | → New tag |
|---|---|---|
| `categories_whatsapp` | categories whose products get a WhatsApp enquiry button instead of add-to-cart | tag the matching products `whatsapp` |
| `products_in_cart` | the cart upsell slider's product list | tag the matching products `cart-upsell` |
| `products_play_games` | `target_product` → its `products` (the "suggested games" group) | tag every product in one group with the same `set:<name>` (pick any short name, e.g. `set:climbing-triangle`) |

Only the 14 products below actually render a product page today (the other 29
sitemap URLs redirect to the home page — tagging a redirecting product is
pointless until D6 is resolved in Stage 9). Check each one against the
dashboard settings above and tick whichever tags apply; most will get none.

| Done | Product (ar) | id | `whatsapp` | `cart-upsell` | `set:` |
|---|---|---|---|---|---|
| [ ] | خدمة التركيب | 1385822926 | [ ] | [ ] | `set:` |
| [ ] | حلقات خشبية | 334846772 | [ ] | [ ] | `set:` |
| [ ] | ارضيات بلاط خارجي | 1230899322 | [ ] | [ ] | `set:` |
| [ ] | ملصقات معدنية للجوال | 439970423 | [ ] | [ ] | `set:` |
| [ ] | كوب غرفة الألعاب | 129353473 | [ ] | [ ] | `set:` |
| [ ] | رول البيت المغناطيسي | 754836750 | [ ] | [ ] | `set:` |
| [ ] | رول القوس المغناطيسي | 1900499967 | [ ] | [ ] | `set:` |
| [ ] | إستاند للمراجيح | 431530834 | [ ] | [ ] | `set:` |
| [ ] | حوض الكور | 1880665425 | [ ] | [ ] | `set:` |
| [ ] | بيت الألعاب | 1246641851 | [ ] | [ ] | `set:` |
| [ ] | صندوق التخزين | 979102582 | [ ] | [ ] | `set:` |
| [ ] | مجموعة المغامرة | 744217497 | [ ] | [ ] | `set:` |
| [ ] | أرضيات فوم للأطفال | 826587792 | [ ] | [ ] | `set:` |
| [ ] | الإستيكرات | 1783930334 | [ ] | [ ] | `set:` |

If the old settings turn out to be empty/unused on the live store, tick the
section as "N/A — nothing to carry over" in `TASK.md` rather than inventing
tag assignments.

---

## C. Category images and descriptions

**Where:** **Products → Categories & options → Categories →** open the
category → its image, banner (if the field is present) and description sit
directly on that category's edit form; description doubles as the page's SEO
description field further down the same form. (Salla's docs note the category
**image** field is shown on Digital/Raed-based storefronts — this theme is a
Raed-starter rebuild, so it applies here.)

**Extraction gap:** `banner_image`/`banner_mobile_image`/`banner_title_*`/`banner_desc_*`
came back empty for every one of the 59 crawled categories — the crawler could
not find a banner on any category page (likely a CSS background-image it
doesn't read, or banners were already gone by the time of the crawl). There is
no data-driven way to tell which categories "had banners" — open each live URL
below and judge visually; if a category shows a hero image/banner on
theplayroom.sa today, add that same image + a short description to the
matching category in the dashboard (used by `CategoryHero`, Stage 4).

Ready-to-paste description text exists for 4 categories (`hero_desc_ar`/`en`
were captured) — use it directly as that category's dashboard description:

| Done | Category (ar / en) | id | Arabic description | English description |
|---|---|---|---|---|
| [ ] | جميع المنتجات / All Products | 2118208525 | اكتشف مجموعتنا الكاملة من الألعاب الخشبية التعليمية | Discover our full collection of educational wooden toys |
| [ ] | ٧ أشهر - ٢ سنة / 7 months - 2 years | 48709728 | ألعاب تنمو مع طفلك | that grow with your child |
| [ ] | ٢ سنة -٥ سنين / 2 - 5 years | 2021109091 | ألعاب مثالية لمرحلة الاستكشاف | Perfect toys for the discovery stage |
| [ ] | ٥ سنوات - ٨ سنة / 5 - 8 years | 1247595628 | ألعاب تخدم طفلك لسنوات طويلة | Toys that serve your child for many years |

All other live categories (54 more, listed below) — open the URL, and if it
has a banner image on the live site, copy the image and write a short
description for it in the dashboard; if it never had one, tick "N/A":

| Done | Category (ar) | id | Live URL |
|---|---|---|---|
| [ ] | الطلب المسبق | 694674476 | https://theplayroom.sa/ar/الطلب-المسبق/c694674476 |
| [ ] | الأكسسوارات | 1980773349 | https://theplayroom.sa/ar/الأكسسوارات/c1980773349 |
| [ ] | الأرضيات | 1944845064 | https://theplayroom.sa/ar/الأرضيات/c1944845064 |
| [ ] | المجموعات المخفضة | 1094861344 | https://theplayroom.sa/ar/المجموعات-المخفضة/c1094861344 |
| [ ] | خدمات التركيب | 1116539108 | https://theplayroom.sa/ar/خدمات-التركيب/c1116539108 |
| [ ] | تخزين الالعاب | 1921374651 | https://theplayroom.sa/ar/تخزين-الالعاب/c1921374651 |
| [ ] | تخفيضات الجمعة البيضاء | 851891340 | https://theplayroom.sa/ar/تخفيضات-الجمعة-البيضاء/c851891340 |
| [ ] | الصفحه الرئيسيه | 156901053 | https://theplayroom.sa/ar/الصفحه-الرئيسيه/c156901053 |
| [ ] | أثاث | 752288773 | https://theplayroom.sa/ar/أثاث/c752288773 |
| [ ] | offers | 118242011 | https://theplayroom.sa/ar/offers/c118242011 |
| [ ] | بيوت المرح | 769893142 | https://theplayroom.sa/ar/بيوت-المرح/c769893142 |
| [ ] | مثلث بيكلر واكسسواراته | 1018473246 | https://theplayroom.sa/ar/مثلث-بيكلر-واكسسواراته/c1018473246 |
| [ ] | لوح التوازن واكسسواراته | 1475737705 | https://theplayroom.sa/ar/لوح-التوازن-واكسسواراته/c1475737705 |
| [ ] | الألعاب الجدارية | 2037844691 | https://theplayroom.sa/ar/الألعاب-الجدارية/c2037844691 |
| [ ] | مثلث بيكلر و لوح التوازن | 1268823373 | https://theplayroom.sa/ar/مثلث-بيكلر-و-لوح-التوازن/c1268823373 |
| [ ] | سلم سويدي | 501153692 | https://theplayroom.sa/ar/سلم-سويدي/c501153692 |
| [ ] | بيت التسلق | 964705694 | https://theplayroom.sa/ar/بيت-التسلق/c964705694 |
| [ ] | بيت الطاحونة | 191716511 | https://theplayroom.sa/ar/بيت-الطاحونة/c191716511 |
| [ ] | لوح التوازن | 1268256163 | https://theplayroom.sa/ar/لوح-التوازن/c1268256163 |
| [ ] | طاولة اللعب الحسي | 1511181234 | https://theplayroom.sa/ar/طاولة-اللعب-الحسي/c1511181234 |
| [ ] | صندوق تخزين الالعاب | 551717331 | https://theplayroom.sa/ar/صندوق-تخزين-الالعاب/c551717331 |
| [ ] | بيت الالعاب | 341790820 | https://theplayroom.sa/ar/بيت-الالعاب/c341790820 |
| [ ] | مجموعة المغامرة | 205400156 | https://theplayroom.sa/ar/مجموعة-المغامرة/c205400156 |
| [ ] | مثلث بيكلر | 2085340175 | https://theplayroom.sa/ar/مثلث-بيكلر/c2085340175 |
| [ ] | مرسم متنقل | 1464900911 | https://theplayroom.sa/ar/مرسم-متنقل/c1464900911 |
| [ ] | سلم تسلق | 1571853312 | https://theplayroom.sa/ar/سلم-تسلق/c1571853312 |
| [ ] | شبك تسلق | 1619587180 | https://theplayroom.sa/ar/شبك-تسلق/c1619587180 |
| [ ] | جدار تسلق | 844439405 | https://theplayroom.sa/ar/جدار-تسلق/c844439405 |
| [ ] | مرتبة لوح التوازن | 1579113839 | https://theplayroom.sa/ar/مرتبة-لوح-التوازن/c1579113839 |
| [ ] | خيمة | 96639849 | https://theplayroom.sa/ar/خيمة/c96639849 |
| [ ] | مرجيحة الزرافة | 1471134314 | https://theplayroom.sa/ar/مرجيحة-الزرافة/c1471134314 |
| [ ] | مرجيحة اليونيكورن | 1934751860 | https://theplayroom.sa/ar/مرجيحة-اليونيكورن/c1934751860 |
| [ ] | حلقات خشبية | 1295910773 | https://theplayroom.sa/ar/حلقات-خشبية/c1295910773 |
| [ ] | مرجيحة اطفال | 521873014 | https://theplayroom.sa/ar/مرجيحة-اطفال/c521873014 |
| [ ] | حلقات خشبية | 769225863 | https://theplayroom.sa/ar/حلقات-خشبية/c769225863 |
| [ ] | مرجيحة الاطفال | 1233957505 | https://theplayroom.sa/ar/مرجيحة-الاطفال/c1233957505 |
| [ ] | مجموعة التسلق | 459919746 | https://theplayroom.sa/ar/مجموعة-التسلق/c459919746 |
| [ ] | أرضيات فوم للأطفال - بيج | 135196080 | https://theplayroom.sa/ar/أرضيات-فوم-للأطفال-بيج/c135196080 |
| [ ] | أرضيات فوم للأطفال - وردي فاتح | 2098485644 | https://theplayroom.sa/ar/أرضيات-فوم-للأطفال-وردي-فاتح/c2098485644 |
| [ ] | ارضيات فوم خارجية | 1499058050 | https://theplayroom.sa/ar/ارضيات-فوم-خارجية/c1499058050 |
| [ ] | تخفيضات نهاية السنة | 1762692959 | https://theplayroom.sa/ar/تخفيضات-نهاية-السنة/c1762692959 |
| [ ] | لوح القوس المغناطيسي | 2034943127 | https://theplayroom.sa/ar/لوح-القوس-المغناطيسي/c2034943127 |
| [ ] | لوح البيت المغناطيسي | 1993941394 | https://theplayroom.sa/ar/لوح-البيت-المغناطيسي/c1993941394 |
| [ ] | سلم سويدي - للكبار | 1818857117 | https://theplayroom.sa/ar/سلم-سويدي-للكبار/c1818857117 |
| [ ] | تخفيضات عيد الفطر | 1984989662 | https://theplayroom.sa/ar/تخفيضات-عيد-الفطر/c1984989662 |
| [ ] | حوض الكور | 888202796 | https://theplayroom.sa/ar/حوض-الكور/c888202796 |
| [ ] | إستاند للمراجيح | 526066272 | https://theplayroom.sa/ar/إستاند-للمراجيح/c526066272 |
| [ ] | تخفيضات عيد الأضحى | 1763721569 | https://theplayroom.sa/ar/تخفيضات-عيد-الأضحى/c1763721569 |
| [ ] | السلم السويدي و شبك التسلق | 1228195236 | https://theplayroom.sa/ar/السلم-السويدي-و-شبك-التسلق/c1228195236 |
| [ ] | شبك التسلق و جدار التسلق | 454157477 | https://theplayroom.sa/ar/شبك-التسلق-و-جدار-التسلق/c454157477 |
| [ ] | السلم السويدي و جدار التسلق | 278938016 | https://theplayroom.sa/ar/السلم-السويدي-و-جدار-التسلق/c278938016 |
| [ ] | تصميم مناطق لعب مخصصة | 1766577166 | https://theplayroom.sa/ar/تصميم-مناطق-لعب-مخصصة/c1766577166 |
| [ ] | غرف ألعابنا السعيدة (renamed) | 1241225104 | https://theplayroom.sa/ar/معرض-الأعمال/c1241225104 |
| [ ] | تخفيضات اليوم الوطني (renamed) | 333670039 | https://theplayroom.sa/ar/تخفيضات-اليوم-الوطني/c333670039 |

(One more crawled category, id `1489698407` "تخفيضات اليوم الوطني", now redirects
to the home page on the live site — skip it, nothing to enter.)

---

## D. Header and footer menus

**Where:** **Store & Channels → Store Design → Customize (on the active theme)
→ Menu Management** (side menu inside the editor) — lists every menu, which
theme version(s) it's assigned to, and lets you edit/add/duplicate/rename
items (the two built-in "core" menus can't be deleted, only edited). Assign
whichever menu plays the header/footer role to this theme version here.

No CSV data exists for this — the old side menu (`menu_links` setting) and
footer (three link columns, `components/footer/footer.twig`) were
dashboard-managed lists of links, not something the Phase 0b crawl captured.
The new theme reads the dashboard's native **Menus** feature directly
(`HeaderNav`/`SallaMenu`, Stage 2), so there is nothing to port in code — only
the dashboard menu content needs to match:

- [ ] Open the live site's header side menu and compare every link/label/order against the dashboard's header menu (Online Store → Navigation/Menus)
- [ ] Open the live site's footer (three columns) and compare every link/label/order against the dashboard's footer menu
- [ ] Confirm payment/trust badge content (`footer_links3` on the old site) still matches what's intended — the new theme uses Salla's native `SallaPayments`/`SallaTrustBadges`, not a settings list

---

## E. Screenshots (rollback reference)

**Where:** **Store & Channels → Store Design → Customize (on the active theme)**
opens the live editor. The **Homepage components** area is the block list in
page order — hover/click each block for its Edit action, which opens that
block's own settings panel (the per-field values to screenshot). The theme's
store-wide settings (the ones declared in `twilight.json` — `show_whatsapp`,
`whatsapp_number`, `footer_logo`, `footer_description`, etc.) are on the
editor's **Design Options** tab, not inside any one block.

Take these before changing anything else above, so there's a clean "before" record:

- [ ] Full-page screenshot of the current (Twig) home page, desktop and mobile — the visual reference
- [ ] In the dashboard's home-page editor: screenshot the block list in order, then open **each** block and screenshot its settings panel so every field value (product picks, links, text) is readable — this is what Stage 14 actually re-enters from ("set up the home page and settings from the Stage 7 screenshots"); a rendered-page screenshot alone can't be used for that
- [ ] Screenshot of every theme setting screen/tab in the dashboard (current values, before any Stage 7 edits)
- [ ] Save all screenshots under one dated folder (e.g. `docs/legacy/screenshots/2026-11-14/`) and note the folder name here once done

---

## Not on this checklist but worth doing alongside it

The FAQ accordion (Stage 5 `ProductFaq`, resolved via D2) reads its questions
from the `common-questions-section` home block, not from a product field — it
currently has no content in `twilight.preview.json`. The 16 shared questions
already extracted to `docs/legacy/data/store-wide.json` (`faq` array, Arabic
only) are ready to paste into that block's `items` in the dashboard once the
real home-page arrangement is rebuilt (Stage 3's "done when"). Flagging here
only because it's sourced from the same `docs/legacy/data/` extraction this
checklist is built from — not a Stage 7 checklist item, so not tracked above.
