import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { CustomBrandsSection } from '../../../app/components/home/CustomBrandsSection';

vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({ to, children, className }: { to: string; children?: React.ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

const motionAllowed = { value: true };
vi.mock('../../../app/hooks/useMotionAllowed', () => ({
  useMotionAllowed: () => motionAllowed.value,
}));

describe('CustomBrandsSection', () => {
  it('renders nothing with no brand images', () => {
    const { container } = render(<CustomBrandsSection data={{ brands: [{ alt_text: 'no image' }] }} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a grid when display_as_grid is set', () => {
    const { container } = render(
      <CustomBrandsSection
        data={{ display_as_grid: true, brands: [{ image: 'a.jpg' }, { image: 'b.jpg' }] }}
      />
    );
    expect(container.querySelector('.grid')).toBeTruthy();
    expect(container.querySelectorAll('img').length).toBe(2);
  });

  it('wraps a brand logo in a link when it has a url', () => {
    const { container } = render(
      <CustomBrandsSection
        data={{ display_as_grid: true, brands: [{ image: 'a.jpg', url: '/brand/a' }] }}
      />
    );
    expect(container.querySelector('a')?.getAttribute('href')).toBe('/brand/a');
  });

  it('doubles the track for a seamless loop when motion is allowed', () => {
    motionAllowed.value = true;
    const { container } = render(
      <CustomBrandsSection data={{ brands: [{ image: 'a.jpg' }, { image: 'b.jpg' }] }} />
    );
    expect(container.querySelectorAll('img').length).toBe(4);
    expect(container.querySelector('.custom-brands-marquee__track--animated')).toBeTruthy();
  });

  it('shows the plain list once, unanimated, when motion is not allowed', () => {
    motionAllowed.value = false;
    const { container } = render(
      <CustomBrandsSection data={{ brands: [{ image: 'a.jpg' }, { image: 'b.jpg' }] }} />
    );
    expect(container.querySelectorAll('img').length).toBe(2);
    expect(container.querySelector('.custom-brands-marquee__track--animated')).toBeNull();
    motionAllowed.value = true;
  });
});
