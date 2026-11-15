# Security Audit Report — theplayroom_react_theme (run-1)

**Target:** Salla "Twilight" React storefront theme (TanStack Start, server-rendered) for theplayroom.sa, a single-merchant store. **Branch:** `stage-12-security-audit` (stacked on `stage-11-performance`). **Reviewed:** HEAD commit `4258941` plus the branch's own state. **Profile:** standard, scoped to theme-owned source (see `run-metadata.json.scope_paths`). **Prior runs:** none — this is run 1; this pass does not exhaust the target.

## Coverage statement

15 deterministic coverage units were seeded and closed across 3 hunting/critic waves (1 parent-run wave of 6 units during reconnaissance, 1 hunter wave of 4 units, 2 follow-on units added after coverage-critic findings, converging to a clean `stop: true` second final-clean critic pass with no missing units). 13 units closed `covered` (no finding survived the candidate gate), 2 closed `candidate` and were independently verified to `confirmed` (below), and 1 remains `blocked`/`needs_validation`. No unit was silently dropped; the full ledger is in `coverage-ledger.json`.

**What this run excludes, by design:** the engine (`@salla.sa/twilight-theme-engine`) and all other `node_modules` internals (third-party, supply-chain-reviewed only via `pnpm audit`, not source-hunted — this repo cannot fix the engine's own code); Cloudflare/Salla platform-level configuration (DNS, WAF, SSL mode, CSP actually enforced at the edge — owner-reviewed per this project's `AGENTS.md`); anything requiring a running dev server or live staging URL (no dev server was available in this session; the one `needs_validation` record below is deferred to the project's own Stage 14 staging pass for exactly this reason).

**Execution-environment limitation, disclosed in full:** no OS-enforced sandbox is available in this Windows Bash/PowerShell tool environment, so **no target-controlled code was executed** anywhere in this run — no dev server, no built bundle, no test run, no fuzzing. Every check in this report is static source review, or parent-run read-only tooling (`pnpm audit`, `pnpm why`, `git log`) that inspects dependency metadata and history without executing target application code. Separately, the skill's own `validate-coverage-ledger.cjs` and `validate-findings.cjs` refuse to run on this platform (they require a POSIX `O_NOFOLLOW` file-open flag Node does not expose on Windows) — hand-written manual equivalents (`manual-ledger-check.cjs`, `manual-findings-check.cjs`) re-implement the same documented required-field/enum/state-table/severity-ordinal rules and both pass against the final `coverage-ledger.json` and `findings.json`. See `run-metadata.json.validator_execution_note` for the full disclosure.

## Summary of findings

| # | Fingerprint | Title | Verdict | Severity |
|---|---|---|---|---|
| 1 | `seroval-transitive-dependency-cve-ghsa-f86p-9wx9` | Vulnerable `seroval` 1.6.9 in the runtime SSR/hydration dependency chain | confirmed | **medium** |
| 2 | `public-headers-missing-baseline-security-headers` | No baseline HTTP security headers declared anywhere in this theme's own layer | confirmed | **low** |
| 3 | `resolvelink-engine-picker-scheme-constraint-unverified` | `resolveLink.ts` trusts the engine-resolved CTA target string with no scheme check of its own | needs_validation | n/a |

Full detail for each: `FINDINGS-DETAIL.md`. The one `needs_validation` record: `NEEDS-VALIDATION.md`.

**Zero findings** came out of the areas this project's own Stage 12 instructions specifically asked for extra attention on: the six `dangerouslySetInnerHTML` sinks (all merchant-authored content only, no customer- or request-derived string reaches any of them); the `wa.me`/`t.me`/YouTube-embed link builders built from settings/tags (digit-stripped, protocol- and host-allowlisted, `encodeURIComponent`-escaped); the YouTube `postMessage` handler (checks `event.source` identity, not a weaker origin string); `localStorage`/`sessionStorage` usage (UI-preference state only, no PII or tokens); and SSR JSON-LD (data-only, the engine owns serialization). Two additional customer-reachable surfaces this project's own instructions didn't name — the comments/reviews mount and the add-to-cart form's file-upload/notes/gifting widgets — were found and closed by coverage critics during this run; both delegate entirely to third-party Salla web components with no new theme-added authorization or sanitization step, and neither has a theme code path that renders one customer's content back to another visitor.

## Independent verification

Both `confirmed` findings were validated by a **fresh, non-fork verifier agent** with no access to the original candidate's reasoning beyond the raw claim — each independently re-derived the version/file/line facts from source rather than trusting the candidate. The parent additionally spot-checked the three most load-bearing line-number citations (`package.json:22`, `pnpm-lock.yaml:6548`, `node_modules/.../router-core/package.json:171`) directly and confirmed an exact match. The one `needs_validation` record was not sent to a verifier — its blocker (the Salla dashboard's own link-picker UI is not in this repository) is self-evident from the claim itself and would not change under a second source-only read.

## Fix status

See the project's `docs/audits/security/` for the fix commits applied in response to this report (Stage 12 checklist item 5: every confirmed medium-or-above finding gets its own commit with a regression test; the one `low` finding is fixed alongside it since the fix is free and strictly beneficial regardless of severity). The `needs_validation` record is carried forward to this project's Stage 14 staging pass, per its own validation plan.
