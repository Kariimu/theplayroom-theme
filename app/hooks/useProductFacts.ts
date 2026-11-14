import { useEffect, useState } from 'react';
import {
  FACTS_SECTION_NAMES,
  extractFacts,
  findSection,
  sectionsFromMetadataValues,
  type FactKey,
} from '../lib/specs';

/** `window.salla.metadata` isn't in the engine's ambient types (sdk/metadata.md documents it, the engine package doesn't ship its shape). */
type MetadataBridge = {
  fetchValues?: (entity: string, ids: number | number[]) => Promise<{ data: unknown }>;
};

/**
 * The product's "تفاصيل المنتج" / "Product Details" facts (`app/lib/specs.ts`),
 * fetched through `Salla.metadata.fetchValues` rather than the
 * `<salla-metadata>` web component, so a compact facts row (`ProductFacts`)
 * can render independently of the generic specs accordion (`ProductMetadata`).
 * Client-only, like all specs data (docs/MIGRATION-PLAN.md §5B); a product
 * without `has_metadata` never fetches.
 */
export function useProductFacts(
  productId: number,
  hasMetadata: boolean | undefined
): { facts: Partial<Record<FactKey, string>>; isLoading: boolean } {
  const [facts, setFacts] = useState<Partial<Record<FactKey, string>>>({});
  const [isLoading, setIsLoading] = useState(!!hasMetadata);

  useEffect(() => {
    if (!hasMetadata) {
      setFacts({});
      setIsLoading(false);
      return;
    }
    let alive = true;
    setIsLoading(true);
    const metadata = (
      window.salla as (typeof window.salla & { metadata?: MetadataBridge }) | undefined
    )?.metadata;
    Promise.resolve(metadata?.fetchValues?.('product', [productId]))
      .then((result) => {
        if (!alive) return;
        const sections = sectionsFromMetadataValues(result?.data, productId);
        setFacts(extractFacts(findSection(sections, FACTS_SECTION_NAMES)));
      })
      .catch(() => {
        if (alive) setFacts({});
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [productId, hasMetadata]);

  return { facts, isLoading };
}
