import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { LanguageSwitcher } from '../../../app/components/layout/LanguageSwitcher';

let store: { settings?: { is_multilingual?: boolean } } | undefined = {
  settings: { is_multilingual: true },
};

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k, languageName: 'العربية' }),
}));
vi.mock('@salla.sa/twilight-theme-engine/providers', () => ({
  useTwilight: () => ({ store }),
}));

const openStoreSwitcher = vi.fn();
vi.mock('../../../app/lib/storeSwitchers', () => ({
  openStoreSwitcher: (...args: unknown[]) => openStoreSwitcher(...args),
}));

describe('LanguageSwitcher', () => {
  it('renders nothing when the store is not multilingual', () => {
    store = { settings: { is_multilingual: false } };
    const { container } = render(<LanguageSwitcher />);
    expect(container.firstChild).toBeNull();
  });

  it('shows the current language name and opens the language switcher on click', () => {
    store = { settings: { is_multilingual: true } };
    const { getByText, getByRole } = render(<LanguageSwitcher />);
    expect(getByText('العربية')).toBeTruthy();
    fireEvent.click(getByRole('button'));
    expect(openStoreSwitcher).toHaveBeenCalledWith('language');
  });
});
