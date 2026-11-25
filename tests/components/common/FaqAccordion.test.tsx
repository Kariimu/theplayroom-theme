import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { FaqAccordion } from '../../../app/components/common/FaqAccordion';

describe('FaqAccordion', () => {
  it('renders nothing with no questions', () => {
    const { container } = render(<FaqAccordion questions={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders one collapsed <details> per question, each with its answer', () => {
    const { container } = render(
      <FaqAccordion
        questions={[
          { title: 'Do you ship internationally?', desc: 'Yes, worldwide.' },
          { title: 'What is the warranty?', desc: '2 years.' },
        ]}
      />
    );
    const details = container.querySelectorAll('details');
    expect(details.length).toBe(2);
    details.forEach((d) => expect(d.hasAttribute('open')).toBe(false));
    expect(container.querySelector('summary')?.textContent).toBe('Do you ship internationally?');
    expect(container.textContent).toContain('Yes, worldwide.');
  });

  it('skips a question with no title', () => {
    const { container } = render(<FaqAccordion questions={[{ desc: 'orphaned answer' }]} />);
    expect(container.querySelectorAll('details').length).toBe(0);
  });

  it('renders a question with no answer, just no answer paragraph', () => {
    const { container } = render(<FaqAccordion questions={[{ title: 'Q only' }]} />);
    expect(container.querySelector('summary')?.textContent).toBe('Q only');
    expect(container.querySelector('.common-questions__answer')).toBeNull();
  });
});
