import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DemoFoundationPage from './pages/DemoFoundationPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import OrganizerEventsPage from './pages/OrganizerEventsPage';
import AdminEventsPage from './pages/AdminEventsPage';
import StudentRegistrationsPage from './pages/StudentRegistrationsPage';
import OrganizerAttendancePage from './pages/OrganizerAttendancePage';
import StudentDashboard from './pages/StudentDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
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
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/recommendations" element={<DemoFoundationPage />} />
              <Route path="/verify" element={<DemoFoundationPage />} />
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
              <Route path="/student/recommendations" element={<StudentDashboard />} />
              <Route path="/student/registrations" element={<StudentRegistrationsPage />} />
              <Route path="/student/calendar" element={<StudentDashboard />} />
              <Route path="/student/certificates" element={<StudentDashboard />} />
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
              <Route path="/organizer/analytics" element={<OrganizerDashboard />} />
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
              <Route path="/admin/users" element={<AdminDashboard />} />
              <Route path="/admin/feedback" element={<AdminDashboard />} />
              <Route path="/admin/certificates" element={<AdminDashboard />} />
              <Route path="/admin/audit-logs" element={<AdminDashboard />} />
              <Route path="/admin/analytics" element={<AdminDashboard />} />
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
              <Route path="/notifications" element={<ProfilePage />} />
            </Route>

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
