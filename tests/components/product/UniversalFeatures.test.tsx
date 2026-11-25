import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { UniversalFeatures } from '../../../app/components/product/UniversalFeatures';

const TRANSLATIONS: Record<string, string> = {
  'blocks.universal_features.1.title': 'Saudi brand',
  'blocks.universal_features.1.desc': 'Made in the Kingdom',
  'blocks.universal_features.2.title': 'Sustainable wood',
  'blocks.universal_features.2.desc': 'Eco-friendly',
  'blocks.universal_features.3.title': 'Builds sensory skills',
  'blocks.universal_features.3.desc': 'Learn through play',
  'blocks.universal_features.4.title': 'Encourages exploration',
  'blocks.universal_features.4.desc': 'Discover the world',
};

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (k: string, fb?: string) => TRANSLATIONS[k] ?? fb ?? k }),
}));

describe('UniversalFeatures', () => {
  it('renders all 4 features with their icon, title and description', () => {
    const { container, getByText } = render(<UniversalFeatures />);
    expect(container.querySelectorAll('.universal-features__item')).toHaveLength(4);
    expect(getByText('Saudi brand')).toBeTruthy();
    expect(getByText('Encourages exploration')).toBeTruthy();
    const images = container.querySelectorAll('img');
    expect(images).toHaveLength(4);
    expect(images[0].getAttribute('src')).toBe('/features/feature-1.webp');
  });

  it('renders nothing when no feature has a title', () => {
    const titleKeys = Object.keys(TRANSLATIONS).filter((k) => k.endsWith('.title'));
    const saved = titleKeys.map((k) => TRANSLATIONS[k]);
    titleKeys.forEach((k) => delete TRANSLATIONS[k]);
    try {
      const { container } = render(<UniversalFeatures />);
      expect(container.firstChild).toBeNull();
    } finally {
      titleKeys.forEach((k, i) => (TRANSLATIONS[k] = saved[i]));
    }
  });
});
