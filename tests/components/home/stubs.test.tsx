import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  CUSTOM_HOME_BLOCK_KEYS,
  homeBlockStubs,
  type CustomHomeBlockKey,
} from '../../../app/components/home/stubs';
import twilight from '../../../twilight.json';

describe('home block stubs', () => {
  it('render the block key and its data keys', () => {
    const Stub = homeBlockStubs['instagram-section'];
    const { getByText, container } = render(<Stub data={{ page_name: 'x', posts: [] }} />);
    expect(getByText('instagram-section')).toBeTruthy();
    expect(getByText('data: page_name, posts')).toBeTruthy();
    expect(container.querySelector('[data-home-stub="instagram-section"]')).toBeTruthy();
  });

  it('say so when the block has no data', () => {
    const Stub = homeBlockStubs['instagram-section'];
    const { getByText } = render(<Stub />);
    expect(getByText('no data')).toBeTruthy();
  });

  it('expose exactly the remaining keys, each with a component', () => {
    expect(CUSTOM_HOME_BLOCK_KEYS).toHaveLength(1);
    expect(new Set(CUSTOM_HOME_BLOCK_KEYS).size).toBe(1);
    for (const key of CUSTOM_HOME_BLOCK_KEYS) {
      // memo() returns a component object, not a bare function — assert it renders.
      const Stub = homeBlockStubs[key as CustomHomeBlockKey];
      const { container } = render(<Stub data={{}} />);
      expect(container.querySelector(`[data-home-stub="${key}"]`)).toBeTruthy();
    }
  });

  it('each stub key matches a declared `home.<key>` component in twilight.json', () => {
    const paths = new Set(twilight.components.map((c) => c.path));
    for (const key of CUSTOM_HOME_BLOCK_KEYS) {
      expect(paths.has(`home.${key}`)).toBe(true);
    }
  });
});
