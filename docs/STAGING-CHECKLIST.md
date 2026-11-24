# Staging checklist: The Playroom React theme

A click-through script for the Stage 14 walk-through (`TASK.md`). You test the real theme on the demo store before the live store changes. Work top to bottom and tick each box. Anything that is wrong goes into `TASK.md` under Stage 14 (format in §1) and is fixed through a normal stage PR, never directly on the demo store.

- **Who:** the owner clicks; the agent re-runs the automated checks in §10 once the staging URL exists.
- **Time:** about 3 hours for §2–§9, and it can be split across days.
- **Never:** do not change the live store, and do not publish the theme in the Partners Portal. Those steps belong to Stage 15.

---

## 0. Setup (OWNER, once)

- [ ] Create a demo store for this theme in the Partners Portal. Each theme needs its own preview store.
- [ ] On the theme's portal page, set **GitHub Branch** to `migration`.
- [ ] Open the build log and confirm it is green.
  - [ ] Also confirm that the `.github/workflows/ci.yml` file added in Stage 13 did not upset the build. If it did, note the error and stop here.
- [ ] Install the theme on the demo store ("Send Installation Request").
- [ ] Copy into the demo store the products, categories, tags, specs and menus from `docs/DATA-ENTRY.md`. At least the 3 products with facts and the 14 products that render today, and their categories.
- [ ] Set up the home page and settings from the Stage 7 screenshots (`docs/DATA-ENTRY.md` §E).
- [ ] Write the staging URL here: `______________________________`

**Data the walk-through needs.** Make sure each of these exists on the demo store before you start:

| What | Why |
|---|---|
| A product on sale (sale price set) | Price sizes and colour above Add to Cart |
| A product with several images and a video | Gallery, lightbox |
| A product with options (colour/size) and the option «خدمة التركيب» | Options panel, installation service |
| A product tagged `whatsapp` | Enquiry instead of Add to Cart |
| A product tagged `cart-upsell` | Cart upsell slider |
| Two products sharing a `set:<key>` tag | "Play together" suggestions, **and the colon test in §9** |
| A product and its accessories tagged `addons-p<masterId>` | Add-ons |
| A product tagged `feature-<key>`, `inuse-<key>`, `faq-<key>` | Features, in-use photos, per-product FAQ |
| A product with specs filled (`تفاصيل المنتج` group) | Specifications section |
| A product that is out of stock | "Notify me", greyed card |
| The category «معرض الأعمال» picked in «تصنيف صفحة المعرض» | Gallery page |
| A blog with 2+ articles | Blog block, blog pages |
| A test customer account | Account pages, order |

---

## 1. How to log an issue

Add one line per issue to `TASK.md` under **Stage 14**:

```
- [ ] S14-<n>: <page> · <ar|en> · <mobile|desktop> · what you saw → what you expected (screenshot: <file>)
```

Example: `- [ ] S14-3: product · ar · mobile · installation price shows "+150" with no currency → "+150 ر.س"`

---

## 2. Run every page in four views

Do §3 four times:

| Pass | Language | Width |
|---|---|---|
| 1 | `/ar` | Mobile (phone, or browser at 375px) |
| 2 | `/ar` | Desktop (1280px) |
| 3 | `/en` | Mobile |
| 4 | `/en` | Desktop |

On every page and in every pass, check these four things:
- [ ] **Text:** nothing appears in the wrong language.
- [ ] **Direction:** right-to-left in Arabic, left-to-right in English. Arrows point the reading way, and nothing is cut off or overlapping.
- [ ] **Console:** no red errors (desktop browser, DevTools → Console).
- [ ] **Navigation:** clicking a link inside the store does not reload the whole page.

---

## 3. Page types

Tick each page in each pass: `ar-m`, `ar-d`, `en-m`, `en-d`.

### Home `/ar`, `/en`

| ar-m | ar-d | en-m | en-d |
|---|---|---|---|
| [ ] | [ ] | [ ] | [ ] |

- **Header:**
  - Logo, menu, search, account and cart all show.
  - The menu icon is `#222`.
  - The language switch goes to the other language on the same page.
- **Blocks:**
  - Every block on the page shows and is in the right order.
  - Blocks further down appear as you scroll.
- **Footer:**
  - Logo, text, menus, contacts and payment icons all show.
  - The dark footer setting works (§5).
- **WhatsApp:** the floating WhatsApp button opens `wa.me/<store number>`, never `wa.me/0`.

### Category / listing

| ar-m | ar-d | en-m | en-d |
|---|---|---|---|
| [ ] | [ ] | [ ] | [ ] |

- Check a normal category, the search results (`?q=`), a tag page, a brand page, and `/brands`.
- **Filters and count:**
  - The tag filters show.
  - Picking one filters the products and updates the count.
  - Clearing them resets the list.
- **Sorting** changes the order.
- **More products:** pagination or "load more" brings more products.
- **Product cards:** image, name, price and sale price all show.
  - An out-of-stock card is greyed and shows "Notify me".
  - Add to Cart works from the card.
- **Breadcrumbs** show or hide with the setting.

### Gallery category `/ar/معرض-الأعمال/c1241225104`

| ar-m | ar-d | en-m | en-d |
|---|---|---|---|
| [ ] | [ ] | [ ] | [ ] |

- **Page:**
  - The hero title and description show.
  - A row of photos and a row of videos show; there is no product list.
- **Popup:**
  - Opening a photo or video shows its linked product with "Shop now".
  - The close button is in the reading-end corner.
  - Escape closes the popup.
- **Without the setting:** clear «تصنيف صفحة المعرض» for a moment. The category then shows a normal product list. Set it back afterwards.

### Product page

| ar-m | ar-d | en-m | en-d |
|---|---|---|---|
| [ ] | [ ] | [ ] | [ ] |

Run this on the sale product, the product with options, the `whatsapp` product and the out-of-stock product.

- **Mobile top row:**
  - A "العودة للرئيسية / Back to Home" row sits above the images, with no start padding.
  - It goes to the home page.
  - There is no wishlist or share icon on the image.
- **Gallery:**
  - Swiping works and the thumbnails show.
  - Tapping opens the lightbox with images and video.
  - In the Salla app, it opens the app's own gallery.
- **Prices on a sale product, above Add to Cart:**
  - The total price is 22px and `#222222`.
  - The old price is 20px and struck through.
- **Price changes:**
  - Changing the quantity or an option updates the price, with a short pulse.
- **Options:**
  - The collapsible panel follows the setting.
  - A product with 2 options or fewer shows them in full.
- **Installation service:**
  - The cities show with prices in the visitor's currency.
  - Picking a city updates the total.
  - Switch the currency and check the prices follow it.
- **WhatsApp product:** shows an enquiry button instead of Add to Cart, and it opens WhatsApp with the product name.
- **Out of stock:** shows the out-of-stock message and "Notify me".
- **Sections:**
  - The four product-info sections open and close.
  - Specs, features, in-use photos, the per-product FAQ and reviews show.
  - The add-ons and the "play together" suggestions show.
- **Sticky bar:** the sticky Add to Cart bar on mobile follows its setting.
- **Hidden product:** a deleted or hidden product URL goes to the home page with a "Page not found" message.

### Cart drawer and cart page `/cart`

| ar-m | ar-d | en-m | en-d |
|---|---|---|---|
| [ ] | [ ] | [ ] | [ ] |

- **Empty drawer:** in a fresh private window (no cart yet), tap the header cart icon. The drawer must say "السلة فارغة / Your cart is empty". It must **not** show grey placeholder rows that never go away.
- **Drawer with items:**
  - Add 2 products, then open the drawer.
  - Changing the quantity and removing an item work, and the total updates.
  - "View Cart" goes to `/cart`.
  - "Complete Order" goes to checkout.
- **Cart page:**
  - Items, options, the installation service, quantity, coupon, the free-shipping bar and the upsell slider all show.
- **Empty cart page:** shows the empty state with the upsell slider.

### Checkout hand-off and thank-you

| ar-m | ar-d | en-m | en-d |
|---|---|---|---|
| [ ] | [ ] | [ ] | [ ] |

- Place the test order in §4, once in each language.
- The thank-you page shows the order number, the items and the cashback text if loyalty is on.

### Account (signed in as the test customer)

| ar-m | ar-d | en-m | en-d |
|---|---|---|---|
| [ ] | [ ] | [ ] | [ ] |

- Check orders and one order's detail, wishlist, profile, settings, notifications, wallet, and the loyalty pages if they are on.
- Sign out (`/logout`) and back in.
- Wishlist:
  - Adding from a product card shows on `/account/wishlist`.
  - Removing it works.

### Content pages

| ar-m | ar-d | en-m | en-d |
|---|---|---|---|
| [ ] | [ ] | [ ] | [ ] |

- **Blog:** the blog list, a category, a tag, an author and an article.
- **Store pages:** a static page (`/…/page-<id>`), `/faq`, `/testimonials`.
- **Not found:** a 404 URL shows the not-found page in the page's language.

---

## 4. Test order

Use the demo store's test payment, or bank transfer / cash on delivery if no test gateway is set.

- [ ] **Order 1:** in `/ar` on mobile, as a guest.
  - Buy the sale product and the product with options, with an installation city picked.
  - Complete checkout.
- [ ] **Order 2:** in `/en` on desktop, signed in.
  - Add from a product card and from the drawer.
  - Complete checkout.
- [ ] **Check each order:**
  - The dashboard order shows the right items, options, installation line and totals.
  - The thank-you page matches.
  - The order appears in the customer's account.
- [ ] **After the order:** the cart is empty and the drawer says so.

---

## 5. Settings: change each once and see its effect

Open the theme customizer on the demo store. For each setting, change it, save, reload `/ar`, check the effect, then set it back.

| ✓ | Setting (in the editor) | Where to look | Expected effect |
|---|---|---|---|
| [ ] | شكل بطاقة المنتج | Home blocks, category | Vertical / horizontal cards; the category's default view |
| [ ] | شكل صورة بطاقة المنتج | Vertical cards | Image frame shape changes |
| [ ] | تصميم رأس الصفحة | Every page | Lite: logo centred + menu button. Default: top bar + horizontal menu |
| [ ] | القائمة الرئيسية في سطر واحد مع «المزيد» | Header (default layout) | Links that don't fit go into "More" |
| [ ] | عرض معلومات المتجر تحت الشعار | Header (lite) | Store name, description and social links under the logo |
| [ ] | معلومات المتجر في الصفحة الرئيسية فقط | Header (lite) | Off: on every page |
| [ ] | تثبيت القائمة الرئيسية أعلى الصفحة عند التمرير | Scroll any page | Header sticks |
| [ ] | شريط علوي داكن | Header | Dark bar, light icons |
| [ ] | روابط الصفحات المهمة في الشريط العلوي | Top bar (default layout) | Important page links show |
| [ ] | عرض الصور في قسم الصور المربعة | Square images block | Cover / contain |
| [ ] | عرض عمودي في قسم المنتجات الثابتة | Fixed products block | Vertical layout |
| [ ] | زر «عرض الكل» في أقسام الصفحة الرئيسية | Home product blocks | "View all" button shows |
| [ ] | أسفل الصفحة داكن | Footer | Near-black footer palette |
| [ ] | مسار التنقل في صفحة المنتج | Product page | Breadcrumbs show / hide |
| [ ] | مسار التنقل في صفحات قوائم المنتجات | Category | Breadcrumbs show / hide |
| [ ] | إشعار محسّن عند الإضافة للسلة | Add to cart | Enhanced toast |
| [ ] | زر «أعلمني عند التوفر» في بطاقة المنتج | Out-of-stock card | Button shows / hides |
| [ ] | تثبيت زر الإضافة للسلة أسفل شاشة الجوال | Product, mobile | Sticky bar shows / hides |
| [ ] | خيارات المنتج في لوحة قابلة للطي | Product with 3+ options | Collapsed summary / full options |
| [ ] | عرض الصور في معرض صور المنتج | Product gallery | Cover / contain |
| [ ] | تكبير صور المنتج | Product gallery | **Known: does nothing** (Stage 8). Decide: keep, or remove from the manifest |
| [ ] | زر واتساب العائم | Every page | Floating button shows / hides |
| [ ] | رقم واتساب المتجر | Floating button, `whatsapp` product | Links use this number. Field stays visible when the button is off |
| [ ] | شعار أسفل الصفحة | Footer | Replaces the store logo there |
| [ ] | نص أسفل الصفحة | Footer | Text shows |
| [ ] | تصنيف صفحة المعرض | Gallery category | See §3 |

Also check in the editor:
- [ ] **Labels:** every setting label and home-block title is readable in Arabic, and in English when the dashboard is in English. None shows a code name like `banner-section`.
- [ ] **Hotspots:** the hotspot X/Y fields on «بانر تفاعلي بنقاط المنتجات» are number boxes (0–100).

---

## 6. Home blocks: add, fill, check

For each block:
1. Add it in the customizer and fill its fields.
2. Check it in `/ar` and `/en`, on mobile and desktop.
3. Empty its main field and check the block hides cleanly, with no empty gap.

| ✓ | Block (editor title) | Check |
|---|---|---|
| [ ] | صور متحركة (محسّنة) | Slides, autoplay, in-container, background video, button |
| [ ] | صور متحركة مع نصوص | Same, text in the middle |
| [ ] | روابط سريعة | Icons/images in circles, categories mode, arrows, merge with the block above |
| [ ] | منتجات مميزة (تبويبات) | Each tab source: category, best sellers, newest, chosen, top rated, tag |
| [ ] | عرض خاص + منتجات | Offer product beside 4 products |
| [ ] | منتج مميز + منتجات | Featured product beside 3 products |
| [ ] | منتجات متحركة مع خلفية | Background, slider, "view all" hides with an empty link |
| [ ] | صور مربعة (محسّنة) | Images, links, text on image |
| [ ] | الماركات التجارية | Brands row |
| [ ] | آراء العملاء | Cards; a testimonial with no photo still looks right; opening one shows it in full |
| [ ] | المدونة | Articles with image, title, date, author; background colour |
| [ ] | بانر (صورة للكمبيوتر وصورة للجوال) | Mobile image on phones, desktop image on desktop, no cropping |
| [ ] | ملخص التقييمات | 5 gold stars, "4.9 / 5", button |
| [ ] | شعارات الماركات (شريط متحرك أو شبكة) | Marquee, then grid |
| [ ] | تسوق حسب النوع | Cards, plain-text title / subtitle switches |
| [ ] | قائمة منتجات مع زر | Products, button, text under the products |
| [ ] | فيديوهات المنتجات (ريلز) | Videos play, product under each |
| [ ] | مميزات المتجر | Icons and text |
| [ ] | معرض صور | Desktop and mobile images, button |
| [ ] | بانر تفاعلي بنقاط المنتجات | Hotspots at the right spots; tapping one shows the product; WhatsApp button uses the block's number, or the store's when empty |
| [ ] | مميزات المتجر (تصميم 2) | Cards; a horizontal row on mobile |
| [ ] | الأسئلة الشائعة | Questions open and close (paste the 16 from `docs/legacy/data/store-wide.json`) |
| [ ] | حساب إنستغرام | Profile, counts, posts open in a sheet, follow link from `@handle` |
| [ ] | صور الاستخدام (تظهر في صفحة المنتج فقط) | Nothing on home; cards on the `inuse-` product |
| [ ] | محتوى صفحة المعرض (يظهر في تصنيف المعرض فقط) | Nothing on home; content on the gallery category |
| [ ] | أسئلة المنتجات (تظهر في صفحة المنتج فقط) | Nothing on home; questions on the `faq-` product |

---

## 7. Installed apps

For each app installed on the demo store (chat, analytics, reviews translator, and any other app you use on the live store):

- [ ] **Loads:** it shows on first load.
- [ ] **After navigation:** it still shows after you move to another page with an in-store link (no full reload).
- [ ] **Languages:** it works in both `/ar` and `/en`.
- [ ] **Analytics:** the analytics or ad pixels receive a page view and an add-to-cart (check in the app's own dashboard or Tag Assistant).

---

## 8. The Salla app (if the store has one)

- [ ] **Product gallery:** a product opens the app's own gallery.
- [ ] **Language switch:** opens the app's language sheet.
- [ ] **Cart:** adding to cart and the cart drawer work inside the app.

---

## 9. Open items to settle on staging

Earlier stages could not settle these from the code. Record each outcome next to its box.

| ✓ | Item | How to check | If it fails |
|---|---|---|---|
| [ ] | **`set:` tag colon.** Salla rejected colons in other tag names (`feature-`, `faq-`, `addons-p` all switched to hyphens) | Create a `set:test` tag on a product | Log it. The prefix moves to `set-` in a code PR, with a data-entry note |
| [ ] | **Live-editor frame origin.** `docs/audits/security/NEEDS-VALIDATION.md` #1 | Open the theme customizer on staging; in DevTools find the preview iframe's parent origin | Agent adds `frame-ancestors 'self' <origin>` to `public/_headers` |
| [ ] | **Link picker scheme.** `NEEDS-VALIDATION.md` #2 | In a home-block button link, try to enter `javascript:alert(1)` | If it is accepted, the agent adds an http(s)/relative allowlist to `resolveLink.ts` |
| [ ] | **WhatsApp number default.** Fixed in Stage 13 | With the number empty, no WhatsApp link appears anywhere | Log it |
| [ ] | **Cart drawer, stale cart.** Fixed in Stage 13 | Hard to force; skip unless you see an error in the drawer | Log it |
| [ ] | **Two GTM containers** (`GTM-TGFC6FV`, `GTM-52WZ58CL`). Stage 11 | DevTools → Network, filter `gtm.js`: are both intended? | Remove the extra one in the store/app settings (owner) |
| [ ] | **Product page layout shift** (CLS 0.247). Stage 11 | Load a product page on mobile: does content jump after it appears? | Log it with a screen recording |
| [ ] | **`imageZoom` does nothing.** Stage 8 | See §5 | Owner decides: keep or remove |
| [ ] | **`llms.txt` at the root** | Open `<staging URL>/llms.txt` | Note the result. If it 404s, the file does nothing and can be removed |
| [ ] | **`public/_headers` applied** | Agent checks in §10 | — |
| [ ] | **D1: Salla's answers** (Twig end date, saved-settings migration, framework accepted). `TASK.md` decisions | Ask Salla support | Record the answers in `TASK.md` |
| [ ] | **D5: AI crawlers** (Cloudflare) | Cloudflare dashboard → bots | Owner decision |

---

## 10. Agent: re-run Stages 9–12 against the staging URL

Once the URL in §0 exists, ask the agent to run these and write the results into `TASK.md` Stage 14:

- [ ] **SEO (Stage 9):** title, description, canonical and hreflang on home, a category, a product and a page; Product and BreadcrumbList JSON-LD; `robots.txt` and the sitemap. Compare with `docs/audits/seo.md`.
- [ ] **GEO (Stage 10):** the Organization JSON-LD with ContactPoint, the rating text fallback on products, and `llms.txt`. Compare with `docs/audits/geo.md`.
- [ ] **Performance (Stage 11):** Lighthouse mobile on home, category, product and cart (target above 85); LCP, CLS, INP and JS weight against `docs/audits/performance.md`.
- [ ] **Security (Stage 12):** response headers on `/` and on an asset (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`), then the two items in §9.

---

## 11. Sign-off

- [ ] §2–§9 are done, and every issue is logged in `TASK.md`.
- [ ] Every `S14-*` issue is fixed through a stage PR and checked again on staging.
- [ ] §10 results are recorded.
- [ ] Owner: "staging approved", with the date: `__________`. Stage 15 (`docs/GO-LIVE.md`) can then start.
