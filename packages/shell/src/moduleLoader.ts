import { lazy } from 'react';
import type { ComponentType } from 'react';

declare const __webpack_init_sharing__: (scope: string) => Promise<void>;
declare const __webpack_share_scopes__: Record<string, unknown>;

interface RemoteContainer {
  init: (shareScope: unknown) => Promise<void>;
  get: (module: string) => Promise<() => unknown>;
}

declare global {
  interface Window {
    [remoteScope: string]: RemoteContainer | undefined;
  }
}

async function loadRemoteModule(scope: string, module: string, shareScope = 'default') {
  await __webpack_init_sharing__(shareScope);

  const container = window[scope];
  if (!container) {
    throw new Error(`Remote container "${scope}" is not available`);
  }

  await container.init(__webpack_share_scopes__[shareScope]);
  const factory = await container.get(module);
  return factory();
}

/**
 * Lazily loads a default-exported component from a federated remote.
 * Falls back to `onError`'s component if the remote isn't running —
 * feature modules aren't scaffolded yet, so this keeps the shell usable standalone.
 */
export function loadRemoteComponent<T extends ComponentType<unknown>>(
  scope: string,
  module: string,
  onError: () => ComponentType<unknown>
) {
  return lazy(async () => {
    try {
      const mod = (await loadRemoteModule(scope, module)) as { default?: T } | T;
      const Component = (mod as { default?: T }).default ?? (mod as T);
      return { default: Component };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[moduleLoader] failed to load ${scope}/${module}:`, err);
      return { default: onError() };
    }
  });
}
