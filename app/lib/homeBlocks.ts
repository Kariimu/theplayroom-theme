// app/lib/homeBlocks.ts
import type { HomeComponentData } from '@salla.sa/twilight-theme-engine/types';

/**
 * Reading a home block's data outside the home page (the product page reads
 * the FAQ and in-use gallery blocks, D2 pattern).
 *
 * `home.queries.components()` returns the raw API shape: `path` keeps its
 * `home.` prefix (`home.common-questions-section`) and the block's field
 * values sit flat on the block, not under `component`. The engine's own home
 * loader strips the prefix before rendering; anything else that reads the raw
 * list has to do the same, or it never finds the block.
 */

/** `home.common-questions-section` → `common-questions-section` (same rule as the engine). */
export const homeBlockPath = (path: string | null | undefined) => (path ?? '').replace(/^home\./, '');

/**
 * The field values of the first block at `path` (with or without `home.`), or
 * undefined. Reads them flat off the block, or from `component` when a source
 * nests them there.
 */
export function findHomeBlock(
  components: readonly HomeComponentData[] | null | undefined,
  path: string
): Record<string, unknown> | undefined {
  const wanted = homeBlockPath(path);
  const block = components?.find((c) => homeBlockPath(c?.path) === wanted);
  if (!block) return undefined;
  const nested = block.component;
  return nested && typeof nested === 'object' && !Array.isArray(nested)
    ? (nested as Record<string, unknown>)
    : (block as Record<string, unknown>);
}

interface PreviewLayoutBlock {
  path?: string;
  fields?: Record<string, unknown>;
}

export interface PreviewFile {
  enabled?: boolean;
  layout?: PreviewLayoutBlock[];
}

/**
 * The dev panel's home layout (`twilight.preview.json`) as home blocks, or
 * null when its overrides are off. Same mapping as the engine's dev home page
 * (`{ ...fields, path }`), so the product page sees what the home page shows.
 */
export function previewLayoutBlocks(file: PreviewFile | null | undefined): HomeComponentData[] | null {
  if (!file?.enabled || !Array.isArray(file.layout)) return null;
  return file.layout
    .filter((block) => typeof block?.path === 'string')
    .map((block) => ({ ...(block.fields ?? {}), path: homeBlockPath(block.path) }) as HomeComponentData);
}

/**
 * `pnpm dev` only: the dev panel's layout when its overrides are on. Blocks
 * added in the dev panel live in `twilight.preview.json`, never in the store
 * API, and the engine only swaps them in on the home page (its hook for that
 * is not public). Without this the product page could never be tested
 * against a block that hasn't been pushed to the store yet. The whole branch
 * is dropped from production builds.
 */
export async function devPreviewBlocks(): Promise<HomeComponentData[] | null> {
  if (import.meta.env.DEV) {
    const files = import.meta.glob<PreviewFile>('/twilight.preview.json', { import: 'default' });
    const load = Object.values(files)[0];
    if (!load) return null;
    try {
      return previewLayoutBlocks(await load());
    } catch {
      return null;
    }
  }
  return null;
}
