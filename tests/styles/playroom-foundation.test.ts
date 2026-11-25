// @vitest-environment node
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import * as sass from 'sass';

const themeRoot = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(import.meta.url);
const compile = (file: string) => sass.compile(`${themeRoot}app/styles/${file}`).css;

describe('Playroom foundation tokens', () => {
  it('defines the page background and the four brand tints in :root', () => {
    const css = compile('01-settings/global.scss');
    expect(css).toContain('--body-bg: #fcf9f5');
    expect(css).toContain('--brand-yellow-light: #fdf1d3');
    expect(css).toContain('--brand-blue-light: #e9edf2');
    expect(css).toContain('--brand-orange-light: #feece5');
    expect(css).toContain('--brand-red-light: #f9ebeb');
  });

  it('paints the body with the page background', () => {
    const css = compile('02-generic/reset.scss');
    expect(css).toMatch(/background-color:\s*var\(--body-bg, #fcf9f5\)/);
  });

  it('falls back to a system font on English (LTR) pages only', () => {
    const css = compile('02-generic/ltr.scss');
    expect(css).toMatch(/\[dir=["']?ltr["']?\][\s\S]*font-family:[^;]*system-ui[^;]*!important/);
  });

  it('self-hosts the dongol display font from public/fonts', () => {
    const css = compile('01-settings/fonts.scss');
    expect(css).toContain('font-family: "dongol"');
    expect(css).toContain('font-family: "Dongol"');
    expect(css).toContain('/fonts/dongol-400.ttf');
    expect(css).toContain('/fonts/dongol-500.ttf');
    expect(css).toContain('font-display: swap');
  });
});

describe('Playroom Tailwind theme', () => {
  const config = require(`${themeRoot}tailwind.config.cjs`) as {
    theme: { extend: { colors: Record<string, string> }; fontFamily: Record<string, unknown> };
  };

  it('exposes the brand tints as hex (so /opacity utilities work)', () => {
    const { colors } = config.theme.extend;
    expect(colors['brand-blue-light']).toBe('#e9edf2');
    expect(colors['brand-orange-light']).toBe('#feece5');
    expect(colors['brand-yellow-light']).toBe('#fdf1d3');
    expect(colors['brand-red-light']).toBe('#f9ebeb');
  });

  it('exposes the dongol font family', () => {
    expect(config.theme.fontFamily.dongol).toEqual(['Dongol', 'dongol', 'var(--font-main)', 'sans-serif']);
  });
});
