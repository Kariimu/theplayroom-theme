import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Product } from '@salla.sa/twilight-theme-engine/types';
import { product } from '@salla.sa/twilight-theme-engine/api/product';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { useMoney } from '@salla.sa/twilight-theme-engine/hooks/useMoney';
import { getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';
import { toIds } from '../../lib/pickerValue';
import { whatsappEnquiryHref } from '../../lib/whatsapp';

interface ModernBannerFeature {
  image?: string;
  title?: string;
  desc?: string;
}

interface ModernBannerHotspot {
  product?: unknown;
  /** `hotspots.pos_x`/`pos_y`: "from the left/top, 0–100" — always physical, not RTL/LTR-relative. */
  pos_x?: string;
  pos_y?: string;
}

export interface ModernBannerSectionProps {
  data: {
    text_icon?: string;
    title_section?: string;
    desc_section?: string;
    image?: string;
    text_on_image?: string;
    features?: ModernBannerFeature[];
    title_footer?: string;
    desc_footer?: string;
    whatsapp_msg?: string;
    whatsapp_number?: string;
    whatsapp_btn_text?: string;
    hotspots?: ModernBannerHotspot[];
    position?: number;
    [key: string]: unknown;
  };
}

/** Clamps a hotspot's `pos_x`/`pos_y` (free text in the dashboard) to a usable percentage. */
function clampPercent(value: unknown, fallback = 50): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : fallback;
}

function HotspotPrice({ item }: { item: Product }) {
  const { format } = useMoney();
  return (
    <span className="flex items-center gap-1.5 text-sm">
      <span className="font-bold text-primary">{format(item.price)}</span>
      {item.is_on_sale && <span className="opacity-60 line-through">{format(item.regular_price)}</span>}
    </span>
  );
}

/**
 * One product marker on the banner image, positioned by `pos_x`/`pos_y`
 * (always from the left/top — see {@link ModernBannerHotspot}). Desktop only,
 * as in the Twig block it replaces. The dot alone shows when its product
 * hasn't resolved yet (or was removed after the hotspot was placed); the
 * popup needs `group-hover`/`group-focus-within`, Tailwind only, no custom CSS.
 */
function Hotspot({ spot, item }: { spot: ModernBannerHotspot; item?: Product }) {
  const left = clampPercent(spot.pos_x);
  const top = clampPercent(spot.pos_y);
  const dot = (
    <span className="relative flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-lg">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-3 17v-10l9 5.146-9 4.854z" />
      </svg>
    </span>
  );

  return (
    <div
      className="absolute hidden -translate-x-1/2 -translate-y-1/2 md:block"
      style={{ left: `${left}%`, top: `${top}%` }}
    >
      {item ? (
        <Link to={item.url} className="group relative block">
          {dot}
          <span className="absolute bottom-full start-1/2 z-10 mb-2 hidden w-48 -translate-x-1/2 flex-col gap-1 rounded-lg bg-white p-2 text-start shadow-xl group-hover:flex group-focus-within:flex">
            {item.image?.url && (
              <img
                src={getCdnImageUrl(item.image.url, { width: 120 }) ?? item.image.url}
                width="60"
                height="60"
                alt=""
                loading="lazy"
                decoding="async"
                className="h-[60px] w-[60px] self-start rounded-md object-cover"
              />
            )}
            <span className="line-clamp-2 text-sm font-medium text-gray-900">{item.name}</span>
            <HotspotPrice item={item} />
          </span>
        </Link>
      ) : (
        dot
      )}
    </div>
  );
}

/**
 * `modern-banner-section` home block — the richest of the twelve: an icon +
 * heading, a banner image with up to 8 shoppable hotspots, a feature grid and
 * a footer WhatsApp CTA. The Twig block resolved each hotspot's product from
 * a merchant-duplicated `all_products` picker (the only way the old
 * settings-only theme could get full product data); here the hotspot ids are
 * fetched directly through `product.queries.list`, so `all_products` is
 * unused and the merchant no longer has to keep two pickers in sync.
 */
export function ModernBannerSection({ data }: ModernBannerSectionProps) {
  const {
    text_icon: textIcon,
    title_section: title,
    desc_section: description,
    image,
    text_on_image: textOnImage,
    features = [],
    title_footer: titleFooter,
    desc_footer: descFooter,
    whatsapp_msg: whatsappMsg,
    whatsapp_number: whatsappNumber,
    whatsapp_btn_text: whatsappBtnText,
    hotspots = [],
  } = data;

  const hotspotIds = useMemo(
    () => Array.from(new Set(hotspots.flatMap((spot) => toIds(spot.product)))),
    [hotspots]
  );

  const { data: result } = useQuery({
    ...product.queries.list({ source: 'selected', sourceValue: hotspotIds }),
    enabled: hotspotIds.length > 0,
  });
  const productsById = useMemo(() => {
    const map = new Map<number, Product>();
    result?.items.forEach((item) => map.set(Number(item.id), item));
    return map;
  }, [result]);

  const whatsappHref = whatsappEnquiryHref(whatsappNumber, whatsappMsg);

  if (!image && !title && !description && !features.length) return null;

  return (
    <div className="container">
      {(textIcon || title || description) && (
        <div className="text-center mb-8">
          {textIcon && (
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary mb-4">
              {textIcon}
            </span>
          )}
          {title && <h2 className="text-2xl md:text-4xl font-black mb-2">{title}</h2>}
          {description && <p className="opacity-70 max-w-2xl mx-auto">{description}</p>}
        </div>
      )}

      {image && (
        <div className="relative rounded-2xl overflow-hidden mb-10">
          <div className="relative aspect-video md:aspect-[21/9]">
            <img
              src={getCdnImageUrl(image, { width: 1280 }) ?? image}
              alt={title || ''}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {textOnImage && (
              <p className="absolute bottom-0 start-0 end-0 p-6 text-start text-lg font-bold text-white md:p-10 md:text-2xl">
                {textOnImage}
              </p>
            )}

            {hotspots.map((spot, index) => (
              // A static settings list with no id; see .react-doctor/false-positives.md.
              // react-doctor-disable-next-line react-doctor/no-array-index-as-key
              <Hotspot key={index} spot={spot} item={productsById.get(toIds(spot.product)[0])} />
            ))}
          </div>
        </div>
      )}

      {features.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
          {features.map((feature, index) => (
            // A static settings list with no id; see .react-doctor/false-positives.md.
            // react-doctor-disable-next-line react-doctor/no-array-index-as-key
            <div key={index} className="rounded-2xl bg-white p-5 shadow-lg text-center">
              {feature.image && (
                <img
                  src={getCdnImageUrl(feature.image, { width: 140 }) ?? feature.image}
                  width="64"
                  height="64"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-16 w-16 object-contain mx-auto mb-4"
                />
              )}
              {feature.title && <h3 className="font-bold mb-1">{feature.title}</h3>}
              {feature.desc && <p className="text-sm opacity-70">{feature.desc}</p>}
            </div>
          ))}
        </div>
      )}

      {(titleFooter || descFooter || whatsappHref) && (
        <div className="text-center">
          {titleFooter && <h3 className="text-xl md:text-3xl font-black mb-2">{titleFooter}</h3>}
          {descFooter && <p className="opacity-70 max-w-xl mx-auto mb-6">{descFooter}</p>}
          {whatsappHref && whatsappBtnText && (
            // An external link (wa.me), not internal navigation — a plain <a>,
            // same as the floating WhatsApp button and the product-card enquiry link.
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-bold text-white shadow-lg"
            >
              {whatsappBtnText}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
