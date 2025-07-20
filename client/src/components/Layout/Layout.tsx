import React from 'react';
import { Outlet } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const Layout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              B2B Flight Booking System
            </Typography>
            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2">
                  Welcome, {user.first_name} {user.last_name}
                </Typography>
                <Typography variant="body2" color="inherit">
                  ({user.role})
                </Typography>
              </Box>
            )}
          </Toolbar>
        </AppBar>
        
        <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
          <Outlet />
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default Layout;