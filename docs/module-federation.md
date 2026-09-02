# Module Federation Setup Guide

## What is Module Federation?

Module Federation is a Webpack 5+ feature that enables:
- Runtime dynamic module loading
- Shared dependency resolution
- Independent application deployment
- True micro frontend architecture

## Installation

### 1. Install Dependencies

```bash
npm install webpack@^5.89.0 webpack-cli@^5.1.0
npm install @module-federation/enhanced
npm install -D webpack-dev-server
```

### 2. Shell Application Configuration

The shell acts as the host and loads feature modules. It also shares the two external singleton packages (`component-ui-library`, `sw-core-engine`) so every feature module gets the same instance.

**webpack.config.js:**

```javascript
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: __dirname + '/dist',
    filename: '[name].[contenthash].js',
  },
  devServer: {
    port: 3000,
    historyApiFallback: true,
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      filename: 'remoteEntry.js',
      remotes: {
        '@feature-profile': 'feature_profile@http://localhost:3001/remoteEntry.js',
        '@feature-portfolio': 'feature_portfolio@http://localhost:3002/remoteEntry.js',
        '@feature-blog': 'feature_blog@http://localhost:3003/remoteEntry.js',
      },
      exposes: {
        './AppShell': './src/AppShell',
        './useAppContext': './src/hooks/useAppContext',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0' },
        '@jelly/component-ui-library': { singleton: true },
        '@jelly/sw-core-engine': { singleton: true },
      },
    }),
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react', '@babel/preset-env'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};
```

### 3. Feature Module Configuration

Feature modules expose their routes and components, and consume the shared singleton packages from the shell's share scope (they don't bundle their own copies).

**packages/feature-profile/webpack.config.js:**

```javascript
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: __dirname + '/dist',
    filename: '[name].[contenthash].js',
  },
  devServer: {
    port: 3001,
    historyApiFallback: true,
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'feature_profile',
      filename: 'remoteEntry.js',
      exposes: {
        './routes': './src/routes',
        './ProfileProvider': './src/context/ProfileProvider',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0' },
        '@jelly/component-ui-library': { singleton: true },
        '@jelly/sw-core-engine': { singleton: true },
      },
    }),
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
    ],
  },
};
```

## Runtime Module Loading

### Loading a Feature Module

```javascript
// src/moduleLoader.js
export const loadModule = async (scope, module, shareScope = 'default') => {
  // Initialize the share scope
  await __webpack_init_sharing__(shareScope);

  const container = window[scope];
  if (!container) {
    throw new Error(`Container ${scope} not found`);
  }

  // Initialize the container
  await container.init(__webpack_share_scopes__[shareScope]);

  const factory = await window[scope].get(module);
  return factory();
};
```

### Using Dynamic Imports

```javascript
// src/shell/Shell.jsx
import { Suspense, lazy } from 'react';

const ProfileModule = lazy(() =>
  import('@feature-profile/routes').then((module) => ({
    default: module.default || module,
  }))
);

export const Shell = () => (
  <div>
    <Suspense fallback={<div>Loading...</div>}>
      <ProfileModule />
    </Suspense>
  </div>
);
```

## Shared Dependencies Strategy

### Level 1: Framework (React, React-DOM)
Always share with singleton mode to prevent version conflicts.

### Level 2: External Packages (`@jelly/component-ui-library`, `@jelly/sw-core-engine`)
Version-pinned, npm-published, shared as singletons.

### Level 3: Feature-Specific
Not shared; each feature bundles its own dependencies.

## Development Server Setup

### Start All Modules

```bash
# In separate terminals
npm run dev --workspace packages/shell             # :3000
npm run dev --workspace packages/feature-profile   # :3001
npm run dev --workspace packages/feature-portfolio # :3002
npm run dev --workspace packages/feature-blog      # :3003
```

Run `component-ui-library`'s Storybook (`:6006`) from its own repo.

### Or Use Concurrently

```json
{
  "scripts": {
    "dev": "concurrently \"npm:dev:*\"",
    "dev:shell": "cd packages/shell && npm run dev",
    "dev:profile": "cd packages/feature-profile && npm run dev",
    "dev:portfolio": "cd packages/feature-portfolio && npm run dev",
    "dev:blog": "cd packages/feature-blog && npm run dev"
  }
}
```

## Production Build

### Build All Packages

```bash
npm run build --workspaces
```

### Deploy Strategy

1. Publish `component-ui-library` and `sw-core-engine` to npm first
2. Bump their versions in each package.json that depends on them
3. Build the shell application
4. Build feature modules independently
5. Sync `dist/` to S3 and invalidate CloudFront — see [deployment.md](./deployment.md)

## Troubleshooting

### "Module not found" errors

Check that:
- Remote module is running on correct port
- `remoteEntry.js` is accessible
- Module name matches in `remotes` config

### Shared dependency version conflicts

Verify:
- `singleton: true` is set for shared packages
- All modules declare the same shared dependencies
- Version ranges are compatible

### Slow module loading

Optimize:
- Reduce bundle size per module
- Use code splitting for large modules
- Enable gzip compression
- Implement proper caching headers

## Next Steps

1. Create shell application scaffold
2. Create first feature module
3. Publish `component-ui-library` v0.1.0 and wire it in as a remote singleton
4. ~~Setup automatic deployment~~ — done, see [deployment.md](./deployment.md) and `.github/workflows/`
