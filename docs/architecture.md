# super-web Architecture

## Overview

`super-web` is a single Next.js (App Router) app, deployed to AWS Lambda + CloudFront via
the [OpenNext](https://opennext.js.org/aws) adapter (see [deployment.md](./deployment.md)).

**This used to be a Webpack Module Federation shell** hosting independently-deployed
`feature-profile`/`feature-portfolio`/`feature-blog` remotes. That was dropped 2026-09-06:
none of those feature-module repos exist yet, and OpenNext's Lambda-based deployment doesn't
pair naturally with a federated multi-remote frontend anyway. If per-feature independent
deploys become worth the complexity later, that's a deliberate architecture decision to
revisit — not something to quietly rebuild piecemeal.

## Current structure

`profile`, `portfolio`, and `blog` are plain route segments (`src/app/profile/page.tsx`,
etc.) inside this one app — placeholders today, real pages later. There's no runtime module
loading, no remote entry points, no shared-dependency singleton config: it's a normal
Next.js app.

```
src/app/
├── layout.tsx     # AppProvider (session context) + Nav, wraps every route
├── page.tsx        # Home
├── error.tsx        # Root error boundary (Next.js convention, not a hand-rolled one)
├── profile/page.tsx
├── portfolio/page.tsx
└── blog/page.tsx
```

## External Package Layer

Code shared across the ecosystem, versioned and published independently — not part of this
repo:

| Package | Repo | Purpose |
|---|---|---|
| `@jelly2000/component-ui-library` | `component-ui-library` | UI components, design tokens |
| `@jelly2000/sw-core-engine` | `sw-core-engine` | Pure algorithms/utilities — **no API calls** |

Neither is added yet. Once they are, they're consumed as ordinary npm dependencies
(`import { Button } from '@jelly2000/component-ui-library'`) — no singleton-sharing mechanism
needed since there's no Module Federation runtime.

## Data Flow

```
User Action
    ↓
A route/page (e.g. src/app/profile)
    ↓
HTTP call to sw-server (auth, data, files)
    ↓
sw-server (AWS Lambda) → DynamoDB / S3 / SES
    ↓
Response → local state update → re-render
```

Pure client-side calculations (formatting, validation, game/calendar logic) go through
`sw-core-engine` directly in the browser once it's added — no network round trip.

## Session Context

The root layout wraps the app in `AppProvider` (`src/context/AppContext.tsx`), which holds
the session (`user`, `token`) obtained from `sw-server`'s auth API and exposes it via
`useAppContext()` to any client component that needs it (see `src/components/SessionStatus.tsx`
for the pattern — keep the context read in a small client component rather than making whole
pages client components just to read the session).

## Rendering & Deployment

Every route currently prerenders as fully static content (confirmed via `next build`'s route
output — all routes show `○ (Static)`), since nothing calls `sw-server` yet. Once
data-fetching / auth is added, some routes will become dynamic (SSR) — that's exactly what
the OpenNext Lambda deployment exists for. See [deployment.md](./deployment.md) for the
full Lambda + CloudFront setup and the CI/CD workflows that build and deploy it.

## Testing Strategy

- **Unit/Component tests** - Vitest + Testing Library (`npm run test`)
- **Type checking** - `npm run type-check`
- E2E/Playwright: not set up yet — add when there's enough real UI flow to justify it
