import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Components
import Layout from './components/Layout/Layout';

// Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import FlightSearch from './pages/Flights/FlightSearch';
import Wallet from './pages/Wallet/Wallet';
import AnalyticsDashboard from './pages/Analytics/AnalyticsDashboard';
import EnterpriseDashboard from './pages/Enterprise/EnterpriseDashboard';
import LoadingSpinner from './components/Common/LoadingSpinner';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirects to dashboard if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />

        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="flights/search" element={<FlightSearch />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="enterprise" element={<EnterpriseDashboard />} />
          
          {/* Placeholder routes for future implementation */}
          <Route path="bookings" element={
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h2>My Bookings</h2>
              <p>Booking management page coming soon...</p>
            </div>
          } />
          <Route path="profile" element={
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h2>Profile</h2>
              <p>Profile management page coming soon...</p>
            </div>
          } />
          
          {/* Admin Routes */}
          <Route path="admin/*" element={
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h2>Admin Panel</h2>
              <p>Admin features coming soon...</p>
            </div>
          } />
          
          {/* Company Routes */}
          <Route path="company/*" element={
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h2>Company Dashboard</h2>
              <p>Company management features coming soon...</p>
            </div>
          } />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default App;