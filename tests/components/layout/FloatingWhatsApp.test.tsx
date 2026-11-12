import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { cleanWhatsappNumber, FloatingWhatsApp } from '../../../app/components/layout/FloatingWhatsApp';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k }),
}));

describe('cleanWhatsappNumber', () => {
  it('keeps digits only', () => {
    expect(cleanWhatsappNumber('+966 53 260 3300')).toBe('966532603300');
    expect(cleanWhatsappNumber(966532603300)).toBe('966532603300');
    expect(cleanWhatsappNumber('966-53-260-3300')).toBe('966532603300');
  });

  it('is empty for nothing usable', () => {
    for (const v of [null, undefined, '', '   ', '+']) expect(cleanWhatsappNumber(v)).toBe('');
  });
});

describe('FloatingWhatsApp', () => {
  it('links to wa.me with the cleaned number and a translated label', () => {
    const { getByLabelText } = render(<FloatingWhatsApp number="+966 53 260 3300" />);
    const link = getByLabelText('Chat on WhatsApp') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('https://wa.me/966532603300');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link.querySelector('svg')).toBeTruthy();
  });

  it('renders nothing without a usable number', () => {
    const { container } = render(<FloatingWhatsApp number={null} />);
    expect(container.querySelector('a')).toBeNull();
  });
});
