import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AccountBalanceWallet,
  Add,
  Remove,
  SwapHoriz,
  TrendingUp,
  TrendingDown,
  Payment,
  Receipt,
  Download,
  History,
  CreditCard,
  AccountBalance,
} from '@mui/icons-material';

interface WalletData {
  id: string;
  balance: number;
  currency: string;
  status: string;
  lastTransactionDate: string;
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit' | 'transfer';
  amount: number;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
}

const Wallet: React.FC = () => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  
  // Dialog states
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [deductFundsOpen, setDeductFundsOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  
  // Form states
  const [addFundsForm, setAddFundsForm] = useState({ amount: '', description: '', paymentMethod: 'card' });
  const [deductFundsForm, setDeductFundsForm] = useState({ amount: '', description: '' });
  const [transferForm, setTransferForm] = useState({ 
    toUserId: '', 
    amount: '', 
    description: '' 
  });

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      // Simulate API calls - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock wallet data
      setWallet({
        id: '1',
        balance: 1250.50,
        currency: 'USD',
        status: 'active',
        lastTransactionDate: '2024-11-25T15:30:00Z',
      });

      // Mock transaction data
      setTransactions([
        {
          id: '1',
          type: 'credit',
          amount: 500.00,
          description: 'Added funds via credit card',
          balanceBefore: 750.50,
          balanceAfter: 1250.50,
          createdAt: '2024-11-25T15:30:00Z',
          status: 'completed',
          reference: 'TXN2024112501',
        },
        {
          id: '2',
          type: 'debit',
          amount: 450.00,
          description: 'Flight booking - JFK to LAX',
          balanceBefore: 1200.50,
          balanceAfter: 750.50,
          createdAt: '2024-11-20T10:15:00Z',
          status: 'completed',
          reference: 'TXN2024112001',
        },
        {
          id: '3',
          type: 'credit',
          amount: 1000.00,
          description: 'Company reimbursement',
          balanceBefore: 200.50,
          balanceAfter: 1200.50,
          createdAt: '2024-11-15T14:20:00Z',
          status: 'completed',
          reference: 'TXN2024111501',
        },
        {
          id: '4',
          type: 'debit',
          amount: 350.00,
          description: 'Flight booking - LAX to SFO',
          balanceBefore: 550.50,
          balanceAfter: 200.50,
          createdAt: '2024-11-10T09:45:00Z',
          status: 'completed',
          reference: 'TXN2024111001',
        },
        {
          id: '5',
          type: 'transfer',
          amount: 200.00,
          description: 'Transfer to Jane Doe',
          balanceBefore: 750.50,
          balanceAfter: 550.50,
          createdAt: '2024-11-05T16:30:00Z',
          status: 'completed',
          reference: 'TXN2024110501',
        },
      ]);
    } catch (err: any) {
      setError('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async () => {
    try {
      const amount = parseFloat(addFundsForm.amount);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update wallet balance
      setWallet(prev => prev ? {
        ...prev,
        balance: prev.balance + amount,
        lastTransactionDate: new Date().toISOString(),
      } : null);

      // Add transaction
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: 'credit',
        amount,
        description: addFundsForm.description || 'Added funds',
        balanceBefore: wallet?.balance || 0,
        balanceAfter: (wallet?.balance || 0) + amount,
        createdAt: new Date().toISOString(),
        status: 'completed',
        reference: `TXN${Date.now()}`,
      };

      setTransactions(prev => [newTransaction, ...prev]);
      setAddFundsOpen(false);
      setAddFundsForm({ amount: '', description: '', paymentMethod: 'card' });
    } catch (err: any) {
      setError('Failed to add funds');
    }
  };

  const handleDeductFunds = async () => {
    try {
      const amount = parseFloat(deductFundsForm.amount);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      if (amount > (wallet?.balance || 0)) {
        setError('Insufficient balance');
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update wallet balance
      setWallet(prev => prev ? {
        ...prev,
        balance: prev.balance - amount,
        lastTransactionDate: new Date().toISOString(),
      } : null);

      // Add transaction
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: 'debit',
        amount,
        description: deductFundsForm.description || 'Deducted funds',
        balanceBefore: wallet?.balance || 0,
        balanceAfter: (wallet?.balance || 0) - amount,
        createdAt: new Date().toISOString(),
        status: 'completed',
        reference: `TXN${Date.now()}`,
      };

      setTransactions(prev => [newTransaction, ...prev]);
      setDeductFundsOpen(false);
      setDeductFundsForm({ amount: '', description: '' });
    } catch (err: any) {
      setError('Failed to deduct funds');
    }
  };

  const handleTransfer = async () => {
    try {
      const amount = parseFloat(transferForm.amount);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      if (amount > (wallet?.balance || 0)) {
        setError('Insufficient balance');
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update wallet balance
      setWallet(prev => prev ? {
        ...prev,
        balance: prev.balance - amount,
        lastTransactionDate: new Date().toISOString(),
      } : null);

      // Add transaction
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: 'transfer',
        amount,
        description: `Transfer to ${transferForm.toUserId} - ${transferForm.description}`,
        balanceBefore: wallet?.balance || 0,
        balanceAfter: (wallet?.balance || 0) - amount,
        createdAt: new Date().toISOString(),
        status: 'completed',
        reference: `TXN${Date.now()}`,
      };

      setTransactions(prev => [newTransaction, ...prev]);
      setTransferOpen(false);
      setTransferForm({ toUserId: '', amount: '', description: '' });
    } catch (err: any) {
      setError('Failed to transfer funds');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: wallet?.currency || 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return <TrendingUp color="success" />;
      case 'debit':
        return <TrendingDown color="error" />;
      case 'transfer':
        return <SwapHoriz color="info" />;
      default:
        return <Payment color="action" />;
    }
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
      <Typography variant="h4" gutterBottom>
        Wallet Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Wallet Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Current Balance
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {formatCurrency(wallet?.balance || 0)}
                  </Typography>
                </Box>
                <AccountBalanceWallet color="primary" sx={{ fontSize: 40 }} />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Currency: {wallet?.currency}
              </Typography>
              <Chip 
                label={wallet?.status} 
                color={getStatusColor(wallet?.status || '') as any}
                size="small"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setAddFundsOpen(true)}
                  sx={{ height: 56 }}
                >
                  Add Funds
                </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Remove />}
                  onClick={() => setDeductFundsOpen(true)}
                  sx={{ height: 56 }}
                >
                  Deduct Funds
                </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SwapHoriz />}
                  onClick={() => setTransferOpen(true)}
                  sx={{ height: 56 }}
                >
                  Transfer
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Transaction History */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Transaction History
        </Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Balance After</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Reference</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getTransactionIcon(transaction.type)}
                      <Chip
                        label={transaction.type.toUpperCase()}
                        color={transaction.type === 'credit' ? 'success' : transaction.type === 'debit' ? 'error' : 'info'}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell align="right">
                    <Typography
                      color={transaction.type === 'credit' ? 'success.main' : 'error.main'}
                      fontWeight="bold"
                    >
                      {transaction.type === 'credit' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(transaction.balanceAfter)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={transaction.status}
                      color={getStatusColor(transaction.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {transaction.reference}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {transactions.length === 0 && (
          <Box textAlign="center" py={4}>
            <AccountBalanceWallet sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No transactions yet
            </Typography>
            <Typography color="text.secondary">
              Your transaction history will appear here once you make your first transaction.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Add Funds Dialog */}
      <Dialog open={addFundsOpen} onClose={() => setAddFundsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Funds to Wallet</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={addFundsForm.amount}
            onChange={(e) => setAddFundsForm(prev => ({ ...prev, amount: e.target.value }))}
            sx={{ mt: 2 }}
            InputProps={{
              startAdornment: <Typography color="text.secondary">$</Typography>,
            }}
          />
          <TextField
            fullWidth
            label="Description (Optional)"
            value={addFundsForm.description}
            onChange={(e) => setAddFundsForm(prev => ({ ...prev, description: e.target.value }))}
            sx={{ mt: 2 }}
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={addFundsForm.paymentMethod}
              label="Payment Method"
              onChange={(e) => setAddFundsForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
            >
              <MenuItem value="card">Credit/Debit Card</MenuItem>
              <MenuItem value="bank">Bank Transfer</MenuItem>
              <MenuItem value="paypal">PayPal</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddFundsOpen(false)}>Cancel</Button>
          <Button onClick={handleAddFunds} variant="contained">Add Funds</Button>
        </DialogActions>
      </Dialog>

      {/* Deduct Funds Dialog */}
      <Dialog open={deductFundsOpen} onClose={() => setDeductFundsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Deduct Funds from Wallet</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={deductFundsForm.amount}
            onChange={(e) => setDeductFundsForm(prev => ({ ...prev, amount: e.target.value }))}
            sx={{ mt: 2 }}
            InputProps={{
              startAdornment: <Typography color="text.secondary">$</Typography>,
            }}
          />
          <TextField
            fullWidth
            label="Description (Optional)"
            value={deductFundsForm.description}
            onChange={(e) => setDeductFundsForm(prev => ({ ...prev, description: e.target.value }))}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeductFundsOpen(false)}>Cancel</Button>
          <Button onClick={handleDeductFunds} variant="contained">Deduct Funds</Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onClose={() => setTransferOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transfer Funds</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Recipient Email or ID"
            value={transferForm.toUserId}
            onChange={(e) => setTransferForm(prev => ({ ...prev, toUserId: e.target.value }))}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={transferForm.amount}
            onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
            sx={{ mt: 2 }}
            InputProps={{
              startAdornment: <Typography color="text.secondary">$</Typography>,
            }}
          />
          <TextField
            fullWidth
            label="Description (Optional)"
            value={transferForm.description}
            onChange={(e) => setTransferForm(prev => ({ ...prev, description: e.target.value }))}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferOpen(false)}>Cancel</Button>
          <Button onClick={handleTransfer} variant="contained">Transfer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Wallet;