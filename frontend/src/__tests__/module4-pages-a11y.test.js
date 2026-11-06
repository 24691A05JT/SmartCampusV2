import assert from 'assert';
import fs from 'fs';
import path from 'path';

const frontendDir = 'c:\\Users\\user\\OneDrive\\Desktop\\SmartCampusV2\\frontend';

console.log('--- Running Module 4 Page-Level Accessibility Hardening Tests ---');

// 1. StudentCertificatesPage Accessibility & ARIA Tablist
{
  const certSource = fs.readFileSync(path.resolve(frontendDir, 'src/pages/StudentCertificatesPage.jsx'), 'utf-8');
  assert(certSource.includes('role="tablist"'), 'StudentCertificatesPage must have role="tablist"');
  assert(certSource.includes('aria-label="Certificate categories"'), 'StudentCertificatesPage tablist must have descriptive aria-label');
  assert(certSource.includes('role="tab"'), 'StudentCertificatesPage tabs must have role="tab"');
  assert(certSource.includes('aria-selected={activeTab === \'earned\'}'), 'StudentCertificatesPage earned tab must have aria-selected');
  assert(certSource.includes('aria-controls="panel-earned"'), 'StudentCertificatesPage earned tab must have aria-controls');
  assert(certSource.includes('aria-selected={activeTab === \'eligible\'}'), 'StudentCertificatesPage eligible tab must have aria-selected');
  assert(certSource.includes('aria-controls="panel-eligible"'), 'StudentCertificatesPage eligible tab must have aria-controls');
  assert(certSource.includes('handleTabKeyDown'), 'StudentCertificatesPage must handle keyboard tab navigation');
  assert(certSource.includes('role="tabpanel"'), 'StudentCertificatesPage must wrap tab content in role="tabpanel"');
  assert(certSource.includes('id="search-certificates"'), 'StudentCertificatesPage search input must have id');
  assert(certSource.includes('aria-label="Search certificates by event or ID"'), 'StudentCertificatesPage search input must have aria-label');
  console.log('✔ StudentCertificatesPage: ARIA tablist, tab, tabpanel, arrow navigation, and search label verified.');
}

// 2. StudentRegistrationsPage Accessibility & ARIA Tablist
{
  const regSource = fs.readFileSync(path.resolve(frontendDir, 'src/pages/StudentRegistrationsPage.jsx'), 'utf-8');
  assert(regSource.includes('role="tablist"'), 'StudentRegistrationsPage must have role="tablist"');
  assert(regSource.includes('aria-label="Registration status tabs"'), 'StudentRegistrationsPage tablist must have descriptive aria-label');
  assert(regSource.includes('role="tab"'), 'StudentRegistrationsPage tabs must have role="tab"');
  assert(regSource.includes('aria-selected={activeTab === tab.id}'), 'StudentRegistrationsPage tabs must dynamically bind aria-selected');
  assert(regSource.includes('aria-controls={`panel-${tab.id}`}'), 'StudentRegistrationsPage tabs must bind aria-controls');
  assert(regSource.includes('handleTabKeyDown'), 'StudentRegistrationsPage must handle keyboard tab navigation');
  assert(regSource.includes('role="tabpanel"'), 'StudentRegistrationsPage must wrap tab content in role="tabpanel"');
  assert(regSource.includes('id="search-registrations"'), 'StudentRegistrationsPage search input must have id');
  assert(regSource.includes('aria-label="Search event or ticket"'), 'StudentRegistrationsPage search input must have aria-label');
  console.log('✔ StudentRegistrationsPage: ARIA tablist, tab, tabpanel, keyboard arrow navigation, and search label verified.');
}

// 3. AdminAuditLogsPage Accessibility & Table Semantics
{
  const auditSource = fs.readFileSync(path.resolve(frontendDir, 'src/pages/AdminAuditLogsPage.jsx'), 'utf-8');
  assert(auditSource.includes('id="audit-search-input"'), 'AdminAuditLogsPage search must have id');
  assert(auditSource.includes('aria-label="Search audit logs by action, target, or IP address"'), 'AdminAuditLogsPage search must have aria-label');
  assert(auditSource.includes('id="audit-action-filter"'), 'AdminAuditLogsPage action filter must have id');
  assert(auditSource.includes('aria-label="Filter by audit action"'), 'AdminAuditLogsPage action filter must have aria-label');
  assert(auditSource.includes('id="audit-target-type-filter"'), 'AdminAuditLogsPage target filter must have id');
  assert(auditSource.includes('aria-label="Filter by target resource type"'), 'AdminAuditLogsPage target filter must have aria-label');
  assert(auditSource.includes('id="audit-start-date"'), 'AdminAuditLogsPage start date must have id');
  assert(auditSource.includes('aria-label="Filter by start date"'), 'AdminAuditLogsPage start date must have aria-label');
  assert(auditSource.includes('id="audit-end-date"'), 'AdminAuditLogsPage end date must have id');
  assert(auditSource.includes('aria-label="Filter by end date"'), 'AdminAuditLogsPage end date must have aria-label');
  assert(auditSource.includes('aria-label="Governance audit trail"'), 'AdminAuditLogsPage table must have aria-label');
  assert(auditSource.includes('<caption className="sr-only">'), 'AdminAuditLogsPage table must have sr-only caption');
  assert(auditSource.includes('scope="col"'), 'AdminAuditLogsPage table headers must use scope="col"');
  console.log('✔ AdminAuditLogsPage: Explicit search/date labels, scope="col" headers, and accessible table caption verified.');
}

// 4. AdminUsersPage Accessibility & Table Semantics
{
  const usersSource = fs.readFileSync(path.resolve(frontendDir, 'src/pages/AdminUsersPage.jsx'), 'utf-8');
  assert(usersSource.includes('id="search-users-input"'), 'AdminUsersPage search must have id');
  assert(usersSource.includes('aria-label="Search users by name, email, or student ID"'), 'AdminUsersPage search must have aria-label');
  assert(usersSource.includes('aria-label="Filter users by role"'), 'AdminUsersPage role filter group must have aria-label');
  assert(usersSource.includes('aria-label="Filter users by account status"'), 'AdminUsersPage status filter group must have aria-label');
  assert(usersSource.includes('aria-label="Campus users directory"'), 'AdminUsersPage table must have aria-label');
  assert(usersSource.includes('<caption className="sr-only">'), 'AdminUsersPage table must have sr-only caption');
  assert(usersSource.includes('scope="col"'), 'AdminUsersPage table headers must use scope="col"');
  console.log('✔ AdminUsersPage: Accessible search, filter groups, scope="col", and directory table caption verified.');
}

// 5. AdminRegistrationsPage Accessibility & Table Semantics
{
  const adminRegSource = fs.readFileSync(path.resolve(frontendDir, 'src/pages/AdminRegistrationsPage.jsx'), 'utf-8');
  assert(adminRegSource.includes('id="search-registrations-input"'), 'AdminRegistrationsPage search must have id');
  assert(adminRegSource.includes('aria-label="Search registrations by student or event title"'), 'AdminRegistrationsPage search must have aria-label');
  assert(adminRegSource.includes('aria-label="Filter registrations by status"'), 'AdminRegistrationsPage filter group must have aria-label');
  assert(adminRegSource.includes('aria-label="Campus event registrations"'), 'AdminRegistrationsPage table must have aria-label');
  assert(adminRegSource.includes('<caption className="sr-only">'), 'AdminRegistrationsPage table must have sr-only caption');
  assert(adminRegSource.includes('scope="col"'), 'AdminRegistrationsPage table headers must use scope="col"');
  console.log('✔ AdminRegistrationsPage: Accessible search, filter group, scope="col", and registrations table caption verified.');
}

// 6. AdminCertificatesPage Accessibility & Table Semantics
{
  const adminCertSource = fs.readFileSync(path.resolve(frontendDir, 'src/pages/AdminCertificatesPage.jsx'), 'utf-8');
  assert(adminCertSource.includes('id="search-certificates-input"'), 'AdminCertificatesPage search must have id');
  assert(adminCertSource.includes('aria-label="Search certificates by certificate ID"'), 'AdminCertificatesPage search must have aria-label');
  assert(adminCertSource.includes('aria-label="Filter certificates by status"'), 'AdminCertificatesPage filter group must have aria-label');
  assert(adminCertSource.includes('aria-label="Campus certificate registry"'), 'AdminCertificatesPage table must have aria-label');
  assert(adminCertSource.includes('<caption className="sr-only">'), 'AdminCertificatesPage table must have sr-only caption');
  assert(adminCertSource.includes('scope="col"'), 'AdminCertificatesPage table headers must use scope="col"');
  console.log('✔ AdminCertificatesPage: Accessible search, filter group, scope="col", and registry table caption verified.');
}

// 7. AdminFeedbackPage Accessibility
{
  const fbSource = fs.readFileSync(path.resolve(frontendDir, 'src/pages/AdminFeedbackPage.jsx'), 'utf-8');
  assert(fbSource.includes('id="search-feedback-input"'), 'AdminFeedbackPage search must have id');
  assert(fbSource.includes('aria-label="Search keywords in reviews"'), 'AdminFeedbackPage search must have aria-label');
  assert(fbSource.includes('id="rating-filter-select"'), 'AdminFeedbackPage rating filter must have id');
  assert(fbSource.includes('aria-label="Filter reviews by star rating"'), 'AdminFeedbackPage rating filter must have aria-label');
  console.log('✔ AdminFeedbackPage: Accessible search input and star rating filter select verified.');
}

// 8. OrganizerAttendancePage Accessibility & Table Semantics
{
  const attSource = fs.readFileSync(path.resolve(frontendDir, 'src/pages/OrganizerAttendancePage.jsx'), 'utf-8');
  assert(attSource.includes('id="search-attendance-input"'), 'OrganizerAttendancePage search must have id');
  assert(attSource.includes('aria-label="Search participant by name or ticket code"'), 'OrganizerAttendancePage search must have aria-label');
  assert(attSource.includes('aria-label="Filter participants by attendance status"'), 'OrganizerAttendancePage filter group must have aria-label');
  assert(attSource.includes('aria-label="Event participant attendance roster"'), 'OrganizerAttendancePage table must have aria-label');
  assert(attSource.includes('<caption className="sr-only">'), 'OrganizerAttendancePage table must have sr-only caption');
  assert(attSource.includes('scope="col"'), 'OrganizerAttendancePage table headers must use scope="col"');
  assert(attSource.includes('aria-pressed={current.status === \'present\'}'), 'OrganizerAttendancePage present button must have aria-pressed');
  assert(attSource.includes('aria-pressed={current.status === \'absent\'}'), 'OrganizerAttendancePage absent button must have aria-pressed');
  console.log('✔ OrganizerAttendancePage: Accessible search, roster table caption, scope="col", and aria-pressed toggles verified.');
}

// 9. VerifyCertificatePage Accessibility & Announcements
{
  const verifySource = fs.readFileSync(path.resolve(frontendDir, 'src/pages/VerifyCertificatePage.jsx'), 'utf-8');
  assert(verifySource.includes('id="verify-cert-id-input"'), 'VerifyCertificatePage input must have id');
  assert(verifySource.includes('aria-label="Certificate ID for public verification"'), 'VerifyCertificatePage input must have aria-label');
  assert(verifySource.includes('role="alert"'), 'VerifyCertificatePage error must have role="alert"');
  assert(verifySource.includes('aria-live="assertive"'), 'VerifyCertificatePage error must have aria-live="assertive"');
  assert(verifySource.includes('role="status"'), 'VerifyCertificatePage results must have role="status"');
  assert(verifySource.includes('aria-live="polite"'), 'VerifyCertificatePage results must have aria-live="polite"');
  console.log('✔ VerifyCertificatePage: Accessible search input and assertive/polite live region announcements verified.');
}

// 10. ProfilePage Accessibility & Semantic Elements
{
  const profSource = fs.readFileSync(path.resolve(frontendDir, 'src/pages/ProfilePage.jsx'), 'utf-8');
  assert(profSource.includes('id="interests-group-label"'), 'ProfilePage interests must have id for group label');
  assert(profSource.includes('role="group"'), 'ProfilePage interests must have role="group"');
  assert(profSource.includes('aria-labelledby="interests-group-label"'), 'ProfilePage interests must link to group label');
  assert(profSource.includes('aria-pressed={isSelected}'), 'ProfilePage interest buttons must have aria-pressed');
  assert(profSource.includes('id="skills-group-label"'), 'ProfilePage skills must have id for group label');
  assert(profSource.includes('id="add-skill-input"'), 'ProfilePage add skill input must have id');
  assert(profSource.includes('aria-label="Add new skill or technical competency"'), 'ProfilePage add skill input must have aria-label');
  assert(profSource.includes('aria-label={`Remove skill ${skill}`}'), 'ProfilePage remove skill buttons must have descriptive aria-label');
  console.log('✔ ProfilePage: Semantic group headings, aria-pressed on interest toggles, and accessible skill management verified.');
}

console.log('--- ALL MODULE 4 TESTS PASSED SUCCESSFULLY! ---');
