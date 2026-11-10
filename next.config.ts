import path from "node:path";
import type { NextConfig } from "next";

// Deployed via @opennextjs/aws (see docs/deployment.md) — no special `output`
// mode needed here; OpenNext builds straight from the standard Next.js output.
const nextConfig: NextConfig = {
  transpilePackages: ["@jelly2000/component-ui-library"],
  // The UI library is currently linked via `file:../component-ui-library`
  // (symlink), so Turbopack must be allowed to read outside this folder, and
  // `react` must resolve to super-web's copy (React 19), not the library's own
  // dev copy (React 18) — two Reacts breaks rendering. Remove both once the
  // package is installed from GitHub Packages instead of a local link.
  turbopack: {
    root: path.resolve(__dirname, ".."),
    resolveAlias: {
      react: "./node_modules/react",
      "react-dom": "./node_modules/react-dom",
    },
  },
};

export default nextConfig;
