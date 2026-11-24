# AGENTS.md

Salla React storefront theme: TanStack Start (server-rendered at the edge) on
`@salla.sa/twilight-theme-engine`. You customize the engine; you do not fork it.

## Read the docs before writing code

Do not write an engine API from memory. Look it up first:

- Salla Partners MCP tool `salla_themes_docs` (`search`, `read`, `list`), or
- `https://docs.salla.dev/twilight/react/llms.txt` (index), then add `.md` to any page URL.

| I want to…                                             | Read                                                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Add a page                                             | `/recipes/add-a-page`                                                                |
| Change a built-in page                                 | `/recipes/fork-a-built-in-route`                                                     |
| Add a home block                                       | `/recipes/add-a-home-block`                                                          |
| Replace the product card                               | `/recipes/replace-the-product-card`                                                  |
| Put content in an existing spot                        | `/recipes/add-content-to-a-slot`                                                     |
| Add translations                                       | `/recipes/add-translation-keys`                                                      |
| React to cart events                                   | `/recipes/react-to-cart-events`                                                      |
| Add a merchant setting                                 | `/guide/settings`, and `/guide/twilight-json` for every key and format               |
| Load data in a page                                    | `/guide/loading-data`                                                                |
| Style something                                        | `/guide/styling`                                                                     |
| Navigate, detect the page, redirect or 404 in a loader | `/hooks/navigation`                                                                  |
| Set classes on `<html>`/`<body>`                       | `/hooks/use-document-class`                                                          |
| Loading placeholders                                   | `/components/skeleton`                                                               |
| Keep it fast, or lint it                               | `/guide/performance`, `/guide/lint-your-theme`                                       |
| Use a `<salla-*>` web component                        | `/web-components` (index), then `/web-components/<tag>` for its props, events, slots |

## Rules that prevent the usual mistakes

**Routes**

- A new or overriding page needs both: a `route('/path', 'file.tsx')` entry in `app/routes.ts` and the file in `app/routes/`.
- Every storefront route path starts with `{-$locale}`: `createFileRoute('/{-$locale}/about')`.
- Never put `// @auto-generated` at the top of a route file you own. The next build deletes it.
- Never edit `routeTree.gen.ts`. It is regenerated.
- Test pages at `/ar` or `/en`, never `/`.

**Components and registry**

- Only these registry keys are resolved: `product:card`, `product:list-page`, the `home:*` blocks, `account:layout-pending`. Overriding any other name does nothing. For anything else use a hook slot (registered in `app/hooks/index.tsx`) or fork the route.
- To replace the product card call `registry.register('product:card', X)` and then `registry.override('product:card', X)`. `override()` alone is silently ignored.
- Home blocks are bound by key in `registerHomeComponents({ ...DefaultHomeComponents, key: MyComponent })`. Keep the spread, or you lose the defaults.
- A block with a `view_style` is looked up as `key:styleN` before `key`. Register both when you replace it.

**Imports**

- Import from the narrowest public subpath: `@salla.sa/twilight-theme-engine/hooks/useStore`, `/common`, `/cart`, `/product`, `/layout`.
- Never import from `dist/` or `src/` of the engine. Those paths are not public.
- Use the engine `Link` (`/common`) for internal navigation, not `<a>`.

**Data and settings**

- Theme settings are a plain object: `const { settings } = useTheme(); settings?.my_id ?? default`. There is no `settings.get()`.
- `useMoney().format()` returns a React node, not a string.
- Merchant settings and home blocks are declared in `twilight.json`; reading them in code is not enough.
- The SDK is `window.salla`. Subscribe and unsubscribe with the same API and the same function reference, in a `useEffect` cleanup. Use the dotted event name (`auth::logged.in`).
- No `window.location.reload()` and no manual DOM edits. Use state, refs and `key`.

**Translations**

- Add keys to both `locales/ar.json` and `locales/en.json`. Arabic and RTL come first: use logical CSS (`ms-*`, `ps-*`, `text-start`) not left/right.

## Web components (`<salla-*>`)

The engine renders many Salla widgets as web components. In React, prefer, in this order:

1. A native engine component (`Link`, `ProductCard`, `Breadcrumb`, product lists and sliders) when one exists.
2. A wrapper from `@salla.sa/twilight-components-react` (granular import: `.../slider`, `.../rating-stars`).
3. A raw `<salla-*>` tag only if there is no wrapper.

Before using one, `read` `/web-components/<tag>` (for example `/web-components/salla-modal`) for its exact props, events, methods and slots. Do not invent attributes.

## Verify

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm check:manifest   # after editing twilight.json: duplicate ids, missing options, bad values
```

Do not start `pnpm dev` yourself; ask the user to run it. Typecheck needs `app/routeTree.gen.ts`, which `pnpm build` or `pnpm dev` generates.

## This project: The Playroom (store-specific rules)

This repo is the React rebuild of the Salla theme for theplayroom.sa (wooden toys, Arabic-first, English supported). It started as the unmodified React Raed starter. The old Twig theme is the live site and the behaviour spec.

- Read `docs/MIGRATION-PLAN.md` before any migration task and follow its phases. Section 5A is binding: no root-level `collection` settings and no product pickers in `twilight.json`; product and category content lives on the product/category (specs, tags, description, category fields), not in theme settings.
- `docs/legacy/` describes the old theme (settings inventory, custom features, known issues, `old-twilight.json`). Port behaviour, not code. Do not port anything listed in `docs/legacy/09-known-issues.md`.
- The old theme folder (`../Theplayroom-theme`) is read-only reference. Never edit it.
- Keep home-block `key` (UUID) and `path` values identical to `docs/legacy/old-twilight.json` for blocks that exist in both themes.
- Git: work on the `migration` branch (the repo's default branch since 24 Nov 2026, so Salla reads `twilight.json` from it). Never commit to or push `master`, never publish, and never change anything in the Salla Partners Portal; the owner does releases. Salla builds whatever is pushed, and only `master` can be submitted for publication.
- Every user-visible string goes in both `locales/ar.json` and `locales/en.json`. Check every UI change at `/ar` and `/en`, on mobile and desktop.
- When you fork an engine component, add the row to `FORKS.md` in the same commit.
- Partners theme: `Theplayroom_react`, Theme ID `786991395` (imported 24 Nov 2026 as a new theme). The earlier record `Theplayroom_theme`, Theme ID `1869420365`, keeps the old name. Live store for reference only: https://theplayroom.sa/ar
- `TASK.md` is the ordered checklist of everything left (build stages, SEO, GEO, performance, security audit, PR review, staging, go-live). Work one stage per session and tick it there.
