import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  InstallationServiceOption,
  fill,
} from '../../../app/components/product/InstallationServiceOption';
import type { PanelOption } from '../../../app/components/common/ProductOptionsPanel';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));
vi.mock('@salla.sa/twilight-theme-engine/hooks/useMoney', () => ({
  useMoney: () => ({ format: (amount: number) => <b className="money">{amount} USD</b> }),
}));

const OPTIONS = [
  { id: 7, name: 'اللون', details: [{ id: 1, name: 'Red' }] },
  {
    id: 12,
    name: 'خدمة التركيب',
    details: [
      { id: 101, name: 'الرياض', additional_price: 150 },
      { id: 102, name: 'جدة', additional_price: 200 },
      { id: 103, name: 'الدمام', additional_price: 250 },
    ],
  },
] as unknown as PanelOption[];

/** The product form as Salla renders it: the native option control, then this panel. */
function renderInForm(options: PanelOption[], native: ReactNode) {
  return render(
    <form>
      <div data-option-id="12">{native}</div>
      <InstallationServiceOption options={options} />
    </form>
  );
}

const nativeSelect = (disabled: string[] = []) => (
  <select name="options[12]" defaultValue="">
    <option value="">-</option>
    {['101', '102', '103'].map((id) => (
      <option key={id} value={id} disabled={disabled.includes(id)}>
        {id}
      </option>
    ))}
  </select>
);

const cities = (container: HTMLElement) =>
  [...container.querySelectorAll('.installation-service__pill-city')].map((el) => el.textContent);

describe('fill', () => {
  it('puts nodes and strings in place of the :placeholders', () => {
    const { container } = render(<p>{fill(':city · +:price', { city: 'Riyadh', price: <b>150</b> })}</p>);
    expect(container.textContent).toBe('Riyadh · +150');
    expect(container.querySelector('b')?.textContent).toBe('150');
  });
});

describe('InstallationServiceOption', () => {
  it('renders nothing when the product has no installation option', () => {
    const { container } = render(<InstallationServiceOption options={[OPTIONS[0]]} />);
    expect(container.querySelector('.installation-service')).toBeNull();
  });

  it('finds the option by its name and lists "No installation" plus every city with its price', () => {
    const { container } = renderInForm(OPTIONS, nativeSelect());
    expect(cities(container)).toEqual(['No installation', 'الرياض', 'جدة', 'الدمام']);
    // The price comes from the money formatter (the visitor's currency), not a hard-coded "SAR".
    expect(container.querySelectorAll('.installation-service__pill-price .money')).toHaveLength(3);
    expect(container.textContent).not.toContain('ر.س');
  });

  it('hides the native control and leaves out cities it has disabled', async () => {
    const { container } = renderInForm(OPTIONS, nativeSelect(['102']));
    await waitFor(() => expect(cities(container)).toEqual(['No installation', 'الرياض', 'الدمام']));
    expect(container.querySelector('[data-option-id="12"]')?.classList).toContain(
      'installation-service__native-hidden'
    );
  });

  it('sets the native select and fires a change when a city is picked, so the price updates', async () => {
    const { container, getByText } = renderInForm(OPTIONS, nativeSelect());
    const select = container.querySelector('select')!;
    const onChange = vi.fn();
    container.querySelector('form')!.addEventListener('change', onChange);

    fireEvent.click(getByText('جدة'));

    expect(select.value).toBe('102');
    expect(onChange).toHaveBeenCalled();
    await waitFor(() =>
      expect(container.querySelector('.installation-service__summary')?.textContent).toBe('جدة · +200 USD')
    );
  });

  it('drives a native radio group the same way', () => {
    const { container, getByText } = renderInForm(
      OPTIONS,
      <>
        {['101', '102', '103'].map((id) => (
          <input key={id} type="radio" name="options[12]" value={id} readOnly />
        ))}
      </>
    );
    fireEvent.click(getByText('الدمام'));
    const checked = container.querySelector<HTMLInputElement>('[data-option-id="12"] input:checked');
    expect(checked?.value).toBe('103');
  });
});
