import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { TagGroupFilters } from '../../../app/components/product/TagGroupFilters';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k }),
}));

const groups = [
  {
    group: 'Age Range',
    options: [
      { key: 'Age Range-7 months - 5 years', label: '7 months - 5 years' },
      { key: 'Age Range-5-8 years', label: '5-8 years' },
    ],
  },
  { group: 'Color', options: [{ key: 'Color-Natural wood', label: 'Natural wood' }] },
];

describe('TagGroupFilters', () => {
  it('renders nothing when there are no groups', () => {
    const { container } = render(
      <TagGroupFilters groups={[]} selected={[]} onToggle={() => {}} onClear={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders one fieldset per group with its options', () => {
    const { container, getByText } = render(
      <TagGroupFilters groups={groups} selected={[]} onToggle={() => {}} onClear={() => {}} />
    );
    expect(container.querySelectorAll('fieldset')).toHaveLength(2);
    expect(getByText('Age Range')).toBeTruthy();
    expect(getByText('5-8 years')).toBeTruthy();
  });

  it('checks exactly the selected options', () => {
    const { getByLabelText } = render(
      <TagGroupFilters
        groups={groups}
        selected={['Age Range-5-8 years']}
        onToggle={() => {}}
        onClear={() => {}}
      />
    );
    expect((getByLabelText('5-8 years') as HTMLInputElement).checked).toBe(true);
    expect((getByLabelText('7 months - 5 years') as HTMLInputElement).checked).toBe(false);
  });

  it('calls onToggle with the option key when clicked', () => {
    const onToggle = vi.fn();
    const { getByLabelText } = render(
      <TagGroupFilters groups={groups} selected={[]} onToggle={onToggle} onClear={() => {}} />
    );
    fireEvent.click(getByLabelText('Natural wood'));
    expect(onToggle).toHaveBeenCalledWith('Color-Natural wood');
  });

  it('shows "clear all" only when something is selected, and calls onClear', () => {
    const onClear = vi.fn();
    const { queryByText, getByText, rerender } = render(
      <TagGroupFilters groups={groups} selected={[]} onToggle={() => {}} onClear={onClear} />
    );
    expect(queryByText('Clear all')).toBeNull();

    rerender(
      <TagGroupFilters
        groups={groups}
        selected={['Color-Natural wood']}
        onToggle={() => {}}
        onClear={onClear}
      />
    );
    fireEvent.click(getByText('Clear all'));
    expect(onClear).toHaveBeenCalled();
  });
});
