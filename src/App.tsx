import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { Toaster } from '@/components/ui/sonner';
import routes from './routes';
import { AuthProvider } from '@/contexts/AuthContext';
import { RouteGuard } from '@/components/common/RouteGuard';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import NotFound from '@/pages/NotFound';

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/dashboard');
  const isLogin = location.pathname === '/login';

  if (isLogin) {
    return <>{children}</>;
  }

  if (isAdmin) {
    return <AdminLayout>{children}</AdminLayout>;
  }

  return <PublicLayout>{children}</PublicLayout>;
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <RouteGuard>
          <IntersectObserver />
          <LayoutWrapper>
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            }>
              <Routes>
                {routes.map((route, index) => (
                  <Route
                    key={index}
                    path={route.path}
                    element={route.element}
                  />
                ))}
                {/* Catch all invalid routes */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </LayoutWrapper>
          <Toaster />
        </RouteGuard>
      </AuthProvider>
    </Router>
  );
};

export default App;
