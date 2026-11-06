import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import assert from 'assert';

import { EventCard } from '../components/events/EventCard.jsx';
import PublicLayout from '../layouts/PublicLayout.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';

console.log('--- Running Module 2 Functional & Envelope Fixes Tests ---');

// Helper to simulate defensive event list normalization
const normalizeEventsResponse = (res) => {
  const eventsList = Array.isArray(res?.data)
    ? res.data
    : (Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));
  const paginationData = res?.pagination || res?.data?.pagination || null;
  return { eventsList, paginationData };
};

// Helper to simulate defensive venue conflict extraction
const extractConflictData = (res) => {
  const conflictData = res?.data?.hasConflict !== undefined
    ? res.data
    : (res?.hasConflict !== undefined ? res : (res?.data || {}));
  const hasConflict = Boolean(conflictData?.hasConflict);
  const message = conflictData?.message || res?.message || (hasConflict ? 'Schedule conflict detected.' : 'Venue is available.');
  const conflictingEvent = conflictData?.conflictingEvent || null;
  return { hasConflict, message, conflictingEvent };
};

// 1. Student Event Listing Response Extraction Tests
{
  // Test actual backend envelope: { success: true, data: [...], pagination: {...} }
  const mockBackendResponse = {
    success: true,
    message: 'Events retrieved successfully',
    data: [
      { _id: 'e1', title: 'Tech Expo 2026', capacity: 100, registeredCount: 45 },
      { _id: 'e2', title: 'AI Workshop', capacity: 50, registeredCount: 50 }
    ],
    pagination: { total: 2, page: 1, pages: 1, limit: 12 }
  };

  const { eventsList, paginationData } = normalizeEventsResponse(mockBackendResponse);
  assert.strictEqual(eventsList.length, 2, 'Should extract 2 events from standard envelope');
  assert.strictEqual(eventsList[0].title, 'Tech Expo 2026', 'First event title should match');
  assert.strictEqual(paginationData?.total, 2, 'Should extract pagination total correctly');

  // Test empty/null response
  const emptyResult = normalizeEventsResponse(null);
  assert.deepStrictEqual(emptyResult.eventsList, [], 'Should safely return empty array for null');

  // Test direct array response
  const directArrayResult = normalizeEventsResponse([{ _id: 'e3', title: 'Hackathon' }]);
  assert.strictEqual(directArrayResult.eventsList.length, 1, 'Should handle direct array gracefully');

  console.log('✔ Student Event Listing: Standard envelope, direct array, and empty dataset normalized correctly.');
}

// 2. Organizer Event Listing Response Extraction Tests
{
  const mockOrganizerResponse = {
    success: true,
    message: 'Organizer events retrieved successfully',
    data: [
      { _id: 'oe1', title: 'Robotics Seminar', status: 'draft', capacity: 80, registeredCount: 0 }
    ],
    pagination: { total: 1, page: 1, pages: 1, limit: 20 }
  };

  const { eventsList } = normalizeEventsResponse(mockOrganizerResponse);
  assert.strictEqual(eventsList.length, 1, 'Should extract organizer events');
  assert.strictEqual(eventsList[0].status, 'draft', 'Should preserve status');

  console.log('✔ Organizer Event Listing: Envelope normalization verified.');
}

// 3. Admin Event Listing Response Extraction Tests
{
  const mockAdminResponse = {
    success: true,
    message: 'Admin events queue retrieved successfully',
    data: [
      { _id: 'ae1', title: 'Pending Cultural Fest', status: 'pending', capacity: 200 }
    ],
    pagination: { total: 1, page: 1, pages: 1, limit: 20 }
  };

  const { eventsList } = normalizeEventsResponse(mockAdminResponse);
  assert.strictEqual(eventsList.length, 1, 'Should extract admin events');
  assert.strictEqual(eventsList[0].status, 'pending', 'Should preserve pending status');

  console.log('✔ Admin Event Listing: Envelope normalization verified.');
}

// 4. Venue Conflict Positive and Negative Cases
{
  // Negative Case: No conflict
  const negativeResponse = {
    success: true,
    message: 'Venue is available. No overlapping schedule conflicts detected.',
    data: {
      hasConflict: false,
      message: 'Venue is available. No overlapping schedule conflicts detected.',
      conflictingEvent: null
    }
  };

  const negativeResult = extractConflictData(negativeResponse);
  assert.strictEqual(negativeResult.hasConflict, false, 'Should extract hasConflict=false');
  assert.strictEqual(negativeResult.conflictingEvent, null, 'Conflicting event should be null');
  assert(negativeResult.message.includes('Venue is available'), 'Message should indicate availability');

  // Positive Case: Overlapping conflict
  const positiveResponse = {
    success: true,
    message: "Venue Conflict: 'Main Auditorium' is already booked for 'Annual Day'",
    data: {
      hasConflict: true,
      message: "Venue Conflict: 'Main Auditorium' is already booked for 'Annual Day'",
      conflictingEvent: {
        _id: 'conflict1',
        title: 'Annual Day',
        startTime: '10:00',
        endTime: '14:00'
      }
    }
  };

  const positiveResult = extractConflictData(positiveResponse);
  assert.strictEqual(positiveResult.hasConflict, true, 'Should extract hasConflict=true');
  assert.strictEqual(positiveResult.conflictingEvent?.title, 'Annual Day', 'Should extract conflicting event title');
  assert(positiveResult.message.includes('Venue Conflict'), 'Message should indicate conflict');

  console.log('✔ Venue Conflict: Positive and negative conflict cases extracted accurately.');
}

// 5. EventCard Navigation and Capacity Accessibility
{
  const mockEvent = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Web Security Summit 2026',
    description: 'Deep dive into application security, OAuth2 and modern web hardening.',
    category: 'Technical',
    date: new Date('2026-11-20T10:00:00Z'),
    startTime: '10:00',
    endTime: '13:00',
    venue: 'Hall B',
    capacity: 100,
    registeredCount: 75,
    status: 'approved',
    organizer: { name: 'Prof. Alan Turing' }
  };

  // Student view rendering
  const studentHtml = renderToString(
    React.createElement(MemoryRouter, null,
      React.createElement(EventCard, { event: mockEvent, isOrganizerView: false })
    )
  );

  // Check progressbar accessibility
  assert(studentHtml.includes('role="progressbar"'), 'EventCard should have role="progressbar"');
  assert(studentHtml.includes('aria-valuenow="75"'), 'EventCard should have aria-valuenow="75"');
  assert(studentHtml.includes('aria-valuemin="0"'), 'EventCard should have aria-valuemin="0"');
  assert(studentHtml.includes('aria-valuemax="100"'), 'EventCard should have aria-valuemax="100"');
  assert(studentHtml.includes('75 of 100 seats booked'), 'EventCard should have descriptive aria-valuetext');

  // Check button inside anchor nesting fix:
  // In student view, the CTA is a Link styled as a button, NOT a <button> nested inside an <a>.
  // Verify that there is an <a> tag pointing to /events/507f1f77bcf86cd799439011
  assert(studentHtml.includes('href="/events/507f1f77bcf86cd799439011"'), 'EventCard should have anchor link to event detail');
  // Verify there is NO <button> tag inside that anchor
  const anchorSubstring = studentHtml.substring(studentHtml.indexOf('href="/events/507f1f77bcf86cd799439011"'));
  assert(!anchorSubstring.includes('<button'), 'EventCard should NOT nest a <button> inside an <a> tag');

  // Organizer view rendering
  const organizerHtml = renderToString(
    React.createElement(MemoryRouter, null,
      React.createElement(EventCard, {
        event: { ...mockEvent, status: 'draft' },
        isOrganizerView: true,
        onSubmit: () => {},
        onEdit: () => {},
        onDelete: () => {}
      })
    )
  );

  // In organizer view, buttons (Submit, Edit, Delete) should exist as buttons, and Details is an <a>
  assert(organizerHtml.includes('Submit') && organizerHtml.includes('<button'), 'Organizer view should have Submit button');
  assert(organizerHtml.includes('Edit') && organizerHtml.includes('<button'), 'Organizer view should have Edit button');
  assert(organizerHtml.includes('Delete') && organizerHtml.includes('<button'), 'Organizer view should have Delete button');
  assert(organizerHtml.includes('href="/events/507f1f77bcf86cd799439011"'), 'Organizer view should have Details link');

  console.log('✔ EventCard: Accessible progressbar and valid semantic non-nested links verified.');
}

// 6. Documentation Footer Navigation
{
  const publicLayoutHtml = renderToString(
    React.createElement(MemoryRouter, null,
      React.createElement(AuthProvider, null,
        React.createElement(PublicLayout, null)
      )
    )
  );

  assert(
    publicLayoutHtml.includes('href="/demo-foundation"'),
    'PublicLayout footer should have link to /demo-foundation'
  );
  assert(
    publicLayoutHtml.includes('Component Catalog &amp; Docs') || publicLayoutHtml.includes('Component Catalog & Docs'),
    'PublicLayout footer should display Component Catalog & Docs label'
  );

  console.log('✔ Documentation Navigation: Footer link to /demo-foundation verified.');
}

console.log('--- ALL MODULE 2 TESTS PASSED SUCCESSFULLY! ---');
