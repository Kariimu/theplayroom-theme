import { memo } from 'react';

/** Props every home block receives from the engine: the merchant's saved fields. */
export interface HomeBlockStubProps {
  data?: Record<string, unknown>;
}

/**
 * The custom home blocks declared in `twilight.json` that are not built yet.
 * Each is bound to a Stage-1 placeholder (below) so the owner can add every
 * block in the dev settings panel and confirm it renders and receives its
 * fields. The real components land in Stage 3; as each is built, remove its key
 * here and register the real one. Delete this file when the list is empty.
 */
export const CUSTOM_HOME_BLOCK_KEYS = [
  'reels-section',
  'gallery-section',
  'modern-banner-section',
  'instagram-section',
] as const;

export type CustomHomeBlockKey = (typeof CUSTOM_HOME_BLOCK_KEYS)[number];

/**
 * A visible placeholder for an unbuilt home block: shows the block's key and the
 * data keys the engine passed, so "the block renders and got its fields" is
 * checkable in the dev panel without the real UI existing yet.
 */
function createHomeBlockStub(name: CustomHomeBlockKey) {
  const Stub = memo(function HomeBlockStub({ data }: HomeBlockStubProps) {
    const keys = data ? Object.keys(data) : [];
    return (
      <section className="s-block" data-home-stub={name}>
        <p className="font-bold text-start">{name}</p>
        <p className="text-sm opacity-70 text-start">
          {keys.length ? `data: ${keys.join(', ')}` : 'no data'}
        </p>
      </section>
    );
  });
  Stub.displayName = `HomeBlockStub(${name})`;
  return Stub;
}

/** `{ 'banner-section': Stub, … }` — spread into `registerHomeComponents`. */
export const homeBlockStubs: Record<CustomHomeBlockKey, ReturnType<typeof createHomeBlockStub>> =
  Object.fromEntries(CUSTOM_HOME_BLOCK_KEYS.map((key) => [key, createHomeBlockStub(key)])) as Record<
    CustomHomeBlockKey,
    ReturnType<typeof createHomeBlockStub>
  >;
