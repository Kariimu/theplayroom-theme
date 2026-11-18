import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { ProductFacts } from '../../../app/components/product/ProductFacts';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k }),
}));

afterEach(() => {
  delete (window as unknown as { salla?: unknown }).salla;
});

function stubFetchValues(data: unknown) {
  (window as unknown as { salla: unknown }).salla = {
    metadata: { fetchValues: vi.fn().mockResolvedValue({ data }) },
  };
}

describe('ProductFacts', () => {
  it('renders the three facts once the SDK resolves them', async () => {
    stubFetchValues({
      sections: [
        {
          name: 'Product Details',
          fields: [
            { name: 'Suitable for', value: 'Ages 3+' },
            { name: 'Material', value: 'Solid beech wood' },
            { name: 'Box contents', value: '1x play set' },
          ],
        },
      ],
    });
    const { container } = render(<ProductFacts productId={101} hasMetadata />);
    await waitFor(() => expect(container.querySelectorAll('.product-facts__row')).toHaveLength(3));
    expect(container.textContent).toContain('Ages 3+');
    expect(container.textContent).toContain('Solid beech wood');
  });

  it('renders nothing for a product with no metadata at all', () => {
    const { container } = render(<ProductFacts productId={101} hasMetadata={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when has_metadata but no facts group matches', async () => {
    stubFetchValues({ sections: [{ name: 'Shipping', fields: [] }] });
    const { container } = render(<ProductFacts productId={101} hasMetadata />);
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it('renders nothing if the SDK call rejects', async () => {
    (window as unknown as { salla: unknown }).salla = {
      metadata: { fetchValues: vi.fn().mockRejectedValue(new Error('network')) },
    };
    const { container } = render(<ProductFacts productId={101} hasMetadata />);
    await waitFor(() => expect(container.firstChild).toBeNull());
  });
});
