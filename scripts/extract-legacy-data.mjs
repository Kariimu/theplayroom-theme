// scripts/extract-legacy-data.mjs
// Phase 0b of docs/MIGRATION-PLAN.md (section 5A): read-only extraction of the
// content the old Twig theme keeps in theme settings, so it can be moved onto
// products and categories.
//
// READ-ONLY: plain HTTP GETs of public storefront pages. Nothing is written to
// the store.
//
// How it works: the old theme renders this content on the server, so it is in
// each page's HTML. The selectors below come from the old theme's
// pages/product/single.twig and pages/product/index.twig and were checked
// against the live product page p1571449334 on 11 Nov 2026.
//
// Input : docs/legacy/data/urls.json  ({products:[{id,ar,en}], categories:[...]})
// Output: docs/legacy/data/products.json     full data, both languages
//         docs/legacy/data/products.csv      one row per product (opens in Excel)
//         docs/legacy/data/faq.csv           one row per product-specific question
//                                            (header-only when the FAQ is entirely store-wide)
//         docs/legacy/data/store-wide.json   the FAQ shown on every product page (Arabic only;
//                                            EN product pages do not render the FAQ) + universal features
//         docs/legacy/data/categories.csv    banner / hero text per category
//
// Usage (from the repo root):  node scripts/extract-legacy-data.mjs
//        optional:             node scripts/extract-legacy-data.mjs --limit 3

import { readFile, writeFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const DIR = 'docs/legacy/data';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A redirect that lands on the storefront home (`/ar` or `/en`) means the page
// is gone: Salla sends the 29 hidden products and dead categories there. A
// redirect to another slug (same `c<id>`/`p<id>`) is just a rename — keep it.
const isHome = (u) => {
  try {
    return /^\/(ar|en)\/?$/.test(new URL(u).pathname);
  } catch {
    return false;
  }
};

// Returns { doc, redirected, finalUrl } on a 200, or null when the page could
// not be fetched. redirected:true with a home finalUrl == gone.
async function getDoc(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' } });
      if (res.ok)
        return {
          doc: new JSDOM(await res.text()).window.document,
          redirected: res.redirected,
          finalUrl: res.url,
        };
      console.error(`  HTTP ${res.status} ${url}`);
      if (res.status === 404) return null;
    } catch (e) {
      console.error(`  ${e.message} ${url}`);
    }
    await sleep(1500 * attempt);
  }
  return null;
}

const T = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
const attr = (el, name) => (el ? el.getAttribute(name) || '' : '');
// Old theme wraps Salla CDN images in a resize prefix; store the original URL.
const rawImg = (u) => u.replace(/\/cdn-cgi\/image\/[^/]+\//, '/');

export function extractProduct(doc) {
  // The template can print a fact block more than once; keep every distinct text.
  const fact = (iconClass) => {
    const texts = [...doc.querySelectorAll(`.prod-acc-item svg.${iconClass}`)].map((svg) => {
      const content = svg.closest('.prod-acc-item')?.querySelector('.prod-acc-content');
      if (!content) return '';
      const lis = [...content.querySelectorAll('li')];
      return lis.length ? lis.map(T).filter(Boolean).join('\n') : T(content);
    });
    return [...new Set(texts.filter(Boolean))];
  };
  const whats = doc.getElementById('whatsapp-btn-wrapper');
  return {
    name: T(doc.querySelector('h1')),
    for_who: fact('lucide-users'),
    material: fact('lucide-leaf'),
    inner_box: fact('lucide-package'),
    dimensions_image: rawImg(attr(doc.querySelector('#dimensions img'), 'src')),
    features: [...doc.querySelectorAll('section[style*="253, 248, 243"] .group')].map((g) => ({
      title: T(g.querySelector('p')),
      image: rawImg(attr(g.querySelector('img'), 'src')),
    })),
    cards: [...doc.querySelectorAll('salla-slider.mains-slider .swiper-slide')].map((s) => ({
      title: T(s.querySelector('h3')),
      desc: T(s.querySelector('p')),
      image: rawImg(attr(s.querySelector('img'), 'src')),
    })),
    faq: [...doc.querySelectorAll('.faq-div .faq-item')].map((f) => ({
      q: T(f.querySelector('.faq-btn span')),
      a: T(f.querySelector('.faq-content')),
    })),
    suggested_games: [...doc.querySelectorAll('custom-salla-product-card[isspecial]')]
      .map((c) => {
        try {
          return String(JSON.parse(c.getAttribute('product')).id);
        } catch {
          return '';
        }
      })
      .filter(Boolean),
    whatsapp_only: !!whats && !/display:\s*none/.test(attr(whats, 'style')),
    universal: [...doc.querySelectorAll('section.mt-12 > .hidden > .text-center')].map((u) => ({
      title: T(u.querySelectorAll('p')[0]),
      desc: T(u.querySelectorAll('p')[1]),
      image: rawImg(attr(u.querySelector('img'), 'src')),
    })),
  };
}

export function extractCategory(doc) {
  const picture = doc.querySelector('section.container picture');
  const bannerBox = picture?.closest('section');
  const hero = doc.querySelector('section.bg-gradient-to-b');
  return {
    banner_image: rawImg(attr(picture?.querySelector('img'), 'src')),
    banner_mobile_image: rawImg(attr(picture?.querySelector('source'), 'srcset')),
    banner_title: T(bannerBox?.querySelector('h1')),
    banner_desc: T(bannerBox?.querySelector('p')),
    hero_title: T(hero?.querySelector('h1')),
    hero_desc: T(hero?.querySelector('p.text-lg')),
    page_title: T(doc.querySelector('h1')),
  };
}

const csvCell = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (rows, cols) =>
  '﻿' + [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\r\n');

async function main() {
  const urls = JSON.parse(await readFile(`${DIR}/urls.json`, 'utf8'));
  const products = [];
  const list = urls.products.slice(0, LIMIT);
  for (const [i, p] of list.entries()) {
    console.error(`product ${i + 1}/${list.length}  ${p.id}`);
    const row = { id: p.id, ar_url: p.ar, en_url: p.en, redirected: false };
    for (const lang of ['ar', 'en']) {
      const r = await getDoc(p[lang]);
      if (lang === 'ar' && r?.redirected) row.redirected = true; // Arabic is authoritative
      row[lang] = r && !r.redirected ? extractProduct(r.doc) : null;
      await sleep(400);
    }
    products.push(row);
  }

  // A question shown on every product that has an FAQ is a store-wide question.
  const withFaq = products.filter((p) => p.ar?.faq.length);
  const counts = new Map();
  for (const p of withFaq) for (const f of p.ar.faq) counts.set(f.q, (counts.get(f.q) || 0) + 1);
  const isGlobal = (q) => withFaq.length > 1 && counts.get(q) === withFaq.length;
  const first = withFaq[0];
  const storeWide = {
    faq: first
      ? first.ar.faq
          .map((f, idx) => ({ ...f, idx }))
          .filter((f) => isGlobal(f.q))
          .map((f) => ({ q_ar: f.q, a_ar: f.a, q_en: first.en?.faq[f.idx]?.q || '', a_en: first.en?.faq[f.idx]?.a || '' }))
      : [],
    universal_features_ar: products.find((p) => p.ar?.universal.length)?.ar.universal || [],
    universal_features_en: products.find((p) => p.en?.universal.length)?.en.universal || [],
  };

  const flat = products.map((p) => {
    const a = p.ar || {};
    const e = p.en || {};
    const own = (a.faq || []).filter((f) => !isGlobal(f.q));
    return {
      id: p.id,
      name_ar: a.name,
      name_en: e.name,
      ar_url: p.ar_url,
      whatsapp_only: a.whatsapp_only ? 'yes' : '',
      for_who: (a.for_who || []).join(' || '),
      material: (a.material || []).join(' || '),
      inner_box: (a.inner_box || []).join(' || '),
      for_who_en_page: (e.for_who || []).join(' || '),
      material_en_page: (e.material || []).join(' || '),
      inner_box_en_page: (e.inner_box || []).join(' || '),
      dimensions_image: a.dimensions_image,
      features_ar: (a.features || []).map((f) => f.title).join(' | '),
      features_en: (e.features || []).map((f) => f.title).join(' | '),
      cards_ar: (a.cards || []).map((c) => c.title).join(' | '),
      suggested_games_ids: (a.suggested_games || []).join(' '),
      faq_total: (a.faq || []).length,
      faq_product_specific: own.length,
      fetched: p.redirected ? 'redirected' : p.ar ? 'ok' : 'FAILED',
    };
  });

  const faqRows = [];
  for (const p of products)
    (p.ar?.faq || []).forEach((f, idx) => {
      if (isGlobal(f.q)) return;
      faqRows.push({
        product_id: p.id,
        product: p.ar.name,
        question_ar: f.q,
        answer_ar: f.a,
        question_en: p.en?.faq[idx]?.q || '',
        answer_en: p.en?.faq[idx]?.a || '',
      });
    });

  const categories = [];
  const clist = urls.categories.slice(0, LIMIT);
  for (const [i, c] of clist.entries()) {
    console.error(`category ${i + 1}/${clist.length}  ${c.id}`);
    const arR = await getDoc(c.ar);
    await sleep(400);
    const enR = await getDoc(c.en);
    await sleep(400);
    // A category whose sitemap slug 301s to a new slug (same c<id>) is live —
    // keep it. Only a redirect to the home page means the category is gone.
    const arDead = !!(arR?.redirected && isHome(arR.finalUrl));
    const enDead = !!(enR?.redirected && isHome(enR.finalUrl));
    const ar = arR && !arDead ? arR.doc : null;
    const en = enR && !enDead ? enR.doc : null;
    const a = ar ? extractCategory(ar) : {};
    const e = en ? extractCategory(en) : {};
    categories.push({
      id: c.id,
      ar_url: c.ar,
      final_url: arR?.redirected ? decodeURIComponent(arR.finalUrl) : '',
      title_ar: a.page_title,
      title_en: e.page_title,
      banner_image: a.banner_image,
      banner_mobile_image: a.banner_mobile_image,
      banner_title_ar: a.banner_title,
      banner_desc_ar: a.banner_desc,
      banner_title_en: e.banner_title,
      banner_desc_en: e.banner_desc,
      hero_desc_ar: a.hero_desc,
      hero_desc_en: e.hero_desc,
      // 'redirected' = gone (lands on home); 'renamed' = live at a new slug.
      fetched: arDead ? 'redirected' : arR?.redirected ? 'renamed' : ar ? 'ok' : 'FAILED',
    });
  }

  await writeFile(`${DIR}/products.json`, JSON.stringify(products, null, 1));
  await writeFile(`${DIR}/store-wide.json`, JSON.stringify(storeWide, null, 1));
  await writeFile(`${DIR}/products.csv`, toCsv(flat, Object.keys(flat[0] || { id: '' })));
  await writeFile(
    `${DIR}/faq.csv`,
    toCsv(faqRows, ['product_id', 'product', 'question_ar', 'answer_ar', 'question_en', 'answer_en'])
  );
  await writeFile(`${DIR}/categories.csv`, toCsv(categories, Object.keys(categories[0] || { id: '' })));

  const n = (f) => flat.filter(f).length;
  console.log(
    `\nProduct pages (catalogue): ${n((r) => r.fetched === 'ok')}/${flat.length}  (redirected to home: ${n((r) => r.fetched === 'redirected')})`
  );
  console.log(`  with facts: ${n((r) => r.for_who || r.material || r.inner_box)}`);
  console.log(`  with dimensions image: ${n((r) => r.dimensions_image)}`);
  console.log(`  with feature badges: ${n((r) => r.features_ar)}`);
  console.log(`  with cards: ${n((r) => r.cards_ar)}`);
  console.log(`  with suggested games: ${n((r) => r.suggested_games_ids)}`);
  console.log(`  WhatsApp-only: ${n((r) => r.whatsapp_only)}`);
  console.log(`Store-wide FAQ questions: ${storeWide.faq.length}`);
  console.log(`Product-specific FAQ rows: ${faqRows.length}`);
  const cn = (f) => categories.filter(f).length;
  console.log(
    `Categories: ${cn((c) => c.fetched === 'ok' || c.fetched === 'renamed')} live (${cn((c) => c.fetched === 'renamed')} at a renamed slug), ${cn((c) => c.fetched === 'redirected')} gone, of ${categories.length}`
  );
  console.log(`  with a banner: ${categories.filter((c) => c.banner_image).length}`);
}

// Run only when executed directly, so the extract functions can be imported in tests.
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
