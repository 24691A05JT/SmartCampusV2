import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import RouteLoadingFallback from './components/common/RouteLoadingFallback';

// Route-level Code Splitting (React.lazy)
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const DemoFoundationPage = lazy(() => import('./pages/DemoFoundationPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const OrganizerEventsPage = lazy(() => import('./pages/OrganizerEventsPage'));
const AdminEventsPage = lazy(() => import('./pages/AdminEventsPage'));
const StudentRegistrationsPage = lazy(() => import('./pages/StudentRegistrationsPage'));
const OrganizerAttendancePage = lazy(() => import('./pages/OrganizerAttendancePage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const AdminFeedbackPage = lazy(() => import('./pages/AdminFeedbackPage'));
const StudentRecommendationsPage = lazy(() => import('./pages/StudentRecommendationsPage'));
const StudentCertificatesPage = lazy(() => import('./pages/StudentCertificatesPage'));
const OrganizerAnalyticsPage = lazy(() => import('./pages/OrganizerAnalyticsPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/AdminAnalyticsPage'));
const AdminCertificatesPage = lazy(() => import('./pages/AdminCertificatesPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminAuditLogsPage = lazy(() => import('./pages/AdminAuditLogsPage'));
const AdminRegistrationsPage = lazy(() => import('./pages/AdminRegistrationsPage'));
const VerifyCertificatePage = lazy(() => import('./pages/VerifyCertificatePage'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const OrganizerDashboard = lazy(() => import('./pages/OrganizerDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              {/* Public Layout Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/demo-foundation" element={<DemoFoundationPage />} />
                <Route path="/docs" element={<Navigate to="/demo-foundation" replace />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:id" element={<EventDetailPage />} />
                <Route path="/recommendations" element={<DemoFoundationPage />} />
                <Route path="/verify/:certificateId" element={<VerifyCertificatePage />} />
                <Route path="/verify" element={<VerifyCertificatePage />} />
              </Route>

              {/* Student Protected Routes */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/student/events" element={<EventsPage />} />
                <Route path="/student/events/:id" element={<EventDetailPage />} />
                <Route path="/student/recommendations" element={<StudentRecommendationsPage />} />
                <Route path="/student/registrations" element={<StudentRegistrationsPage />} />
                <Route path="/student/calendar" element={<StudentDashboard />} />
                <Route path="/student/certificates" element={<StudentCertificatesPage />} />
              </Route>

              {/* Organizer Protected Routes */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/organizer" element={<OrganizerDashboard />} />
                <Route path="/organizer/events" element={<OrganizerEventsPage />} />
                <Route path="/organizer/events/new" element={<OrganizerEventsPage />} />
                <Route path="/organizer/attendance" element={<OrganizerAttendancePage />} />
                <Route path="/organizer/analytics" element={<OrganizerAnalyticsPage />} />
              </Route>

              {/* Admin Protected Routes */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/events" element={<AdminEventsPage />} />
                <Route path="/admin/attendance" element={<OrganizerAttendancePage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/registrations" element={<AdminRegistrationsPage />} />
                <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
                <Route path="/admin/certificates" element={<AdminCertificatesPage />} />
                <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
                <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              </Route>

              {/* Common Protected Profile Route */}
              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
              </Route>

              {/* 404 Catch-All */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
