import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Layout from '../components/Layout';

export function ProtectedRoute() {
  const token = useAuthStore((s) => s.token);
  const refreshToken = useAuthStore((s) => s.refreshToken);

  if (!token && !refreshToken) {
    return <Navigate to="/login" replace />;
  }

  if (!token && refreshToken) {
    return (
      <div className="route-loading" role="status" aria-live="polite">
        <span className="route-loading-spinner" />
        Restoring session…
      </div>
    );
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export function RoleGuard({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user || !roles.includes(user.role)) {
    return (
      <div className="p-8 text-center text-slate-500">
        You do not have permission to view this page.
      </div>
    );
  }
  return <>{children}</>;
}
