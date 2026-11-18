// @vitest-environment node
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import ar from '../../locales/ar.json';
import en from '../../locales/en.json';

const themeRoot = fileURLToPath(new URL('../../', import.meta.url));

describe('locale parity', () => {
  it('ar.json and en.json have identical key sets (09 #8)', () => {
    const arKeys = new Set(Object.keys(ar));
    const enKeys = new Set(Object.keys(en));
    expect([...arKeys].filter((k) => !enKeys.has(k))).toEqual([]);
    expect([...enKeys].filter((k) => !arKeys.has(k))).toEqual([]);
  });

  it('no value is left blank', () => {
    for (const [k, v] of Object.entries(ar)) expect(String(v).trim(), `ar ${k}`).not.toBe('');
    for (const [k, v] of Object.entries(en)) expect(String(v).trim(), `en ${k}`).not.toBe('');
  });
});

describe('store-wide content in locales', () => {
  const map = ar as Record<string, string>;

  it('carries the 4 universal features, English actually translated', () => {
    for (let i = 1; i <= 4; i++) {
      expect(map[`blocks.universal_features.${i}.title`]).toBeTruthy();
      expect(map[`blocks.universal_features.${i}.desc`]).toBeTruthy();
    }
    // EN must differ from the Arabic source (the old collection stored Arabic in both).
    expect((en as Record<string, string>)['blocks.universal_features.1.title']).not.toBe(
      map['blocks.universal_features.1.title']
    );
  });

  it('self-hosts the 4 feature images', () => {
    for (let i = 1; i <= 4; i++) {
      expect(existsSync(`${themeRoot}public/features/feature-${i}.webp`)).toBe(true);
    }
  });

  it('has the product WhatsApp enquiry message', () => {
    expect(map['blocks.whatsapp.enquiry_message']).toBeTruthy();
  });
});
