import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import FlightSearch from './pages/Flights/FlightSearch';
import Bookings from './pages/Bookings/Bookings';
import Wallet from './pages/Wallet/Wallet';
import AgentDashboard from './pages/Agent/AgentDashboard';
import CompanyManagement from './pages/Company/CompanyManagement';
import UserManagement from './pages/Users/UserManagement';
import Analytics from './pages/Analytics/Analytics';
import Reports from './pages/Reports/Reports';
import Profile from './pages/Profile/Profile';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ 
  children, 
  roles 
}) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        !isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />
      } />
      <Route path="/register" element={
        !isAuthenticated ? <Register /> : <Navigate to="/dashboard" replace />
      } />

      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Dashboard */}
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Flight Management */}
        <Route path="flights" element={<FlightSearch />} />
        <Route path="bookings" element={<Bookings />} />
        
        {/* Wallet */}
        <Route path="wallet" element={<Wallet />} />
        
        {/* Agent Routes */}
        <Route path="agent" element={
          <ProtectedRoute roles={['agent', 'super_agent']}>
            <AgentDashboard />
          </ProtectedRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="admin" element={
          <ProtectedRoute roles={['admin']}>
            <CompanyManagement />
          </ProtectedRoute>
        } />
        
        <Route path="users" element={
          <ProtectedRoute roles={['admin', 'company_admin']}>
            <UserManagement />
          </ProtectedRoute>
        } />
        
        {/* Analytics & Reports */}
        <Route path="analytics" element={
          <ProtectedRoute roles={['admin', 'company_admin', 'travel_manager']}>
            <Analytics />
          </ProtectedRoute>
        } />
        
        <Route path="reports" element={
          <ProtectedRoute roles={['admin', 'company_admin', 'travel_manager']}>
            <Reports />
          </ProtectedRoute>
        } />
        
        {/* Profile */}
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;