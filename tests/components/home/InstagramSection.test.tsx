import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { InstagramSection } from '../../../app/components/home/InstagramSection';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k }),
}));

// Only the real BottomSheet, not the whole barrel — it also re-exports
// BlockHookSlot, which imports `@salla.sa/twilight-theme-engine/home` and
// pulls in a chunk graph the test setup's narrow component-library mock
// doesn't cover (see MobileAccountSheet.test.tsx for the same pattern).
vi.mock('../../../app/components/common', async () => ({
  BottomSheet: (await vi.importActual<typeof import('../../../app/components/common/BottomSheet')>(
    '../../../app/components/common/BottomSheet'
  )).BottomSheet,
}));

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
    expect(container.querySelectorAll('button img, button video').length).toBe(1);
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
