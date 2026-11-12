import { memo } from 'react';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';
import { resolveLink } from '../../lib/resolveLink';

interface ShoppingItem {
  image?: string;
  title?: string;
  /** `items.title_type`: plain text instead of the default styled heading. */
  title_type?: boolean;
  subtitle?: string;
  /** `items.subtitle_type`: plain text instead of the default styled subheading. */
  subtitle_type?: boolean;
  url?: unknown;
}

export interface ShoppingSectionProps {
  data: {
    title?: string;
    subtitle?: string;
    items?: ShoppingItem[];
    position?: number;
    [key: string]: unknown;
  };
}

/**
 * `shopping1-section` home block — "Shop by type": a card grid of image +
 * title + subtitle tiles, each linking to a category or custom page. Up to
 * 10 items; each title/subtitle can be styled (default) or plain
 * (`*_type: true`), per its own toggle in the dashboard.
 */
export const ShoppingSection = memo(function ShoppingSection({ data }: ShoppingSectionProps) {
  const { title, subtitle, items = [] } = data;

  if (!items.length) return null;

  return (
    <div className="container">
      {(title || subtitle) && (
        <div className="s-block__title text-center">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {subtitle && <p className="text-sm opacity-70">{subtitle}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {items.map((item, index) => {
          const link = resolveLink(item.url);
          return (
            // A static settings list with no id; see .react-doctor/false-positives.md.
            // react-doctor-disable-next-line react-doctor/no-array-index-as-key
            <Link key={index} to={link || '#'} className="shopping-item flex flex-col gap-2">
              {item.image && (
                <img
                  src={getCdnImageUrl(item.image, { width: 500 }) ?? item.image}
                  width="500"
                  height="375"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-full aspect-[4/3] rounded-lg object-cover"
                />
              )}
              {item.title && (
                <h3
                  className={
                    item.title_type ? 'text-sm font-normal' : 'text-base font-semibold'
                  }
                >
                  {item.title}
                </h3>
              )}
              {item.subtitle && (
                <p
                  className={
                    item.subtitle_type ? 'text-xs' : 'text-sm font-medium opacity-70'
                  }
                >
                  {item.subtitle}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
});
