// scripts/extract-legacy-data.mjs
// Phase 0b (docs/MIGRATION-PLAN.md §5A step 1): read-only extraction of the data
// that must move off theme settings onto products/categories.
//
// READ-ONLY. It issues only HTTP GETs to the PUBLIC storefront (sitemaps) and,
// optionally, the public Store API. It never writes to the store, never touches
// the Partners Portal, never authenticates with merchant credentials.
//
// IMPORTANT — what this script CAN and CANNOT produce (verified in Phase 0):
//   The per-product/-category CONTENT (facts, FAQ, feature badges, in-product
//   cards, suggested games, category banners, menu/footer links) is NOT in the
//   live pages' server HTML and NOT in docs/legacy/old-twilight.json (that file
//   is the theme MANIFEST/schema: every content collection has value:[]). The
//   old Twig theme renders this content CLIENT-SIDE from the merchant's SAVED
//   theme settings, which are served only through token-gated calls the
//   storefront JS makes. A plain read-only HTTP crawl therefore cannot auto-fill
//   the content columns.
//
//   So this script builds the SPINE of the spreadsheet — every live product and
//   category (id, slug, ar/en URL) with one empty, correctly-named column per
//   piece of 5A content — ready to be filled from ONE of:
//     (a) the owner exporting saved theme settings from the Salla dashboard, or
//     (b) an authorized JS-rendering pass that scrapes each product's rendered DOM.
//   Column ids below mirror the exact subfield ids in docs/legacy/old-twilight.json.
//
// OPTIONAL native enrichment (off by default): if you pass a public store token
// the storefront itself uses, the script will add NATIVE product data
// (name, price, has_metadata, tags) from api.salla.dev. This is NOT the 5A
// content above — it only helps the owner see which products already have native
// specs/tags. Enable with:  STORE_TOKEN=<token> node scripts/extract-legacy-data.mjs --enrich
//
// Usage:
//   node scripts/extract-legacy-data.mjs                 # spine only (default)
//   node scripts/extract-legacy-data.mjs --out docs/legacy/data
//   STORE_TOKEN=... node scripts/extract-legacy-data.mjs --enrich
//
// Output: <out>/products.csv and <out>/categories.csv (default out: docs/legacy/data)

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const STORE = 'https://theplayroom.sa';
const SITEMAP = `${STORE}/sitemap.xml`;
const UA = 'theplayroom-migration-audit (read-only sitemap crawl)';
const args = process.argv.slice(2);
const OUT = argVal('--out') ?? 'docs/legacy/data';
const ENRICH = args.includes('--enrich');
const STORE_TOKEN = process.env.STORE_TOKEN || '';
const THROTTLE_MS = 1100; // be polite

function argVal(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, as = 'text', withToken = false) {
  const headers = { 'User-Agent': UA, Accept: as === 'json' ? 'application/json' : '*/*' };
  // Store API enrichment only. The anonymous call returns HTTP 422 — the storefront
  // sends a store-identifying token. The EXACT header name is NOT confirmed here
  // (read_network_requests shows URLs, not request headers): inspect the storefront's
  // /products/{id}/details request in DevTools and set TOKEN_HEADER accordingly before
  // first use. Common candidates: 'Authorization' (Bearer), or a Salla-specific header.
  if (withToken && STORE_TOKEN) {
    const TOKEN_HEADER = process.env.TOKEN_HEADER || 'Authorization';
    headers[TOKEN_HEADER] = TOKEN_HEADER === 'Authorization' ? `Bearer ${STORE_TOKEN}` : STORE_TOKEN;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
  return as === 'json' ? res.json() : res.text();
}

function locs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decodeURIComponent(m[1].trim()));
}

// A storefront URL looks like /{locale}/{slug}/p{id} (product) or /c{id} (category).
function classify(url) {
  const u = new URL(url);
  const parts = u.pathname.split('/').filter(Boolean); // [locale, ...slug, idSeg]
  if (parts.length < 2) return null;
  const locale = parts[0] === 'ar' || parts[0] === 'en' ? parts[0] : null;
  if (!locale) return null;
  const last = parts[parts.length - 1];
  const slug = decodeURIComponent(parts.slice(1, -1).join('/'));
  let m;
  if ((m = last.match(/^p(\d+)$/))) return { kind: 'product', id: m[1], locale, slug, url };
  if ((m = last.match(/^c(\d+)$/))) return { kind: 'category', id: m[1], locale, slug, url };
  return null; // /p/<text> CMS pages, home, etc. are ignored
}

// CSV helpers
const esc = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (cols, rows) => [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n') + '\n';

async function main() {
  console.error(`Fetching sitemap index: ${SITEMAP}`);
  const index = await get(SITEMAP);
  const subs = locs(index).filter((u) => /sitemap-\d+\.xml$/.test(u)); // product/category sitemaps, skip blog
  console.error(`Sub-sitemaps: ${subs.length} -> ${subs.join(', ')}`);

  const products = new Map(); // id -> { id, ar_slug, ar_url, en_slug, en_url }
  const categories = new Map();
  for (const s of subs) {
    const xml = await get(s);
    for (const url of locs(xml)) {
      const c = classify(url);
      if (!c) continue;
      const bag = c.kind === 'product' ? products : categories;
      const row = bag.get(c.id) ?? { id: c.id };
      row[`${c.locale}_slug`] = c.slug;
      row[`${c.locale}_url`] = c.url;
      bag.set(c.id, row);
    }
    await sleep(THROTTLE_MS);
  }
  console.error(`Found ${products.size} products, ${categories.size} categories.`);

  // Content columns (empty; ids mirror docs/legacy/old-twilight.json subfields).
  const productContentCols = [
    'fact_for_who',        // products_settings.for_who
    'fact_material',       // products_settings.material
    'fact_inner_box',      // products_settings.inner_box
    'dimensions_image',    // products_settings.image_dimensions
    'faq_json',            // products_questions (per-product rows: [{title,desc}])
    'features_json',       // special_features ([{image,title}])
    'cards_json',          // slider_in_products ([{image,title,desc}])
    'suggested_games_ids', // products_play_games.products (ids)
    'whatsapp_only',       // product is in a categories_whatsapp category
    'cart_upsell',         // product in products_in_cart
    'native_name',         // native enrichment (optional)
    'native_price',
    'native_has_metadata',
    'native_tags',
    'content_source_note',
  ];
  const categoryContentCols = [
    'banner_image',        // categories_banners.image
    'banner_mobile_image', // categories_banners.mobile_image
    'banner_title',        // categories_banners.title
    'banner_desc',         // categories_banners.desc / category_all_desc
    'description',         // subcategories.desc / category description
    'parent_id',           // category tree
    'content_source_note',
  ];

  const productRows = [...products.values()].sort((a, b) => a.id - b.id);
  const categoryRows = [...categories.values()].sort((a, b) => a.id - b.id);
  for (const r of productRows) r.content_source_note = 'content from saved theme settings — fill via dashboard export or JS-render crawl';
  for (const r of categoryRows) r.content_source_note = 'content from saved theme settings — fill via dashboard export or JS-render crawl';

  if (ENRICH) {
    if (!STORE_TOKEN) {
      console.error('--enrich requires STORE_TOKEN (the public token the storefront JS sends). Skipping enrichment.');
    } else {
      console.error(`Enriching ${productRows.length} products from the public Store API (native data only)...`);
      for (const r of productRows) {
        try {
          const d = await get(`https://api.salla.dev/store/v1/products/${r.id}/details`, 'json', true);
          const p = d.data ?? d;
          r.native_name = p.name;
          r.native_price = typeof p.price === 'object' ? p.price?.amount : p.price;
          r.native_has_metadata = p.has_metadata;
          r.native_tags = (p.tags ?? []).map((t) => t.name).join('|');
        } catch (e) {
          r.native_name = `ERROR: ${e.message}`;
        }
        await sleep(THROTTLE_MS);
      }
    }
  }

  const localeCols = ['id', 'ar_slug', 'ar_url', 'en_slug', 'en_url'];
  const outProducts = join(OUT, 'products.csv');
  const outCategories = join(OUT, 'categories.csv');
  await mkdir(dirname(outProducts), { recursive: true });
  await writeFile(outProducts, toCsv([...localeCols, ...productContentCols], productRows), 'utf8');
  await writeFile(outCategories, toCsv([...localeCols, ...categoryContentCols], categoryRows), 'utf8');
  console.error(`Wrote ${outProducts} (${productRows.length} rows)`);
  console.error(`Wrote ${outCategories} (${categoryRows.length} rows)`);
  console.error('NOTE: content columns are intentionally empty — see header comment.');
}

main().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
