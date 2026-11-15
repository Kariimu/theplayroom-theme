// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const headersPath = fileURLToPath(new URL('../../public/_headers', import.meta.url));

/** Parses the Cloudflare-Pages-style `_headers` file into { path: { header: value } }. */
function parseHeaders(raw: string): Record<string, Record<string, string>> {
  const blocks: Record<string, Record<string, string>> = {};
  let currentPath: string | null = null;
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    if (!line.startsWith(' ') && !line.startsWith('\t')) {
      currentPath = line.trim();
      blocks[currentPath] = {};
    } else if (currentPath) {
      const [name, ...rest] = line.trim().split(':');
      blocks[currentPath][name.trim()] = rest.join(':').trim();
    }
  }
  return blocks;
}

describe('public/_headers security baseline (security audit Stage 12)', () => {
  const blocks = parseHeaders(readFileSync(headersPath, 'utf8'));

  it('declares a catch-all rule for every path, not just /assets/*', () => {
    expect(blocks['/*']).toBeDefined();
  });

  it('sets the baseline security headers on the catch-all rule', () => {
    const headers = blocks['/*'];
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=()');
    expect(headers['Strict-Transport-Security']).toBe(
      'max-age=63072000; includeSubDomains; preload'
    );
  });

  it('keeps the existing /assets/* long-lived cache rule untouched', () => {
    expect(blocks['/assets/*']).toEqual({
      'Cache-Control': 'public, max-age=31556952, immutable',
    });
  });
});
