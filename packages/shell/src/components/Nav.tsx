import React from 'react';

export type Route = 'home' | 'profile' | 'portfolio' | 'blog';

const LINKS: { route: Route; label: string }[] = [
  { route: 'home', label: 'Home' },
  { route: 'profile', label: 'Profile' },
  { route: 'portfolio', label: 'Portfolio' },
  { route: 'blog', label: 'Blog' },
];

interface Props {
  active: Route;
  onNavigate: (route: Route) => void;
}

export function Nav({ active, onNavigate }: Props) {
  return (
    <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid #ddd' }}>
      {LINKS.map(({ route, label }) => (
        <button
          key={route}
          type="button"
          onClick={() => onNavigate(route)}
          aria-current={active === route}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontWeight: active === route ? 700 : 400,
          }}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
