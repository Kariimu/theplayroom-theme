import { useId, useState, type ComponentType, type SVGProps } from 'react';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useProductFacts } from '../../hooks/useProductFacts';
import { UsersIcon, LeafIcon, PackageIcon, CheckIcon, ChevronDownIcon } from '../icons';
import { splitListValue, type FactKey } from '../../lib/specs';

const FACT_ICONS: Record<FactKey, ComponentType<SVGProps<SVGSVGElement>>> = {
  forWho: UsersIcon,
  material: LeafIcon,
  boxContents: PackageIcon,
};

const FACT_LABEL_KEYS: Record<FactKey, [string, string]> = {
  forWho: ['pages.products.facts.for_who', 'Who Is This For?'],
  material: ['pages.products.facts.material', 'Material'],
  boxContents: ['pages.products.facts.box_contents', 'Inner Box'],
};

const FACT_ORDER: FactKey[] = ['boxContents', 'forWho', 'material'];

export interface ProductFactsProps {
  productId: number;
  hasMetadata?: boolean;
}

/**
 * The for-who / material / box-contents facts (§5A row 65) as a compact
 * accordion above the generic specs accordion (`ProductMetadata`) — not
 * buried one click away like the rest of the product's specs. Renders
 * nothing while loading or when the product carries none of the three
 * fields under the canonical "تفاصيل المنتج" / "Product Details" group
 * (`app/lib/specs.ts`).
 *
 * Each fact expands independently (not a single-open accordion) — there are
 * only three, and a shopper may want "material" and "box contents" open at
 * once. All start collapsed.
 */
export function ProductFacts({ productId, hasMetadata }: ProductFactsProps) {
  const { t } = useTranslation();
  const { facts } = useProductFacts(productId, hasMetadata);
  const keys = FACT_ORDER.filter((key) => facts[key]);
  const [openKeys, setOpenKeys] = useState<ReadonlySet<FactKey>>(() => new Set());
  const idPrefix = useId();

  if (!keys.length) return null;

  const toggle = (key: FactKey) =>
    setOpenKeys((current) => {
      const next = new Set(current);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  return (
    <div className="product-facts space-y-4 pt-6 pb-1 text-start">
      {keys.map((key) => {
        const Icon = FACT_ICONS[key];
        const [labelKey, fallback] = FACT_LABEL_KEYS[key];
        const isOpen = openKeys.has(key);
        const contentId = `${idPrefix}-${key}`;
        return (
          <div key={key} className="product-facts__item">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={contentId}
              onClick={() => toggle(key)}
              className="product-facts__header flex w-full items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-brand-navy" aria-hidden="true" />
                <span className="text-[20px] text-[#222222] font-bold">{t(labelKey, fallback)}</span>
              </span>
              <ChevronDownIcon
                className={`h-4 w-4 shrink-0 text-brand-navy transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
            {isOpen &&
              (() => {
                const lines = splitListValue(facts[key]!);
                // A merchant separates list items with `|` (docs/DATA-ENTRY.md) — a
                // single line (no `|` in the value) stays a plain paragraph.
                return lines.length > 1 ? (
                  <ul id={contentId} className="flex flex-col space-y-1 pt-2">
                    {lines.map((line, index) => (
                      <li key={index} className="flex items-center gap-2 text-lg text-slate-500">
                        <CheckIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p id={contentId} className="pt-2 text-lg leading-relaxed text-slate-500">
                    {facts[key]}
                  </p>
                );
              })()}
          </div>
        );
      })}
    </div>
  );
}
