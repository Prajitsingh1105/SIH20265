import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DemoProvider } from './context/DemoContext';
import { LanguageProvider } from './context/LanguageContext';
import { AccessibilityProvider } from './context/AccessibilityContext';

// Layout & Pages
import { Layout } from './components/layout/Layout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { FdrListPage } from './pages/FdrListPage';
import { FdrDetailPage } from './pages/FdrDetailPage';
import { FdrSubmissionPage } from './pages/FdrSubmissionPage';
import { ReleaseWorkflowPage } from './pages/ReleaseWorkflowPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { SmsOutboxPage } from './pages/SmsOutboxPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({
  children,
  roles,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-gov-navy-900 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AccessibilityProvider>
      <LanguageProvider>
        <AuthProvider>
          <DemoProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Root & Login */}
                <Route element={<Layout />}>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />

                  {/* Authenticated Application Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/fdrs"
                    element={
                      <ProtectedRoute>
                        <FdrListPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/fdrs/:id"
                    element={
                      <ProtectedRoute>
                        <FdrDetailPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/submission"
                    element={
                      <ProtectedRoute roles={['INSTITUTION', 'SYSTEM_ADMIN']}>
                        <FdrSubmissionPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/release"
                    element={
                      <ProtectedRoute>
                        <ReleaseWorkflowPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/audit"
                    element={
                      <ProtectedRoute roles={['SCRUTINY_OFFICER', 'COMPETENT_AUTHORITY', 'SYSTEM_ADMIN']}>
                        <AuditTrailPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/integrations"
                    element={
                      <ProtectedRoute roles={['SCRUTINY_OFFICER', 'SYSTEM_ADMIN']}>
                        <IntegrationsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/sms-outbox"
                    element={
                      <ProtectedRoute roles={['INSTITUTION', 'SCRUTINY_OFFICER', 'SYSTEM_ADMIN']}>
                        <SmsOutboxPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute roles={['SYSTEM_ADMIN']}>
                        <AdminSettingsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Catch-all fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </DemoProvider>
        </AuthProvider>
      </LanguageProvider>
    </AccessibilityProvider>
  );
};

export default App;
