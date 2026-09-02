# Super Web - Central Repository

The main hub of the Super Web micro frontend ecosystem. Hosts the shell application and orchestrates feature modules from independent repositories.

## 🎯 Purpose

- **Shell Application** - Main host that loads feature modules
- **Routing & Navigation** - Central routing orchestration
- **Error Handling** - Global error boundaries and fallbacks
- **Cross-Module Communication** - Event bus and context sharing

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development mode (requires all repos running)
npm run dev

# Build production
npm run build

# Run tests
npm run test
```

## 📦 Linked Repositories

This shell consumes two other repos as npm-published, singleton-shared packages, plus one AI backend it talks to over HTTP/WebSocket:

- **component-ui-library** - UI components, published as `@jelly/component-ui-library` (singleton)
- **sw-core-engine** - Pure logic/algorithms, published as `@jelly/sw-core-engine` (singleton) — no network calls, no auth
- **sw-server** - The backend (AWS Lambda) — called directly over HTTP for auth/data/files
- **smart-agent** - AI features (AWS Lambda) — called over HTTP/WebSocket for chat & recommendations

`component-ui-library` and `sw-core-engine` are shared via Module Federation's singleton mechanism once installed from npm:

```javascript
shared: {
  react: { singleton: true },
  'react-dom': { singleton: true },
  '@jelly/component-ui-library': { singleton: true },
  '@jelly/sw-core-engine': { singleton: true },
}
```

## 📚 Architecture

```
┌─────────────────────────────────────────┐
│  Super Web Shell (App Orchestrator)     │
│  ├─ Navigation & Routing                │
│  ├─ Error Boundaries                    │
│  └─ Context Providers                   │
└────────┬────────────────────────────────┘
         │
    ┌────┴────┬──────────────┬──────────────┐
    │          │              │              │
    ▼          ▼              ▼              ▼
Feature    Feature       Feature        Smart
Profile    Portfolio     Blog           Agent
(Module)   (Module)      (Module)       (SDK)
```

## 🔧 Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start all packages in dev mode |
| `npm run build` | Build all packages for production |
| `npm run build:lib` | Build shared libraries only |
| `npm run test` | Run test suite across all packages |
| `npm run clean` | Remove build artifacts |
| `npm run lint` | Lint all code |

## 📁 Package Structure

```
packages/
├── shell/              # Main app (Port 3000)
├── feature-profile/    # Profile module (Port 3001)
├── feature-portfolio/  # Portfolio module (Port 3002)
├── feature-blog/       # Blog module (Port 3003)
└── .env.example
```

## 🌐 Environment Setup

Copy `.env.example` and configure:

```bash
SHELL_PORT=3000
PROFILE_PORT=3001
PORTFOLIO_PORT=3002
BLOG_PORT=3003

# Remote CDN URLs (for production)
VITE_COMPONENT_UI_URL=https://cdn.example.com/component-ui-library
VITE_SERVICES_URL=https://cdn.example.com/sw-core-engine
VITE_AGENT_URL=https://cdn.example.com/smart-agent
```

## 📖 Documentation

- [Architecture Guide](./docs/architecture.md)
- [Module Federation Setup](./docs/module-federation.md)
- [Ecosystem-wide Architecture](../docs/ARCHITECTURE.md) — how all 5 repos fit together
- [Implementation Roadmap](../docs/IMPLEMENTATION.md)

## 🧪 Testing Strategy

- **Unit Tests** - Per-package with Vitest
- **Integration Tests** - Module communication
- **E2E Tests** - Full app flow with Playwright
- **Performance Tests** - Load time monitoring

## 🚢 Deployment

Each package deploys independently. The shell deploys to **S3 + CloudFront** — see [docs/deployment.md](./docs/deployment.md) for the setup and the [pr-release](./.github/workflows/pr-release.yml) / [pr-closed](./.github/workflows/pr-closed.yml) / [master-release](./.github/workflows/master-release.yml) workflows for the CI/CD pipeline. Update remote URLs in the shell's webpack config to point at each deployed feature module.

## 💡 Resume Impact

This project demonstrates:
- Advanced Webpack Module Federation
- Monorepo management with npm workspaces
- Micro frontend architecture at scale
- Independent module deployment
- Scalable system design

## 📝 License

MIT
