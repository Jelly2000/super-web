import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const fromHere = (p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.mjs'],
    // The linked UI library is ESM and imports `react` — inline it so the
    // aliases below apply to it too.
    server: { deps: { inline: [/@jelly2000\/component-ui-library/, /component-ui-library/] } },
  },
  resolve: {
    alias: {
      '@': fromHere('./src'),
      // Force one React (19) even for the symlinked library, which has its own
      // React 18 dev copy. Remove once the library is a registry install.
      react: fromHere('./node_modules/react'),
      'react-dom': fromHere('./node_modules/react-dom'),
    },
  },
});
