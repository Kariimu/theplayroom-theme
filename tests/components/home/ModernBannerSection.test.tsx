import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ModernBannerSection } from '../../../app/components/home/ModernBannerSection';

const listMock = vi.fn();

vi.mock('@salla.sa/twilight-theme-engine/api/product', () => ({
  product: {
    queries: {
      list: (params: { source: string; sourceValue?: unknown }) => ({
        queryKey: ['products', 'list', params],
        queryFn: () => listMock(params),
      }),
    },
  },
}));

vi.mock('@salla.sa/twilight-theme-engine/hooks/useMoney', () => ({
  useMoney: () => ({ format: (amount: unknown) => `${amount} SAR` }),
}));

vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({ to, children, className }: { to: string; children?: React.ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  listMock.mockReset();
  listMock.mockResolvedValue({ items: [] });
});

describe('ModernBannerSection', () => {
  it('renders nothing with no content', () => {
    const { container } = renderWithClient(<ModernBannerSection data={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the header icon, title and description', () => {
    const { container } = renderWithClient(
      <ModernBannerSection
        data={{ text_icon: 'New', title_section: 'Climbing sets', desc_section: 'Built for play' }}
      />
    );
    expect(container.textContent).toContain('New');
    expect(container.querySelector('h2')?.textContent).toBe('Climbing sets');
    expect(container.textContent).toContain('Built for play');
  });

  it('renders the banner image with its overlay text', () => {
    const { container } = renderWithClient(
      <ModernBannerSection data={{ image: 'banner.jpg', text_on_image: 'Shop now' }} />
    );
    expect(container.querySelector('img')).toBeTruthy();
    expect(container.textContent).toContain('Shop now');
  });

  it('renders every feature card', () => {
    const { container } = renderWithClient(
      <ModernBannerSection
        data={{
          image: 'banner.jpg',
          features: [
            { title: 'Solid wood', desc: 'Built to last' },
            { title: 'Non-toxic', desc: 'Safe paint' },
          ],
        }}
      />
    );
    expect(container.textContent).toContain('Solid wood');
    expect(container.textContent).toContain('Non-toxic');
  });

  it('renders the WhatsApp CTA as an external link, not internal navigation', () => {
    const { container } = renderWithClient(
      <ModernBannerSection
        data={{ image: 'banner.jpg', whatsapp_number: '+966 50 000 0000', whatsapp_msg: 'Hi', whatsapp_btn_text: 'Chat with us' }}
      />
    );
    const cta = container.querySelector('a[href^="https://wa.me/"]');
    expect(cta?.textContent).toBe('Chat with us');
    expect(cta?.getAttribute('href')).toBe('https://wa.me/966500000000?text=Hi');
    expect(cta?.getAttribute('target')).toBe('_blank');
  });

  it('fetches and resolves hotspot products by id, positioned by pos_x/pos_y', async () => {
    listMock.mockResolvedValue({
      items: [{ id: 1, name: 'Climbing frame', url: '/p/1', price: 500, is_on_sale: false, regular_price: 500 }],
    });
    const { container } = renderWithClient(
      <ModernBannerSection
        data={{ image: 'banner.jpg', hotspots: [{ product: [1], pos_x: '30', pos_y: '70' }] }}
      />
    );
    await waitFor(() => expect(container.textContent).toContain('Climbing frame'));
    const dotWrapper = container.querySelector('a[href="/p/1"]')?.parentElement;
    expect(dotWrapper?.getAttribute('style')).toContain('left: 30%');
    expect(dotWrapper?.getAttribute('style')).toContain('top: 70%');
  });

  it('shows the plain dot, no popup, when a hotspot product has not resolved', () => {
    const { container } = renderWithClient(
      <ModernBannerSection
        data={{ image: 'banner.jpg', hotspots: [{ product: [999], pos_x: '50', pos_y: '50' }] }}
      />
    );
    expect(container.querySelector('a[href="/p/999"]')).toBeNull();
    expect(container.querySelector('svg')).toBeTruthy();
  });
});
