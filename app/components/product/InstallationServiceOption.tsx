import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { matchesName } from '../../lib/specs';
import { ChevronDownIcon, WrenchIcon } from '../icons';
import type { PanelOption } from '../common/ProductOptionsPanel';

/** The merchant's own option name (free text, like a spec group's) — only Arabic
 * exists on the example product today, "Installation service" kept as a
 * candidate in case a merchant later adds the English name. */
const INSTALLATION_OPTION_NAMES = ['خدمة التركيب', 'Installation service'] as const;

/** `:city` / `:price` replaced into the locale string — this theme's own
 * interpolation convention (`ProductDetails`' `rating_summary`), not i18next's
 * `{{}}`, so every locale file keeps using the same pattern. */
const fill = (template: string, vars: Record<string, string>) =>
  Object.entries(vars).reduce((text, [key, value]) => text.replace(`:${key}`, value), template);

type Detail = NonNullable<PanelOption['details']>[number] & {
  additional_price?: number;
};

/** The field the native control actually renders for this option: a `<select>`
 * for many cities (today's data), or (if Salla ever renders few enough details
 * as radios instead) an `<input type="radio">` group. Either way the native
 * element is this component's only source of truth — read from on sync, only
 * ever written to from a pill's own click. */
function readNativeState(container: HTMLElement): { value: string; disabled: Set<string> } {
  const select = container.querySelector<HTMLSelectElement>('select');
  if (select) {
    const disabled = new Set(
      Array.from(select.querySelectorAll<HTMLOptionElement>('option[disabled]')).map(
        (o) => o.value
      )
    );
    return { value: select.value, disabled };
  }
  const radios = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
  const checked = radios.find((r) => r.checked);
  const disabled = new Set(radios.filter((r) => r.disabled).map((r) => r.value));
  return { value: checked?.value ?? '', disabled };
}

/** Sets the native control to `detailId` (`''` for "no installation") the way a
 * shopper's own click would, then fires a bubbling `change` so the form's
 * existing price-update flow (`AddToCartForm`'s `onChange` →
 * `salla.product.getPrice`) and `ProductOptionsPanel`'s own listeners both run
 * — nothing about that flow is reimplemented here. */
function writeNativeState(container: HTMLElement, detailId: string) {
  const select = container.querySelector<HTMLSelectElement>('select');
  if (select) {
    select.value = detailId;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }
  const radios = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
  const target = radios.find((r) => r.value === detailId);
  radios.forEach((r) => {
    r.checked = r === target;
  });
  (target ?? radios[0])?.dispatchEvent(new Event('change', { bubbles: true }));
}

interface PillProps {
  groupName: string;
  id: string;
  city: string;
  priceLabel: string;
  selected: boolean;
  onSelect: (id: string) => void;
}

/** One grid cell: a real `<input type="radio">` for native keyboard/AT
 * semantics, visually hidden (`sr-only`, not `hidden` — it must still take
 * focus), styled through its checked sibling `<label>`. `form="_installation-service"`
 * (an id nothing else uses) gives it no form owner, so — unlike a plain
 * nameless radio — it's excluded from the product form's `FormData`; only the
 * native select/radio this panel drives should ever post a value. */
function Pill({ groupName, id, city, priceLabel, selected, onSelect }: PillProps) {
  const inputId = useId();
  return (
    <div className="installation-service__pill-wrap">
      <input
        type="radio"
        form="_installation-service"
        name={groupName}
        id={inputId}
        value={id}
        checked={selected}
        onChange={() => onSelect(id)}
        className="sr-only"
      />
      <label htmlFor={inputId} className="installation-service__pill">
        <span className="installation-service__pill-radio" aria-hidden="true" />
        <span className="installation-service__pill-city">{city}</span>
        <span className="installation-service__pill-price">{priceLabel}</span>
      </label>
    </div>
  );
}

/**
 * Replaces the native rendering of one single product option — "خدمة التركيب"
 * (Installation service) — with a collapsible accordion of pill radios, while
 * `<salla-product-options>` (rendered elsewhere in the same `<form>` —
 * `AddToCartForm` on the product page, `CartItem` on the cart page) stays
 * mounted and keeps being the thing that actually gets posted. This component
 * never talks to the cart/price APIs directly: it only sets that one option's
 * native control and dispatches a `change`, the same as a shopper clicking it
 * would, so price updates on the product page and `cart.updateItem` on the
 * cart page keep working through each page's own existing flow, untouched.
 * Both call sites pass the same `options` shape (`product.options` /
 * `item.options`), so this one component drops into either form unchanged.
 *
 * Renders nothing if the product has no option by this name (a plain
 * `product.options` check, done here rather than by the caller so this stays
 * a drop-in with no conditional at the call site).
 *
 * Finds its target option's native container by name match, not by id (the
 * id is per-product) — `[data-option-id]`, same attribute `ProductOptionsPanel`
 * reads for its own chip-scroll targeting. A `MutationObserver` re-runs the
 * sync because the component can re-render its option boxes after the async
 * options fetch, same as `ProductMetadata`'s own native-DOM sync.
 */
export function InstallationServiceOption({ options }: { options: PanelOption[] }) {
  const { t } = useTranslation();
  const panelId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [disabledIds, setDisabledIds] = useState<ReadonlySet<string>>(new Set());

  const option = useMemo(
    () => options.find((candidate) => matchesName(candidate.name, INSTALLATION_OPTION_NAMES)),
    [options]
  );
  const optionId = option?.id;

  const containerOf = useCallback((form: HTMLFormElement | null) => {
    if (!form || optionId === undefined) return null;
    return form.querySelector<HTMLElement>(`[data-option-id="${CSS.escape(String(optionId))}"]`);
  }, [optionId]);

  useEffect(() => {
    if (optionId === undefined) return;
    const form = wrapperRef.current?.closest('form');
    if (!form) return;

    const sync = () => {
      const container = containerOf(form);
      if (!container) return;
      container.classList.add('installation-service__native-hidden');
      const { value, disabled } = readNativeState(container);
      setSelectedId((current) => (current === value ? current : value));
      setDisabledIds((current) =>
        current.size === disabled.size && [...current].every((id) => disabled.has(id))
          ? current
          : disabled
      );
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(form, { childList: true, subtree: true });
    form.addEventListener('change', sync);
    return () => {
      observer.disconnect();
      form.removeEventListener('change', sync);
    };
  }, [optionId, containerOf]);

  if (!option) return null;

  const details = ((option.details ?? []) as Detail[]).filter(
    (detail) => !disabledIds.has(String(detail.id))
  );

  const selectDetail = (detailId: string) => {
    const container = containerOf(wrapperRef.current?.closest('form') ?? null);
    if (!container) return;
    writeNativeState(container, detailId);
    setSelectedId(detailId);
  };

  const selected = details.find((detail) => String(detail.id) === selectedId);
  const summary = selected
    ? fill(t('pages.products.installation.summary', ':city · +:price ر.س'), {
        city: selected.name ?? '',
        price: String(selected.additional_price ?? 0),
      })
    : '';
  const note = selected
    ? fill(
        t(
          'pages.products.installation.note_with_city',
          'سيُضاف :price ر.س للتركيب في :city، ونتواصل معك عبر واتساب لتحديد الموعد'
        ),
        { city: selected.name ?? '', price: String(selected.additional_price ?? 0) }
      )
    : t(
        'pages.products.installation.note_without',
        'بدون تركيب — الأدوات ودليل التركيب داخل الصندوق'
      );

  return (
    <div ref={wrapperRef} className="installation-service">
      <button
        type="button"
        className="installation-service__header"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="installation-service__label">
          <WrenchIcon className="installation-service__icon" aria-hidden="true" />
          <span className="installation-service__title">
            {t('pages.products.installation.title', 'Installation service')}
          </span>
          <span className="installation-service__optional">
            {t('pages.products.installation.optional', '(Optional)')}
          </span>
        </span>
        <span className="installation-service__state">
          {summary && <span className="installation-service__summary">{summary}</span>}
          <ChevronDownIcon
            className={`installation-service__chevron${open ? ' is-open' : ''}`}
            aria-hidden="true"
          />
        </span>
      </button>

      <div id={panelId} className="installation-service__panel" hidden={!open}>
        <p className="installation-service__helper">
          {t(
            'pages.products.installation.helper',
            'اختر مدينتك وتُضاف تكلفة التركيب إلى السعر تلقائياً'
          )}
        </p>

        <div
          role="radiogroup"
          aria-label={t('pages.products.installation.aria_label', 'Installation city')}
          className="installation-service__grid"
        >
          <Pill
            groupName={panelId}
            id=""
            city={t('pages.products.installation.none_option', 'No installation')}
            priceLabel={t('pages.products.installation.free', 'Free')}
            selected={selectedId === ''}
            onSelect={selectDetail}
          />
          {details.map((detail) => (
            <Pill
              key={detail.id}
              groupName={panelId}
              id={String(detail.id)}
              city={detail.name ?? ''}
              priceLabel={fill(t('pages.products.installation.price_addition', '+:price ر.س'), {
                price: String(detail.additional_price ?? 0),
              })}
              selected={selectedId === String(detail.id)}
              onSelect={selectDetail}
            />
          ))}
        </div>

        <div className="installation-service__note">{note}</div>
      </div>
    </div>
  );
}
