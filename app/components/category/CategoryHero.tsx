import { Link, Image } from '@salla.sa/twilight-theme-engine/common';
import type { Category } from '@salla.sa/twilight-theme-engine/types';

export interface CategoryHeroProps {
  /** Only set for `source.type === 'categories'`; absent for every other listing source. */
  category?: Category | null;
}

/** CDN widths for the banner image. */
const BANNER_WIDTHS = [480, 768, 1200, 1600] as const;

/**
 * Category hero (`docs/MIGRATION-PLAN.md` row 6): the category's own `image`
 * and `description`, plus a card row for `sub_categories`. Deliberately has
 * no `<h1>` of its own — `ProductListPage` already renders the page's one
 * title — so it renders nothing at all for a leaf category with no image, no
 * description and no children.
 */
export function CategoryHero({ category }: CategoryHeroProps) {
  if (!category) return null;

  const { image, description, sub_categories: subCategories } = category;
  const hasSubCategories = !!subCategories?.length;

  if (!image && !description && !hasSubCategories) return null;

  return (
    <div className="category-hero">
      {image && (
        <Image
          src={image}
          alt={category.name}
          priority
          aspectRatio="21/9"
          objectFit="cover"
          srcSetWidths={BANNER_WIDTHS}
          sizes="100vw"
          className="category-hero__banner"
        />
      )}

      {description && <p className="category-hero__description">{description}</p>}

      {hasSubCategories && (
        <div className="category-hero__subcats">
          {subCategories!.map((sub) => (
            <Link key={sub.id} to={sub.url} className="category-hero__subcat">
              {sub.image ? (
                <Image
                  src={sub.image}
                  alt={sub.name}
                  aspectRatio="1/1"
                  objectFit="cover"
                  srcSetWidths={[80, 160]}
                  sizes="80px"
                  className="category-hero__subcat-image"
                />
              ) : (
                <span className="category-hero__subcat-initial" aria-hidden="true">
                  {sub.name.charAt(0)}
                </span>
              )}
              <span className="category-hero__subcat-name">{sub.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
