import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Tabs,
  Tab,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  Flight,
  AccountBalanceWallet,
  Assessment,
  Analytics,
  Business,
  Timeline,
  PieChart,
  BarChart,
  ShowChart
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Analytics data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [financialData, setFinancialData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [period]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError('');

    try {
      const [
        dashboardResponse,
        financialResponse,
        performanceResponse,
        customerResponse,
        forecastResponse
      ] = await Promise.all([
        axios.get('/api/analytics/dashboard'),
        axios.get(`/api/analytics/financial?period=${period}`),
        axios.get('/api/analytics/performance'),
        axios.get('/api/analytics/customers/segmentation'),
        axios.get('/api/analytics/forecast/bookings')
      ]);

      setDashboardData(dashboardResponse.data.data);
      setFinancialData(financialResponse.data.data);
      setPerformanceData(performanceResponse.data.data);
      setCustomerData(customerResponse.data.data);
      setForecastData(forecastResponse.data.data);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'success';
      case 'good': return 'primary';
      case 'needs_improvement': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading analytics..." />;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Analytics Dashboard
        </Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={period}
            label="Period"
            onChange={(e) => setPeriod(e.target.value)}
          >
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="quarter">This Quarter</MenuItem>
            <MenuItem value="year">This Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(dashboardData?.totalRevenue || 0)}
                  </Typography>
                </Box>
                <TrendingUp color="primary" sx={{ fontSize: 40 }} />
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
                    Total Bookings
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData?.totalBookings || 0}
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
                    Active Users
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData?.activeUsers || 0}
                  </Typography>
                </Box>
                <People color="primary" sx={{ fontSize: 40 }} />
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
                    Profit Margin
                  </Typography>
                  <Typography variant="h4">
                    {formatPercentage(financialData?.profitMargin || 0)}
                  </Typography>
                </Box>
                <AccountBalanceWallet color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Analytics Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="analytics tabs">
          <Tab icon={<Assessment />} label="Overview" />
          <Tab icon={<ShowChart />} label="Financial" />
          <Tab icon={<Timeline />} label="Performance" />
          <Tab icon={<People />} label="Customers" />
          <Tab icon={<TrendingUp />} label="Forecast" />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Revenue Trend
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dashboardData?.revenueTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Routes
                  </Typography>
                  <Box>
                    {dashboardData?.topRoutes?.slice(0, 5).map((route: any, index: number) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {route.route}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {route.bookingCount} bookings • {formatCurrency(route.totalRevenue)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Financial Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Revenue Sources
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={financialData?.topRevenueSources || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {financialData?.topRevenueSources?.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Payment Methods
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={financialData?.paymentMethodDistribution || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="method" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar dataKey="totalAmount" fill="#8884d8" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Financial Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Total Revenue
                      </Typography>
                      <Typography variant="h6">
                        {formatCurrency(financialData?.revenue || 0)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Total Expenses
                      </Typography>
                      <Typography variant="h6">
                        {formatCurrency(financialData?.expenses || 0)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Net Profit
                      </Typography>
                      <Typography variant="h6">
                        {formatCurrency(financialData?.profit || 0)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Profit Margin
                      </Typography>
                      <Typography variant="h6">
                        {formatPercentage(financialData?.profitMargin || 0)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Performance Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance KPIs
                  </Typography>
                  <Box>
                    {performanceData?.kpis && Object.entries(performanceData.kpis).map(([key, kpi]: [string, any]) => (
                      <Box key={key} sx={{ mb: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" textTransform="capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </Typography>
                          <Chip
                            label={kpi.status}
                            color={getStatusColor(kpi.status)}
                            size="small"
                          />
                        </Box>
                        <Typography variant="h6">
                          {key.includes('Rate') || key.includes('Percentage') 
                            ? formatPercentage(kpi.value)
                            : key.includes('Value') 
                              ? formatCurrency(kpi.value)
                              : kpi.value}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Target: {key.includes('Rate') || key.includes('Percentage') 
                            ? formatPercentage(kpi.target)
                            : key.includes('Value') 
                              ? formatCurrency(kpi.target)
                              : kpi.target}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recommendations
                  </Typography>
                  <Box>
                    {performanceData?.recommendations?.map((rec: string, index: number) => (
                      <Box key={index} sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          • {rec}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Customers Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Customer Segmentation
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={customerData?.segmentation ? Object.entries(customerData.segmentation).map(([key, value]: [string, any]) => ({
                          name: key.replace(/([A-Z])/g, ' $1').trim(),
                          value: value.count
                        })) : []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.entries(customerData?.segmentation || {}).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Customer Insights
                  </Typography>
                  <Box>
                    {customerData?.insights && Object.entries(customerData.insights).map(([key, insight]: [string, any]) => (
                      <Box key={key} sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" textTransform="capitalize" gutterBottom>
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          {insight.count} customers ({insight.percentage?.toFixed(1)}%)
                        </Typography>
                        <Box>
                          {insight.recommendations?.map((rec: string, index: number) => (
                            <Typography key={index} variant="body2" sx={{ ml: 2 }}>
                              • {rec}
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Forecast Tab */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Booking Forecast (Next 30 Days)
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={forecastData?.forecast || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="predictedBookings" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Forecast Insights
                  </Typography>
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      <strong>Total Predicted Bookings:</strong> {forecastData?.insights?.totalPredictedBookings || 0}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Average Daily Bookings:</strong> {forecastData?.insights?.averageDailyBookings || 0}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Confidence Level:</strong> {forecastData?.insights?.confidenceLevel || 'N/A'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recommendations
                  </Typography>
                  <Box>
                    {forecastData?.insights?.recommendations?.map((rec: string, index: number) => (
                      <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                        • {rec}
                      </Typography>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AnalyticsDashboard;