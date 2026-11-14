import type { ComponentType, SVGProps } from 'react';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useProductFacts } from '../../hooks/useProductFacts';
import { UserIcon, DashboardSquare01Icon, NoteIcon } from '../icons';
import type { FactKey } from '../../lib/specs';

const FACT_ICONS: Record<FactKey, ComponentType<SVGProps<SVGSVGElement>>> = {
  forWho: UserIcon,
  material: DashboardSquare01Icon,
  boxContents: NoteIcon,
};

const FACT_LABEL_KEYS: Record<FactKey, [string, string]> = {
  forWho: ['pages.products.facts.for_who', 'Suitable for'],
  material: ['pages.products.facts.material', 'Material'],
  boxContents: ['pages.products.facts.box_contents', 'Box contents'],
};

const FACT_ORDER: FactKey[] = ['forWho', 'material', 'boxContents'];

export interface ProductFactsProps {
  productId: number;
  hasMetadata?: boolean;
}

/**
 * The for-who / material / box-contents facts (§5A row 65) as a compact row
 * above the generic specs accordion (`ProductMetadata`) — not buried one
 * click away like the rest of the product's specs. Renders nothing while
 * loading or when the product carries none of the three fields under the
 * canonical "تفاصيل المنتج" / "Product Details" group (`app/lib/specs.ts`).
 */
export function ProductFacts({ productId, hasMetadata }: ProductFactsProps) {
  const { t } = useTranslation();
  const { facts } = useProductFacts(productId, hasMetadata);
  const keys = FACT_ORDER.filter((key) => facts[key]);

  if (!keys.length) return null;

  return (
    <ul className="product-facts mb-5 flex flex-col gap-2">
      {keys.map((key) => {
        const Icon = FACT_ICONS[key];
        const [labelKey, fallback] = FACT_LABEL_KEYS[key];
        return (
          <li key={key} className="product-facts__row flex items-start gap-2 text-sm">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
            <p>
              <b className="font-medium text-gray-700">{t(labelKey, fallback)}</b>
              <span className="text-gray-500">
                {': '}
                {facts[key]}
              </span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}
