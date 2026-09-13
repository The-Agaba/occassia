import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthBootstrap } from './components/AuthBootstrap';
import { ProtectedRoute, RoleGuard } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NewEventPage from './pages/NewEventPage';
import EventDetailPage from './pages/EventDetailPage';
import GuestsPage from './pages/GuestsPage';
import GuestImportPage from './pages/GuestImportPage';
import CardsPage from './pages/CardsPage';
import CheckInPage from './pages/CheckInPage';
import LiveDashboardPage from './pages/LiveDashboardPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import AuditPage from './pages/AuditPage';
import OrganizationPage from './pages/OrganizationPage';
import LandingPage from './pages/LandingPage';
import MarkdownPage from './pages/MarkdownPage';

export default function App() {
  return (
    <AuthBootstrap>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<MarkdownPage kind="about" />} />
          <Route path="/terms" element={<MarkdownPage kind="terms" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/events/new" element={
              <RoleGuard roles={['ADMIN']}><NewEventPage /></RoleGuard>
            } />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/events/:id/guests" element={<GuestsPage />} />
            <Route path="/events/:id/guests/import" element={
              <RoleGuard roles={['ADMIN', 'EVENT_MANAGER']}><GuestImportPage /></RoleGuard>
            } />
            <Route path="/events/:id/cards" element={
              <RoleGuard roles={['ADMIN', 'SUPER_ADMIN', 'EVENT_MANAGER']}><CardsPage /></RoleGuard>
            } />
            <Route path="/events/:id/checkin" element={
              <RoleGuard roles={['ADMIN', 'EVENT_MANAGER', 'CHECKIN_STAFF']}><CheckInPage /></RoleGuard>
            } />
            <Route path="/events/:id/dashboard" element={<LiveDashboardPage />} />
            <Route path="/events/:id/reports" element={<ReportsPage />} />
            <Route path="/settings/users" element={
              <RoleGuard roles={['ADMIN', 'SUPER_ADMIN']}><UsersPage /></RoleGuard>
            } />
            <Route path="/audit" element={
              <RoleGuard roles={['ADMIN', 'SUPER_ADMIN']}><AuditPage /></RoleGuard>
            } />
            <Route path="/organizations" element={
              <RoleGuard roles={['SUPER_ADMIN']}><OrganizationPage /></RoleGuard>
            } />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthBootstrap>
  );
}
