import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReelsSection } from '../../../app/components/home/ReelsSection';

const listMock = vi.fn();
const motionAllowed = { value: true };

vi.mock('../../../app/hooks/useMotionAllowed', () => ({
  useMotionAllowed: () => motionAllowed.value,
}));

vi.mock('../../../app/components/common', () => ({
  ScrollCarousel: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k }),
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
  motionAllowed.value = true;
  // jsdom doesn't implement video playback.
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  HTMLMediaElement.prototype.pause = vi.fn();
});

describe('ReelsSection', () => {
  it('renders nothing with no reel has a video', () => {
    const { container } = renderWithClient(
      <ReelsSection data={{ reels: [{ product: [1] }] }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the header title and description', () => {
    const { container } = renderWithClient(
      <ReelsSection
        data={{ title_section: 'Watch it in action', desc_section: 'Real families', reels: [{ video_url: 'a.mp4' }] }}
      />
    );
    expect(container.querySelector('h2')?.textContent).toBe('Watch it in action');
    expect(container.textContent).toContain('Real families');
  });

  it('renders one card per reel with a video', () => {
    const { container } = renderWithClient(
      <ReelsSection data={{ reels: [{ video_url: 'a.mp4' }, { video_url: 'b.mp4' }, { product: [1] }] }} />
    );
    expect(container.querySelectorAll('video').length).toBe(2);
  });

  it('resolves and renders the linked product for a reel', async () => {
    listMock.mockResolvedValue({
      items: [{ id: 1, name: 'Swedish ladder', url: '/p/1', price: 1359, is_on_sale: true, regular_price: 1599 }],
    });
    const { container } = renderWithClient(
      <ReelsSection data={{ reels: [{ video_url: 'a.mp4', product: [1] }] }} />
    );
    await waitFor(() => expect(container.textContent).toContain('Swedish ladder'));
    expect(container.textContent).toContain('1359 SAR');
    expect(container.textContent).toContain('1599 SAR');
  });

  it('toggles play/pause on click, independent of the mute button', () => {
    const { container } = renderWithClient(
      <ReelsSection data={{ reels: [{ video_url: 'a.mp4' }] }} />
    );
    const video = container.querySelector('video') as HTMLVideoElement;
    const frame = video.parentElement as HTMLElement;
    fireEvent.click(frame);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  it('autoplays only the first reel when motion is allowed', () => {
    renderWithClient(
      <ReelsSection data={{ reels: [{ video_url: 'a.mp4' }, { video_url: 'b.mp4' }] }} />
    );
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
  });

  it('does not autoplay when motion is not allowed', () => {
    motionAllowed.value = false;
    renderWithClient(<ReelsSection data={{ reels: [{ video_url: 'a.mp4' }] }} />);
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });
});
