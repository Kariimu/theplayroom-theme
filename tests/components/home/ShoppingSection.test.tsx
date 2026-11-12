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

  it('links to # when an item has no url', () => {
    const { container } = render(<ShoppingSection data={{ items: [{ title: 'No link' }] }} />);
    expect(container.querySelector('a')?.getAttribute('href')).toBe('#');
  });

  it('switches title/subtitle styling with their *_type toggles', () => {
    const { container } = render(
      <ShoppingSection
        data={{ items: [{ title: 'Plain', title_type: true, subtitle: 'Plain sub', subtitle_type: true }] }}
      />
    );
    expect(container.querySelector('h3')?.className).toContain('font-normal');
    expect(container.querySelector('p')?.className).toContain('text-xs');
  });
});
