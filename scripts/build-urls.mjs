// scripts/build-urls.mjs — read-only: build docs/legacy/data/urls.json from the
// public sitemap. Input for extract-legacy-data.mjs. Pins --first ids to the front.
import { writeFile, mkdir } from 'node:fs/promises';
const STORE = 'https://theplayroom.sa';
const UA = 'theplayroom-migration-audit (read-only)';
const firstArg = process.argv.indexOf('--first');
const PIN = firstArg > -1 ? process.argv[firstArg + 1].split(',') : [];

const get = async (u) => {
  const r = await fetch(u, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${u}`);
  return r.text();
};
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decodeURIComponent(m[1].trim()));

function classify(url) {
  const u = new URL(url);
  const parts = u.pathname.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  const locale = parts[0] === 'ar' || parts[0] === 'en' ? parts[0] : null;
  if (!locale) return null;
  const last = parts[parts.length - 1];
  let m;
  if ((m = last.match(/^p(\d+)$/))) return { kind: 'product', id: m[1], locale, url };
  if ((m = last.match(/^c(\d+)$/))) return { kind: 'category', id: m[1], locale, url };
  return null;
}

const index = await get(`${STORE}/sitemap.xml`);
const subs = locs(index).filter((u) => /sitemap-\d+\.xml$/.test(u));
const products = new Map();
const categories = new Map();
for (const s of subs) {
  for (const url of locs(await get(s))) {
    const c = classify(url);
    if (!c) continue;
    const bag = c.kind === 'product' ? products : categories;
    const row = bag.get(c.id) ?? { id: c.id };
    row[c.locale] = c.url;
    bag.set(c.id, row);
  }
}
const pinFirst = (arr) => {
  const pinned = PIN.map((id) => arr.find((r) => r.id === id)).filter(Boolean);
  const rest = arr.filter((r) => !PIN.includes(r.id));
  return [...pinned, ...rest];
};
const out = {
  products: pinFirst([...products.values()]),
  categories: [...categories.values()],
};
await mkdir('docs/legacy/data', { recursive: true });
await writeFile('docs/legacy/data/urls.json', JSON.stringify(out, null, 1));
console.log(`urls.json: ${out.products.length} products, ${out.categories.length} categories; pinned: ${PIN.join(',') || '(none)'}`);
