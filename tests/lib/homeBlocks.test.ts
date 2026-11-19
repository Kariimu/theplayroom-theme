import { describe, it, expect } from 'vitest';
import type { HomeComponentData } from '@salla.sa/twilight-theme-engine/types';
import { findHomeBlock, homeBlockPath, previewLayoutBlocks } from '../../app/lib/homeBlocks';

const blocks = (...list: Record<string, unknown>[]) => list as unknown as HomeComponentData[];

describe('homeBlockPath', () => {
  it('strips only a leading home. prefix', () => {
    expect(homeBlockPath('home.common-questions-section')).toBe('common-questions-section');
    expect(homeBlockPath('common-questions-section')).toBe('common-questions-section');
    expect(homeBlockPath('my-home.block')).toBe('my-home.block');
    expect(homeBlockPath(undefined)).toBe('');
  });
});

describe('findHomeBlock', () => {
  it('reads the raw API shape: home. prefix, fields flat on the block', () => {
    const data = findHomeBlock(
      blocks(
        { path: 'home.banner-section', image_desktop: 'x' },
        { path: 'home.common-questions-section', title_section: 'FAQ', questions: [{ title: 'Q' }] }
      ),
      'common-questions-section'
    );
    expect(data?.title_section).toBe('FAQ');
    expect(data?.questions).toEqual([{ title: 'Q' }]);
  });

  it('reads fields nested under component, and a prefixed lookup path', () => {
    const data = findHomeBlock(
      blocks({ path: 'common-questions-section', component: { questions: [] } }),
      'home.common-questions-section'
    );
    expect(data).toEqual({ questions: [] });
  });

  it('is undefined when the block is missing', () => {
    expect(findHomeBlock(blocks({ path: 'home.other' }), 'common-questions-section')).toBeUndefined();
    expect(findHomeBlock(undefined, 'common-questions-section')).toBeUndefined();
  });
});

describe('previewLayoutBlocks', () => {
  const layout = [
    { id: 'b-1', path: 'product-usage-gallery', fields: { items: [{ key: 'a' }] } },
    { id: 'b-2', path: 'home.common-questions-section', fields: { questions: [] } },
  ];

  it('maps the dev panel layout to blocks when overrides are on', () => {
    expect(previewLayoutBlocks({ enabled: true, layout })).toEqual([
      { items: [{ key: 'a' }], path: 'product-usage-gallery' },
      { questions: [], path: 'common-questions-section' },
    ]);
  });

  it('is null when overrides are off or there is no layout', () => {
    expect(previewLayoutBlocks({ enabled: false, layout })).toBeNull();
    expect(previewLayoutBlocks({ enabled: true })).toBeNull();
    expect(previewLayoutBlocks(undefined)).toBeNull();
  });
});
