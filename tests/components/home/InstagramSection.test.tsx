import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { InstagramSection } from '../../../app/components/home/InstagramSection';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k }),
}));

// Only the real BottomSheet and ScrollCarousel, not the whole barrel — it also
// re-exports BlockHookSlot, which imports `@salla.sa/twilight-theme-engine/home`
// and pulls in a chunk graph the test setup's narrow component-library mock
// doesn't cover.
vi.mock('../../../app/components/common', async () => ({
  BottomSheet: (await vi.importActual<typeof import('../../../app/components/common/BottomSheet')>(
    '../../../app/components/common/BottomSheet'
  )).BottomSheet,
  ScrollCarousel: (await vi.importActual<typeof import('../../../app/components/common/ScrollCarousel')>(
    '../../../app/components/common/ScrollCarousel'
  )).ScrollCarousel,
}));

beforeEach(() => {
  Element.prototype.scrollBy = vi.fn();
});

describe('InstagramSection', () => {
  it('renders nothing with no avatar, name or posts', () => {
    const { container } = render(<InstagramSection data={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the profile name, handle and stats', () => {
    const { container } = render(
      <InstagramSection
        data={{
          page_name: 'The Playroom',
          page_link: '@theplayroom.sa',
          number_posts: '379',
          number_followers: '22.1K',
          number_following: '12',
        }}
      />
    );
    expect(container.querySelector('h3')?.textContent).toBe('The Playroom');
    expect(container.textContent).toContain('@theplayroom.sa');
    expect(container.textContent).toContain('22.1K');
  });

  it('builds the follow link from the @handle when follow_btn is unset', () => {
    const { container } = render(
      <InstagramSection data={{ page_name: 'x', page_link: '@theplayroom.sa' }} />
    );
    const follow = container.querySelector('a[target="_blank"]');
    expect(follow?.getAttribute('href')).toBe('https://instagram.com/theplayroom.sa');
  });

  it('prefers an explicit follow_btn over the derived handle url', () => {
    const { container } = render(
      <InstagramSection
        data={{ page_name: 'x', page_link: '@theplayroom.sa', follow_btn: 'https://ig.me/custom' }}
      />
    );
    const follow = container.querySelector('a[target="_blank"]');
    expect(follow?.getAttribute('href')).toBe('https://ig.me/custom');
  });

  it('renders one tile per post with media, skipping posts with neither image nor video', () => {
    const { container } = render(
      <InstagramSection
        data={{
          posts: [{ img: 'a.jpg', like_number: '10', comment_number: '2' }, { desc: 'no media' }],
        }}
      />
    );
    // Posts render twice — a mobile paged row and a desktop flat grid (CSS picks
    // one per breakpoint) — so count within the unambiguous desktop grid only.
    const desktopGrid = container.querySelector('.md\\:grid')!;
    expect(desktopGrid.querySelectorAll('button img, button video').length).toBe(1);
  });

  it('opens the bottom sheet with the post detail on tile click', () => {
    const { getByText, container } = render(
      <InstagramSection
        data={{
          posts: [{ img: 'a.jpg', desc: 'A climbing frame in the wild', like_number: '10', comment_number: '2' }],
        }}
      />
    );
    // BottomSheet portals to document.body, not the render container.
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    fireEvent.click(container.querySelector('button') as HTMLButtonElement);
    expect(getByText('A climbing frame in the wild')).toBeTruthy();
    expect(document.querySelector('[role="dialog"]')).toBeTruthy();
  });

  it('pages the mobile grid into groups of 4, matching the reference site', () => {
    const posts = Array.from({ length: 6 }, (_, i) => ({ img: `${i}.jpg` }));
    const { container } = render(<InstagramSection data={{ posts }} />);
    const pages = container.querySelectorAll('.instagram-section__pager .scroll-carousel__track > .grid');
    expect(pages.length).toBe(2); // 6 posts → a page of 4, a page of 2
    expect(pages[0].children.length).toBe(4);
    expect(pages[1].children.length).toBe(2);
  });

  it('still names the post dialog when the merchant has not set a profile name', () => {
    const { container } = render(
      <InstagramSection data={{ posts: [{ img: 'a.jpg', like_number: '10', comment_number: '2' }] }} />
    );
    fireEvent.click(container.querySelector('button') as HTMLButtonElement);
    expect(document.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe(
      'Instagram post'
    );
  });

  it('shows the video thumbnail with a play badge when video_first is set', () => {
    const { container } = render(
      <InstagramSection
        data={{ posts: [{ img: 'poster.jpg', video: 'a.mp4', video_first: true }] }}
      />
    );
    expect(container.querySelector('button video')).toBeTruthy();
    expect(container.querySelector('button svg')).toBeTruthy();
  });
});
