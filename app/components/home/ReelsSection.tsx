import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Product } from '@salla.sa/twilight-theme-engine/types';
import { product } from '@salla.sa/twilight-theme-engine/api/product';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { useMoney } from '@salla.sa/twilight-theme-engine/hooks/useMoney';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';
import { ScrollCarousel } from '../common';
import { useMotionAllowed } from '../../hooks/useMotionAllowed';
import { toIds } from '../../lib/pickerValue';

interface ReelItem {
  video_url?: string;
  poster?: string;
  product?: unknown;
}

export interface ReelsSectionProps {
  data: {
    title_section?: string;
    desc_section?: string;
    reels?: ReelItem[];
    position?: number;
    [key: string]: unknown;
  };
}

/** The video URL with a `#t=0.1` media fragment, so a video with no poster
 *  paints a frame from its start (not frame 0, often black) once its
 *  metadata loads. Left alone if the URL already has a fragment. */
export function firstFrameSrc(url: string): string {
  return url.includes('#') ? url : `${url}#t=0.1`;
}

function PlayIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}

function VolumeIcon({ muted }: { muted: boolean }) {
  return muted ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z" />
      <line x1="22" x2="16" y1="9" y2="15" />
      <line x1="16" x2="22" y1="9" y2="15" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    </svg>
  );
}

function ReelProduct({ item }: { item: Product }) {
  const { format } = useMoney();
  return (
    <div className="flex items-center gap-3 rounded-b-2xl border border-t-0 border-gray-100 bg-white p-3 shadow-lg">
      <Link to={item.url} aria-label={item.name} className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
        {item.image?.url && (
          <img
            src={getCdnImageUrl(item.image.url, { width: 120 }) ?? item.image.url}
            width="56"
            height="56"
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-base font-bold leading-tight">{item.name}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-base font-bold text-primary">{format(item.price)}</span>
          {item.is_on_sale && (
            <span className="text-xs opacity-60 line-through">{format(item.regular_price)}</span>
          )}
        </div>
      </div>
      <Link
        to={item.url}
        aria-label={item.name}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
      </Link>
    </div>
  );
}

/**
 * One reel: a muted, looping, click-to-play video (play/pause and mute state
 * live on the element itself via a ref, same imperative pattern as
 * {@link EnhancedSlider}'s `useSlideVideos` — not a "manual DOM edit", a
 * standard media-element API), with its linked product below.
 */
function ReelCard({ reel, item, autoPlay }: { reel: ReelItem; item?: Product; autoPlay: boolean }) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    videoRef.current?.play().catch(() => undefined);
  }, [autoPlay]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => undefined);
    else video.pause();
  };

  const toggleMute = (event: MouseEvent) => {
    event.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  return (
    <div className="w-[220px] flex-shrink-0 md:w-[260px]">
      <div
        className="relative aspect-[9/16] cursor-pointer overflow-hidden rounded-t-2xl bg-black"
        onClick={togglePlay}
      >
        {reel.video_url && (
          <video
            ref={videoRef}
            src={reel.poster ? reel.video_url : firstFrameSrc(reel.video_url)}
            poster={reel.poster ? getCdnImageUrl(reel.poster, { width: 400 }) ?? reel.poster : undefined}
            className="h-full w-full object-cover"
            playsInline
            loop
            muted
            // No cover image: load just enough of the video to show a frame of
            // it (`#t=0.1`) instead of a black box. With a cover, nothing loads
            // until it plays.
            preload={reel.poster ? 'none' : 'metadata'}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
        )}

        {!playing && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/30 text-white">
              <PlayIcon />
            </span>
          </div>
        )}

        <button
          type="button"
          aria-label={t('blocks.home.toggle_volume', 'Toggle sound')}
          onClick={toggleMute}
          className="absolute start-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white"
        >
          <VolumeIcon muted={muted} />
        </button>
      </div>

      {item && <ReelProduct item={item} />}
    </div>
  );
}

/**
 * `reels-section` home block — a horizontally scrolling row of short product
 * videos. The Twig block resolved each reel's product from a
 * merchant-duplicated `all_products` picker; here the reel ids are fetched
 * directly through `product.queries.list`, so `all_products` is unused.
 */
export function ReelsSection({ data }: ReelsSectionProps) {
  const { t } = useTranslation();
  const { title_section: title, desc_section: description, reels = [] } = data;
  const motionAllowed = useMotionAllowed();

  const reelIds = useMemo(() => Array.from(new Set(reels.flatMap((reel) => toIds(reel.product)))), [reels]);
  const { data: result } = useQuery({
    ...product.queries.list({ source: 'selected', sourceValue: reelIds }),
    enabled: reelIds.length > 0,
  });
  const productsById = useMemo(() => {
    const map = new Map<number, Product>();
    result?.items.forEach((item) => map.set(Number(item.id), item));
    return map;
  }, [result]);

  const withVideo = reels.filter((reel) => reel.video_url);
  if (!withVideo.length) return null;

  return (
    <div className="container">
      {(title || description) && (
        <div className="mb-8 text-center">
          {title && <h2 className="text-3xl font-black">{title}</h2>}
          {description && <p className="text-lg opacity-70">{description}</p>}
        </div>
      )}

      <ScrollCarousel
        arrows="sides"
        prevLabel={t('blocks.home.reviews_prev', 'Previous')}
        nextLabel={t('blocks.home.reviews_next', 'Next')}
      >
        {withVideo.map((reel, index) => (
          // A static settings list with no id; see .react-doctor/false-positives.md.
          // react-doctor-disable-next-line react-doctor/no-array-index-as-key
          <div key={index} className="s-products-carousel__slide">
            <ReelCard
              reel={reel}
              item={productsById.get(toIds(reel.product)[0])}
              autoPlay={motionAllowed && index === 0}
            />
          </div>
        ))}
      </ScrollCarousel>
    </div>
  );
}
