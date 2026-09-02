import React, { Suspense, useState } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Nav } from './Nav';
import type { Route } from './Nav';
import { Home } from '../pages/Home';
import { NotAvailable } from '../pages/NotAvailable';
import { loadRemoteComponent } from '../moduleLoader';

const ProfileModule = loadRemoteComponent('feature_profile', './routes', () => () => (
  <NotAvailable moduleName="Profile" />
));
const PortfolioModule = loadRemoteComponent('feature_portfolio', './routes', () => () => (
  <NotAvailable moduleName="Portfolio" />
));
const BlogModule = loadRemoteComponent('feature_blog', './routes', () => () => (
  <NotAvailable moduleName="Blog" />
));

export function AppShell() {
  const [route, setRoute] = useState<Route>('home');

  return (
    <div>
      <Nav active={route} onNavigate={setRoute} />
      <ErrorBoundary>
        <Suspense fallback={<div style={{ padding: '2rem' }}>Loading...</div>}>
          {route === 'home' && <Home />}
          {route === 'profile' && <ProfileModule />}
          {route === 'portfolio' && <PortfolioModule />}
          {route === 'blog' && <BlogModule />}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
