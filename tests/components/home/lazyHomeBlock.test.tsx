import { describe, it, expect } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { lazyHomeBlock } from '../../../app/components/home/lazyHomeBlock';

function TestBlock({ data }: { data: { title: string } }) {
  return <div data-testid="test-block">{data.title}</div>;
}

describe('lazyHomeBlock', () => {
  it('renders nothing until the dynamic import resolves, then renders the real block', async () => {
    const { container, findByTestId } = render(
      (() => {
        const Lazy = lazyHomeBlock(() => Promise.resolve({ default: TestBlock }));
        return <Lazy data={{ title: 'Hello' }} />;
      })()
    );

    // Immediately after the first render, the lazy import hasn't resolved yet —
    // the Suspense fallback (null) is what shows, not the real block.
    expect(container.querySelector('[data-testid="test-block"]')).toBeNull();

    const block = await findByTestId('test-block');
    expect(block.textContent).toBe('Hello');
  });

  it('passes `priority` through to the loaded block', async () => {
    function PriorityBlock({ priority }: { data: unknown; priority?: boolean }) {
      return <div data-testid="priority">{String(priority)}</div>;
    }
    const Lazy = lazyHomeBlock(() => Promise.resolve({ default: PriorityBlock }));
    const { findByTestId } = render(<Lazy data={{}} priority />);

    await waitFor(async () => {
      expect((await findByTestId('priority')).textContent).toBe('true');
    });
  });
});
