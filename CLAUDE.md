# Super Web - Main Repository

Frontend app of the Super Web ecosystem.

**Purpose:** Next.js app — routing, session context, (eventually) auth/data UI
**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, deployed to AWS Lambda +
CloudFront via OpenNext
**Status:** In Development

---

## Not a Module Federation shell

Earlier plans had this repo host independently-deployed `feature-profile`/`feature-portfolio`/
`feature-blog` remotes via Webpack Module Federation. That was dropped 2026-09-06: deploying
to Lambda via OpenNext, plus none of those feature-module repos existing yet, made a federated
multi-remote host not worth the added complexity. `profile`/`portfolio`/`blog` are plain
route segments inside this one Next.js app for now. If independent per-feature deploys become
worth it later, that's a decision to revisit deliberately — not something to silently
reintroduce.

---

## Repository Structure

```
super-web/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── error.tsx
│   │   ├── profile/page.tsx     # placeholder
│   │   ├── portfolio/page.tsx   # placeholder
│   │   └── blog/page.tsx        # placeholder
│   ├── components/
│   ├── context/
│   └── hooks/
├── docs/
├── .github/workflows/    # deploy.yml (reusable), pr-release, pr-closed, master-release
├── next.config.ts
├── package.json
└── README.md
```

---

## Dependencies (not wired in yet)

| Package | Purpose | Repo |
|---------|---------|------|
| @jelly2000/component-ui-library | UI components | component-ui-library |
| @jelly2000/sw-core-engine | Pure logic/algorithms (no network calls) | sw-core-engine |

Both are consumed as plain npm dependencies (`import { X } from '@jelly2000/...'`) once added —
there's no Module Federation runtime here, so no singleton-sharing config is needed.

Auth, user, project, and blog data come from `sw-server`'s REST API directly — feature pages
call it with a plain HTTP client.

---

## Development

```bash
npm install
npm run dev              # :3000
npm run build            # next build
npm run opennext:build   # Lambda-ready bundle — see docs/deployment.md
npm run test
```

---

## Key Components

### AppProvider / useAppContext (`src/context`, `src/hooks`)
Holds the session (`user`, `token`) obtained from `sw-server`'s auth API. Client component —
wraps the whole app from the root layout.

### Nav (`src/components/Nav.tsx`)
Top navigation using `next/link` + `usePathname`.

### error.tsx (Next.js convention)
Root error boundary — App Router calls this automatically on a thrown render error, no
manual React error-boundary component needed.

---

## Next Steps

- [ ] Add `@jelly2000/component-ui-library` and `@jelly2000/sw-core-engine` once they're published
- [ ] Auth flow against `sw-server` (login, token storage, refresh)
- [ ] Build out `/profile`, `/portfolio`, `/blog` for real
- [ ] Provision the AWS resources in [docs/deployment.md](./docs/deployment.md) and confirm a
      real deploy end-to-end
