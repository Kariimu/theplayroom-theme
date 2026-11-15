# Needs Validation — theplayroom_react_theme (run-1)

One record in this run is blocked on a fact outside this repository's source. Per the audit's own rules, a `needs_validation` record carries no severity — it names a specific blocked hypothesis, not a low-confidence vulnerability.

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
