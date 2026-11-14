import { useMemo, useState } from 'react';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';
import { BottomSheet, ScrollCarousel } from '../common';
import { resolveLink } from '../../lib/resolveLink';

interface InstagramPost {
  img?: string;
  video?: string;
  video_first?: boolean;
  desc?: string;
  like_number?: string;
  comment_number?: string;
}

export interface InstagramSectionProps {
  data: {
    page_img?: string;
    page_name?: string;
    page_link?: string;
    number_posts?: string;
    number_followers?: string;
    number_following?: string;
    follow_btn?: unknown;
    posts?: InstagramPost[];
    'showing-btn'?: unknown;
    position?: number;
    [key: string]: unknown;
  };
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function PlayBadge() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="white"
      className="absolute end-2 top-2 drop-shadow"
      aria-hidden="true"
    >
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function CommentIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

/** A post's media: the video thumbnail when `video_first` is set (muted, no autoplay — just a poster-backed preview), otherwise the image. */
function PostMedia({ post, big }: { post: InstagramPost; big?: boolean }) {
  const width = big ? 600 : 360;
  if (post.video_first && post.video) {
    return (
      <>
        <video
          src={post.video}
          poster={post.img ? getCdnImageUrl(post.img, { width }) ?? post.img : undefined}
          className="h-full w-full object-cover"
          muted
          loop
          playsInline
          preload="none"
          {...(big && { controls: true })}
        />
        {!big && <PlayBadge />}
      </>
    );
  }
  if (post.img) {
    return (
      <img
        src={getCdnImageUrl(post.img, { width }) ?? post.img}
        alt={post.desc || ''}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
    );
  }
  return null;
}

function PostTile({ post, onOpen }: { post: InstagramPost; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative aspect-square overflow-hidden"
    >
      <PostMedia post={post} />
      <span className="absolute inset-0 flex items-center justify-center gap-4 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="flex items-center gap-1 text-white text-sm font-semibold">
          <HeartIcon /> {post.like_number}
        </span>
        <span className="flex items-center gap-1 text-white text-sm font-semibold">
          <CommentIcon /> {post.comment_number}
        </span>
      </span>
    </button>
  );
}

/**
 * `instagram-section` home block — a profile mockup (avatar, handle, post
 * counts, follow CTA) with a grid of up to 20 posts; each opens a
 * {@link BottomSheet} with its full media, description and a "view on
 * Instagram" link. The Twig block hard-coded the profile URL instead of
 * reading `follow_btn`/`showing-btn` (same class of bug as the WhatsApp
 * number in `09-known-issues.md` #1) — both are wired here, falling back to
 * a URL built from `page_link` (an `@handle`) when unset.
 */
export function InstagramSection({ data }: InstagramSectionProps) {
  const { t } = useTranslation();
  const {
    page_img: avatar,
    page_name: name,
    page_link: handle,
    number_posts: posts_,
    number_followers: followers,
    number_following: following,
    follow_btn: followBtn,
    posts = [],
    'showing-btn': showingBtn,
  } = data;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleUrl = handle?.startsWith('@') ? `https://instagram.com/${handle.slice(1)}` : handle;
  const followHref = resolveLink(followBtn) || handleUrl;
  const showingHref = resolveLink(showingBtn) || handleUrl;

  const withMedia = posts.filter((post) => post.img || post.video);
  // Mobile pages through 2x2 groups (matches the reference site's own swiper of
  // 4-post pages); desktop drops the paging for one flat 5-column row.
  const pages = useMemo(() => {
    const groups: InstagramPost[][] = [];
    for (let i = 0; i < withMedia.length; i += 4) groups.push(withMedia.slice(i, i + 4));
    return groups;
  }, [withMedia]);
  if (!avatar && !name && !withMedia.length) return null;

  const openPost = openIndex != null ? withMedia[openIndex] : null;

  return (
    <div className="container">
      <div className="rounded-2xl bg-primary/5 p-6 mb-6 flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-4">
          {avatar && (
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 p-0.5">
              <img
                src={getCdnImageUrl(avatar, { width: 160 }) ?? avatar}
                width="80"
                height="80"
                alt={name || ''}
                loading="lazy"
                decoding="async"
                className="h-full w-full rounded-full border-2 border-white object-cover"
              />
            </div>
          )}
          <div className="text-start">
            {name && <h3 className="font-bold text-lg">{name}</h3>}
            {handle && <p className="text-sm opacity-70">{handle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div>
            <p className="font-bold">{posts_}</p>
            <p className="text-xs opacity-70">{t('blocks.home.instagram_posts', 'Posts')}</p>
          </div>
          <div>
            <p className="font-bold">{followers}</p>
            <p className="text-xs opacity-70">{t('blocks.home.instagram_followers', 'Followers')}</p>
          </div>
          <div>
            <p className="font-bold">{following}</p>
            <p className="text-xs opacity-70">{t('blocks.home.instagram_following', 'Following')}</p>
          </div>
        </div>

        {followHref && (
          <a
            href={followHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 px-8 py-2.5 font-semibold text-white"
          >
            <InstagramIcon />
            {t('blocks.home.instagram_follow', 'Follow us')}
          </a>
        )}
      </div>

      {withMedia.length > 0 && (
        <>
          {/* Mobile: a swipeable row of 2x2 pages (4 posts each) with prev/next
              arrows — matches the reference site's own mobile post slider
              (`s-slider-prev`/`s-slider-next`): arrows stay visible here, unlike
              every other `ScrollCarousel` row, which drops them for dots below `md`. */}
          <div className="instagram-section__pager md:hidden">
            <ScrollCarousel
              prevLabel={t('blocks.home.reviews_prev', 'Previous')}
              nextLabel={t('blocks.home.reviews_next', 'Next')}
            >
              {pages.map((page, pageIndex) => (
                // A static settings list with no id; see .react-doctor/false-positives.md.
                // react-doctor-disable-next-line react-doctor/no-array-index-as-key
                <div key={pageIndex} className="grid w-full flex-shrink-0 grid-cols-2 gap-1">
                  {page.map((post, index) => (
                    // react-doctor-disable-next-line react-doctor/no-array-index-as-key
                    <PostTile
                      key={index}
                      post={post}
                      onOpen={() => setOpenIndex(pageIndex * 4 + index)}
                    />
                  ))}
                </div>
              ))}
            </ScrollCarousel>
          </div>
          {/* Desktop: one flat row, no paging. */}
          <div className="hidden gap-1 md:grid md:grid-cols-5">
            {withMedia.map((post, index) => (
              // react-doctor-disable-next-line react-doctor/no-array-index-as-key
              <PostTile key={index} post={post} onOpen={() => setOpenIndex(index)} />
            ))}
          </div>
        </>
      )}

      {showingHref && (
        <div className="text-center mt-8">
          <a
            href={showingHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-semibold text-primary hover:underline"
          >
            <InstagramIcon />
            {t('blocks.home.instagram_show_more', 'See more on Instagram')}
          </a>
        </div>
      )}

      <BottomSheet
        open={openPost != null}
        onClose={() => setOpenIndex(null)}
        title={name || t('blocks.home.instagram_post', 'Instagram post')}
      >
        {openPost && (
          <div className="flex flex-col gap-4">
            <div className="aspect-square w-full overflow-hidden rounded-xl bg-black">
              <PostMedia post={openPost} big />
            </div>
            {openPost.desc && <p className="text-sm">{openPost.desc}</p>}
            <div className="flex items-center gap-4 border-t pt-4">
              <span className="flex items-center gap-1 text-sm">
                <HeartIcon className="text-red-500" /> {openPost.like_number}
              </span>
              <span className="flex items-center gap-1 text-sm">
                <CommentIcon className="text-gray-500" /> {openPost.comment_number}
              </span>
            </div>
            {showingHref && (
              <a
                href={showingHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 py-2.5 font-semibold text-white"
              >
                <InstagramIcon />
                {t('blocks.home.instagram_show_more', 'See more on Instagram')}
              </a>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
