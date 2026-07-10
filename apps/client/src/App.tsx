import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AuthProvider from './components/AuthProvider';
import Layout from './components/layout/Layout';
import LoginPage from './components/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import ApplicationsPage from './pages/ApplicationsPage';
import DashboardPage from './pages/DashboardPage';
import EditApplicationPage from './pages/EditApplicationPage';
import NewApplicationPage from './pages/NewApplicationPage';
import SettingsPage from './pages/SettingsPage';

// Exported separately so tests can mount the routes inside a MemoryRouter.
export const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />

    <Route
      element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }
    >
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/applications" element={<ApplicationsPage />} />
      <Route path="/applications/new" element={<NewApplicationPage />} />
      <Route path="/applications/:applicationId" element={<ApplicationDetailPage />} />
      <Route path="/applications/:applicationId/edit" element={<EditApplicationPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Route>

    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
