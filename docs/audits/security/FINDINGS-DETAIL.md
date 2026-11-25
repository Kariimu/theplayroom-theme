# Findings Detail — theplayroom_react_theme (run-1)

Derived from `findings.json`, the authoritative structured record. No instruction here probes a live or deployed target; every reproduction step either re-reads this repository's own source/metadata or is phrased for an owner to run against their own staging URL once one exists.

---

## 1. Vulnerable `seroval` 1.6.9 in the runtime SSR/hydration dependency chain

**Fingerprint:** `seroval-transitive-dependency-cve-ghsa-f86p-9wx9`
**Verdict:** confirmed · **Severity:** medium (likelihood: low, impact: medium) · **Confidence:** high

### What's wrong

`pnpm audit` reports two advisories against `seroval@1.6.9`:

- **GHSA-f86p-h4j2-7qgj** — code injection through a typed array's own `constructor` property (vulnerable `>=1.6.0 <1.6.11`)
- **GHSA-9wx9-5pv9-3349** — script injection through unescaped `<` in RegExp sources in serialized output (vulnerable `>=1.5.5 <1.6.10`)

`seroval` is the serialization library `@tanstack/router-core` uses to dehydrate loader data into the server-rendered HTML for client-side hydration — it runs on every SSR response this theme produces. `@tanstack/react-start` is a direct **runtime** dependency of this theme (`package.json:22`, not a devDependency), and `pnpm why seroval` confirms exactly one deduped `seroval` install (1.6.9) in the entire tree, shared by `@tanstack/router-core` and, through it, by every genuinely runtime `@tanstack/start-*` package — not isolated to the devDependency path (`@tanstack/router-plugin`) that `pnpm audit`'s own printed chain happens to show first.

### Why it's reachable, and why severity is only "medium"

`@tanstack/router-core`'s own `package.json` (line 171) declares `"seroval": "^1.6.7"` — a range that already permits the patched 1.6.11+ releases. This means the vulnerable version in `pnpm-lock.yaml` is a **stale lockfile resolution**, not a ceiling the dependency itself imposes.

Exploiting either CVE requires a specific precondition inside `seroval`'s own serialization call path (a typed array with an attacker-set own `constructor` property, or a `RegExp` built from an attacker-controlled pattern containing `<`) to receive data this theme's loaders pass through. No such construction was found in this repository's own route/loader code — that precondition belongs to the framework layer, and this repo's own code was not shown to create it. Likelihood is therefore scored low; impact is scored medium because *if* the precondition is met anywhere in the request path, the result is script execution in every visitor's browser on the affected SSR page (matching the advisories' own moderate CVSS ratings).

### Evidence

- `package.json:22` — `"@tanstack/react-start": "~1.168.57"` under top-level `dependencies`.
- `pnpm-lock.yaml:6548` — `seroval@1.6.9: {}`, the single resolved install for the whole repo.
- `node_modules/.pnpm/@tanstack+router-core@1.171.35/node_modules/@tanstack/router-core/package.json:171` — `"seroval": "^1.6.7"`.

### Fix

Lockfile-only bump, already within the existing permitted range — no `package.json`/`pnpm.overrides` change needed:

```bash
pnpm update seroval
```

Then re-run `pnpm build`, `pnpm typecheck`, `pnpm test`, and `pnpm audit --json` to confirm the two advisories no longer appear and `pnpm why seroval` reports `>=1.6.11`.

---

## 2. No baseline HTTP security headers declared anywhere in this theme's own layer

**Fingerprint:** `public-headers-missing-baseline-security-headers`
**Verdict:** confirmed · **Severity:** low (likelihood: low, impact: low) · **Confidence:** high

### What's wrong

`public/_headers` — the only file through which this theme can declare static response headers (Cloudflare-Pages-style `_headers` syntax) — contains exactly one rule:

```
/assets/*
  Cache-Control: public, max-age=31556952, immutable
```

No rule exists, for `/assets/*` or any other path (there is no catch-all `/*` rule at all), for `X-Content-Type-Options`, `X-Frame-Options`/`Content-Security-Policy: frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`, or `Strict-Transport-Security`. A repo-wide search of every theme-owned server-rendering entry point (`app/server.ts`, `app/start.ts`, `vite.config.ts`, `app/routes/__root.tsx`, and every file under `app/routes`) found no middleware, route-level `headers()` export, or manual header-setting call that adds any of these either.

### Why severity is only "low"

The demonstrated issue is "this repo's own layer contributes nothing," not "the live site is definitively unprotected" — whether Salla's production hosting edge already sets some or all of these headers independently of this file is a platform fact this repository's source cannot establish either way (and is explicitly an owner-review item per this project's `AGENTS.md`). Severity is calibrated to what is demonstrated, not to an unverified worst case: even end-to-end, the realistic impact against a single-merchant storefront with no admin/auth surface exposed here is clickjacking/UI-redress and minor referrer leakage, not data exfiltration.

### Evidence

- `public/_headers:1-2` — the file's entire content.
- `app/server.ts:1-4` — the entire SSR server entry, no header-setting code.

### Fix

Add a catch-all rule with four of the five headers — free, strictly beneficial regardless of what the platform edge separately does:

```
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=63072000

/assets/*
  Cache-Control: public, max-age=31556952, immutable
```

**`X-Frame-Options`/`frame-ancestors` deliberately left out of this fix.** `node_modules/@salla.sa/twilight-theme-engine/dist/components/live-editor/frame.d.ts` confirms the engine ships its own live-editor iframe component, and this theme's `twilight.preview.json` exists for exactly that embedded dashboard preview — so a blanket `DENY`/`SAMEORIGIN` would plausibly break the merchant's own live-editor preview, which needs to frame the storefront from a different (Salla dashboard) origin. The correct fix is a `frame-ancestors <editor-origin>` allowlist, not a bare deny, and the editor's real origin isn't observable from this repository. Carried to Stage 14 (see `docs/audits/security/NEEDS-VALIDATION.md`), not fixed here.

**`includeSubDomains`/`preload` left off `Strict-Transport-Security`.** Both are owner-level commitments — `includeSubDomains` forces HTTPS on every subdomain of theplayroom.sa (mail, API, or any HTTP-only subdomain would break), and `preload` submits the domain to browsers' built-in preload list, which is difficult to reverse. This project's own Stage 12 scope note treats SSL/TLS posture as an OWNER review, so the theme asserts only the base `max-age` and leaves those two to the owner once the domain's full subdomain estate is known.
