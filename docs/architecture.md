# Micro Frontend Architecture

## Overview

This project implements a **Module Federation** based micro frontend architecture that enables independent development, testing, and deployment of multiple frontend applications.

`super-web` is the shell repository. It consumes two other repositories as external, versioned dependencies rather than internal workspace packages:

- **`component-ui-library`** — published as `@jelly/component-ui-library`, singleton-shared UI components
- **`sw-core-engine`** — published as `@jelly/sw-core-engine`, singleton-shared pure logic/utilities (no network calls — see [sw-core-engine/README.md](../../sw-core-engine/README.md))

## Core Concepts

### Shell Application
The host application that orchestrates and loads feature modules dynamically at runtime.

**Responsibilities:**
- Provides global navigation and layout
- Manages routing between feature modules
- Holds the authenticated user's session/token (obtained from `sw-server`) and shares it via context
- Shares common dependencies (React, `@jelly/component-ui-library`, `@jelly/sw-core-engine`)

### Feature Modules
Independent, self-contained applications that run within the shell (`feature-profile`, `feature-portfolio`, `feature-blog`).

**Characteristics:**
- Can be developed in isolation
- Independently deployable
- Own routing and local state
- Call `sw-server` directly over HTTP for data (auth, projects, posts, files)
- Use `sw-core-engine` only for local, non-network calculations (formatting, validation, game/calendar logic)
- Consume `component-ui-library` for UI

### External Package Layer
Code shared across the shell and every feature module, but versioned and published independently — not part of this monorepo's workspaces.

| Package | Repo | Purpose |
|---|---|---|
| `@jelly/component-ui-library` | `component-ui-library` | UI components, design tokens |
| `@jelly/sw-core-engine` | `sw-core-engine` | Pure algorithms/utilities — **no API calls** |

## Module Federation Architecture

### Webpack Module Federation

Uses Webpack 5's native Module Federation to enable runtime module loading:

```
Shell Application
├── Exposes: App shell, navigation
├── Consumes: Feature modules (remote)
└── Shared: React, component-ui-library, sw-core-engine

Feature Modules (Remote)
├── Exposes: Routes, components
├── Consumes: Shared singleton packages
└── Independent: Local state, logic, own sw-server API calls
```

### Shared Dependencies

Prevents duplication by sharing heavy dependencies as npm-published singletons:

```javascript
// webpack.config.js
shared: {
  react: { singleton: true, requiredVersion: '^18.0' },
  'react-dom': { singleton: true, requiredVersion: '^18.0' },
  '@jelly/component-ui-library': { singleton: true },
  '@jelly/sw-core-engine': { singleton: true },
}
```

## Data Flow

```
User Action
    ↓
Feature Module
    ↓
HTTP call to sw-server (auth, data, files)
    ↓
sw-server (AWS Lambda) → DynamoDB / S3 / SES
    ↓
Response
    ↓
Feature Module (update local state)
    ↓
UI Re-render
```

Pure client-side calculations (e.g. formatting a date, validating a form field, scoring a game) go through `sw-core-engine` directly in the browser — no network round trip.

## Communication Between Modules

### Event-Based Communication
Features communicate via a shell-provided event emitter:

```javascript
// In feature-profile
import { eventBus } from './shell-context';
eventBus.emit('user:updated', userData);

// In feature-portfolio
eventBus.on('user:updated', (data) => {
  // React to changes
});
```

### Shared Session Context
The shell holds the authenticated session (JWT from `sw-server`) and exposes it via context:

```javascript
// In shell
export const useAppContext = () => {
  const [user, setUser] = useState(null);
  return { user, setUser };
};
```

## Development Workflow

### Local Development

All packages run in development mode with hot reload:

```bash
npm run dev
```

Each package serves on its own port:
- Shell: `http://localhost:3000`
- Feature Profile: `http://localhost:3001`
- Feature Portfolio: `http://localhost:3002`
- Feature Blog: `http://localhost:3003`
- Component UI Library (Storybook): `http://localhost:6006`
- sw-server (local API): `http://localhost:3500` (Serverless Offline)

### Monorepo Structure

Using npm workspaces for package management **within this repo only** (`packages/shell`, `packages/feature-*`):

```bash
# Install all dependencies
npm install

# Run scripts in all workspaces
npm run build --workspaces

# Run script in specific workspace
npm run dev --workspace packages/shell
```

## Deployment Strategy

### Independent Deployment

Each feature module deploys independently to a CDN. The shell deploys to S3 + CloudFront — see [deployment.md](./deployment.md):

```
CDN Structure:
├── shell/ (latest version)
├── feature-profile/ (v1.2.3)
├── feature-portfolio/ (v2.0.1)
└── feature-blog/ (v1.0.0)
```

### Versioning

Semantic versioning per module:
- **Major**: Breaking API changes
- **Minor**: New features (backward compatible)
- **Patch**: Bug fixes

### Health Checks

Before loading a remote module:

```javascript
// Check if module is healthy
const isHealthy = async (moduleUrl) => {
  try {
    const response = await fetch(`${moduleUrl}/health.json`);
    return response.ok;
  } catch {
    return false;
  }
};
```

## Isolation & Security

### Sandboxing

Each feature module is scoped to prevent naming conflicts:

```javascript
// Scoped CSS
.feature-profile { /* Only affects profile module */ }

// Scoped global state
const profileState = useContext(ProfileContext);
```

### XSS Prevention

- Sanitize user input before rendering
- Use React's built-in escaping
- Content Security Policy headers

## Performance Optimization

### Code Splitting

- Shell: Essential code only (~150KB gzipped)
- Features: Lazy-loaded on-demand
- Shared packages: Deduplicated across modules via singleton sharing

### Caching Strategy

```
Shell: Cache-Control: max-age=3600
Features: Cache-Control: max-age=31536000 (versioned)
```

## Monitoring & Debugging

### Error Tracking

```javascript
// Global error handler
window.addEventListener('error', (event) => {
  trackError({
    module: getCurrentModule(),
    error: event.error,
    timestamp: Date.now(),
  });
});
```

### Performance Monitoring

```javascript
// Track module load time
performance.mark(`module-load-${moduleName}`);
// ... load module
performance.measure(`module-load-${moduleName}`);
```

## Trade-offs

| Benefit | Trade-off |
|---------|-----------|
| Independent deployment | Coordination complexity |
| Scalability | Increased bundle size |
| Team autonomy | Shared dependency management |
| Resilience | Network latency for module loading |
