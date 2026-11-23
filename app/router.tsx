import { lazy } from 'react';
import { createRouter } from '@salla.sa/twilight-theme-engine/tanstack';
import { registry } from '@salla.sa/twilight-theme-engine';
import {
  registerHomeComponents,
  registerHomeComponentConfig,
  DefaultHomeComponents,
} from '@salla.sa/twilight-theme-engine/routes/home';
import { ProductsListSkeleton, SliderSkeleton } from '@salla.sa/twilight-components-react';
import { routeTree } from './routeTree.gen';
// `ProductsSlider` is reused directly by the product page (`ProductPage.tsx`,
// `SuggestedGames.tsx`), so lazy-loading it here wouldn't save anything there
// — every other home block below is registry-only and gets `lazyHomeBlock`.
// Imported from their own files, not the `./components/home` barrel: importing
// through the barrel pulls every sibling export's module graph in too.
import { ProductsSlider } from './components/home/ProductsSlider';
import { featuredProductsConfig } from './components/home/FeaturedProducts';
import { lazyHomeBlock } from './components/home/lazyHomeBlock';
import { registerThemeHooks } from './hooks';
import { ProductListSkeleton } from './components/product/ProductListSkeleton';

const ProductListPage = lazy(() =>
  import('./components/product/ProductListPage').then((m) => ({ default: m.ProductListPage }))
);

// Stage 11 performance audit: these were static imports from the `./components/home`
// barrel, which every route paid for through `router.tsx` — confirmed as a ~580KB
// "shared" chunk loaded on the product/cart/account pages too, none of which render a
// home block. Each import below targets its own file (not the barrel), so Vite splits
// it into its own chunk, fetched only when that block is actually registered on a page.
const BannerSection = lazyHomeBlock(() =>
  import('./components/home/BannerSection').then((m) => ({ default: m.BannerSection }))
);
const Brands = lazyHomeBlock(() =>
  import('./components/home/Brands').then((m) => ({ default: m.Brands }))
);
const CommonQuestionsSection = lazyHomeBlock(() =>
  import('./components/home/CommonQuestionsSection').then((m) => ({
    default: m.CommonQuestionsSection,
  }))
);
const CustomBrandsSection = lazyHomeBlock(() =>
  import('./components/home/CustomBrandsSection').then((m) => ({ default: m.CustomBrandsSection }))
);
const CustomTestimonials = lazyHomeBlock(() =>
  import('./components/home/CustomTestimonials').then((m) => ({ default: m.CustomTestimonials }))
);
const EnhancedSlider = lazyHomeBlock(() =>
  import('./components/home/EnhancedSlider').then((m) => ({ default: m.EnhancedSlider }))
);
const EnhancedSquareBanners = lazyHomeBlock(() =>
  import('./components/home/EnhancedSquareBanners').then((m) => ({
    default: m.EnhancedSquareBanners,
  }))
);
const FeaturedProducts = lazyHomeBlock(() =>
  import('./components/home/FeaturedProducts').then((m) => ({ default: m.FeaturedProducts }))
);
const FeaturedProductsSpecialOffer = lazyHomeBlock(() =>
  import('./components/home/FeaturedProducts').then((m) => ({
    default: m.FeaturedProductsSpecialOffer,
  }))
);
const FeaturedProductsWithSpecialProduct = lazyHomeBlock(() =>
  import('./components/home/FeaturedProducts').then((m) => ({
    default: m.FeaturedProductsWithSpecialProduct,
  }))
);
const Features2Section = lazyHomeBlock(() =>
  import('./components/home/Features2Section').then((m) => ({ default: m.Features2Section }))
);
const FeaturesSection = lazyHomeBlock(() =>
  import('./components/home/FeaturesSection').then((m) => ({ default: m.FeaturesSection }))
);
const FixedProducts = lazyHomeBlock(() =>
  import('./components/home/FixedProducts').then((m) => ({ default: m.FixedProducts }))
);
const GallerySection = lazyHomeBlock(() =>
  import('./components/home/GallerySection').then((m) => ({ default: m.GallerySection }))
);
const InstagramSection = lazyHomeBlock(() =>
  import('./components/home/InstagramSection').then((m) => ({ default: m.InstagramSection }))
);
const LatestProducts = lazyHomeBlock(() =>
  import('./components/home/LatestProducts').then((m) => ({ default: m.LatestProducts }))
);
const MainLinks = lazyHomeBlock(() =>
  import('./components/home/MainLinks').then((m) => ({ default: m.MainLinks }))
);
const ModernBannerSection = lazyHomeBlock(() =>
  import('./components/home/ModernBannerSection').then((m) => ({ default: m.ModernBannerSection }))
);
const PhotosSlider = lazyHomeBlock(() =>
  import('./components/home/PhotosSlider').then((m) => ({ default: m.PhotosSlider }))
);
const PhotosSliderWithText = lazyHomeBlock(() =>
  import('./components/home/PhotosSliderWithText').then((m) => ({
    default: m.PhotosSliderWithText,
  }))
);
const ProductsSection = lazyHomeBlock(() =>
  import('./components/home/ProductsSection').then((m) => ({ default: m.ProductsSection }))
);
const ReelsSection = lazyHomeBlock(() =>
  import('./components/home/ReelsSection').then((m) => ({ default: m.ReelsSection }))
);
const ReviewsSection = lazyHomeBlock(() =>
  import('./components/home/ReviewsSection').then((m) => ({ default: m.ReviewsSection }))
);
const ShoppingSection = lazyHomeBlock(() =>
  import('./components/home/ShoppingSection').then((m) => ({ default: m.ShoppingSection }))
);
const SliderProductsWithHeader = lazyHomeBlock(() =>
  import('./components/home/SliderProductsWithHeader').then((m) => ({
    default: m.SliderProductsWithHeader,
  }))
);
const Blog = lazyHomeBlock(() =>
  import('./components/home/Blog').then((m) => ({ default: m.Blog }))
);

// Register theme-level hooks (AddProductToast, DigitalFilesSettings, etc.)
registerThemeHooks();

registry.register('product:list-page', ProductListPage);
registry.register('product:list-skeleton', ProductListSkeleton);

// NOTE: we deliberately do NOT register `product:card`. The theme `ProductCard`
// wraps the engine `ProductCard`, which itself resolves `product:card` from the
// registry — registering the wrapper makes it re-resolve to itself and recurse
// infinitely (freezes the page when a product list mounts; the recipe warns
// "do not render the engine card inside your override"). The theme card is used
// directly in the home blocks (FeaturedProducts etc.), which is safe. A global
// override needs a from-scratch card (no engine-card wrap) — Stage 4/5, when the
// list/product pages are forked.

registerHomeComponents({
  ...DefaultHomeComponents,
  brands: Brands,
  'enhanced-slider': EnhancedSlider,
  'custom-testimonials': CustomTestimonials,
  'main-links': MainLinks,
  'square-links': MainLinks,
  // Replaces the engine Swiper with the theme's scroll carousel (home block +
  // the product page's "similar products" `best-offers-<n>-slider`).
  'products-slider': ProductsSlider,
  // Replaces the engine Swiper with the theme's scroll carousel — same
  // progress bar + arrows as testimonials/products, cards instead of a thin
  // full-width banner strip.
  'photos-slider': PhotosSlider,
  'photos-slider-with-text': PhotosSliderWithText,
  // The renderer checks `home:featured-products:<view_style>` before the bare
  // key (theme-engine `HomePageRenderer.getComponentByPath`), and
  // `...DefaultHomeComponents` above still has the engine's own component
  // registered under the three literal `styleN` variants — leaving those out
  // here would mean only view_style-less / unrecognised blocks ever reach
  // this component, and every `style1`/`style2`/`style3` block keeps
  // rendering the broken engine variants this fork exists to replace.
  'featured-products': FeaturedProducts,
  'featured-products:style1': FeaturedProducts,
  'featured-products:style2': FeaturedProducts,
  'featured-products:style3': FeaturedProducts,
  // The block's other two layouts, each its own block.
  'featured-products-special-offer': FeaturedProductsSpecialOffer,
  'featured-products-special-product': FeaturedProductsWithSpecialProduct,
  // Fork of the engine block so its grid renders the theme's ProductCard wrapper.
  'fixed-products': FixedProducts,
  // Fork of the engine's no-blocks fallback, for the same reason.
  'latest-products': LatestProducts,
  'slider-products-with-header': SliderProductsWithHeader,
  'enhanced-square-banners': EnhancedSquareBanners,
  blog: Blog,
  'banner-section': BannerSection,
  'features-section': FeaturesSection,
  'features2-section': Features2Section,
  'common-questions-section': CommonQuestionsSection,
  'products-section': ProductsSection,
  'shopping1-section': ShoppingSection,
  'custom-brands-section': CustomBrandsSection,
  'reviews-section': ReviewsSection,
  'gallery-section': GallerySection,
  'modern-banner-section': ModernBannerSection,
  'reels-section': ReelsSection,
  'instagram-section': InstagramSection,
  // Data-only block: it holds the product page's in-use gallery cards
  // (`app/lib/productUsageGallery.ts`) and draws nothing on the home page.
  // Registered so the engine doesn't show its "Unknown component" fallback.
  'product-usage-gallery': () => null,
});

// Wrapper `<section>` classes for `featured-products` — the engine only styles
// the literal `styleN` values; this covers the semantic `view_style`s too.
registerHomeComponentConfig({
  // The data-only in-use gallery block: a hidden, zero-height shell, so the
  // engine's lazy wrapper doesn't reserve its default 400px on the home page.
  'product-usage-gallery': { className: 'hidden', height: '0px', placeholder: null },
  'featured-products': featuredProductsConfig,
  'featured-products-special-offer': featuredProductsConfig,
  'featured-products-special-product': featuredProductsConfig,
  // Gray band edge to edge; the height is a card plus the heading and controls.
  blog: {
    className: 's-block s-block--blog s-block--full-bg',
    height: 'clamp(480px, 45vw, 660px)',
  },
  // A single `image_desktop` (640×427) or `image_mobile` (1200×300) banner, no
  // slider — same ratio-based clamp idea as the slider entries below, sized to
  // the container (not the full viewport) since the image sits in `.container`.
  'banner-section': {
    height: 'clamp(140px, 30vw, 427px)',
  },
  // A row of up to 4 icon+title items, 2 per row on phones, on the page
  // background, with a section heading above it.
  'features-section': {
    height: 'clamp(200px, 26vw, 300px)',
  },
  // Up to 3 larger feature cards (icon, title, description), on the page
  // background — a horizontal-scroll row on phones, a 3-col grid on desktop.
  'features2-section': {
    height: 'clamp(240px, 28vw, 330px)',
  },
  // A collapsed accordion of up to 15 Q&As; closed-row height × a handful visible.
  'common-questions-section': {
    height: '400px',
  },
  'products-section': {
    height: '450px',
    placeholder: <ProductsListSkeleton />,
  },
  // A 2–5 column card grid, up to 10 image+title+subtitle tiles.
  'shopping1-section': {
    height: 'clamp(280px, 40vw, 420px)',
  },
  // A logo row (grid or marquee), one line of ~100px-tall logos.
  'custom-brands-section': {
    height: '140px',
  },
  // A centered rating number, heading, description and CTA.
  'reviews-section': {
    height: '220px',
  },
  // Up to 5 photo tiles (2–5 columns), square on phones, portrait on desktop.
  'gallery-section': {
    height: 'clamp(260px, 36vw, 420px)',
  },
  // Header + a 16:9/21:9 banner with hotspots + a feature grid + a WhatsApp footer.
  'modern-banner-section': {
    height: 'clamp(560px, 70vw, 900px)',
  },
  // A 9:16 video row, ~260px cards plus a product footer.
  'reels-section': {
    height: '480px',
    placeholder: <SliderSkeleton />,
  },
  // Boxed, no background band, no vertical padding of its own — matches the
  // reference demo's native reviews container exactly (`s-reviews-container`:
  // transparent, 0 padding, just `max-w-4xl mx-auto` and the generic block
  // top-margin everything else gets).
  'custom-testimonials': {
    className: 's-block s-block--custom-testimonials',
  },
  // Lazy placements (blocks 4+): reserve the loaded blocks' height and show the
  // same SliderSkeleton the SSR path shows (sized in home-blocks.scss), not the
  // engine's 400px/200px defaults with mismatched skeletons (CLS on scroll-in).
  'enhanced-slider': {
    height: 'calc(100vw / 2.4)', // the 12:5 slide ratio
    placeholder: <SliderSkeleton />,
    // The boxed variant (`in_container`) is capped at the container width, so
    // its skeleton must be too (home-blocks.scss) or the reservation oversizes.
    className: (data) =>
      `s-block s-block--enhanced-slider${data.in_container ? ' s-block--enhanced-slider-boxed' : ''}`,
  },
  'main-links': {
    height: '112px',
    placeholder: <SliderSkeleton />,
    // Keeps the engine entry's merge classes; theme config replaces, not merges.
    className: (data) => {
      const mergeWithTop = data.merge_with_top_component;
      return [
        's-block',
        's-block--main-links',
        mergeWithTop && data.position ? 'merge-with-top-component' : '',
        !data.title && mergeWithTop ? 'merged-has-no-title' : '',
      ]
        .filter(Boolean)
        .join(' ');
    },
  },
  'square-links': {
    height: '144px', // .slide--cat-entry h-36 cards (square-links keeps the card look)
    placeholder: <SliderSkeleton />,
  },
  // The centred banner (--stage-w in home-blocks.scss, at the usual 1.7 shape)
  // plus its pager, so the real content doesn't shift the page on load.
  'photos-slider': {
    height: 'calc(min(1260px, 100vw - 3rem, max(18rem, (100vh - 14rem) * 1.7)) / 1.7 + 3.25rem)',
    placeholder: <SliderSkeleton />,
    className: (data) =>
      `s-block s-block--photos-slider${data.is_repeated ? ' repeated-block' : ''}`,
  },
  'photos-slider-with-text': {
    height: 'clamp(300px, 36vw, 470px)', // a card plus the controls row
    placeholder: <SliderSkeleton />,
    className: (data) =>
      `s-block s-block--photos-slider-with-text${data.in_container ? ' s-block--photos-slider-with-text-boxed' : ''}`,
  },
  // Profile header + a 2–5 column post grid, up to 20 square tiles.
  'instagram-section': {
    height: 'clamp(480px, 60vw, 760px)',
  },
});

// Singleton for client-side (preserves QueryClient cache across navigations)
// SSR creates fresh instances per request via getRouter()
let clientRouter: ReturnType<typeof createRouter> | null = null;

// TanStack Start expects getRouter() for SSR compatibility
export function getRouter() {
  // On client: reuse existing router to preserve QueryClient cache
  if (typeof window !== 'undefined' && clientRouter) {
    return clientRouter;
  }

  // On SSR or first client load: create new router
  const router = createRouter(routeTree);

  // Cache for client-side
  if (typeof window !== 'undefined') {
    clientRouter = router;
  }

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
