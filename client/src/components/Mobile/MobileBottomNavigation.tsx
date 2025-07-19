import React from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Badge,
  Box
} from '@mui/material';
import {
  Dashboard,
  Flight,
  BookOnline,
  AccountBalanceWallet,
  Assessment,
  Person
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface MobileBottomNavigationProps {
  showBadge?: boolean;
  badgeContent?: number;
}

const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
  showBadge = false,
  badgeContent = 0
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const getNavigationItems = () => {
    const baseItems = [
      {
        label: 'Dashboard',
        icon: <Dashboard />,
        value: '/dashboard',
        path: '/dashboard'
      },
      {
        label: 'Search',
        icon: <Flight />,
        value: '/flights/search',
        path: '/flights/search'
      },
      {
        label: 'Bookings',
        icon: <BookOnline />,
        value: '/bookings',
        path: '/bookings'
      },
      {
        label: 'Wallet',
        icon: <AccountBalanceWallet />,
        value: '/wallet',
        path: '/wallet'
      }
    ];

    // Add analytics for admin and company admin
    if (user?.role === 'admin' || user?.role === 'company_admin') {
      baseItems.push({
        label: 'Analytics',
        icon: <Assessment />,
        value: '/analytics',
        path: '/analytics'
      });
    }

    // Add profile for all users
    baseItems.push({
      label: 'Profile',
      icon: <Person />,
      value: '/profile',
      path: '/profile'
    });

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  const getCurrentValue = () => {
    const currentPath = location.pathname;
    const matchingItem = navigationItems.find(item => 
      currentPath === item.path || currentPath.startsWith(item.path + '/')
    );
    return matchingItem ? matchingItem.value : '/dashboard';
  };

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0,
        zIndex: 1000,
        borderTop: '1px solid',
        borderColor: 'divider'
      }} 
      elevation={3}
    >
      <BottomNavigation
        value={getCurrentValue()}
        onChange={handleChange}
        showLabels
        sx={{
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '6px 8px',
            '&.Mui-selected': {
              color: 'primary.main'
            }
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.75rem',
            marginTop: '4px'
          }
        }}
      >
        {navigationItems.map((item) => (
          <BottomNavigationAction
            key={item.value}
            label={item.label}
            value={item.value}
            icon={
              item.label === 'Bookings' && showBadge ? (
                <Badge badgeContent={badgeContent} color="error">
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )
            }
            sx={{
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.7rem',
                lineHeight: 1.2
              }
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

export default MobileBottomNavigation;