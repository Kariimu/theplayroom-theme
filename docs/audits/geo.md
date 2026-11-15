# Stage 10 — GEO audit (visibility in AI search and assistants)

Builds directly on Stage 9's SEO audit (`docs/audits/seo.md`) — same engine-bundle method
(read what's actually shipped before writing code), same "add only what is missing" rule.
GEO's extra bar: an AI crawler that doesn't execute JavaScript must be able to read the
*answer*, in plain text, not just structured data a human-facing widget hydrates later.

## 1. FAQ — already done in Stage 9, not redone here

"FAQ rendered as real text in HTML with FAQPage structured data (only where visible)" is
this stage's checklist item 2. Stage 9 fixed exactly this: the product route's loader now
fetches `home.queries.components()` server-side (`app/routes/$slug.p$id.tsx`), so
`ProductFaq`'s question text is in the SSR HTML, and `app/lib/faqJsonLd.ts` adds FAQPage
JSON-LD scoped to each page's own canonical URL, present only when that page's FAQ block
actually has questions. Nothing to add here.

## 2. Product-page facts in plain text (checklist item 1) — the real finding

What's already server-rendered plain text on the product page, confirmed by reading
`ProductDetails.tsx` (loader-fed props, no client fetch): **what it is** (`product.name` +
`product.description`, straight `dangerouslySetInnerHTML` from loader data — real text),
**price** (`ProductPrice`), **availability** (`ProductQuantityInfo` + the
`show_availability` section, both from `product.*` loader fields).

**Age range, material, box contents — not in plain text.** `ProductFacts` (the for_who/
material/box-contents row) and `ProductMetadata` (the generic specs accordion) both read
through `useProductFacts`/`<SallaMetadata>`, and Stage 9 already confirmed — re-checked this
stage, nothing new in the shipped engine — there is no server-callable equivalent of
`Salla.metadata.fetchValues`. This is Phase 0's binding finding (`docs/MIGRATION-PLAN.md`
§5B: "specs are client-only... SEO text also goes in the description"), not something to
build around.

**Delivery and returns — not in plain text anywhere on the product page.** Checked, not
assumed: `SallaTrustBadges`, `SallaPayments`, `SallaRatingStars` and `SallaComments` are all
Stencil web components wrapped in `withDeferredHydration` (`@salla.sa/
twilight-components-react/dist/hydration/`) — their content, whatever it is, never reaches
the server-rendered HTML; it mounts after hydration. `UniversalFeatures` (the 4 store-wide
feature cards, genuinely SSR'd — plain `t()` calls, no fetch) covers "Saudi brand",
"Sustainable wood", "Builds sensory skills", "Encourages exploration" (`locales/{ar,en}.
json`, `blocks.universal_features.*`) — none of the 4 are about delivery or returns. No
existing store-wide copy block says anything about shipping or the return policy in text a
non-JS crawler would see.

**Dimensions — no data exists at all**, not just an SSR timing problem: Phase 0b's crawl
(`docs/PHASE-0-FINDINGS.md`) found no dimension images or dimension text on any of the 43
sitemap products. This is a content gap at the source, before any SSR question applies.

**Not fixed by this stage** (content, not code, per this stage's own instruction not to
rewrite store content): facts/dimensions/delivery/returns copy belongs in the product
description (facts, dimensions) or a new store-wide content block (delivery/returns) — both
are the owner's calls. See §5 below for the concrete per-product list.

## 3. Organization — one real gap found and fixed

Checked `app/lib/homeJsonLd.ts`'s Organization block (Stage 8-era, built from `StoreContext`)
against this stage's four asks:

- Brand name in Arabic and English — ✅ already there (`store.name` is the merchant's Arabic
  name; `alternateName: 'The Playroom'` is the English one).
- Logo — ✅ already there (`store.logo`).
- Social profiles (`sameAs`) — ✅ already there (non-empty `store.social` values).
- **Contact — missing.** `StoreContext['store']` has a real, public `contacts` field
  (`phone`/`mobile`/`email`/`whatsapp`/`telegram`, confirmed in the engine's own
  `types/index.d.ts`) that nothing in this theme read. Added a `ContactPoint`
  (`contactType: 'customer service'`, phone preferred over mobile, email) to the Organization
  object when the store has set either — `tests/lib/homeJsonLd.test.ts` covers the
  phone+email case, the mobile-only fallback, and the no-contact-set case (omitted entirely,
  not an empty object).

## 4. Arabic/English fact parity — checked, already correct, one pre-flagged content gap

`app/lib/specs.ts`'s `FACTS_SECTION_NAMES`/`FACTS_FIELD_NAMES` already list both the Arabic
and English spec group/field names (`'تفاصيل المنتج'`/`'Product Details'`,
`'مناسب لـ'`/`'Suitable for'`, etc.), matched case/whitespace-insensitively — so once a
product's specs are entered, both locales' product pages extract the same facts regardless
of which language the merchant typed the group/field *names* in. The actual *values* are a
content question Stage 7 already caught and documented: `docs/DATA-ENTRY.md` says plainly,
for the one product with any English text captured, "No English text was captured... write
the English spec set yourself, or leave it" — this stage adds nothing beyond confirming the
matching code is sound; the content gap it's already flagged stands as it was.

## 5. Content suggestions (report only — not rewritten)

Of the 43 sitemap products, 14 currently render a product page (the other 29 are D6, still
open). Of those 14, only 3 have any facts captured from the old site
(`docs/legacy/data/products.json`, confirmed again this stage):

| Product | id | Facts captured? |
|---|---|---|
| بيت الألعاب | 1246641851 | yes (Stage 7 checklist has the paste-ready text) |
| صندوق التخزين | 979102582 | yes |
| مجموعة المغامرة | 744217497 | yes |
| خدمة التركيب | 1385822926 | no |
| حلقات خشبية | 334846772 | no |
| ارضيات بلاط خارجي | 1230899322 | no |
| ملصقات معدنية للجوال | 439970423 | no |
| كوب غرفة الألعاب | 129353473 | no |
| رول البيت المغناطيسي | 754836750 | no |
| رول القوس المغناطيسي | 1900499967 | no |
| إستاند للمراجيح | 431530834 | no |
| حوض الكور | 1880665425 | no |
| أرضيات فوم للأطفال | 826587792 | no |
| الإستيكرات | 1783930334 | no |

**Suggestion for the owner**, for all 14, beyond what `docs/DATA-ENTRY.md` already asks for
specs: since facts never reach a non-JS crawler no matter how they're entered (§2 above), the
*description* field (real SSR'd text) should also say, in prose, the age range, material and
box contents — the same values Stage 7's checklist already has ready to paste for the first
three. A full rewrite of 14 descriptions is a content task for the owner, not done here.

## 6. `llms.txt` and D5 (Cloudflare)

- **`llms.txt`**: no documentation found (checked `docs.salla.dev/twilight/react/guide/
  seo-and-head.md`, the one page close to this topic — it covers head tags and redirects,
  not static file serving) confirming whether a file in this theme's `public/` folder reaches
  the site root through Salla's hosting. Circumstantial evidence it does: `public/features/
  *.webp` (Stage 2) is already relied on and referenced directly as `/features/feature-
  N.webp`; `public/_headers` already exists and uses the Cloudflare Pages convention
  (confirmed the live site's own response headers show `Server: cloudflare`). Added a short
  `public/llms.txt` on that basis — **its actual effect on Salla's edge is unproven** until
  Stage 14's staging URL exists; if it doesn't resolve there, that's useful information, not
  a theme bug.
- **D5 (OWNER)**: whether AI crawlers are allowed in Cloudflare for theplayroom.sa is a
  dashboard/WAF setting this repo has no access to and shouldn't change from here. Still
  open — see `TASK.md`'s decisions table.

## Checklist

- [x] Each product page answers, in plain server-rendered text: what it is, price,
      availability — **age range, material, dimensions/box contents stay client-only**
      (Phase 0, binding) and **delivery/returns have no SSR'd copy anywhere** (all the
      relevant widgets defer hydration) — both are content gaps, reported in §2/§5, not
      code this stage fixes
- [x] FAQ rendered as real text in HTML with FAQPage structured data — done in Stage 9
- [x] Organization data: brand name in Arabic and English, logo, contact, social profiles —
      contact was the one gap; fixed
- [x] Arabic and English pages carry the same facts — code already correct; the one
      content gap was already flagged in Stage 7's `docs/DATA-ENTRY.md`
- [x] Reviews and ratings present in HTML where the store shows them — the rating
      *number* (stars + count) now has a real sr-only text fallback next to the
      deferred-hydration widget (`ProductDetails.tsx`); **individual review text stays
      JS-only**: no server-callable comments/reviews API exists in the engine's public
      exports, checked, a structural limitation this stage can't fix
- [ ] D5 (OWNER): confirm AI crawlers aren't blocked in Cloudflare — still open
- [x] `llms.txt` added (`public/llms.txt`), effect on Salla's hosting explicitly unproven
      until Stage 14
- [x] Content suggestions for the owner — table in §5; no content rewritten
Deliverable: this file.

Result: three real code fixes this stage — a `ContactPoint` on the Organization JSON-LD
(`app/lib/homeJsonLd.ts`, `store.contacts` was already public data, nothing read it before),
a real sr-only rating-summary text next to the product page's deferred-hydration stars widget
(`ProductDetails.tsx`), and `public/llms.txt`. Everything else was either already correct
(FAQ — Stage 9; Organization's name/logo/sameAs; the ar/en facts-matching code) or a genuine
content gap with no code fix available (facts/dimensions/delivery/returns in plain text,
individual review text, D5, D6) — each named specifically rather than glossed over.
`pnpm build`, `pnpm typecheck`, `pnpm check:manifest` all green. `pnpm test`: 10 failed / 850
passed — the same pre-existing `PageAdvertisements`/`ProductDetails`/`ProductGallery`
failures every prior stage documented, confirmed unchanged; 2 new tests this stage
(`ProductDetails rating summary`) plus 2 new homeJsonLd tests (`ContactPoint`). Next: owner
action on D5/D6 and the content suggestions in §5; re-check `llms.txt` and the
`/{slug}/p{id}` View Source items once Stage 14's staging URL exists.
