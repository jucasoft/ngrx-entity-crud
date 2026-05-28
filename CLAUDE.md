# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository purpose

This repo publishes the `ngrx-entity-crud` npm library: a wrapper around `@ngrx/entity` that generates CRUD actions, reducers, effects, selectors and a base HTTP/GQL service for a given entity, plus Angular schematics (`ng-add`, `store`, `section`, `auth`, `auth0`) that scaffold consumer code. It is an Nx workspace whose only project today is the library at `libs/ngrx-entity-crud` (the `apps/` folder is empty — `apps/.gitkeep`).

## Commands

Run from the workspace root unless noted.

- `npm run build` — builds the library AND its schematics (`nx build ngrx-entity-crud --skip-nx-cache && npm run build:schematics`). Output goes to `dist/ngrx-entity-crud`. The schematics step (`tsc -p dist/ngrx-entity-crud/tsconfig.schematics.json`) depends on the ng-packagr build having run first, so don't skip it.
- `npm run dev` / `npm run build:schematics:watch` — watch builds for library and schematics respectively.
- `npm run testLibs` — runs the library's Jest tests (`nx test ngrx-entity-crud`). `npm test` runs Jest across all projects.
- Single test: `npx nx test ngrx-entity-crud --testFile=<path>` or `--testNamePattern="<regex>"`.
- `npm run lint` / `npm run lint:fix` — ESLint (flat config in `eslint.config.mjs`) over `*.ts` and `*.html` in the lib.
- `npm run format` / `format:check` — Prettier across the repo.
- `npm run link` — builds + `npm link` from `dist/ngrx-entity-crud` so a sibling app can consume the local build.
- `npm run publish` / `publish:beta` — builds + `npm publish` (latest / `beta` tag) from `dist/ngrx-entity-crud`.
- Testing `ng-add` against a consumer app: `ng generate ngrx-entity-crud:ng-add` (after `npm link`).

Husky + lint-staged run Prettier and `eslint --fix` on staged `*.{ts,js,json,md}` via pre-commit.

## Architecture

### Library (`libs/ngrx-entity-crud/src/lib`)

The public surface (see `public-api.ts`) is a set of factories that, given an entity type `T` and a feature name, produce a full NgRx CRUD slice:

- `models.ts` — core type contracts (`Actions<T>`, `EntityCrudState<T>`, `ICriteria`, `OptRequest`, `Response<T>`, etc.). These are the shapes every other module composes on.
- `actions.ts` — `createCrudActions<T>(name)` returns the full action group: `SearchRequest/SearchSuccess/SearchFailure`, `Create*`, `Edit*`, `Delete*`, `Select*`, `EditMany`, `CreateMany`, `DeleteMany`, plus selection/edit state actions. There is also a `createSingularCrudActions` variant for non-collection state.
- `create_adapter.ts` + `entity_state.ts` — wrap `@ngrx/entity`'s `createEntityAdapter` to produce an initial state that includes selection, editing item, and search criteria on top of the entity dictionary.
- `reducer.ts` — `createCrudOns` returns the `on(...)` handlers to pass into `createReducer`; `createSingularCrudOns` is the singular counterpart. `evalData` is the shared payload-normalization helper.
- `state_selectors.ts` — `getSingeCrudSelectors` (and the implicit collection selectors via the adapter) expose `selectAll`, `selectEntities`, `selectItemSelected`, `selectItemEdited`, search criteria, loading flags, etc.
- `effect-*.ts` (one file per operation: `search`, `select`, `create`, `create-many`, `edit`, `edit-many`, `delete`, `delete-many`) — each exports an effect factory that wires the action stream to a `BaseCrudService` method and dispatches Success/Failure. They are intentionally split per-operation so consumers can opt in.
- `base-crud.service.ts` / `base-singular-crud.service.ts` / `base-crud-gql.service.ts` — abstract HTTP/GraphQL services implementing `IBaseCrudService<T>` (`search`, `select`, `create`, `edit`, `delete`, plus `*Many`). Consumers extend these and supply a `path`/endpoint; the effects call into them.
- `filter.ts` + `j-ngrx-filter.ts` + `utils.ts` — predicate/criteria utilities used by `search` (client-side filtering via `ICriteria.queries`).

The mental model: a consumer feature module instantiates **one** adapter + actions + reducer + selectors + service + the subset of effects it needs, all parameterized by the entity `T`. Adding a new operation type means adding a new `effect-*.ts`, a matching method on `IBaseCrudService`, action members in `actions.ts`, a reducer `on` in `reducer.ts`, and re-exporting from `public-api.ts`.

### Schematics (`libs/ngrx-entity-crud/schematics`)

Schematics are TypeScript sources compiled separately (see `tsconfig.schematics.json` referenced by the `build-schematics` target). Each schematic has `index.ts`, `schema.json`, `schema.d.ts`, and a `files/` template tree applied via the Angular schematics `Tree` API.

- `ng-add` — entry point invoked by `ng add ngrx-entity-crud`; bootstraps store wiring in a consumer app.
- `store` — scaffolds a feature store (actions/reducer/effects/selectors/service) for a new entity, using the library factories above.
- `section` — generates a CRUD UI module (PrimeNG-based components in `views/`) bound to a generated store.
- `auth` / `auth0` — opinionated authentication store + login views (mock service for `auth`, Auth0 integration for `auth0`).

When editing schematics, remember the templates under `files/` use Angular schematics template syntax (`__name@dasherize__`, `<% if (...) { %>`) — they are NOT compiled TypeScript, so don't try to typecheck them as project code.

### Build pipeline quirks

- `tsconfig.schematics.json` lives inside `dist/ngrx-entity-crud` (copied there by ng-packagr from `libs/ngrx-entity-crud/schematics/tsconfig.schematics.json` via `ng-package.json` assets). That's why `build:schematics` runs *after* the ng-packagr build and references a path under `dist/`.
- The library `package.json` (`libs/ngrx-entity-crud/package.json`) is the one actually published — its version is independent of the root `package.json`. Update both when bumping versions.

## Reference docs in this repo

- `USE-CASE.md` — worked example of consuming the library in an app (read this before changing the public API).
- `TEST.md` — manual test recipes for the schematics.
- `TODO.md` — open work; consult before starting larger refactors.
- `ngrx-entity-crud-lazy-store-plan.md` — design notes for the lazy-store work in progress on this branch.
