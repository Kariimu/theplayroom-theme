import { memo } from 'react';
import { getCdnImageSrcSet, getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';

/** CDN widths for the mobile banner. */
const MOBILE_WIDTHS = [480, 768, 1200] as const;
/** CDN widths for the desktop banner. */
const DESKTOP_WIDTHS = [640, 960, 1280] as const;

export interface BannerSectionProps {
  data: {
    image_desktop?: string;
    image_mobile?: string;
    image_desktop_description?: string;
    image_mobile_description?: string;
    top_margin?: boolean;
    position?: number;
    /** Set by the engine (`HomeComponentRenderer`) when this is the first block on the
     * page — the reference site uses this exact block as its hero, above the fold. */
    priority?: boolean;
    [key: string]: unknown;
  };
}

/**
 * `banner-section` home block — a plain decorative banner with its own art per
 * breakpoint (`image_mobile` below `sm`, `image_desktop` from `sm` up); no link,
 * no overlay text, matching the Twig block it replaces. Falls back to the
 * desktop image on mobile when no mobile art was uploaded. This is the
 * reference site's own hero (position 1 in `twilight.preview.json`), so it
 * loads eagerly there, like any other home block's `priority` image.
 */
export const BannerSection = memo(function BannerSection({ data }: BannerSectionProps) {
  const {
    image_desktop: desktop,
    image_mobile: mobile,
    image_desktop_description: desktopAlt,
    image_mobile_description: mobileAlt,
    top_margin: topMargin,
    priority,
  } = data;

  if (!desktop && !mobile) return null;

  const fallback = desktop || mobile;

  return (
    <div className={`container ${topMargin ? 'mt-4 sm:mt-8' : ''}`}>
      <picture>
        {mobile && (
          <source
            media="(max-width: 639px)"
            srcSet={getCdnImageSrcSet(mobile, MOBILE_WIDTHS)}
            sizes="100vw"
          />
        )}
        {desktop && (
          <source
            media="(min-width: 640px)"
            srcSet={getCdnImageSrcSet(desktop, DESKTOP_WIDTHS)}
            sizes="100vw"
          />
        )}
        <img
          src={getCdnImageUrl(fallback, { width: 1280 }) ?? fallback}
          // One alt serves both `<source>`s (the `<img>` itself never swaps); desktop's
          // description is the block's primary copy, mobile's is the fallback.
          alt={desktopAlt || mobileAlt || ''}
          loading={priority ? 'eager' : 'lazy'}
          {...(priority && { fetchPriority: 'high' as const })}
          decoding="async"
          // The reference site's own hero banner is 12:5 (1200×500) at every breakpoint —
          // no separate, more-cropped mobile shape — and relies on exactly these two
          // things for CLS: `width`/`height` attributes plus `height: auto` (`w-full`
          // here does the same job). A forced *different* ratio per breakpoint is what
          // was causing the "zoomed" look: `object-cover` had to crop away a big share
          // of the image's width to fill a box shaped nothing like it.
          width={1200}
          height={500}
          className="aspect-[12/5] w-full rounded-lg object-cover"
        />
      </picture>
    </div>
  );
});
