// app/lib/galleryPage.ts
import type { HomeComponentData } from '@salla.sa/twilight-theme-engine/types';
import { findHomeBlock } from './homeBlocks';
import { toIds } from './pickerValue';

/**
 * Gallery page ("معرض الأعمال"): the old theme's gallery category mode
 * (`product/index.twig`, 06 §5), rebuilt. One category, picked by the small
 * `gallery_page_category` setting (same id as the Twig theme), shows a photo
 * row and a video row instead of a product list; each photo or video can be
 * linked to a product, shown beside it in a popup.
 *
 * The content (titles, photos, videos) lives in the data-only `gallery-page`
 * home block, the D2 pattern used by the FAQ and the in-use gallery: home
 * blocks are the supported place for collections and product pickers
 * (MIGRATION-PLAN §5A), and the owner edits it in the theme customizer. The
 * block draws nothing on the home page itself (`app/router.tsx`).
 */

/** The block's `path` as the engine reports it (`twilight.json` has `home.` in front). */
export const GALLERY_PAGE_PATH = 'gallery-page';

/** The root setting holding the gallery category, same id as the Twig theme. */
export const GALLERY_CATEGORY_SETTING = 'gallery_page_category';

/** Matches the manifest's `maxLength` on both collections. */
export const MAX_GALLERY_ITEMS = 20;

export interface GalleryPhoto {
  image: string;
  productId?: number;
}

export interface GalleryVideo {
  video: string;
  /** The merchant's cover, else a YouTube thumbnail, else undefined (show a frame of the video). */
  poster?: string;
  desc?: string;
  productId?: number;
}

export interface GalleryContent {
  title?: string;
  desc?: string;
  videosTitle?: string;
  photos: GalleryPhoto[];
  videos: GalleryVideo[];
}

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/** An image field is a URL string; tolerate an `{ url }` object too. */
function imageUrl(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object' && 'url' in value) return text((value as { url?: unknown }).url);
  return '';
}

/** Is this category the one picked in `gallery_page_category`? */
export function isGalleryCategory(
  settings: Record<string, unknown> | null | undefined,
  categoryId: unknown
): boolean {
  const picked = toIds(settings?.[GALLERY_CATEGORY_SETTING])[0];
  const id = Number(categoryId);
  return picked !== undefined && Number.isFinite(id) && picked === id;
}

/** The YouTube video id in a watch / youtu.be / embed / shorts link, else undefined. */
export function youTubeId(url: string): string | undefined {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([\w-]{6,})/);
  return match?.[1];
}

/** A YouTube link's own thumbnail, as the Twig theme derived it when no cover was set. */
export function youTubePoster(url: string): string | undefined {
  const id = youTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : undefined;
}

interface RawPhoto {
  img?: unknown;
  product?: unknown;
}

interface RawVideo {
  video?: unknown;
  poster?: unknown;
  desc?: unknown;
  product?: unknown;
}

const list = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

/**
 * The gallery block's content, cleaned: photos need an image and videos a
 * link; everything else is optional. Order is the block's own.
 */
export function resolveGalleryContent(
  components: readonly HomeComponentData[] | null | undefined
): GalleryContent {
  const data = findHomeBlock(components, GALLERY_PAGE_PATH) ?? {};

  const photos: GalleryPhoto[] = [];
  for (const item of list<RawPhoto>(data.images)) {
    const image = imageUrl(item?.img);
    if (!image) continue;
    const productId = toIds(item?.product)[0];
    photos.push(productId ? { image, productId } : { image });
    if (photos.length >= MAX_GALLERY_ITEMS) break;
  }

  const videos: GalleryVideo[] = [];
  for (const item of list<RawVideo>(data.videos)) {
    const video = text(item?.video);
    if (!video) continue;
    const entry: GalleryVideo = { video };
    const poster = imageUrl(item?.poster) || youTubePoster(video);
    if (poster) entry.poster = poster;
    const desc = text(item?.desc);
    if (desc) entry.desc = desc;
    const productId = toIds(item?.product)[0];
    if (productId) entry.productId = productId;
    videos.push(entry);
    if (videos.length >= MAX_GALLERY_ITEMS) break;
  }

  return {
    title: text(data.title_section) || undefined,
    desc: text(data.desc_section) || undefined,
    videosTitle: text(data.videos_title) || undefined,
    photos,
    videos,
  };
}

/** Every product id linked from a photo or video, once each. */
export function galleryProductIds(content: GalleryContent): number[] {
  const ids = [...content.photos, ...content.videos]
    .map((item) => item.productId)
    .filter((id): id is number => typeof id === 'number');
  return Array.from(new Set(ids));
}
