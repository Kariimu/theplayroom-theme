import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { CategoryHero } from '../../../app/components/category/CategoryHero';

vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({ to, children, className }: { to: string; children?: unknown; className?: string }) => (
    <a href={to} className={className}>
      {children as never}
    </a>
  ),
  Image: (props: Record<string, unknown>) => (
    <img alt={String(props.alt ?? '')} src={String(props.src ?? '')} />
  ),
}));

describe('CategoryHero', () => {
  it('renders nothing without a category', () => {
    const { container } = render(<CategoryHero category={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for a leaf category with no image, description or children', () => {
    const { container } = render(
      <CategoryHero category={{ id: 1, name: 'ألعاب', url: '/c1' }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the banner image and description when set', () => {
    const { getByText, getByAltText } = render(
      <CategoryHero
        category={{
          id: 1,
          name: 'ألعاب خشبية',
          url: '/c1',
          image: 'cat.jpg',
          description: 'ألعاب خشبية مستدامة للأطفال',
        }}
      />
    );
    expect(getByAltText('ألعاب خشبية').getAttribute('src')).toBe('cat.jpg');
    expect(getByText('ألعاب خشبية مستدامة للأطفال')).toBeTruthy();
  });

  it('renders one card per sub-category, linking to its url', () => {
    const { container, getByText } = render(
      <CategoryHero
        category={{
          id: 1,
          name: 'ألعاب',
          url: '/c1',
          sub_categories: [
            { id: 2, name: 'تسلق', url: '/c2', image: 'climb.jpg' },
            { id: 3, name: 'بناء', url: '/c3' },
          ],
        }}
      />
    );
    const links = container.querySelectorAll('.category-hero__subcat');
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute('href')).toBe('/c2');
    expect(getByText('تسلق')).toBeTruthy();
  });

  it('shows the first letter when a sub-category has no image', () => {
    const { container } = render(
      <CategoryHero
        category={{
          id: 1,
          name: 'ألعاب',
          url: '/c1',
          sub_categories: [{ id: 2, name: 'بناء', url: '/c2' }],
        }}
      />
    );
    const initial = container.querySelector('.category-hero__subcat-initial');
    expect(initial?.textContent).toBe('ب');
  });
});
