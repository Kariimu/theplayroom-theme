import { memo } from 'react';
import { getCdnImageSrcSet, getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';

/** CDN widths for the mobile banner (`image_mobile`, 1200×300 recommended). */
const MOBILE_WIDTHS = [480, 768, 1200] as const;
/** CDN widths for the desktop banner (`image_desktop`, 640×427 recommended). */
const DESKTOP_WIDTHS = [640, 960, 1280] as const;

export interface BannerSectionProps {
  data: {
    image_desktop?: string;
    image_mobile?: string;
    image_desktop_description?: string;
    image_mobile_description?: string;
    top_margin?: boolean;
    position?: number;
    [key: string]: unknown;
  };
}

/**
 * `banner-section` home block — a plain decorative banner with its own art per
 * breakpoint (`image_mobile` below `sm`, `image_desktop` from `sm` up); no link,
 * no overlay text, matching the Twig block it replaces. Falls back to the
 * desktop image on mobile when no mobile art was uploaded.
 */
export const BannerSection = memo(function BannerSection({ data }: BannerSectionProps) {
  const {
    image_desktop: desktop,
    image_mobile: mobile,
    image_desktop_description: desktopAlt,
    image_mobile_description: mobileAlt,
    top_margin: topMargin,
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
          loading="lazy"
          decoding="async"
          className="w-full rounded-lg object-cover"
        />
      </picture>
    </div>
  );
});
