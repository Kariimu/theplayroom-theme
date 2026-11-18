import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Features2Section } from '../../../app/components/home/Features2Section';

describe('Features2Section', () => {
  it('renders nothing with no fatures', () => {
    const { container } = render(<Features2Section data={{ fatures: [] }} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders every card with its image, title and description', () => {
    const { container } = render(
      <Features2Section
        data={{
          fatures: [
            { image: 'a.png', title: 'Solid wood', desc: 'Built to last' },
            { image: 'b.png', title: 'Non-toxic paint', desc: 'Safe for kids' },
          ],
        }}
      />
    );
    expect(container.querySelectorAll('img').length).toBe(2);
    expect(container.textContent).toContain('Solid wood');
    expect(container.textContent).toContain('Built to last');
    expect(container.textContent).toContain('Non-toxic paint');
  });

  it('skips the image when a card has none', () => {
    const { container } = render(
      <Features2Section data={{ fatures: [{ title: 'No icon', desc: 'Still shows' }] }} />
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('No icon');
  });
});
