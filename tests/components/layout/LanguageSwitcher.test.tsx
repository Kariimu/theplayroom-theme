import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import {
  LanguageSwitcher,
  otherLanguageHref,
} from '../../../app/components/layout/LanguageSwitcher';

let store: { settings?: { is_multilingual?: boolean } } | undefined = {
  settings: { is_multilingual: true },
};
let locale = 'ar';
let native = false;
let location = { pathname: '/ar/toys/c123', searchStr: '?page=2' };

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k, locale }),
}));
vi.mock('@salla.sa/twilight-theme-engine/providers', () => ({
  useTwilight: () => ({ store }),
}));
vi.mock('@salla.sa/twilight-theme-engine/native-app', () => ({
  isNativeApp: () => native,
}));
vi.mock('@tanstack/react-router', () => ({
  useRouterState: ({ select }: { select: (s: { location: typeof location }) => unknown }) =>
    select({ location }),
}));

const openStoreSwitcher = vi.fn();
vi.mock('../../../app/lib/storeSwitchers', () => ({
  openStoreSwitcher: (...args: unknown[]) => openStoreSwitcher(...args),
}));

beforeEach(() => {
  store = { settings: { is_multilingual: true } };
  locale = 'ar';
  native = false;
  location = { pathname: '/ar/toys/c123', searchStr: '?page=2' };
  openStoreSwitcher.mockClear();
});

describe('otherLanguageHref', () => {
  it('swaps the language prefix, never stacking both', () => {
    expect(otherLanguageHref('/ar/toys/c123', '', 'en')).toBe('/en/toys/c123');
    expect(otherLanguageHref('/en', '', 'ar')).toBe('/ar');
    expect(otherLanguageHref('/ar/', '?q=1', 'en')).toBe('/en?q=1');
    expect(otherLanguageHref('/cart', '', 'en')).toBe('/en/cart');
  });
});

describe('LanguageSwitcher', () => {
  it('renders nothing when the store is not multilingual', () => {
    store = { settings: { is_multilingual: false } };
    const { container } = render(<LanguageSwitcher />);
    expect(container.firstChild).toBeNull();
  });

  it('on the Arabic store, links straight to the same page in English, named EN / English', () => {
    const { getByRole, getByText } = render(<LanguageSwitcher />);
    const link = getByRole('link');
    expect(link.getAttribute('href')).toBe('/en/toys/c123?page=2');
    expect(getByText('EN')).toBeTruthy();
    expect(getByText('English')).toBeTruthy();
  });

  it('on the English store, links to Arabic', () => {
    locale = 'en';
    location = { pathname: '/en', searchStr: '' };
    const { getByRole, getByText } = render(<LanguageSwitcher />);
    expect(getByRole('link').getAttribute('href')).toBe('/ar');
    expect(getByText('AR')).toBeTruthy();
  });

  it('stores the choice in the s-lang cookie, as Salla\'s localization modal does', () => {
    const set = vi.fn();
    (window as unknown as { salla: unknown }).salla = { cookie: { set } };
    const { getByRole } = render(<LanguageSwitcher />);
    const link = getByRole('link');
    link.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(link);
    expect(set).toHaveBeenCalledWith('s-lang', 'en');
    expect(openStoreSwitcher).not.toHaveBeenCalled();
  });

  it("opens the app's own language sheet inside the Salla app", () => {
    native = true;
    const { getByRole } = render(<LanguageSwitcher />);
    fireEvent.click(getByRole('link'));
    expect(openStoreSwitcher).toHaveBeenCalledWith('language');
  });
});
