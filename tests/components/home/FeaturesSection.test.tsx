import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { FeaturesSection } from '../../../app/components/home/FeaturesSection';

describe('FeaturesSection', () => {
  it('renders nothing with no features', () => {
    const { container } = render(<FeaturesSection data={{ features: [] }} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a title when provided', () => {
    const { container } = render(
      <FeaturesSection data={{ title_section: 'Why us', features: [{ title: 'Fast shipping' }] }} />
    );
    expect(container.querySelector('h2')?.textContent).toBe('Why us');
  });

  it('renders every feature item with its image and title', () => {
    const { container } = render(
      <FeaturesSection
        data={{
          features: [
            { image: 'ship.png', title: 'Fast shipping' },
            { image: 'cod.png', title: 'Cash on delivery' },
          ],
        }}
      />
    );
    expect(container.querySelectorAll('img').length).toBe(2);
    expect(container.textContent).toContain('Fast shipping');
    expect(container.textContent).toContain('Cash on delivery');
  });

  it('skips the image when a feature has none', () => {
    const { container } = render(
      <FeaturesSection data={{ features: [{ title: 'No icon here' }] }} />
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('No icon here');
  });
});
