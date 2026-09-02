# Super Web - Main Repository

Central orchestrator for the Super Web micro frontend ecosystem.

**Purpose:** Shell application, routing, and cross-module communication  
**Tech Stack:** React 19, Module Federation, Webpack 5  
**Status:** In Development

---

## Repository Structure

```
super-web/
├── packages/
│   ├── shell/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── pages/
│   │   │   └── App.jsx
│   │   ├── webpack.config.js
│   │   └── package.json
│   ├── feature-profile/
│   ├── feature-portfolio/
│   └── feature-blog/
├── docs/
├── CLAUDE.md
├── package.json
└── README.md
```

---

## Module Federation Remotes

```javascript
remotes: {
  '@feature-profile': 'feature_profile@...',
  '@feature-portfolio': 'feature_portfolio@...',
  '@feature-blog': 'feature_blog@...',
}

shared: {
  react: { singleton: true },
  'react-dom': { singleton: true },
  '@jelly/component-ui-library': { singleton: true },
  '@jelly/sw-core-engine': { singleton: true },
}
```

---

## Workspace Dependencies

| Package | Purpose | Repo |
|---------|---------|------|
| @jelly/component-ui-library | UI components | component-ui-library |
| @jelly/sw-core-engine | Pure logic/algorithms (no network calls) | sw-core-engine |
| @super-web/smart-agent (client) | AI features, called over HTTP/WebSocket | smart-agent |

Auth, user, project, and blog data come from `sw-server`'s REST API directly — there is no npm package for it, feature modules call it with a plain HTTP client.

---

## Development

```bash
npm install
npm run dev        # Start shell + all features
npm run build      # Build all packages
npm run test       # Run test suite
```

---

## Key Components

### AppShell
Main wrapper providing navigation, layout, and routing orchestration.

### Module Router
Dynamically loads feature modules based on routes.

### Error Boundary
Catches and reports errors from feature modules.

### Context Providers
Shares global state across all modules.

---

## Next Steps

- [ ] Setup local development environment
- [ ] Connect Module Federation remotes
- [ ] Implement AppShell component
- [ ] Create first feature module scaffold
