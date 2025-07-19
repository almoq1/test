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
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Business,
  People,
  Flight,
  AccountBalanceWallet,
  Assessment,
  Settings,
  IntegrationInstructions,
  FileUpload,
  FileDownload,
  Refresh,
  Add,
  Edit,
  Delete,
  Visibility,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Error,
  Warning
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

interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  industry: string;
  size: string;
  status: string;
  apiKey: string;
  settings: {
    bookingLimits: {
      daily: number;
      monthly: number;
      yearly: number;
    };
    paymentSettings: {
      autoRecharge: boolean;
      rechargeThreshold: number;
      rechargeAmount: number;
    };
    notificationSettings: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    integrationSettings: {
      erp: boolean;
      crm: boolean;
      accounting: boolean;
    };
  };
  users: User[];
  createdAt: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
}

interface Analytics {
  overview: {
    totalBookings: number;
    totalRevenue: number;
    activeUsers: number;
    averageBookingValue: number;
  };
  trends: Array<{
    date: string;
    count: number;
    amount: number;
  }>;
  topRoutes: Array<{
    route: string;
    count: number;
    amount: number;
  }>;
  walletStats: {
    currentBalance: number;
    transactions: Array<{
      type: string;
      total: number;
      count: number;
    }>;
  };
  userStats: {
    totalUsers: number;
    activeUsers: number;
    byStatus: Array<{
      status: string;
      count: number;
    }>;
  };
}

const EnterpriseDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState(0);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Dialog states
  const [companyDialog, setCompanyDialog] = useState(false);
  const [integrationDialog, setIntegrationDialog] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [bulkImportDialog, setBulkImportDialog] = useState(false);
  
  // Form states
  const [companyForm, setCompanyForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    industry: '',
    size: 'medium'
  });

  const [integrationForm, setIntegrationForm] = useState({
    type: 'erp',
    apiUrl: '',
    apiKey: '',
    system: '',
    version: ''
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      loadAnalytics(selectedCompany.id);
    }
  }, [selectedCompany]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/enterprise/companies');
      setCompanies(response.data.data || []);
      if (response.data.data && response.data.data.length > 0) {
        setSelectedCompany(response.data.data[0]);
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async (companyId: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/enterprise/analytics/${companyId}`);
      setAnalytics(response.data.data);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async () => {
    try {
      const response = await axios.post('/api/enterprise/companies', companyForm);
      if (response.data.success) {
        setCompanyDialog(false);
        setCompanyForm({
          name: '',
          email: '',
          phone: '',
          address: '',
          industry: '',
          size: 'medium'
        });
        loadCompanies();
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create company');
    }
  };

  const handleSetupIntegration = async () => {
    if (!selectedCompany) return;
    
    try {
      const endpoint = `/api/enterprise/integrations/${selectedCompany.id}/${integrationForm.type}`;
      const response = await axios.post(endpoint, integrationForm);
      if (response.data.success) {
        setIntegrationDialog(false);
        setIntegrationForm({
          type: 'erp',
          apiUrl: '',
          apiKey: '',
          system: '',
          version: ''
        });
        loadCompanies();
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to setup integration');
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
        return 'success';
      case 'inactive':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getSizeColor = (size: string) => {
    switch (size) {
      case 'enterprise':
        return 'error';
      case 'large':
        return 'warning';
      case 'medium':
        return 'info';
      case 'small':
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
                  {analytics ? formatNumber(analytics.overview.totalBookings) : '0'}
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
                  {analytics ? formatCurrency(analytics.overview.totalRevenue) : '$0'}
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
                  Active Users
                </Typography>
                <Typography variant="h4">
                  {analytics ? formatNumber(analytics.overview.activeUsers) : '0'}
                </Typography>
              </Box>
              <People color="info" sx={{ fontSize: 40 }} />
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
                  Avg Booking Value
                </Typography>
                <Typography variant="h4">
                  {analytics ? formatCurrency(analytics.overview.averageBookingValue) : '$0'}
                </Typography>
              </Box>
              <Assessment color="secondary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderAnalyticsCharts = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Booking Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8884d8" name="Bookings" />
                <Line type="monotone" dataKey="amount" stroke="#82ca9d" name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Routes
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.topRoutes || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="route" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              User Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics?.userStats.byStatus || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics?.userStats.byStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Wallet Transactions
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.walletStats.transactions || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#82ca9d" name="Amount" />
                <Bar dataKey="count" fill="#ffc658" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderCompaniesTable = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Companies</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCompanyDialog(true)}
          >
            Add Company
          </Button>
        </Box>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Company</TableCell>
                <TableCell>Industry</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Users</TableCell>
                <TableCell>Integrations</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">{company.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {company.email}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{company.industry}</TableCell>
                  <TableCell>
                    <Chip
                      label={company.size}
                      color={getSizeColor(company.size) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={company.status}
                      color={getStatusColor(company.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{company.users?.length || 0}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5}>
                      {company.settings.integrationSettings.erp && (
                        <Chip label="ERP" size="small" color="primary" />
                      )}
                      {company.settings.integrationSettings.crm && (
                        <Chip label="CRM" size="small" color="secondary" />
                      )}
                      {company.settings.integrationSettings.accounting && (
                        <Chip label="ACC" size="small" color="success" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <IconButton size="small" onClick={() => setSelectedCompany(company)}>
                        <Visibility />
                      </IconButton>
                      <IconButton size="small">
                        <Edit />
                      </IconButton>
                      <IconButton size="small">
                        <Settings />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const renderIntegrationsSection = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Integrations</Typography>
          <Button
            variant="contained"
            startIcon={<IntegrationInstructions />}
            onClick={() => setIntegrationDialog(true)}
          >
            Setup Integration
          </Button>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6">ERP</Typography>
                  <Chip
                    label={selectedCompany?.settings.integrationSettings.erp ? 'Connected' : 'Not Connected'}
                    color={selectedCompany?.settings.integrationSettings.erp ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6">CRM</Typography>
                  <Chip
                    label={selectedCompany?.settings.integrationSettings.crm ? 'Connected' : 'Not Connected'}
                    color={selectedCompany?.settings.integrationSettings.crm ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6">Accounting</Typography>
                  <Chip
                    label={selectedCompany?.settings.integrationSettings.accounting ? 'Connected' : 'Not Connected'}
                    color={selectedCompany?.settings.integrationSettings.accounting ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderBulkOperations = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Bulk Operations
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  User Import
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Import multiple users from CSV file
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<FileUpload />}
                  onClick={() => setBulkImportDialog(true)}
                >
                  Import Users
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Booking Export
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Export booking data to CSV/PDF
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<FileDownload />}
                >
                  Export Bookings
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Enterprise Dashboard
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab label="Overview" />
        <Tab label="Companies" />
        <Tab label="Analytics" />
        <Tab label="Integrations" />
        <Tab label="Bulk Operations" />
      </Tabs>
      
      {loading && (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      )}
      
      {activeTab === 0 && selectedCompany && (
        <Box>
          <Typography variant="h5" gutterBottom>
            {selectedCompany.name} - Overview
          </Typography>
          {renderOverviewCards()}
          {renderAnalyticsCharts()}
        </Box>
      )}
      
      {activeTab === 1 && renderCompaniesTable()}
      
      {activeTab === 2 && selectedCompany && (
        <Box>
          <Typography variant="h5" gutterBottom>
            {selectedCompany.name} - Analytics
          </Typography>
          {renderAnalyticsCharts()}
        </Box>
      )}
      
      {activeTab === 3 && selectedCompany && (
        <Box>
          <Typography variant="h5" gutterBottom>
            {selectedCompany.name} - Integrations
          </Typography>
          {renderIntegrationsSection()}
        </Box>
      )}
      
      {activeTab === 4 && selectedCompany && (
        <Box>
          <Typography variant="h5" gutterBottom>
            {selectedCompany.name} - Bulk Operations
          </Typography>
          {renderBulkOperations()}
        </Box>
      )}
      
      {/* Company Dialog */}
      <Dialog open={companyDialog} onClose={() => setCompanyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Company</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company Name"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={companyForm.email}
                onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                value={companyForm.phone}
                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={companyForm.address}
                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Industry"
                value={companyForm.industry}
                onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Size</InputLabel>
                <Select
                  value={companyForm.size}
                  label="Size"
                  onChange={(e) => setCompanyForm({ ...companyForm, size: e.target.value })}
                >
                  <MenuItem value="small">Small</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="large">Large</MenuItem>
                  <MenuItem value="enterprise">Enterprise</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompanyDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateCompany} variant="contained">
            Create Company
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Integration Dialog */}
      <Dialog open={integrationDialog} onClose={() => setIntegrationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Setup Integration</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Integration Type</InputLabel>
                <Select
                  value={integrationForm.type}
                  label="Integration Type"
                  onChange={(e) => setIntegrationForm({ ...integrationForm, type: e.target.value })}
                >
                  <MenuItem value="erp">ERP System</MenuItem>
                  <MenuItem value="crm">CRM System</MenuItem>
                  <MenuItem value="accounting">Accounting System</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="API URL"
                value={integrationForm.apiUrl}
                onChange={(e) => setIntegrationForm({ ...integrationForm, apiUrl: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="API Key"
                type="password"
                value={integrationForm.apiKey}
                onChange={(e) => setIntegrationForm({ ...integrationForm, apiKey: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="System"
                value={integrationForm.system}
                onChange={(e) => setIntegrationForm({ ...integrationForm, system: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Version"
                value={integrationForm.version}
                onChange={(e) => setIntegrationForm({ ...integrationForm, version: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIntegrationDialog(false)}>Cancel</Button>
          <Button onClick={handleSetupIntegration} variant="contained">
            Setup Integration
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnterpriseDashboard;