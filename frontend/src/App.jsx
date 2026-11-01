import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import DemoFoundationPage from './pages/DemoFoundationPage';
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
              <Route path="/demo-foundation" element={<DemoFoundationPage />} />
              <Route path="/events" element={<DemoFoundationPage />} />
              <Route path="/recommendations" element={<DemoFoundationPage />} />
              <Route path="/verify" element={<DemoFoundationPage />} />
              <Route path="/login" element={<DemoFoundationPage />} />
              <Route path="/register" element={<DemoFoundationPage />} />
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
              <Route path="/student/recommendations" element={<StudentDashboard />} />
              <Route path="/student/registrations" element={<StudentDashboard />} />
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
              <Route path="/organizer/events" element={<OrganizerDashboard />} />
              <Route path="/organizer/events/new" element={<OrganizerDashboard />} />
              <Route path="/organizer/attendance" element={<OrganizerDashboard />} />
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
              <Route path="/admin/events" element={<AdminDashboard />} />
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
