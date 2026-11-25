import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { GalleryPage } from '../../../app/components/category/GalleryPage';

const componentsMock = vi.fn();
const listMock = vi.fn();

vi.mock('@salla.sa/twilight-theme-engine/api/home', () => ({
  home: {
    queries: {
      components: () => ({ queryKey: ['home', 'components'], queryFn: () => componentsMock() }),
    },
  },
}));

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
  Link: ({ to, children, className }: { to: string; children?: ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('../../../app/components/common', () => ({
  ScrollCarousel: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

// The dev panel's layout would win under vitest (DEV); these tests feed the store blocks.
vi.mock('../../../app/lib/homeBlocks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../app/lib/homeBlocks')>()),
  devPreviewBlocks: async () => null,
}));

function renderPage(ui = <GalleryPage category={{ id: 1241225104, name: 'معرض الأعمال', url: '/c1241225104' } as never} />) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const galleryBlock = {
  path: 'home.gallery-page',
  title_section: 'غرف ألعابنا السعيدة',
  desc_section: 'لحظات حقيقية من الفرح',
  videos_title: 'لحظات من المرح',
  images: [
    { img: 'https://cdn.files.salla.network/a.webp', product: ['11'] },
    { img: 'https://cdn.files.salla.network/b.webp', product: [] },
  ],
  videos: [{ video: 'https://reels.silverback.sa/1.mp4', desc: 'بيت التسلق', product: ['22'] }],
};

beforeEach(() => {
  componentsMock.mockReset();
  listMock.mockReset();
  componentsMock.mockResolvedValue([galleryBlock]);
  listMock.mockResolvedValue({
    items: [
      { id: 11, name: 'مثلث بيكلر', url: '/p11', price: 104, regular_price: 104, is_on_sale: false, image: { url: 'p11.webp' } },
      { id: 22, name: 'بيت التسلق', url: '/p22', price: 500, regular_price: 600, is_on_sale: true, image: { url: 'p22.webp' } },
    ],
  });
});

describe('GalleryPage', () => {
  it('renders the hero, the photo row and the video row from the gallery block', async () => {
    const { container } = renderPage();
    await waitFor(() => expect(container.querySelectorAll('.gallery-tile')).toHaveLength(3));
    expect(screen.getByRole('heading', { name: 'غرف ألعابنا السعيدة' })).toBeTruthy();
    expect(screen.getByText('لحظات حقيقية من الفرح')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'لحظات من المرح' })).toBeTruthy();
    expect(screen.getByText('بيت التسلق')).toBeTruthy();
    expect(container.querySelector('.gallery-tile--video video')?.getAttribute('src')).toBe(
      'https://reels.silverback.sa/1.mp4#t=0.1'
    );
    // One request for every linked product.
    await waitFor(() =>
      expect(listMock).toHaveBeenCalledWith({ source: 'selected', sourceValue: [11, 22] })
    );
  });

  it('falls back to the category name when the block has no title', async () => {
    componentsMock.mockResolvedValue([{ ...galleryBlock, title_section: '' }]);
    renderPage();
    expect(await screen.findByRole('heading', { name: 'معرض الأعمال' })).toBeTruthy();
  });

  it('opens a photo with its product and a shop-now link, and closes on Escape', async () => {
    const { container } = renderPage();
    await waitFor(() => expect(container.querySelectorAll('.gallery-tile')).toHaveLength(3));
    await waitFor(() => expect(listMock).toHaveBeenCalled());

    fireEvent.click(screen.getAllByRole('button', { name: 'Open photo' })[0]);
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(dialog.textContent).toContain('مثلث بيكلر'));
    expect(dialog.textContent).toContain('104 SAR');
    const shop = screen.getByRole('link', { name: 'Shop now' });
    expect(shop.getAttribute('href')).toBe('/p11');

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('says so when a photo has no linked product', async () => {
    const { container } = renderPage();
    await waitFor(() => expect(container.querySelectorAll('.gallery-tile')).toHaveLength(3));
    fireEvent.click(screen.getAllByRole('button', { name: 'Open photo' })[1]);
    expect((await screen.findByRole('dialog')).textContent).toContain('No product linked');
  });

  it('plays a video in the popup with its product and the old price', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'بيت التسلق' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog.querySelector('video')?.getAttribute('src')).toBe('https://reels.silverback.sa/1.mp4');
    await waitFor(() => expect(dialog.textContent).toContain('600 SAR'));
  });

  it('shows a short note when the block has no photos or videos', async () => {
    componentsMock.mockResolvedValue([]);
    renderPage();
    expect(await screen.findByText('Photos and videos are coming soon.')).toBeTruthy();
  });
});
