# docs/legacy — the old Twig theme, as a spec

This repo is the React rebuild of The Playroom's Salla theme (theplayroom.sa, wooden toys, Arabic-first).
The old Twig theme lives in a separate folder (`../Theplayroom-theme`) and is still the live site. Never edit it from here.

| File | Use |
|---|---|
| `../MIGRATION-PLAN.md` | The plan to follow: strategy, data relocation (section 5A), feature mapping, phases |
| `03-twilight-json.md` | Old settings and home components, with where each was used |
| `06-custom-features.md` | What the old theme does beyond stock Raed (the behaviour to rebuild) |
| `09-known-issues.md` | Bugs in the old theme. Do not port them |
| `old-twilight.json` | The old manifest, for exact ids, keys, field lists and Arabic labels |

Project facts
- Salla Partners theme: `Theplayroom_theme`, Theme ID `1869420365`, built with React, status Development.
- Git: `github.com/Kariimu/theplayroom-theme`, default branch `master`. Salla builds what is pushed; only `master` can be submitted for publication. Do day-to-day work on the `migration` branch.
- Live store for reference (read-only): https://theplayroom.sa/ar

The repo's root `AGENTS.md` (from Salla's starter) holds the engine rules. This folder only adds the store-specific spec.
