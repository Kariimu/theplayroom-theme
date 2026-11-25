import type { ReactNode } from 'react';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import type { Product } from '@salla.sa/twilight-theme-engine/types';
import { useProductSpecs } from '../../hooks/useProductSpecs';
import {
  INFO_SECTIONS,
  fieldLinkUrl,
  groupProductInfo,
  hasDescriptionContent,
  isUnlabeledField,
  type InfoGroup,
  type InfoSectionKey,
} from '../../lib/productInfo';
import { splitListValue, type SpecField } from '../../lib/specs';
import { CheckIcon, ChevronDownIcon } from '../icons';
import { ProductDescription } from './ProductDetails';

const SECTION_TITLES: Record<InfoSectionKey, [string, string]> = {
  details: ['pages.products.info.details', 'Product Details'],
  specs: ['pages.products.info.specifications', 'Specifications'],
  assembly: ['pages.products.info.assembly', 'Assembly'],
  shipping: ['pages.products.info.shipping', 'Shipping & Returns'],
};

export interface ProductInfoProps {
  /**
   * `initialProduct` from the page, not the live product: a variant reload
   * replaces the live one with a response that carries neither
   * `has_metadata` nor, reliably, the description.
   */
  product: Product;
}

/**
 * The product's information as four collapsible sections under the
 * add-to-cart form (reference: the avenlur.com product page), all closed on
 * load:
 *
 *  1. Product Details: the description, then the "features" and "uses" groups
 *  2. Specifications: for-who / material / box contents, the "note" group,
 *     and any custom-field group the theme doesn't know by name
 *  3. Assembly: the installation guide (a file link) and installation service
 *  4. Shipping & Returns: shipping details and the return/exchange policy
 *
 * The merchant's custom-field groups stay as they are in the dashboard;
 * `groupProductInfo` (`app/lib/productInfo.ts`) decides which section each
 * one shows in. Native `<details>`: keyboard and screen-reader accessible
 * with no script, and the description is in the server HTML even while
 * closed. The custom fields load client-side (no server metadata API, Phase
 * 0), so sections 2-4 appear once that call returns; a section with nothing
 * in it is not rendered.
 */
export function ProductInfo({ product }: ProductInfoProps) {
  const { t } = useTranslation();
  const { sections } = useProductSpecs(Number(product.id), product.has_metadata);
  const groups = groupProductInfo(sections);
  const hasDescription = hasDescriptionContent(product.description);

  const bodies: Partial<Record<InfoSectionKey, ReactNode>> = {};
  for (const key of INFO_SECTIONS) {
    const sectionGroups = groups[key];
    const description =
      key === 'details' && hasDescription ? (
        <ProductDescription product={product} expanded className="product-info__description" />
      ) : null;
    if (!description && !sectionGroups.length) continue;
    bodies[key] = (
      <>
        {description}
        {sectionGroups.map((group, index) => (
          <InfoGroupBlock key={`${group.name}-${index}`} group={group} />
        ))}
      </>
    );
  }

  const visible = INFO_SECTIONS.filter((key) => bodies[key]);
  if (!visible.length) return null;

  return (
    <div className="product-info">
      {visible.map((key) => {
        const [titleKey, fallback] = SECTION_TITLES[key];
        return (
          <details key={key} className={`product-info__item product-info__item--${key} group`}>
            <summary className="product-info__summary">
              <span className="product-info__title">{t(titleKey, fallback)}</span>
              <ChevronDownIcon
                className="product-info__chevron group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="product-info__body">{bodies[key]}</div>
          </details>
        );
      })}
    </div>
  );
}

/** One custom-field group: its name as a sub-heading (not for the facts group), then its fields. */
function InfoGroupBlock({ group }: { group: InfoGroup }) {
  return (
    <div className="product-info__group">
      {!group.isFacts && group.name && <h3 className="product-info__group-title">{group.name}</h3>}
      {group.fields.map((field, index) =>
        isUnlabeledField(field) ? (
          <div key={index} className="product-info__text">
            <FieldValue field={field} />
          </div>
        ) : (
          <div key={index} className="product-info__row">
            <span className="product-info__label">{field.name}</span>
            <span className="product-info__value">
              <FieldValue field={field} />
            </span>
          </div>
        )
      )}
    </div>
  );
}

/**
 * A field's value: a link for a file or web address, a checklist when the
 * merchant separated items with `|` (docs/DATA-ENTRY.md), otherwise plain
 * text. Values are rendered as text, never as HTML.
 */
function FieldValue({ field }: { field: SpecField }) {
  const { t } = useTranslation();
  const url = fieldLinkUrl(field);
  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="product-info__link">
        {t('pages.products.info.open_file', 'Open file')}
      </a>
    );
  }

  const lines = splitListValue(field.value ?? '');
  if (lines.length > 1) {
    return (
      <ul className="product-info__list">
        {lines.map((line, index) => (
          <li key={index}>
            <CheckIcon className="product-info__check" aria-hidden="true" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    );
  }
  return <>{lines[0]}</>;
}
