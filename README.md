# Super Web - Central Repository

Frontend app of the Super Web ecosystem. Built with Next.js (App Router), deployed to
AWS Lambda + CloudFront via the [OpenNext](https://opennext.js.org/aws) adapter.

> **Not a Module Federation shell.** The original plan hosted independently-deployed
> `feature-profile`/`feature-portfolio`/`feature-blog` remotes via Webpack Module
> Federation. That was dropped 2026-09-06 in favor of a single Next.js app — see
> [docs/architecture.md](./docs/architecture.md) for why, and the ecosystem-wide
> [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for how this fits the other 4 repos.

## 🎯 Purpose

- **Frontend app** - Next.js App Router, SSR on Lambda
- **Routing & Navigation** - `src/app/*` route segments (profile, portfolio, blog)
- **Error Handling** - Next.js `error.tsx` boundaries per route segment
- **Session Context** - `AppProvider`/`useAppContext` holds the auth session from `sw-server`

## 🚀 Quick Start

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production Next.js build
npm run opennext:build  # OpenNext bundle for Lambda deploy (see docs/deployment.md)
npm run test
npm run type-check
```

## 📦 Linked Repositories

- **component-ui-library** - UI components, published as `@jelly2000/component-ui-library` — a
  regular npm dependency, imported normally (not federated/singleton — there's no Module
  Federation runtime here)
- **sw-core-engine** - Pure logic/algorithms, published as `@jelly2000/sw-core-engine` — no
  network calls, no auth
- **sw-server** - The backend (AWS Lambda) — called directly over HTTP for auth/data/files
- **smart-agent** - AI features (AWS Lambda) — called over HTTP/WebSocket for chat &
  recommendations

None of these are wired in yet — `super-web` currently has placeholder routes only.

## 📚 Structure

```
src/
├── app/
│   ├── layout.tsx       # Root layout — wraps everything in AppProvider + Nav
│   ├── page.tsx          # Home
│   ├── error.tsx          # Root error boundary (Next.js convention)
│   ├── profile/page.tsx   # Placeholder — not implemented yet
│   ├── portfolio/page.tsx # Placeholder — not implemented yet
│   └── blog/page.tsx      # Placeholder — not implemented yet
├── components/
│   ├── Nav.tsx            # Top nav (next/link + usePathname)
│   └── SessionStatus.tsx  # Reads AppContext, client component
├── context/AppContext.tsx # Session/JWT provider ('use client')
└── hooks/useAppContext.ts
```

## 🔧 Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production Next.js build |
| `npm run opennext:build` | Build the Lambda-ready OpenNext bundle (`.open-next/`) |
| `npm run start` | Serve the production build locally (`next start`) |
| `npm run test` | Run the Vitest suite |
| `npm run type-check` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## 📖 Documentation

- [Architecture](./docs/architecture.md) — how this app is structured, and why it's not a
  Module Federation shell
- [Deployment](./docs/deployment.md) — OpenNext + Lambda + CloudFront setup and the CI/CD
  workflows
- [Ecosystem-wide Architecture](../docs/ARCHITECTURE.md) — how all 5 repos fit together
- [Implementation Roadmap](../docs/IMPLEMENTATION.md)

## 🚢 Deployment

Deploys to **AWS Lambda + CloudFront via OpenNext** — see [docs/deployment.md](./docs/deployment.md)
for the AWS setup and the [pr-release](./.github/workflows/pr-release.yml) /
[pr-closed](./.github/workflows/pr-closed.yml) / [master-release](./.github/workflows/master-release.yml)
/ [deploy](./.github/workflows/deploy.yml) workflows for CI/CD.

## 📝 License

MIT
