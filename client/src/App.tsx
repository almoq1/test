import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import FlightSearch from './pages/FlightSearch/FlightSearch';
import FlightDetails from './pages/FlightDetails/FlightDetails';
import BookingForm from './pages/BookingForm/BookingForm';
import MyBookings from './pages/MyBookings/MyBookings';
import BookingDetails from './pages/BookingDetails/BookingDetails';
import Wallet from './pages/Wallet/Wallet';
import Profile from './pages/Profile/Profile';
import AdminDashboard from './pages/Admin/AdminDashboard';
import UserManagement from './pages/Admin/UserManagement';
import CompanyManagement from './pages/Admin/CompanyManagement';
import AirlineManagement from './pages/Admin/AirlineManagement';
import CompanyDashboard from './pages/Company/CompanyDashboard';
import CompanyBookings from './pages/Company/CompanyBookings';
import CompanyUsers from './pages/Company/CompanyUsers';
import LoadingSpinner from './components/Common/LoadingSpinner';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ 
  children, 
  roles 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" replace />} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="flights/search" element={<FlightSearch />} />
          <Route path="flights/:id" element={<FlightDetails />} />
          <Route path="booking/new" element={<BookingForm />} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="bookings/:id" element={<BookingDetails />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="profile" element={<Profile />} />
          
          {/* Admin Routes */}
          <Route path="admin" element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="admin/users" element={
            <ProtectedRoute roles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="admin/companies" element={
            <ProtectedRoute roles={['admin']}>
              <CompanyManagement />
            </ProtectedRoute>
          } />
          <Route path="admin/airlines" element={
            <ProtectedRoute roles={['admin']}>
              <AirlineManagement />
            </ProtectedRoute>
          } />
          
          {/* Company Admin Routes */}
          <Route path="company" element={
            <ProtectedRoute roles={['company_admin']}>
              <CompanyDashboard />
            </ProtectedRoute>
          } />
          <Route path="company/bookings" element={
            <ProtectedRoute roles={['company_admin']}>
              <CompanyBookings />
            </ProtectedRoute>
          } />
          <Route path="company/users" element={
            <ProtectedRoute roles={['company_admin']}>
              <CompanyUsers />
            </ProtectedRoute>
          } />
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Box>
  );
};

export default App;