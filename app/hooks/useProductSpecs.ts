import { useEffect, useState } from 'react';
import { sectionsFromMetadataValues, type SpecSection } from '../lib/specs';

type FetchValues = (entity: string, ids: number | number[]) => Promise<{ data: unknown }>;

/**
 * The parts of the SDK this hook uses; not in the engine's ambient types.
 * `api.metadata.fetchValues` is the call `<salla-metadata>` itself makes
 * (`Salla.api.metadata.fetchValues(entity, id)`), and the one that exists on
 * this storefront: there is no top-level `salla.metadata` here.
 */
type SpecsSdk = {
  onReady?: () => Promise<unknown>;
  api?: { metadata?: { fetchValues?: FetchValues } };
  metadata?: { fetchValues?: FetchValues };
};

/**
 * Every custom-field group of the product (`product.has_metadata`), fetched
 * the same way `<salla-metadata>` does, so the product-info sections
 * (`ProductInfo`) can sort and draw them themselves. Client-only, like all
 * specs data (docs/MIGRATION-PLAN.md §5B): empty on the server and until the
 * call resolves. Waits for `salla.onReady()` first, since the SDK may still
 * be booting when the page mounts. A product without `has_metadata` never
 * fetches; a failed call leaves it empty.
 */
export function useProductSpecs(
  productId: number,
  hasMetadata: boolean | undefined
): { sections: SpecSection[]; isLoading: boolean } {
  const [sections, setSections] = useState<SpecSection[]>([]);
  const [isLoading, setIsLoading] = useState(!!hasMetadata);

  useEffect(() => {
    if (!hasMetadata) {
      setSections([]);
      setIsLoading(false);
      return;
    }
    let alive = true;
    setIsLoading(true);

    const load = async () => {
      const sdk = window.salla as (typeof window.salla & SpecsSdk) | undefined;
      if (!sdk) return [];
      await sdk.onReady?.();
      // called on their owner objects, so an SDK method that uses `this` keeps it
      const response = sdk.api?.metadata?.fetchValues
        ? await sdk.api.metadata.fetchValues('product', productId)
        : await sdk.metadata?.fetchValues?.('product', [productId]);
      return sectionsFromMetadataValues(response?.data, productId);
    };

    load()
      .then((result) => {
        if (alive) setSections(result);
      })
      .catch(() => {
        if (alive) setSections([]);
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [productId, hasMetadata]);

  return { sections, isLoading };
}
