# Needs Validation — theplayroom_react_theme (run-1)

Two records in this run are blocked on a fact outside this repository's source. Per the audit's own rules, a `needs_validation` record carries no severity — it names a specific blocked hypothesis, not a low-confidence vulnerability.

---

## `public/_headers` has no `frame-ancestors`/`X-Frame-Options`, and the correct value isn't source-visible

**Fingerprint:** `public-headers-frame-ancestors-editor-origin-unverified`

### The claim

Of the five baseline headers identified in finding `public-headers-missing-baseline-security-headers` (`docs/audits/security/FINDINGS-DETAIL.md`), four were added to `public/_headers` directly. `X-Frame-Options`/`Content-Security-Policy: frame-ancestors` was deliberately left out of that fix rather than applied as a blanket `DENY`/`SAMEORIGIN`.

### Why it's blocked

`node_modules/@salla.sa/twilight-theme-engine/dist/components/live-editor/frame.d.ts` confirms the engine ships its own live-editor iframe component, and this theme's own `twilight.preview.json` exists for exactly that embedded dashboard preview workflow. A blanket frame-deny header would plausibly break the merchant's own live-editor preview, which needs to frame the storefront from the Salla dashboard's origin. The correct fix is a `frame-ancestors <editor-origin>` allowlist naming that specific origin, not a bare deny — and the editor's real origin is not observable from this repository's source.

### Validation plan

- **Local:** not resolvable locally — the live-editor's origin is a Salla platform detail, not present in this repository.
- **Deployment/owner-observed:** once the Stage 14 staging URL exists, open the Salla dashboard's live editor against it and record the origin the preview iframe actually loads from (check the browser's network panel or the iframe's `src`). Add `Content-Security-Policy: frame-ancestors 'self' <that-origin>` (or the equivalent `X-Frame-Options` value if only one origin is ever needed) to `public/_headers`'s `/*` rule. If the editor turns out to use `postMessage`-based embedding rather than a same-tab iframe, or if Salla's edge already sets a working `frame-ancestors` independently, this may resolve `rejected` instead.

---

## `resolveLink.ts` trusts the engine-resolved CTA target string with no scheme check of its own

**Fingerprint:** `resolvelink-engine-picker-scheme-constraint-unverified`

### The claim

`app/lib/resolveLink.ts` returns a home-block CTA link-target string unchanged (trimmed, with `#` and empty treated as absent) for direct use as an `href` across several home blocks:

```ts
export function resolveLink(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed && trimmed !== '#' ? trimmed : undefined;
}
```

The string originates from the Salla dashboard's own link-target picker field, resolved server-side by the engine before this theme's code ever sees it.

### Why it's blocked

Whether that dashboard picker UI constrains the merchant to `http(s)`/relative targets, or would accept and resolve freehand text containing a `javascript:` scheme, is not visible from this repository's source — the picker UI and its server-side resolution logic live in the Salla dashboard/engine backend, not in this repo.

Even in the worst case, this is a **merchant-self-impact** scenario per this run's trust calibration (a merchant with dashboard access setting an unsafe link on their own storefront is not a lower-trust-principal boundary violation) — which is why this was not escalated as a high-priority item even while blocked. It is recorded here for completeness, not urgency.

### Validation plan

- **Local:** not resolvable locally — the picker UI and its resolution logic are outside this repository.
- **Deployment/owner-observed:** on this project's own Stage 14 staging store, attempt to set a home-block CTA link-target field to a `javascript:` URI (or confirm the picker UI only offers page/product/category selection plus a URL field that itself validates `http(s)`). If the picker only accepts safe targets by construction, this resolves `rejected` with no code change needed. If it accepts freehand `javascript:` text, the smallest fix is a scheme allowlist in `resolveLink.ts` (accept only `http:`, `https:`, or a relative path).
