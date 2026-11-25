import { describe, it, expect } from 'vitest';
import type { HomeComponentData } from '@salla.sa/twilight-theme-engine/types';
import {
  galleryProductIds,
  isGalleryCategory,
  MAX_GALLERY_ITEMS,
  resolveGalleryContent,
  youTubeId,
  youTubePoster,
} from '../../app/lib/galleryPage';

const block = (fields: Record<string, unknown>, path = 'home.gallery-page') =>
  [{ path, ...fields }] as unknown as HomeComponentData[];

describe('isGalleryCategory', () => {
  it.each([
    ['an id string in an array', ['1241225104']],
    ['a { value } item', [{ value: '1241225104' }]],
    ['a hydrated { id } item', [{ id: 1241225104, name: 'معرض الأعمال' }]],
    ['a bare number', 1241225104],
  ])('matches the picked category given as %s', (_shape, value) => {
    expect(isGalleryCategory({ gallery_page_category: value }, '1241225104')).toBe(true);
  });

  it('does not match another category', () => {
    expect(isGalleryCategory({ gallery_page_category: ['1241225104'] }, '42')).toBe(false);
  });

  it('matches nothing when the setting is empty or missing', () => {
    expect(isGalleryCategory({ gallery_page_category: [] }, '1241225104')).toBe(false);
    expect(isGalleryCategory({}, '1241225104')).toBe(false);
    expect(isGalleryCategory(undefined, '1241225104')).toBe(false);
  });

  it('matches nothing for a listing with no category id', () => {
    expect(isGalleryCategory({ gallery_page_category: ['1'] }, undefined)).toBe(false);
  });
});

describe('youTubeId / youTubePoster', () => {
  it.each([
    'https://youtu.be/dQw4w9WgXcQ?si=abc',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10',
    'https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1',
    'https://youtube.com/shorts/dQw4w9WgXcQ',
  ])('reads the id from %s', (url) => {
    expect(youTubeId(url)).toBe('dQw4w9WgXcQ');
    expect(youTubePoster(url)).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  });

  it('is undefined for a plain video file', () => {
    expect(youTubeId('https://reels.silverback.sa/theplayroom1.mp4')).toBeUndefined();
    expect(youTubePoster('https://reels.silverback.sa/theplayroom1.mp4')).toBeUndefined();
  });
});

describe('resolveGalleryContent', () => {
  it('is empty with no block', () => {
    expect(resolveGalleryContent([])).toEqual({
      title: undefined,
      desc: undefined,
      videosTitle: undefined,
      photos: [],
      videos: [],
    });
    expect(resolveGalleryContent(undefined).photos).toEqual([]);
  });

  it('reads the titles, photos and videos in the block order, with their products', () => {
    const content = resolveGalleryContent(
      block({
        title_section: ' غرف ألعابنا السعيدة ',
        desc_section: 'لحظات حقيقية',
        videos_title: 'لحظات من المرح',
        images: [
          { img: 'a.webp', product: [{ value: '1949686711' }] },
          { img: { url: 'b.webp' }, product: [] },
        ],
        videos: [
          { video: 'https://reels.silverback.sa/1.mp4', desc: 'بيت التسلق', product: ['1049262094'] },
          { video: 'https://youtu.be/dQw4w9WgXcQ', poster: '' },
          { video: 'https://reels.silverback.sa/2.mp4', poster: 'cover.webp' },
        ],
      })
    );
    expect(content.title).toBe('غرف ألعابنا السعيدة');
    expect(content.desc).toBe('لحظات حقيقية');
    expect(content.videosTitle).toBe('لحظات من المرح');
    expect(content.photos).toEqual([{ image: 'a.webp', productId: 1949686711 }, { image: 'b.webp' }]);
    expect(content.videos).toEqual([
      { video: 'https://reels.silverback.sa/1.mp4', desc: 'بيت التسلق', productId: 1049262094 },
      { video: 'https://youtu.be/dQw4w9WgXcQ', poster: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg' },
      { video: 'https://reels.silverback.sa/2.mp4', poster: 'cover.webp' },
    ]);
  });

  it('finds the block with or without the home. prefix', () => {
    const content = resolveGalleryContent(block({ images: [{ img: 'a.webp' }] }, 'gallery-page'));
    expect(content.photos).toEqual([{ image: 'a.webp' }]);
  });

  it('skips photos with no image and videos with no link', () => {
    const content = resolveGalleryContent(
      block({ images: [{ img: '' }, { product: ['1'] }], videos: [{ video: '  ' }, { desc: 'x' }] })
    );
    expect(content.photos).toEqual([]);
    expect(content.videos).toEqual([]);
  });

  it(`keeps at most ${MAX_GALLERY_ITEMS} of each`, () => {
    const many = Array.from({ length: MAX_GALLERY_ITEMS + 5 }, (_, i) => ({ img: `${i}.webp`, video: `${i}.mp4` }));
    const content = resolveGalleryContent(block({ images: many, videos: many }));
    expect(content.photos).toHaveLength(MAX_GALLERY_ITEMS);
    expect(content.videos).toHaveLength(MAX_GALLERY_ITEMS);
  });
});

describe('galleryProductIds', () => {
  it('lists every linked product once', () => {
    expect(
      galleryProductIds({
        photos: [{ image: 'a', productId: 1 }, { image: 'b' }],
        videos: [
          { video: 'v', productId: 2 },
          { video: 'w', productId: 1 },
        ],
      })
    ).toEqual([1, 2]);
  });
});
