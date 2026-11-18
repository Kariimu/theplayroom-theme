import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CommonQuestionsSection } from '../../../app/components/home/CommonQuestionsSection';

describe('CommonQuestionsSection', () => {
  it('renders nothing with no questions', () => {
    const { container } = render(<CommonQuestionsSection data={{ questions: [] }} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a title when provided', () => {
    const { container } = render(
      <CommonQuestionsSection
        data={{ title_section: 'FAQ', questions: [{ title: 'Q1', desc: 'A1' }] }}
      />
    );
    expect(container.querySelector('h2')?.textContent).toBe('FAQ');
  });

  it('renders one collapsed <details> per question, each with its answer', () => {
    const { container } = render(
      <CommonQuestionsSection
        data={{
          questions: [
            { title: 'Do you ship internationally?', desc: 'Yes, worldwide.' },
            { title: 'What is the warranty?', desc: '2 years.' },
          ],
        }}
      />
    );
    const details = container.querySelectorAll('details');
    expect(details.length).toBe(2);
    details.forEach((d) => expect(d.hasAttribute('open')).toBe(false));
    expect(container.querySelector('summary')?.textContent).toBe('Do you ship internationally?');
    expect(container.textContent).toContain('Yes, worldwide.');
  });

  it('skips a question with no title', () => {
    const { container } = render(
      <CommonQuestionsSection data={{ questions: [{ desc: 'orphaned answer' }] }} />
    );
    expect(container.querySelectorAll('details').length).toBe(0);
  });

  it('renders a question with no answer, just no answer paragraph', () => {
    const { container } = render(
      <CommonQuestionsSection data={{ questions: [{ title: 'Q only' }] }} />
    );
    expect(container.querySelector('summary')?.textContent).toBe('Q only');
    expect(container.querySelector('.common-questions__answer')).toBeNull();
  });
});
