import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Avatar,
  Divider
} from '@mui/material';
import {
  Person,
  Flight,
  AccountBalanceWallet,
  TrendingUp,
  Assessment,
  Settings,
  Payment,
  Receipt,
  Business,
  Star,
  CheckCircle,
  Pending,
  Error,
  Visibility,
  Edit,
  Download,
  Refresh
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface Agent {
  id: string;
  agentCode: string;
  agentType: string;
  status: string;
  businessName: string;
  isVerified: boolean;
  performanceMetrics: {
    totalBookings: number;
    totalRevenue: number;
    totalCommission: number;
    monthlyBookings: number;
    monthlyRevenue: number;
    monthlyCommission: number;
    averageBookingValue: number;
  };
  commissionStructure: {
    baseRate: number;
    tiers: Array<{
      minAmount: number;
      maxAmount: number | null;
      rate: number;
    }>;
  };
  wallet: {
    balance: number;
    currency: string;
  };
}

interface Commission {
  id: string;
  commissionType: string;
  baseAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: string;
  createdAt: string;
  booking: {
    bookingReference: string;
    totalAmount: number;
    status: string;
  };
}

interface Payout {
  id: string;
  payoutNumber: string;
  payoutPeriod: string;
  totalAmount: number;
  status: string;
  paidAt: string;
}

const AgentDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState(0);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Dialog states
  const [profileDialog, setProfileDialog] = useState(false);
  const [commissionDialog, setCommissionDialog] = useState(false);
  const [payoutDialog, setPayoutDialog] = useState(false);
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    businessName: '',
    phone: '',
    website: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    loadAgentData();
  }, []);

  const loadAgentData = async () => {
    setLoading(true);
    try {
      // Get agent details (assuming user is an agent)
      const agentResponse = await axios.get(`/api/agents/${user?.id}`);
      if (agentResponse.data.success) {
        setAgent(agentResponse.data.data);
        
        // Load related data
        await Promise.all([
          loadCommissions(agentResponse.data.data.id),
          loadPayouts(agentResponse.data.data.id),
          loadBookings(agentResponse.data.data.id)
        ]);
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load agent data');
    } finally {
      setLoading(false);
    }
  };

  const loadCommissions = async (agentId: string) => {
    try {
      const response = await axios.get(`/api/agents/${agentId}/commissions`);
      if (response.data.success) {
        setCommissions(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to load commissions:', error);
    }
  };

  const loadPayouts = async (agentId: string) => {
    try {
      const response = await axios.get(`/api/agents/${agentId}/payouts`);
      if (response.data.success) {
        setPayouts(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to load payouts:', error);
    }
  };

  const loadBookings = async (agentId: string) => {
    try {
      const response = await axios.get(`/api/agents/${agentId}/bookings`);
      if (response.data.success) {
        setBookings(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to load bookings:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'suspended':
      case 'failed':
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getAgentTypeColor = (type: string) => {
    switch (type) {
      case 'super_agent':
        return 'error';
      case 'agency':
        return 'warning';
      case 'corporate':
        return 'info';
      case 'individual':
        return 'success';
      default:
        return 'default';
    }
  };

  const renderOverviewCards = () => (
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
                  {agent ? formatNumber(agent.performanceMetrics.totalBookings) : '0'}
                </Typography>
              </Box>
              <Flight color="primary" sx={{ fontSize: 40 }} />
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
                  Total Revenue
                </Typography>
                <Typography variant="h4">
                  {agent ? formatCurrency(agent.performanceMetrics.totalRevenue) : '$0'}
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
                  Total Commission
                </Typography>
                <Typography variant="h4">
                  {agent ? formatCurrency(agent.performanceMetrics.totalCommission) : '$0'}
                </Typography>
              </Box>
              <Payment color="info" sx={{ fontSize: 40 }} />
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
                  {agent?.wallet ? formatCurrency(agent.wallet.balance) : '$0'}
                </Typography>
              </Box>
              <AccountBalanceWallet color="secondary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderPerformanceCharts = () => {
    const commissionData = commissions.map(commission => ({
      date: new Date(commission.createdAt).toLocaleDateString(),
      amount: parseFloat(commission.commissionAmount),
      rate: parseFloat(commission.commissionRate)
    }));

    const statusData = [
      { name: 'Pending', value: commissions.filter(c => c.status === 'pending').length },
      { name: 'Approved', value: commissions.filter(c => c.status === 'approved').length },
      { name: 'Paid', value: commissions.filter(c => c.status === 'paid').length }
    ];

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Commission Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={commissionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#8884d8" name="Commission Amount" />
                  <Line type="monotone" dataKey="rate" stroke="#82ca9d" name="Commission Rate" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Commission Status
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderCommissionsTable = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Recent Commissions</Typography>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => {/* Export functionality */}}
          >
            Export
          </Button>
        </Box>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Booking Ref</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Base Amount</TableCell>
                <TableCell>Rate</TableCell>
                <TableCell>Commission</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {commissions.slice(0, 10).map((commission) => (
                <TableRow key={commission.id}>
                  <TableCell>{commission.booking.bookingReference}</TableCell>
                  <TableCell>
                    <Chip
                      label={commission.commissionType}
                      size="small"
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>{formatCurrency(commission.baseAmount)}</TableCell>
                  <TableCell>{commission.commissionRate}%</TableCell>
                  <TableCell>{formatCurrency(commission.commissionAmount)}</TableCell>
                  <TableCell>
                    <Chip
                      label={commission.status}
                      color={getStatusColor(commission.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(commission.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const renderPayoutsTable = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Recent Payouts</Typography>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => {/* Export functionality */}}
          >
            Export
          </Button>
        </Box>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Payout Number</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Paid Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payouts.slice(0, 10).map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell>{payout.payoutNumber}</TableCell>
                  <TableCell>{payout.payoutPeriod}</TableCell>
                  <TableCell>{formatCurrency(payout.totalAmount)}</TableCell>
                  <TableCell>
                    <Chip
                      label={payout.status}
                      color={getStatusColor(payout.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {payout.paidAt ? new Date(payout.paidAt).toLocaleDateString() : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const renderAgentProfile = () => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={3}>
          <Avatar sx={{ width: 80, height: 80, mr: 2 }}>
            <Business />
          </Avatar>
          <Box>
            <Typography variant="h5">{agent?.businessName || 'Agent Profile'}</Typography>
            <Typography variant="body1" color="textSecondary">
              Agent Code: {agent?.agentCode}
            </Typography>
            <Box display="flex" gap={1} mt={1}>
              <Chip
                label={agent?.agentType?.replace('_', ' ')}
                color={getAgentTypeColor(agent?.agentType || '') as any}
                size="small"
              />
              <Chip
                label={agent?.status}
                color={getStatusColor(agent?.status || '') as any}
                size="small"
              />
              {agent?.isVerified && (
                <Chip
                  label="Verified"
                  color="success"
                  size="small"
                  icon={<CheckCircle />}
                />
              )}
            </Box>
          </Box>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Commission Structure
            </Typography>
            <Typography variant="body2" gutterBottom>
              Base Rate: {agent?.commissionStructure.baseRate}%
            </Typography>
            {agent?.commissionStructure.tiers.map((tier, index) => (
              <Typography key={index} variant="body2" color="textSecondary">
                {formatCurrency(tier.minAmount)} - {tier.maxAmount ? formatCurrency(tier.maxAmount) : '∞'}: {tier.rate}%
              </Typography>
            ))}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Performance Summary
            </Typography>
            <Typography variant="body2" gutterBottom>
              Monthly Bookings: {agent ? formatNumber(agent.performanceMetrics.monthlyBookings) : '0'}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Monthly Revenue: {agent ? formatCurrency(agent.performanceMetrics.monthlyRevenue) : '$0'}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Monthly Commission: {agent ? formatCurrency(agent.performanceMetrics.monthlyCommission) : '$0'}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Avg Booking Value: {agent ? formatCurrency(agent.performanceMetrics.averageBookingValue) : '$0'}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Agent Dashboard
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading && (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      )}
      
      {agent && (
        <>
          {renderOverviewCards()}
          
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ mb: 3 }}
          >
            <Tab label="Overview" />
            <Tab label="Commissions" />
            <Tab label="Payouts" />
            <Tab label="Performance" />
            <Tab label="Profile" />
          </Tabs>
          
          {activeTab === 0 && (
            <Box>
              {renderPerformanceCharts()}
              {renderCommissionsTable()}
            </Box>
          )}
          
          {activeTab === 1 && renderCommissionsTable()}
          
          {activeTab === 2 && renderPayoutsTable()}
          
          {activeTab === 3 && renderPerformanceCharts()}
          
          {activeTab === 4 && renderAgentProfile()}
        </>
      )}
    </Box>
  );
};

export default AgentDashboard;