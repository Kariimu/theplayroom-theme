import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ShoppingSection } from '../../../app/components/home/ShoppingSection';

vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({ to, children, className }: { to: string; children?: React.ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

describe('ShoppingSection', () => {
  it('renders nothing with no items', () => {
    const { container } = render(<ShoppingSection data={{ items: [] }} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the header title and subtitle', () => {
    const { container } = render(
      <ShoppingSection
        data={{ title: 'Shop by type', subtitle: 'Pick what fits', items: [{ title: 'Toys' }] }}
      />
    );
    expect(container.querySelector('h2')?.textContent).toBe('Shop by type');
    expect(container.textContent).toContain('Pick what fits');
  });

  it('renders every item with its image, title and subtitle, linked to its url', () => {
    const { container } = render(
      <ShoppingSection
        data={{
          items: [
            { image: 'a.jpg', title: 'Climbing sets', subtitle: 'Ages 3+', url: '/c/climbing' },
          ],
        }}
      />
    );
    const link = container.querySelector('a');
    expect(link?.getAttribute('href')).toBe('/c/climbing');
    expect(link?.textContent).toContain('Climbing sets');
    expect(link?.textContent).toContain('Ages 3+');
    expect(container.querySelector('img')).toBeTruthy();
  });

  it('renders a plain tile, not a dead `#` link, when an item has no url', () => {
    const { container } = render(<ShoppingSection data={{ items: [{ title: 'No link' }] }} />);
    expect(container.querySelector('a')).toBeNull();
    expect(container.querySelector('.group')?.textContent).toContain('No link');
  });

  it('switches title/subtitle styling with their *_type toggles', () => {
    const off = render(<ShoppingSection data={{ items: [{ title: 'Plain', subtitle: 'Plain sub' }] }} />);
    const on = render(
      <ShoppingSection
        data={{ items: [{ title: 'Plain', title_type: true, subtitle: 'Plain sub', subtitle_type: true }] }}
      />
    );
    const [offTitleEl, offSubtitleEl] = off.container.querySelectorAll('.group p');
    const [onTitleEl, onSubtitleEl] = on.container.querySelectorAll('.group p');
    expect(onTitleEl.className).not.toBe(offTitleEl.className);
    expect(onSubtitleEl.className).not.toBe(offSubtitleEl.className);
  });

  // `title_type`/`subtitle_type` share one dashboard switch label — "العنوان طبيعى"
  // ("normal title") — so "on" must mean the same thing (the plainer, smaller
  // style) for both fields, not opposite things.
  it('aligns title_type and subtitle_type to the same "normal" direction', () => {
    const { container } = render(
      <ShoppingSection
        data={{ items: [{ title: 'Title', title_type: true, subtitle: 'Subtitle', subtitle_type: true }] }}
      />
    );
    const [titleEl, subtitleEl] = container.querySelectorAll('.group p');
    // Both "normal" variants are the plainer weight (no font-black).
    expect(titleEl.className).not.toContain('font-black');
    expect(subtitleEl.className).not.toContain('font-black');
  });

  it('sets card text at 20px and the subtitle in the brand orange', () => {
    const { container } = render(
      <ShoppingSection data={{ items: [{ title: 'Title', subtitle: 'Subtitle' }] }} />
    );
    const [titleEl, subtitleEl] = container.querySelectorAll('.group p');
    expect(titleEl.className).toContain('text-[20px]');
    expect(subtitleEl.className).toContain('text-[20px]');
    expect(subtitleEl.className).toContain('text-[#f47e4d]');
  });
});
