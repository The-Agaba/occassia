import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthBootstrap } from './components/AuthBootstrap';
import { ProtectedRoute, RoleGuard } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import MarkdownPage from './pages/MarkdownPage';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const NewEventPage = lazy(() => import('./pages/NewEventPage'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const GuestsPage = lazy(() => import('./pages/GuestsPage'));
const GuestImportPage = lazy(() => import('./pages/GuestImportPage'));
const CardsPage = lazy(() => import('./pages/CardsPage'));
const CheckInPage = lazy(() => import('./pages/CheckInPage'));
const LiveDashboardPage = lazy(() => import('./pages/LiveDashboardPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const AuditPage = lazy(() => import('./pages/AuditPage'));
const OrganizationPage = lazy(() => import('./pages/OrganizationPage'));

function RouteLoading() {
  return <div className="route-loading" role="status" aria-live="polite"><span className="route-loading-spinner" />Loading workspace…</div>;
}

export default function App() {
  return (
    <AuthBootstrap>
      <BrowserRouter>
        <Suspense fallback={<RouteLoading />}>
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
        </Suspense>
      </BrowserRouter>
    </AuthBootstrap>
  );
}
