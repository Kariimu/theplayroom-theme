import { useState } from 'react';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { RenderWhenVisible } from '@salla.sa/twilight-theme-engine/common';
import type { ProductTag } from '@salla.sa/twilight-theme-engine/types';
import { ProductsSlider } from '../home/ProductsSlider';
import { TAG_PREFIX, tagIdFromUrl } from '../../lib/tags';

export interface SuggestedGamesProps {
  productId: number;
  tags?: ProductTag[];
}

/**
 * Products sharing this product's `set:<name>` tag (§5A row 71, 06 §7.5,
 * replaces `products_play_games`), listed by that tag's numeric id —
 * `ProductTag.id` isn't actually populated on list responses (Phase 0 §2,
 * `app/lib/tags.ts`), so falls back to parsing it from the tag's own URL.
 * No fallback setting: a product with no `set:` tag renders nothing here —
 * the page's own related-products slider already covers that case.
 */
export function SuggestedGames({ productId, tags }: SuggestedGamesProps) {
  const { t } = useTranslation();
  // `null` until the list resolves, `0` once it's known to be empty — then the
  // wrapper (`RenderWhenVisible`, `.container`) is dropped instead of left empty.
  const [count, setCount] = useState<number | null>(null);

  const setTag = tags?.find((tag) => tag.name?.toLowerCase().startsWith(TAG_PREFIX.set));
  const tagId = setTag ? setTag.id ?? tagIdFromUrl(setTag.url) : null;

  if (!tagId || count === 0) return null;

  return (
    <RenderWhenVisible estimatedHeight="0px">
      <div className="container">
        <ProductsSlider
          data={{
            products: { source: 'tags', source_value: tagId },
            title: t('pages.products.suggested_games', 'Suggested games'),
            display_all_url: '',
          }}
          excludeId={productId}
          onResolve={setCount}
        />
      </div>
    </RenderWhenVisible>
  );
}
