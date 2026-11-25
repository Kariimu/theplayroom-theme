import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Category, Product } from '@salla.sa/twilight-theme-engine/types';
import { home } from '@salla.sa/twilight-theme-engine/api/home';
import { product } from '@salla.sa/twilight-theme-engine/api/product';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { useMoney } from '@salla.sa/twilight-theme-engine/hooks/useMoney';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';
import { ScrollCarousel } from '../common';
import { CloseIcon } from '../icons';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import { useScrollLock } from '../../hooks/useScrollLock';
import { devPreviewBlocks } from '../../lib/homeBlocks';
import { firstFrameSrc } from '../../lib/videoFrame';
import {
  galleryProductIds,
  resolveGalleryContent,
  youTubeId,
  type GalleryContent,
  type GalleryPhoto,
  type GalleryVideo,
} from '../../lib/galleryPage';

/**
 * The floating doodles behind the hero title: same pictures, spots, sizes and
 * delays as the Twig page. Positions are physical (`left`), as there.
 */
const DOODLES = [
  { src: 'star', top: '10%', left: '5%', width: '1.5rem', delay: '0s' },
  { src: 'palette', top: '21%', left: '18%', width: '2rem', delay: '0.7s' },
  { src: 'monkey', top: '32%', left: '31%', width: '2.5rem', delay: '1.4s' },
  { src: 'heart', top: '43%', left: '44%', width: '1.5rem', delay: '2.1s' },
  { src: 'rainbow', top: '54%', left: '57%', width: '2rem', delay: '2.8s' },
  { src: 'sparkles', top: '65%', left: '70%', width: '2.5rem', delay: '3.5s' },
  { src: 'circus-tent', top: '76%', left: '83%', width: '1.5rem', delay: '4.2s' },
  { src: 'carousel-horse', top: '17%', left: '11%', width: '2rem', delay: '4.9s' },
] as const;

/**
 * The gallery block's content. Read in the browser: the engine's category
 * route has no loader extension point, and taking the route over for every
 * category page only for this one is not worth it. Under `pnpm dev` the dev
 * panel's layout wins, as on the product page, so a block added there shows.
 */
function useGalleryContent(): { content?: GalleryContent; loading: boolean } {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: ['gallery-page', 'blocks'],
    queryFn: async () =>
      (await devPreviewBlocks()) ?? queryClient.fetchQuery(home.queries.components()),
  });
  const content = useMemo(() => (data ? resolveGalleryContent(data) : undefined), [data]);
  return { content, loading: isPending };
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}

type Opened =
  | { kind: 'photo'; photo: GalleryPhoto }
  | { kind: 'video'; video: GalleryVideo };

function ModalProduct({ item }: { item?: Product }) {
  const { t } = useTranslation();
  const { format } = useMoney();

  if (!item) {
    return (
      <div className="gallery-modal__no-product">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="m4.9 4.9 14.2 14.2" />
        </svg>
        <p>{t('pages.gallery.no_product_linked', 'No product linked')}</p>
      </div>
    );
  }

  return (
    <div className="gallery-modal__product">
      {item.image?.url && (
        <img
          src={getCdnImageUrl(item.image.url, { width: 340 }) ?? item.image.url}
          width="170"
          height="170"
          alt=""
          decoding="async"
          className="gallery-modal__product-img"
        />
      )}
      <h3 className="gallery-modal__product-name">{item.name}</h3>
      <div className="gallery-modal__prices">
        <span className="gallery-modal__price">{format(item.price)}</span>
        {item.is_on_sale && <span className="gallery-modal__old-price">{format(item.regular_price)}</span>}
      </div>
      <Link to={item.url} className="gallery-modal__shop-btn">
        {t('pages.gallery.shop_now', 'Shop now')}
      </Link>
    </div>
  );
}

/** The photo or video, big, beside its linked product (Twig `reel-modal`). */
function GalleryModal({
  opened,
  item,
  loadingProduct,
  onClose,
}: {
  opened: Opened;
  item?: Product;
  loadingProduct: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);
  useScrollLock(true);
  useDialogFocus(dialogRef, true);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const youTube = opened.kind === 'video' ? youTubeId(opened.video.video) : undefined;
  const label =
    item?.name ||
    (opened.kind === 'video' ? opened.video.desc : undefined) ||
    t('pages.gallery.title', 'Gallery');

  return createPortal(
    <div className="gallery-modal" role="presentation">
      <div className="gallery-modal__overlay" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        className="gallery-modal__inner"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
      >
        <button
          type="button"
          className="gallery-modal__close"
          onClick={onClose}
          aria-label={t('blocks.header.close', 'Close')}
        >
          <CloseIcon aria-hidden="true" />
        </button>

        <div className="gallery-modal__product-col">
          {loadingProduct ? (
            <div className="gallery-modal__skeleton" aria-hidden="true">
              <span className="gallery-modal__skeleton-img" />
              <span className="gallery-modal__skeleton-line gallery-modal__skeleton-line--title" />
              <span className="gallery-modal__skeleton-line gallery-modal__skeleton-line--price" />
              <span className="gallery-modal__skeleton-line gallery-modal__skeleton-line--btn" />
            </div>
          ) : (
            <ModalProduct item={item} />
          )}
        </div>

        <div className={`gallery-modal__media gallery-modal__media--${opened.kind}`}>
          {opened.kind === 'photo' ? (
            <img
              src={getCdnImageUrl(opened.photo.image, { width: 1000 }) ?? opened.photo.image}
              alt=""
              decoding="async"
              className="gallery-modal__photo"
            />
          ) : youTube ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youTube}?autoplay=1&playsinline=1`}
              title={opened.video.desc || 'YouTube'}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="gallery-modal__video gallery-modal__video--embed"
            />
          ) : (
            // The visitor opened it to watch it: play straight away, with sound and controls.
            <video
              src={opened.video.video}
              poster={opened.video.poster}
              className="gallery-modal__video"
              controls
              autoPlay
              playsInline
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function PhotoTile({ photo, onOpen }: { photo: GalleryPhoto; onOpen: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      className="gallery-tile"
      onClick={onOpen}
      aria-label={t('pages.gallery.open_photo', 'Open photo')}
    >
      <img
        src={getCdnImageUrl(photo.image, { width: 480 }) ?? photo.image}
        width="270"
        height="480"
        alt=""
        loading="lazy"
        decoding="async"
      />
    </button>
  );
}

function VideoTile({ video, onOpen }: { video: GalleryVideo; onOpen: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      className="gallery-tile gallery-tile--video"
      onClick={onOpen}
      aria-label={video.desc || t('pages.gallery.play_video', 'Play video')}
    >
      {video.poster ? (
        <img
          src={getCdnImageUrl(video.poster, { width: 480 }) ?? video.poster}
          width="270"
          height="480"
          alt=""
          loading="lazy"
          decoding="async"
        />
      ) : (
        // No cover: load just enough of the video to show a frame of it.
        <video src={firstFrameSrc(video.video)} preload="metadata" playsInline muted tabIndex={-1} />
      )}
      <span className="gallery-tile__play" aria-hidden="true">
        <span className="gallery-tile__play-icon">
          <PlayIcon />
        </span>
      </span>
      {video.desc && <span className="gallery-tile__caption">{video.desc}</span>}
    </button>
  );
}

function RowSkeleton() {
  return (
    <div className="gallery-row-skeleton container" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((n) => (
        <span key={n} className="gallery-row-skeleton__tile" />
      ))}
    </div>
  );
}

/**
 * The gallery category page ("معرض الأعمال"), in place of the product list
 * for the category picked in `gallery_page_category` (see `app/lib/galleryPage.ts`):
 * a hero, a row of photos and a row of videos. A photo or video opens a popup
 * with its linked product and a "Shop now" button. Styles: `gallery-page.scss`.
 *
 * The hero title is an h2: `MobilePageTitleBar` already renders the page's one
 * `<h1>` (the category name), as on every listing page.
 */
export function GalleryPage({ category }: { category?: Category }) {
  const { t } = useTranslation();
  const { content, loading } = useGalleryContent();
  const [opened, setOpened] = useState<Opened | null>(null);
  const close = useCallback(() => setOpened(null), []);

  const productIds = useMemo(() => (content ? galleryProductIds(content) : []), [content]);
  const { data: result, isPending: productsPending } = useQuery({
    ...product.queries.list({ source: 'selected', sourceValue: productIds }),
    enabled: productIds.length > 0,
  });
  const productsById = useMemo(() => {
    const map = new Map<number, Product>();
    result?.items.forEach((item) => map.set(Number(item.id), item));
    return map;
  }, [result]);

  const title = content?.title ?? category?.name;
  const openedId = opened?.kind === 'photo' ? opened.photo.productId : opened?.video.productId;
  const prev = t('blocks.home.reviews_prev', 'Previous');
  const next = t('blocks.home.reviews_next', 'Next');

  return (
    <div className="gallery-page">
      <section className="gallery-hero">
        {DOODLES.map((doodle) => (
          <img
            key={doodle.src}
            src={`/gallery/${doodle.src}.webp`}
            alt=""
            aria-hidden="true"
            width="48"
            height="48"
            className="gallery-doodle"
            style={{ top: doodle.top, left: doodle.left, width: doodle.width, animationDelay: doodle.delay }}
          />
        ))}
        <div className="container relative z-10 max-w-4xl text-center">
          {title && (
            <div className="gallery-hero__deco">
              <h2 className="gallery-hero__title">{title}</h2>
            </div>
          )}
          {content?.desc && <p className="gallery-hero__desc">{content.desc}</p>}
          <div className="gallery-hero__bars" aria-hidden="true">
            <span className="w-12 bg-primary" />
            <span className="w-8 bg-accent" />
            <span className="w-16 bg-[#8fa7c3]" />
            <span className="w-6 bg-primary" />
          </div>
        </div>
      </section>

      {loading && <RowSkeleton />}

      {!!content?.photos.length && (
        <div className="container">
          <ScrollCarousel arrows="sides" className="gallery-track" prevLabel={prev} nextLabel={next}>
            {content.photos.map((photo, index) => (
              // A static settings list with no id; see .react-doctor/false-positives.md.
              // react-doctor-disable-next-line react-doctor/no-array-index-as-key
              <PhotoTile key={index} photo={photo} onOpen={() => setOpened({ kind: 'photo', photo })} />
            ))}
          </ScrollCarousel>
        </div>
      )}

      {!!content?.videos.length && (
        <section className="gallery-videos">
          {content.videosTitle && (
            <div className="container">
              <h2 className="gallery-videos__title">{content.videosTitle}</h2>
            </div>
          )}
          <div className="container">
            <ScrollCarousel arrows="sides" className="gallery-track" prevLabel={prev} nextLabel={next}>
              {content.videos.map((video, index) => (
                // A static settings list with no id; see .react-doctor/false-positives.md.
                // react-doctor-disable-next-line react-doctor/no-array-index-as-key
                <VideoTile key={index} video={video} onOpen={() => setOpened({ kind: 'video', video })} />
              ))}
            </ScrollCarousel>
          </div>
        </section>
      )}

      {!loading && content && !content.photos.length && !content.videos.length && (
        <p className="container pb-16 text-center text-gray-500">
          {t('pages.gallery.empty', 'Photos and videos are coming soon.')}
        </p>
      )}

      {opened && (
        <GalleryModal
          opened={opened}
          item={openedId ? productsById.get(openedId) : undefined}
          loadingProduct={!!openedId && productsPending}
          onClose={close}
        />
      )}
    </div>
  );
}
