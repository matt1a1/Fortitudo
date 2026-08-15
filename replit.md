# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Fortitude App

Password-protected web app with terminal/HUD aesthetic (dark background, monospace, dynamic accent color). Published and live.

### Profiles & Passwords
| Perfil       | ID           | Senha                  |
|-------------|--------------|------------------------|
| Fortitudo   | fortitudo    | `fortitudeomelhor68`   |
| Temperantia | temperantia  | `temperantia42`        |
| Prudentia   | prudentia    | `prudentia15`          |
| Iustitia    | iustitia     | `iustitia73`           |

### Features
- **Tabs**: Fully customizable per profile — add, rename, delete. Saved server-side and shared across all users.
- **Tab storage key**: `__tabs__` inside the profile JSONB data; entries stored by tab ID
- **Persistence**: PostgreSQL via API server (`/api/profiles/:id/data`); localStorage as offline fallback
- **Cross-device sync**: Data stored server-side; all users see the same data when opening the link
- **Settings**: Gear icon (bottom-right) — dark/light mode, font size (sm/md/lg), accent color (orange/blue/green/yellow/rose/violet). Stored in `fortitude_settings_v1` localStorage key.
- **Admin backdoor**: Type `entradaADM` + Enter anywhere on the login screen → password prompt → enter `Maraca` → bypasses all profile passwords. Active only for the current session.
- **SEO**: Meta description in `index.html`; `public/robots.txt` present and valid.

### DB Tables
- `profile_data` (profile_id PK, data JSONB, updated_at) — stores all tab entries + tab config per profile
- `profile_passwords` (profile_id PK, password TEXT) — stores profile passwords

### API Routes
- `POST /api/profiles/:id/auth` — validate profile password
- `GET  /api/profiles/:id/data` — load profile data
- `PUT  /api/profiles/:id/data` — save profile data
- `PUT  /api/profiles/:id/password` — change profile password (requires old password)

### Key Files
- `artifacts/fortitude-app/src/pages/LoginPage.tsx` — login screen, profile selector, admin backdoor
- `artifacts/fortitude-app/src/pages/DashboardPage.tsx` — main dashboard with dynamic tabs
- `artifacts/fortitude-app/src/components/SettingsPanel.tsx` — settings panel + change password
- `artifacts/fortitude-app/src/contexts/SettingsContext.tsx` — theme settings, CSS vars, accent colors
- `artifacts/api-server/src/routes/` — API route handlers
- `lib/db/src/schema/` — Drizzle ORM schemas

### Production Build
API server `artifact.toml` build command runs `pnpm --filter @workspace/db run push` before building, so DB schema migrations apply automatically on every deploy.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
