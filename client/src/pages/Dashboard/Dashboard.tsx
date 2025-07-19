import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
  Divider
} from '@mui/material';
import {
  Flight,
  BookOnline,
  AccountBalanceWallet,
  TrendingUp,
  Notifications,
  Person,
  Business
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

interface DashboardStats {
  totalBookings: number;
  activeBookings: number;
  walletBalance: number;
  recentBookings: any[];
  upcomingFlights: any[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [bookingsResponse, walletResponse] = await Promise.all([
          axios.get('/api/bookings/my-bookings?limit=5'),
          axios.get('/api/wallet/balance')
        ]);

        setStats({
          totalBookings: bookingsResponse.data.pagination?.totalItems || 0,
          activeBookings: bookingsResponse.data.bookings?.filter((b: any) => b.status === 'confirmed').length || 0,
          walletBalance: walletResponse.data.wallet?.balance || 0,
          recentBookings: bookingsResponse.data.bookings || [],
          upcomingFlights: []
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      admin: 'System Administrator',
      company_admin: 'Company Administrator',
      travel_manager: 'Travel Manager',
      employee: 'Employee'
    };
    return roleMap[role] || role;
  };

  return (
    <Box>
      {/* Welcome Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
            {user?.firstName?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom>
              {getGreeting()}, {user?.firstName}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome to your B2B Booking Portal dashboard
            </Typography>
            <Chip 
              label={getRoleDisplayName(user?.role || '')} 
              color="primary" 
              size="small" 
              sx={{ mt: 1 }}
            />
            {user?.company && (
              <Chip 
                label={user.company.name} 
                variant="outlined" 
                size="small" 
                sx={{ mt: 1, ml: 1 }}
              />
            )}
          </Box>
        </Box>
      </Paper>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Flight />}
              onClick={() => navigate('/flights/search')}
              sx={{ height: 56 }}
            >
              Search Flights
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<BookOnline />}
              onClick={() => navigate('/bookings')}
              sx={{ height: 56 }}
            >
              View Bookings
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AccountBalanceWallet />}
              onClick={() => navigate('/wallet')}
              sx={{ height: 56 }}
            >
              Wallet
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Person />}
              onClick={() => navigate('/profile')}
              sx={{ height: 56 }}
            >
              Profile
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Bookings
                  </Typography>
                  <Typography variant="h4">
                    {stats?.totalBookings || 0}
                  </Typography>
                </Box>
                <BookOnline color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Bookings
                  </Typography>
                  <Typography variant="h4">
                    {stats?.activeBookings || 0}
                  </Typography>
                </Box>
                <TrendingUp color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Wallet Balance
                  </Typography>
                  <Typography variant="h4">
                    ${stats?.walletBalance?.toFixed(2) || '0.00'}
                  </Typography>
                </Box>
                <AccountBalanceWallet color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Upcoming Flights
                  </Typography>
                  <Typography variant="h4">
                    {stats?.upcomingFlights?.length || 0}
                  </Typography>
                </Box>
                <Flight color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Bookings
            </Typography>
            {stats?.recentBookings?.length ? (
              <List>
                {stats.recentBookings.map((booking: any, index: number) => (
                  <React.Fragment key={booking.id}>
                    <ListItem>
                      <ListItemIcon>
                        <BookOnline color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${booking.flight?.origin} → ${booking.flight?.destination}`}
                        secondary={`${new Date(booking.travelDate).toLocaleDateString()} • ${booking.status}`}
                      />
                      <Chip 
                        label={booking.status} 
                        color={booking.status === 'confirmed' ? 'success' : 'default'}
                        size="small"
                      />
                    </ListItem>
                    {index < stats.recentBookings.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                No recent bookings
              </Typography>
            )}
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/bookings')}
              sx={{ mt: 2 }}
            >
              View All Bookings
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Stats
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Business color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Company"
                  secondary={user?.company?.name || 'No company assigned'}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon>
                  <Notifications color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Notifications"
                  secondary="All caught up"
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon>
                  <AccountBalanceWallet color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Last Transaction"
                  secondary={stats?.walletBalance ? 'Wallet active' : 'No transactions yet'}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;