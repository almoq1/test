import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Flight,
  BookOnline,
  AccountBalanceWallet,
  TrendingUp,
  Person,
  Business,
  Notifications,
  Search,
  Receipt,
  Assessment,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardStats {
  totalBookings: number;
  activeBookings: number;
  walletBalance: number;
  monthlySpending: number;
  upcomingFlights: number;
  pendingApprovals: number;
}

interface RecentActivity {
  id: string;
  type: 'booking' | 'payment' | 'approval' | 'flight';
  title: string;
  description: string;
  timestamp: string;
  status: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    activeBookings: 0,
    walletBalance: 0,
    monthlySpending: 0,
    upcomingFlights: 0,
    pendingApprovals: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Simulate API calls - replace with actual API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API responses
      setStats({
        totalBookings: 24,
        activeBookings: 8,
        walletBalance: 1250.50,
        monthlySpending: 3200.75,
        upcomingFlights: 3,
        pendingApprovals: 2,
      });

      setRecentActivity([
        {
          id: '1',
          type: 'booking',
          title: 'Flight Booking Confirmed',
          description: 'JFK → LAX on Dec 15, 2024',
          timestamp: '2 hours ago',
          status: 'confirmed',
        },
        {
          id: '2',
          type: 'payment',
          title: 'Payment Processed',
          description: '$450.00 charged to wallet',
          timestamp: '1 day ago',
          status: 'completed',
        },
        {
          id: '3',
          type: 'approval',
          title: 'Booking Approval Required',
          description: 'Premium class booking pending approval',
          timestamp: '2 days ago',
          status: 'pending',
        },
        {
          id: '4',
          type: 'flight',
          title: 'Flight Reminder',
          description: 'Your flight to SFO departs in 3 days',
          timestamp: '3 days ago',
          status: 'upcoming',
        },
      ]);
    } catch (err: any) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

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
      employee: 'Employee',
      agent: 'Travel Agent',
      super_agent: 'Super Agent',
    };
    return roleMap[role] || role;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <BookOnline color="primary" />;
      case 'payment':
        return <AccountBalanceWallet color="success" />;
      case 'approval':
        return <Receipt color="warning" />;
      case 'flight':
        return <Flight color="info" />;
      default:
        return <Notifications color="action" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
            {user?.first_name?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom>
              {getGreeting()}, {user?.first_name}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome to your B2B Flight Booking Portal dashboard
            </Typography>
            <Chip 
              label={getRoleDisplayName(user?.role || '')} 
              color="primary" 
              size="small" 
              sx={{ mt: 1 }}
            />
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

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
              startIcon={<Search />}
              onClick={() => navigate('/flights')}
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
                    {stats.totalBookings}
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
                    {stats.activeBookings}
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
                    {formatCurrency(stats.walletBalance)}
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
                    Monthly Spending
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(stats.monthlySpending)}
                  </Typography>
                </Box>
                <Assessment color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity and Quick Stats */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            {recentActivity.length > 0 ? (
              <List>
                {recentActivity.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getActivityIcon(activity.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {activity.description}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                              <Typography variant="caption" color="text.secondary">
                                {activity.timestamp}
                              </Typography>
                              <Chip 
                                label={activity.status} 
                                color={getStatusColor(activity.status) as any}
                                size="small"
                              />
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentActivity.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                No recent activity
              </Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Stats
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Flight color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Upcoming Flights"
                  secondary={stats.upcomingFlights}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon>
                  <Receipt color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary="Pending Approvals"
                  secondary={stats.pendingApprovals}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon>
                  <Business color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Company"
                  secondary={user?.company_id ? `Company ID: ${user.company_id}` : 'No company assigned'}
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