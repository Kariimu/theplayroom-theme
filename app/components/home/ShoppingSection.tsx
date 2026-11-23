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

function ShoppingCard({ item, className = '' }: { item: ShoppingItem; className?: string }) {
  const link = resolveLink(item.url);
  const alt = item.title || item.subtitle || '';
  const cardClassName = `group overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${className}`;
  const content = (
    <>
      {item.image && (
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={getCdnImageUrl(item.image, { width: 500 }) ?? item.image}
            width="500"
            height="375"
            alt={alt}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
      )}
      {(item.title || item.subtitle) && (
        <div className="p-6 text-center">
          {item.title && (
            // `title_type` is the dashboard's "العنوان طبيعى" ("normal title") switch —
            // on (true) must read as the plainer, smaller variant, same direction as
            // `subtitle_type` below. (Previously inverted: `true` rendered the bigger
            // "styled" look instead — flagged in TASK.md Stage 5.)
            <p
              className={
                item.title_type
                  ? 'mb-2 text-[20px] font-bold text-[#111827]'
                  : 'text-[20px] font-black text-[#111827]'
              }
            >
              {item.title}
            </p>
          )}
          {item.subtitle && (
            <p
              className={
                item.subtitle_type
                  ? 'mt-1 text-[20px] text-[#f47e4d]'
                  : 'text-[20px] font-black text-[#f47e4d]'
              }
            >
              {item.subtitle}
            </p>
          )}
        </div>
      )}
    </>
  );
  // No real destination: a plain tile (no dead `#` link), still carrying its text/image.
  return link ? (
    <Link to={link} className={cardClassName}>
      {content}
    </Link>
  ) : (
    <div className={cardClassName}>{content}</div>
  );
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
        <div className="mb-8 text-center md:mb-10">
          {title && (
            <h2 className="mb-4 text-3xl font-black text-brand-navy">{title}</h2>
          )}
          {subtitle && <p className="text-lg font-medium text-gray-500">{subtitle}</p>}
        </div>
      )}

      {/* Mobile: horizontal scroll row. Desktop: fixed 3-column grid (the
          block is always authored with 3 items; a responsive column count
          would leave empty tracks instead of filling the row). */}
      <div className="-mx-4 overflow-x-auto px-4 pb-4 scrollbar-hide md:hidden">
        <div className="flex gap-4" style={{ width: 'max-content' }}>
          {items.map((item, index) => (
            <ShoppingCard key={index} item={item} className="w-[80vw] flex-shrink-0" />
          ))}
        </div>
      </div>
      <div className="hidden md:grid md:grid-cols-3 md:gap-6 lg:gap-8">
        {items.map((item, index) => (
          <ShoppingCard key={index} item={item} />
        ))}
      </div>
    </div>
  );
});
