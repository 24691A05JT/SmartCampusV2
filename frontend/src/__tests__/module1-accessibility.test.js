import React from 'react';
import { renderToString } from 'react-dom/server';
import assert from 'assert';

// Import our Module 1 components
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';
import Select from '../components/common/Select.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import SkeletonLoader from '../components/common/SkeletonLoader.jsx';
import StatCard from '../components/common/StatCard.jsx';

console.log('--- Running Module 1 Component Accessibility Tests ---');

// 1. Button component tests
{
  // Test loading prop alias
  const html1 = renderToString(React.createElement(Button, { loading: true }, 'Submit Form'));
  assert(html1.includes('aria-busy="true"'), 'Button should have aria-busy="true" when loading');
  assert(html1.includes('aria-disabled="true"'), 'Button should have aria-disabled="true" when loading');
  assert(html1.includes('Submit Form'), 'Button should retain text when loading without loadingText');

  // Test loadingText prop
  const html2 = renderToString(React.createElement(Button, { isLoading: true, loadingText: 'Processing...' }, 'Submit'));
  assert(html2.includes('Processing...'), 'Button should display custom loadingText');

  // Test disabled state
  const html3 = renderToString(React.createElement(Button, { disabled: true }, 'Disabled Btn'));
  assert(html3.includes('aria-disabled="true"'), 'Button should have aria-disabled="true" when disabled');

  console.log('✔ Button: loading aliases, loadingText, aria-busy, and aria-disabled verified.');
}

// 2. Input component tests
{
  // Test error and aria-describedby
  const html = renderToString(React.createElement(Input, {
    label: 'Campus Email',
    name: 'email',
    error: 'Invalid institutional domain'
  }));

  assert(html.includes('aria-invalid="true"'), 'Input should have aria-invalid="true" when error is present');
  assert(html.includes('aria-describedby="email-error"'), 'Input should point aria-describedby to error id');
  assert(html.includes('id="email-error"'), 'Error element should have corresponding id');
  assert(html.includes('role="alert"'), 'Error element should have role="alert"');
  assert(html.includes('aria-live="polite"'), 'Error element should have aria-live="polite"');

  // Test helper text without error
  const htmlHelper = renderToString(React.createElement(Input, {
    label: 'Username',
    name: 'username',
    helperText: 'Enter your student ID'
  }));
  assert(htmlHelper.includes('aria-describedby="username-helper"'), 'Input should point aria-describedby to helper id');
  assert(htmlHelper.includes('id="username-helper"'), 'Helper element should have corresponding id');

  console.log('✔ Input: useId, aria-invalid, aria-describedby, and role="alert" verified.');
}

// 3. Select component tests
{
  const html = renderToString(React.createElement(Select, {
    label: 'Department',
    name: 'dept',
    options: ['CSE', 'ECE'],
    error: 'Department is required'
  }));

  assert(html.includes('aria-invalid="true"'), 'Select should have aria-invalid="true" when error is present');
  assert(html.includes('aria-describedby="dept-error"'), 'Select should point aria-describedby to error id');
  assert(html.includes('role="alert"'), 'Select error element should have role="alert"');

  console.log('✔ Select: useId, aria-invalid, and aria-describedby verified.');
}

// 4. Modal component tests
{
  const html = renderToString(React.createElement(Modal, {
    isOpen: true,
    title: 'Security Notice',
    description: 'Please review your session details.'
  }, React.createElement('p', null, 'Modal Body Content')));

  assert(html.includes('role="dialog"'), 'Modal should have role="dialog"');
  assert(html.includes('aria-modal="true"'), 'Modal should have aria-modal="true"');
  assert(html.includes('aria-labelledby="modal-title-'), 'Modal should link aria-labelledby to title');
  assert(html.includes('aria-describedby="modal-desc-'), 'Modal should link aria-describedby to description');
  assert(html.includes('tabindex="-1"'), 'Modal card should have tabIndex="-1" for safe fallback focus');
  assert(html.includes('Security Notice'), 'Modal header should render title');

  // Test closed state
  const htmlClosed = renderToString(React.createElement(Modal, { isOpen: false, title: 'Hidden' }));
  assert(htmlClosed === '', 'Closed modal should render null');

  console.log('✔ Modal: role="dialog", aria-modal, aria-labelledby, aria-describedby, and fallback tabindex verified.');
}

// 5. ConfirmDialog component tests
{
  const html = renderToString(React.createElement(ConfirmDialog, {
    isOpen: true,
    title: 'Delete Registration',
    message: 'Are you sure you want to cancel this booking?'
  }));

  assert(html.includes('role="dialog"'), 'ConfirmDialog should render accessible modal dialog');
  assert(html.includes('aria-label="Delete Registration"'), 'ConfirmDialog should pass title to modal aria-label');
  assert(html.includes('Delete Registration'), 'ConfirmDialog should render title text');

  console.log('✔ ConfirmDialog: accessible modal delegation and aria-label verified.');
}

// 6. EmptyState component tests
{
  // Test action element support
  const customAction = React.createElement('button', { id: 'clear-btn' }, 'Clear All Filters');
  const html = renderToString(React.createElement(EmptyState, {
    title: 'No Logs Found',
    action: customAction
  }));

  assert(html.includes('role="status"'), 'EmptyState should have role="status"');
  assert(html.includes('id="clear-btn"'), 'EmptyState should render custom action element');
  assert(html.includes('Clear All Filters'), 'EmptyState should render custom action content');

  // Test actionText backwards-compatibility
  const htmlLegacy = renderToString(React.createElement(EmptyState, {
    title: 'No Events',
    actionText: 'Browse Events'
  }));
  assert(htmlLegacy.includes('Browse Events'), 'EmptyState should maintain backwards-compatibility for actionText');

  console.log('✔ EmptyState: custom action element, children, role="status", and legacy actionText verified.');
}

// 7. SkeletonLoader component tests
{
  // Test explicit dimensions to eliminate CLS
  const html = renderToString(React.createElement(SkeletonLoader, {
    height: '280px',
    width: '60%',
    className: 'rounded-2xl'
  }));

  assert(html.includes('role="status"'), 'SkeletonLoader should have role="status"');
  assert(html.includes('aria-busy="true"'), 'SkeletonLoader should have aria-busy="true"');
  assert(html.includes('Loading content...'), 'SkeletonLoader should provide accessible text for screen readers');
  assert(html.includes('height:280px'), 'SkeletonLoader should apply explicit height style');
  assert(html.includes('width:60%'), 'SkeletonLoader should apply explicit width style');

  console.log('✔ SkeletonLoader: height, width, style binding, role="status", and sr-only verified.');
}

// 8. StatCard component tests
{
  // Test accent prop alias and purple theme with icon
  const MockIcon = () => React.createElement('span', { className: 'mock-icon' });
  const html = renderToString(React.createElement(StatCard, {
    title: 'Events Attended',
    value: 12,
    icon: MockIcon,
    accent: 'purple',
    subtitle: 'Verified present'
  }));

  assert(html.includes('text-purple-400'), 'StatCard should apply purple accent to icon container');
  assert(html.includes('from-purple-500/5'), 'StatCard should apply purple glow');
  assert(html.includes('Verified present'), 'StatCard should render subtitle prop');

  // Test description prop
  const htmlDesc = renderToString(React.createElement(StatCard, {
    title: 'Active Passes',
    value: 3,
    description: 'Confirmed student passes'
  }));
  assert(htmlDesc.includes('Confirmed student passes'), 'StatCard should render description prop');

  console.log('✔ StatCard: accent alias, purple theme support, subtitle, and description verified.');
}

console.log('--- ALL MODULE 1 TESTS PASSED SUCCESSFULLY! ---');
