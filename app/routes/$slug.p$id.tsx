import { createFileRoute } from '@tanstack/react-router';
import { Product } from '@salla.sa/twilight-theme-engine/routes/product';
import { ProductDetailSkeleton } from '@salla.sa/twilight-theme-engine/skeleton';
import { withHead, getTwilightContext } from '@salla.sa/twilight-theme-engine/tanstack';
import { home } from '@salla.sa/twilight-theme-engine/api/home';
import { ProductPage, type ProductPageWithFaq } from '../components/product/ProductPage';
import { redirectHomeIfNotFound } from '../lib/productNotFound';
import { buildFaqJsonLd } from '../lib/faqJsonLd';
import { devPreviewBlocks } from '../lib/homeBlocks';
import { hasFeatureTags, productFeatures, type ProductFeature } from '../lib/productFeatures';

export const Route = createFileRoute('/{-$locale}/$slug/p{$id}')({
  loader: async ({ params, preload }): Promise<ProductPageWithFaq> => {
    // Keep the product's own category trail instead of the page the visitor came from.
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage?.removeItem('breadcrumb-referrer');
      }
    } catch {
      /* private mode */
    }
    try {
      return await Product.loader(
        { params: { id: params.id }, locale: params.locale },
        async (data) => {
          const { queryClient, locale } = getTwilightContext();
          const [storeComponents, featureLibrary, previewComponents] = await Promise.all([
            queryClient.ensureQueryData(home.queries.components()),
            // Only a product with a `feature-` tag pays for the blog lookup. A
            // failed or missing library never breaks the product page.
            hasFeatureTags(data.product.tags)
              ? queryClient
                  .ensureQueryData(productFeatures.queries.library(locale))
                  .catch((): ProductFeature[] => [])
              : Promise.resolve(undefined),
            // `pnpm dev` only: the dev panel's home layout, when its overrides
            // are on, so blocks added there (FAQ, in-use gallery) show here too.
            devPreviewBlocks(),
          ]);
          const faqComponents = previewComponents ?? storeComponents;
          return { faqComponents, featureLibrary };
        }
      );
    } catch (error) {
      // Hidden or deleted product: home page with a "Page not found" toast, not the 404 page.
      return redirectHomeIfNotFound(error, { locale: params.locale, preload });
    }
  },
  head: withHead<ProductPageWithFaq>(Product, (result, ctx, data) => {
    const existing = Array.isArray(result.jsonLd)
      ? result.jsonLd
      : result.jsonLd
        ? [result.jsonLd]
        : [];
    const faq = result.canonical
      ? buildFaqJsonLd(data.faqComponents, ctx.locale, result.canonical)
      : undefined;
    return faq ? { ...result, jsonLd: [...existing, faq] } : result;
  }),
  pendingComponent: () => <ProductDetailSkeleton />,
  component: ProductComponent,
});

function ProductComponent() {
  const data: ProductPageWithFaq = Route.useLoaderData();
  // Remount for each product so the previous product's state resets.
  return <ProductPage key={data.product.id} {...data} />;
}
