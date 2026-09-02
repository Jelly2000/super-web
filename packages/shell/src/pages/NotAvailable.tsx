import React from 'react';

interface Props {
  moduleName: string;
}

export function NotAvailable({ moduleName }: Props) {
  return (
    <div style={{ padding: '2rem', color: '#666' }}>
      <h2>{moduleName} is not available</h2>
      <p>
        This feature module hasn&apos;t been scaffolded yet, or its dev server isn&apos;t
        running. See docs/IMPLEMENTATION.md for the build order.
      </p>
    </div>
  );
}
