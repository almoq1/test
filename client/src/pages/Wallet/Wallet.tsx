import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
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
  Pagination
} from '@mui/material';
import {
  AccountBalanceWallet,
  Add,
  Remove,
  SwapHoriz,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';
import axios from 'axios';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

interface WalletData {
  id: string;
  balance: number;
  currency: string;
  status: string;
  lastTransactionDate: string;
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

const Wallet: React.FC = () => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Dialog states
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [deductFundsOpen, setDeductFundsOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  
  // Form states
  const [addFundsForm, setAddFundsForm] = useState({ amount: '', description: '' });
  const [deductFundsForm, setDeductFundsForm] = useState({ amount: '', description: '' });
  const [transferForm, setTransferForm] = useState({ 
    toUserId: '', 
    amount: '', 
    description: '' 
  });
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchWalletData();
    fetchUsers();
  }, [page]);

  const fetchWalletData = async () => {
    try {
      const [walletResponse, transactionsResponse] = await Promise.all([
        axios.get('/api/wallet/balance'),
        axios.get(`/api/wallet/transactions?page=${page}&limit=10`)
      ]);

      setWallet(walletResponse.data.wallet);
      setTransactions(transactionsResponse.data.transactions);
      setTotalPages(transactionsResponse.data.pagination?.totalPages || 1);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleAddFunds = async () => {
    try {
      await axios.post('/api/wallet/add-funds', {
        amount: parseFloat(addFundsForm.amount),
        description: addFundsForm.description
      });
      setAddFundsOpen(false);
      setAddFundsForm({ amount: '', description: '' });
      fetchWalletData();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to add funds');
    }
  };

  const handleDeductFunds = async () => {
    try {
      await axios.post('/api/wallet/deduct-funds', {
        amount: parseFloat(deductFundsForm.amount),
        description: deductFundsForm.description
      });
      setDeductFundsOpen(false);
      setDeductFundsForm({ amount: '', description: '' });
      fetchWalletData();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to deduct funds');
    }
  };

  const handleTransfer = async () => {
    try {
      await axios.post('/api/wallet/transfer', {
        toUserId: transferForm.toUserId,
        amount: parseFloat(transferForm.amount),
        description: transferForm.description
      });
      setTransferOpen(false);
      setTransferForm({ toUserId: '', amount: '', description: '' });
      fetchWalletData();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to transfer funds');
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

  if (loading) {
    return <LoadingSpinner message="Loading wallet..." />;
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
                color={wallet?.status === 'active' ? 'success' : 'default'}
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
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                  <TableCell>
                    <Chip
                      icon={transaction.type === 'credit' ? <TrendingUp /> : <TrendingDown />}
                      label={transaction.type.toUpperCase()}
                      color={transaction.type === 'credit' ? 'success' : 'error'}
                      size="small"
                    />
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
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
          />
          <TextField
            fullWidth
            label="Description"
            value={addFundsForm.description}
            onChange={(e) => setAddFundsForm(prev => ({ ...prev, description: e.target.value }))}
            sx={{ mt: 2 }}
          />
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
          />
          <TextField
            fullWidth
            label="Description"
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
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Transfer To</InputLabel>
            <Select
              value={transferForm.toUserId}
              label="Transfer To"
              onChange={(e) => setTransferForm(prev => ({ ...prev, toUserId: e.target.value }))}
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={transferForm.amount}
            onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
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