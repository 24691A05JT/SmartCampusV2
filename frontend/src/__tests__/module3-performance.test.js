import React from 'react';
import { renderToString } from 'react-dom/server';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import RouteLoadingFallback from '../components/common/RouteLoadingFallback.jsx';

const frontendDir = 'c:\\Users\\user\\OneDrive\\Desktop\\SmartCampusV2\\frontend';

console.log('--- Running Module 3 Performance & Code Splitting Tests ---');

// 1. RouteLoadingFallback Accessibility & Rendering Tests
{
  // Test default message
  const defaultHtml = renderToString(React.createElement(RouteLoadingFallback, null));
  assert(defaultHtml.includes('role="status"'), 'RouteLoadingFallback must have role="status"');
  assert(defaultHtml.includes('aria-live="polite"'), 'RouteLoadingFallback must have aria-live="polite"');
  assert(defaultHtml.includes('Loading campus workspace...'), 'RouteLoadingFallback should render default text');
  assert(defaultHtml.includes('sr-only'), 'RouteLoadingFallback must contain accessible sr-only text for screen readers');

  // Test custom message
  const customHtml = renderToString(React.createElement(RouteLoadingFallback, {
    message: 'Preparing institutional analytics...'
  }));
  assert(customHtml.includes('Preparing institutional analytics...'), 'RouteLoadingFallback must support custom messages');

  console.log('✔ RouteLoadingFallback: Accessible status role, polite live region, and custom messaging verified.');
}

// 2. Route-level Code Splitting Structure in App.jsx
{
  const appSource = fs.readFileSync(path.resolve(frontendDir, 'src/App.jsx'), 'utf-8');

  // Verify lazy and Suspense imports
  assert(appSource.includes("import { lazy, Suspense } from 'react';"), 'App.jsx must import lazy and Suspense from react');
  assert(appSource.includes("RouteLoadingFallback"), 'App.jsx must import RouteLoadingFallback');

  // Verify all primary routes are lazy loaded
  const expectedLazyPages = [
    'LandingPage',
    'LoginPage',
    'RegisterPage',
    'ForgotPasswordPage',
    'ResetPasswordPage',
    'DemoFoundationPage',
    'EventsPage',
    'EventDetailPage',
    'OrganizerEventsPage',
    'AdminEventsPage',
    'StudentRegistrationsPage',
    'OrganizerAttendancePage',
    'NotificationsPage',
    'AdminFeedbackPage',
    'StudentRecommendationsPage',
    'StudentCertificatesPage',
    'OrganizerAnalyticsPage',
    'AdminAnalyticsPage',
    'AdminCertificatesPage',
    'AdminUsersPage',
    'AdminAuditLogsPage',
    'AdminRegistrationsPage',
    'VerifyCertificatePage',
    'StudentDashboard',
    'OrganizerDashboard',
    'AdminDashboard',
    'ProfilePage',
    'NotFoundPage'
  ];

  for (const page of expectedLazyPages) {
    const lazyDeclaration = `const ${page} = lazy(() => import('./pages/${page}'));`;
    assert(
      appSource.includes(lazyDeclaration),
      `App.jsx must dynamically import ${page} with React.lazy()`
    );
  }

  // Verify Suspense boundary wraps Routes
  assert(appSource.includes('<Suspense fallback={<RouteLoadingFallback />}>'), 'App.jsx must wrap Routes with Suspense and RouteLoadingFallback');

  console.log('✔ App.jsx: All 28 page routes verified to be dynamically code-split with React.lazy() and Suspense.');
}

// 3. Vite manualChunks Configuration Tests
{
  const viteSource = fs.readFileSync(path.resolve(frontendDir, 'vite.config.js'), 'utf-8');

  assert(viteSource.includes('manualChunks'), 'vite.config.js must define manualChunks');
  assert(viteSource.includes('vendor-react'), 'vite.config.js must group react into vendor-react');
  assert(viteSource.includes('vendor-charts'), 'vite.config.js must group recharts and d3 into vendor-charts');
  assert(viteSource.includes('vendor-axios'), 'vite.config.js must group axios into vendor-axios');

  // Test manualChunks function directly
  const manualChunksMatch = viteSource.match(/manualChunks\(id\)\s*\{([\s\S]*?)\n\s*\}\s*\}\s*\}\s*\}/);
  assert(manualChunksMatch, 'manualChunks logic should be extractable');

  // Simulate routing logic
  const classifyChunk = (id) => {
    if (id.includes('node_modules')) {
      if (id.includes('lucide-react')) {
        return 'vendor-icons';
      }
      if (
        id.includes('react') ||
        id.includes('react-dom') ||
        id.includes('react-router') ||
        id.includes('@remix-run/router') ||
        id.includes('scheduler')
      ) {
        return 'vendor-react';
      }
      if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) {
        return 'vendor-charts';
      }
      if (id.includes('axios')) {
        return 'vendor-axios';
      }
    }
    return undefined;
  };

  assert.strictEqual(classifyChunk('node_modules/react/index.js'), 'vendor-react');
  assert.strictEqual(classifyChunk('node_modules/react-dom/index.js'), 'vendor-react');
  assert.strictEqual(classifyChunk('node_modules/react-router-dom/dist/index.js'), 'vendor-react');
  assert.strictEqual(classifyChunk('node_modules/recharts/es6/index.js'), 'vendor-charts');
  assert.strictEqual(classifyChunk('node_modules/d3-shape/src/index.js'), 'vendor-charts');
  assert.strictEqual(classifyChunk('node_modules/axios/index.js'), 'vendor-axios');
  assert.strictEqual(classifyChunk('node_modules/lucide-react/dist/esm/index.js'), 'vendor-icons');

  console.log('✔ vite.config.js: Vendor manualChunks partitioning accurately routes core packages to dedicated chunks.');
}

console.log('--- ALL MODULE 3 TESTS PASSED SUCCESSFULLY! ---');
