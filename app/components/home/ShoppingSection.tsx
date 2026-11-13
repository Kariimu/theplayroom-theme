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
        <div className="s-block__title mb-10 text-center md:mb-16">
          {title && (
            <h2 className="mb-4 text-3xl font-black text-gray-900 md:text-5xl">{title}</h2>
          )}
          {subtitle && <p className="text-lg font-medium text-gray-500 md:text-xl">{subtitle}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-5 lg:gap-8">
        {items.map((item, index) => {
          const link = resolveLink(item.url);
          return (
            // A static settings list with no id; see .react-doctor/false-positives.md.
            // react-doctor-disable-next-line react-doctor/no-array-index-as-key
            <Link
              key={index}
              to={link || '#'}
              className="group overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
            >
              {item.image && (
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={getCdnImageUrl(item.image, { width: 500 }) ?? item.image}
                    width="500"
                    height="375"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              )}
              {(item.title || item.subtitle) && (
                <div className="p-4 text-center md:p-6">
                  {item.title && (
                    <p
                      className={
                        item.title_type
                          ? 'text-sm font-normal text-gray-900'
                          : 'text-base font-black text-gray-900 md:text-xl'
                      }
                    >
                      {item.title}
                    </p>
                  )}
                  {item.subtitle && (
                    <p
                      className={
                        item.subtitle_type
                          ? 'mt-1 text-xs text-gray-500'
                          : 'mt-1 text-sm font-medium text-gray-500'
                      }
                    >
                      {item.subtitle}
                    </p>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
});
