import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ProductWhatsAppEnquiry } from '../../../app/components/product/ProductWhatsAppEnquiry';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k }),
}));

const product = { id: 1, name: 'بيت الألعاب' } as never;

describe('ProductWhatsAppEnquiry', () => {
  it('links to wa.me with the cleaned number and the product name in the message', () => {
    const { getByText } = render(
      <ProductWhatsAppEnquiry product={product} number="+966 53 260 3300" />
    );
    const link = getByText('Enquire on WhatsApp').closest('a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe(
      `https://wa.me/966532603300?text=${encodeURIComponent('بيت الألعاب')}`
    );
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link.querySelector('svg')).toBeTruthy();
  });

  it('renders nothing without a usable number', () => {
    const { container } = render(<ProductWhatsAppEnquiry product={product} number={null} />);
    expect(container.querySelector('a')).toBeNull();
  });
});
