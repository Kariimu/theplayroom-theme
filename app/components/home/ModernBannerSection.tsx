import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Product } from '@salla.sa/twilight-theme-engine/types';
import { product } from '@salla.sa/twilight-theme-engine/api/product';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useMoney } from '@salla.sa/twilight-theme-engine/hooks/useMoney';
import { getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';
import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import { toIds } from '../../lib/pickerValue';
import { cleanWhatsappNumber, whatsappEnquiryHref } from '../../lib/whatsapp';

interface ModernBannerFeature {
  image?: string;
  title?: string;
  desc?: string;
}

interface ModernBannerHotspot {
  product?: unknown;
  /** `hotspots.pos_x`/`pos_y`: "from the left/top, 0–100" — always physical, not RTL/LTR-relative. */
  pos_x?: string | number;
  pos_y?: string | number;
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

/** Clamps a hotspot's `pos_x`/`pos_y` (a number field; older saves are text) to a usable percentage. */
function clampPercent(value: unknown, fallback = 50): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : fallback;
}

function HotspotPrice({ item }: { item: Product }) {
  const { format } = useMoney();
  return (
    <span className="hotspot-popup__prices">
      <span className="hotspot-popup__price">{format(item.price)}</span>
      {item.is_on_sale && <span className="hotspot-popup__old-price">{format(item.regular_price)}</span>}
    </span>
  );
}

type FlipClass = '' | 'hotspot-dot--flip-left' | 'hotspot-dot--flip-right';

/** Space the card needs beside / above the pin before it would be clipped by the banner. */
const FLIP_X_PX = 130;
const FLIP_Y_PX = 150;

/**
 * One product pin on the banner image, positioned by `pos_x`/`pos_y` (always
 * from the left/top — see {@link ModernBannerHotspot}). Desktop only, as in
 * the Twig block. Hover or focus fades in a product card that links to the
 * product page (styles in `hotspots.scss`). The pin alone shows when its
 * product hasn't resolved (or was removed after the hotspot was placed).
 *
 * The banner frame is `overflow-hidden`, so on hover/focus the pin measures
 * itself against it and flips the card sideways or below when it would be
 * cut off — the Twig block did the same against the window on load/resize.
 */
function Hotspot({ spot, item }: { spot: ModernBannerHotspot; item?: Product }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [flipX, setFlipX] = useState<FlipClass>('');
  const [flipBottom, setFlipBottom] = useState(false);
  const left = clampPercent(spot.pos_x);
  const top = clampPercent(spot.pos_y);

  const placeCard = () => {
    const dot = ref.current;
    const frame = dot?.closest('.modern-banner__frame');
    if (!dot || !frame) return;
    const d = dot.getBoundingClientRect();
    const f = frame.getBoundingClientRect();
    setFlipX(
      d.left - f.left < FLIP_X_PX
        ? 'hotspot-dot--flip-left'
        : f.right - d.right < FLIP_X_PX
          ? 'hotspot-dot--flip-right'
          : ''
    );
    setFlipBottom(d.top - f.top < FLIP_Y_PX);
  };

  return (
    <div
      ref={ref}
      className={`hotspot-dot hidden md:block ${flipX}${flipBottom ? ' hotspot-dot--flip-bottom' : ''}`}
      style={{ left: `${left}%`, top: `${top}%` }}
      onMouseEnter={item ? placeCard : undefined}
      onFocus={item ? placeCard : undefined}
    >
      <span className="hotspot-dot__ring" aria-hidden="true" />
      <span className="hotspot-dot__btn" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
          <path d="M20 3v4" />
          <path d="M22 5h-4" />
          <path d="M4 17v2" />
          <path d="M5 18H3" />
        </svg>
      </span>
      {item && (
        <Link to={item.url} className="hotspot-popup">
          <span className="hotspot-popup__inner">
            {item.image?.url && (
              <img
                src={getCdnImageUrl(item.image.url, { width: 150 }) ?? item.image.url}
                width="56"
                height="56"
                alt=""
                loading="lazy"
                decoding="async"
                className="hotspot-popup__img"
              />
            )}
            <span className="hotspot-popup__body">
              <span className="hotspot-popup__name">{item.name}</span>
              <HotspotPrice item={item} />
            </span>
            <svg className="hotspot-popup__link-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 3h6v6" />
              <path d="M10 14 21 3" />
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            </svg>
          </span>
          <span className="hotspot-popup__footer">
            {t('blocks.home.click_to_view_product', 'Click to view product')}
          </span>
        </Link>
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

  // The block's own number, else the store's `whatsapp_number` setting, so the
  // merchant does not have to type the same number twice.
  const { theme } = useTwilight();
  const storeWhatsapp = (theme?.settings as { whatsapp_number?: string | number } | undefined)?.whatsapp_number;
  const whatsappHref = whatsappEnquiryHref(cleanWhatsappNumber(whatsappNumber) || storeWhatsapp, whatsappMsg);

  if (!image && !title && !description && !features.length) return null;

  return (
    <div className="container">
      {(textIcon || title || description) && (
        <div className="text-center mb-8">
          {textIcon && (
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[color-mix(in_oklab,var(--color-primary)_10%,transparent)] px-4 py-2 text-[18px] font-bold text-primary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10 12h4" />
                <path d="M10 8h4" />
                <path d="M14 21v-3a2 2 0 0 0-4 0v3" />
                <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
                <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
              </svg>
              {textIcon}
            </span>
          )}
          {title && <h2 className="mb-2 text-[30px] font-black md:text-[36px]">{title}</h2>}
          {description && <p className="mx-auto max-w-2xl text-lg opacity-70 md:text-xl">{description}</p>}
        </div>
      )}

      {image && (
        <div className="modern-banner__frame relative mb-10 overflow-hidden rounded-2xl">
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
