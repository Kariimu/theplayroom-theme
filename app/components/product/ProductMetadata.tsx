import { useEffect, useRef } from 'react';
import { SallaMetadata } from '@salla.sa/twilight-components-react/metadata';
import {
  FACTS_SECTION_NAMES,
  matchesName,
  splitListValue,
  METADATA_GROUPS,
  type MetadataGroupKey,
} from '../../lib/specs';

interface ProductMetadataProps {
  /** Extra classes on the wrapper (used for the responsive show/hide). */
  className?: string;
}

const CHEVRON_ICON =
  '<svg class="s-metadata-box-header__chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true"><path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/** One glyph per `METADATA_GROUPS` key, 24×24 viewBox matching `app/components/icons.tsx`'s
 * line-icon style (1.5 stroke, round caps/joins, no fill) — plain strings, not React
 * components, because these headers are DOM injected into a web component's light DOM,
 * not rendered by React (see the file doc below). */
const GROUP_ICON_PATHS: Record<MetadataGroupKey, string> = {
  features:
    '<path d="M13.7276 3.44418L15.4874 6.99288C15.7274 7.48687 16.3673 7.9607 16.9073 8.05143L20.0969 8.58575C22.1367 8.92853 22.6167 10.4206 21.1468 11.8925L18.6671 14.3927C18.2471 14.8161 18.0172 15.6327 18.1471 16.2175L18.8571 19.3125C19.417 21.7623 18.1271 22.71 15.9774 21.4296L12.9877 19.6452C12.4478 19.3226 11.5579 19.3226 11.0079 19.6452L8.01827 21.4296C5.8785 22.71 4.57865 21.7522 5.13859 19.3125L5.84851 16.2175C5.97849 15.6327 5.74852 14.8161 5.32856 14.3927L2.84884 11.8925C1.389 10.4206 1.85895 8.92853 3.89872 8.58575L7.08837 8.05143C7.61831 7.9607 8.25824 7.48687 8.49821 6.99288L10.258 3.44418C11.2179 1.51861 12.7777 1.51861 13.7276 3.44418Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  uses: '<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  installationGuide:
    '<path d="M2 4.5h5a3.5 3.5 0 0 1 3.5 3.5v12A2.5 2.5 0 0 0 8 17.5H2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 4.5h-5A3.5 3.5 0 0 0 13.5 8v12A2.5 2.5 0 0 1 16 17.5h6z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  installationService:
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  shipping:
    '<path d="M3 16V6a1 1 0 0 1 1-1h8v11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 9h4l3.5 3.5V16h-7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="17.5" r="1.75" stroke="currentColor" stroke-width="1.5"/><circle cx="16.5" cy="17.5" r="1.75" stroke="currentColor" stroke-width="1.5"/>',
  returnExchange:
    '<path d="M17 2l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 11v-1a4 4 0 0 1 4-4h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 22l-4-4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 13v1a4 4 0 0 1-4 4H3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  note: '<path d="M19 15V9C19 6.17 19 4.76 18.12 3.88C17.24 3 15.83 3 13 3H11C8.17 3 6.76 3 5.88 3.88C5 4.76 5 6.17 5 9V15C5 17.83 5 19.24 5.88 20.12C6.76 21 8.17 21 11 21H13C15.83 21 17.24 21 18.12 20.12C19 19.24 19 17.83 19 15Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 8H15M9 12H15M9 16H12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
};

const groupIconSvg = (key: MetadataGroupKey) =>
  `<svg class="s-metadata-box-header__icon" viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">${GROUP_ICON_PATHS[key]}</svg>`;

/**
 * `<SallaMetadata>` (product specs) rendered as collapsible accordion groups.
 *
 * The web component emits static `.s-metadata-box` blocks — this wires
 * click-to-toggle on their `.s-metadata-box-header`s (adds `.is-open` on the
 * box; the open/closed styling lives in `04-components/metadata.scss`) and
 * opens the first group once it appears. A MutationObserver handles the async
 * spec fetch; the click handler is delegated so it survives re-renders.
 *
 * Rendered under the gallery slider on `md`+ ({@link ProductGallery}) and at the
 * end of the description on mobile ({@link ProductDetails}); the `className`
 * carries the `hidden md:block` / `md:hidden` toggle.
 *
 * The headers are plain `<div>`s, so each one also gets `role="button"`,
 * `tabindex="0"` and an `aria-expanded` that follows its box, and Enter / Space
 * toggle it — otherwise keyboard and screen-reader users can only read the
 * first group.
 *
 * The build's `no-manual-dom` check flags the `classList` / attribute calls
 * (and, now, the `replaceChildren` that turns a `|`-separated value into a
 * list — see below). They stay: the boxes are rendered by `<salla-metadata>`,
 * not React, so there is no ref or React state that reaches them.
 *
 * A row's value is rebuilt into a `<ul>` when it contains `|` — the
 * merchant-facing list separator (`docs/DATA-ENTRY.md`), since a dashboard
 * text field can't hold a real newline. Guarded by `data-split` so the
 * MutationObserver watching this same subtree doesn't loop on its own edit,
 * and skipped for a value that already has element children (a file/link
 * field's `<a>`) so a URL is never torn apart.
 *
 * The "تفاصيل المنتج" / "Product Details" group (`app/lib/specs.ts`'s
 * `FACTS_SECTION_NAMES`) is hidden here — it's the same for-who / material /
 * box-contents fields `ProductFacts` already shows, under the add-to-cart
 * payment badges. Matched by the group's own header text, so this only ever
 * hides that one group; any other group (assembly guide, product features)
 * still renders. If a merchant later adds a fourth field to that group, it
 * stays hidden here too — the whole group is suppressed, not just the three
 * known fields.
 *
 * Every other group is reordered to `METADATA_GROUPS`' fixed sequence (the
 * merchant's own dashboard order isn't honoured) and gets a leading icon by
 * the same name match, both done by mutating the already-rendered header/box
 * nodes in place (guarded by `data-enhanced` so a header is only rebuilt
 * once) rather than by React, for the same light-DOM reason as above. The
 * plus/minus the web component drew via CSS `content` is replaced with a
 * real chevron element so it can share `ProductFacts`' rotate-on-open look —
 * a pseudo-element's `content` can't be animated the same way.
 */
export function ProductMetadata({ className }: ProductMetadataProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const syncExpanded = (header: Element) =>
      header.setAttribute(
        'aria-expanded',
        String(!!header.parentElement?.classList.contains('is-open'))
      );

    // Runs on every change under the root: the specs arrive after an async fetch,
    // and the component can re-render its boxes.
    let opened = false;
    const setUp = () => {
      root.querySelectorAll<HTMLElement>('.s-metadata-box').forEach((box) => {
        const header = box.querySelector<HTMLElement>('.s-metadata-box-header');
        if (!header) return;
        if (matchesName(header.textContent ?? undefined, FACTS_SECTION_NAMES)) {
          box.classList.add('is-duplicate-of-facts');
        }

        if (header.dataset.enhanced) return;
        const label = header.textContent?.trim() ?? '';
        const group = METADATA_GROUPS.find((candidate) => matchesName(label, candidate.names));
        box.dataset.groupOrder = group ? String(METADATA_GROUPS.indexOf(group)) : '';

        header.textContent = '';
        const labelWrap = document.createElement('span');
        labelWrap.className = 's-metadata-box-header__label';
        if (group) labelWrap.insertAdjacentHTML('beforeend', groupIconSvg(group.key));
        const text = document.createElement('span');
        text.textContent = label;
        labelWrap.appendChild(text);
        header.insertAdjacentHTML('beforeend', CHEVRON_ICON);
        header.prepend(labelWrap);
        header.dataset.enhanced = 'true';
      });

      // Fixed display order — the merchant/dashboard's own group order isn't
      // honoured. A group with no match in `METADATA_GROUPS` (including the
      // hidden facts duplicate above) keeps its relative position, sunk to
      // the end. Skipped when already in order so a steady-state re-run
      // (e.g. the unrelated list-split below) never re-triggers this
      // observer's own callback.
      const boxesParent = root.querySelector('.s-metadata-box')?.parentElement;
      if (boxesParent) {
        const current = Array.from(boxesParent.children) as HTMLElement[];
        const rank = (box: HTMLElement) =>
          box.dataset.groupOrder ? Number(box.dataset.groupOrder) : METADATA_GROUPS.length;
        const sorted = [...current].sort((a, b) => rank(a) - rank(b));
        if (sorted.some((box, i) => box !== current[i])) {
          sorted.forEach((box) => boxesParent.appendChild(box));
        }
      }

      root
        .querySelectorAll<HTMLElement>('.s-metadata-row-value:not([data-split])')
        .forEach((valueEl) => {
          valueEl.setAttribute('data-split', 'true');
          if (valueEl.children.length > 0) return; // a link/file value — leave its <a> alone
          const lines = splitListValue(valueEl.textContent ?? '');
          if (lines.length <= 1) return;
          const list = document.createElement('ul');
          list.className = 's-metadata-row-value__list';
          for (const line of lines) {
            const item = document.createElement('li');
            item.textContent = line;
            list.append(item);
          }
          valueEl.replaceChildren(list);
        });

      if (!opened) {
        const first = root.querySelector<HTMLElement>('.s-metadata-box:not(.is-duplicate-of-facts)');
        if (first) {
          first.classList.add('is-open');
          opened = true;
        }
      }
      root.querySelectorAll('.s-metadata-box-header').forEach((header) => {
        if (!header.hasAttribute('role')) {
          header.setAttribute('role', 'button');
          header.setAttribute('tabindex', '0');
        }
        syncExpanded(header);
      });
    };

    const observer = new MutationObserver(setUp);
    observer.observe(root, { childList: true, subtree: true });
    setUp();

    const headerOf = (event: Event) => {
      const header = (event.target as HTMLElement).closest('.s-metadata-box-header');
      return header && root.contains(header) ? header : null;
    };
    const toggle = (header: Element) => {
      header.parentElement?.classList.toggle('is-open');
      syncExpanded(header);
    };

    const onClick = (event: MouseEvent) => {
      const header = headerOf(event);
      if (header) toggle(header);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const header = headerOf(event);
      if (!header) return;
      // Space would otherwise scroll the page.
      event.preventDefault();
      toggle(header);
    };
    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKeyDown);

    return () => {
      observer.disconnect();
      root.removeEventListener('click', onClick);
      root.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className={`product-metadata${className ? ` ${className}` : ''}`}>
      <SallaMetadata />
    </div>
  );
}
