import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Flight,
  BookOnline,
  Receipt,
  Cancel,
  Download,
  Visibility,
  Edit,
  FilterList,
  Search,
  Person,
  Schedule,
  Business,
  LocationOn,
} from '@mui/icons-material';

interface Booking {
  id: string;
  bookingReference: string;
  flight: {
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    airline: string;
    flightNumber: string;
  };
  passengers: Array<{
    firstName: string;
    lastName: string;
    type: 'adult' | 'child' | 'infant';
  }>;
  totalAmount: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  bookingDate: string;
  travelDate: string;
  cabinClass: string;
  seats: string[];
  paymentStatus: 'paid' | 'pending' | 'failed';
}

const Bookings: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    search: '',
  });

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock booking data
      const mockBookings: Booking[] = [
        {
          id: '1',
          bookingReference: 'BK202412001',
          flight: {
            origin: 'JFK',
            destination: 'LAX',
            departureTime: '2024-12-15T08:00:00Z',
            arrivalTime: '2024-12-15T11:30:00Z',
            airline: 'American Airlines',
            flightNumber: 'AA123',
          },
          passengers: [
            { firstName: 'John', lastName: 'Doe', type: 'adult' },
            { firstName: 'Jane', lastName: 'Doe', type: 'adult' },
          ],
          totalAmount: 900.00,
          status: 'confirmed',
          bookingDate: '2024-11-20T10:30:00Z',
          travelDate: '2024-12-15',
          cabinClass: 'economy',
          seats: ['12A', '12B'],
          paymentStatus: 'paid',
        },
        {
          id: '2',
          bookingReference: 'BK202412002',
          flight: {
            origin: 'LAX',
            destination: 'SFO',
            departureTime: '2024-12-20T14:00:00Z',
            arrivalTime: '2024-12-20T15:30:00Z',
            airline: 'Delta Air Lines',
            flightNumber: 'DL456',
          },
          passengers: [
            { firstName: 'John', lastName: 'Doe', type: 'adult' },
          ],
          totalAmount: 350.00,
          status: 'pending',
          bookingDate: '2024-11-25T15:45:00Z',
          travelDate: '2024-12-20',
          cabinClass: 'business',
          seats: ['2A'],
          paymentStatus: 'pending',
        },
        {
          id: '3',
          bookingReference: 'BK202412003',
          flight: {
            origin: 'ORD',
            destination: 'MIA',
            departureTime: '2024-11-10T09:00:00Z',
            arrivalTime: '2024-11-10T12:30:00Z',
            airline: 'United Airlines',
            flightNumber: 'UA789',
          },
          passengers: [
            { firstName: 'John', lastName: 'Doe', type: 'adult' },
            { firstName: 'Mike', lastName: 'Doe', type: 'child' },
          ],
          totalAmount: 650.00,
          status: 'completed',
          bookingDate: '2024-10-15T11:20:00Z',
          travelDate: '2024-11-10',
          cabinClass: 'economy',
          seats: ['15C', '15D'],
          paymentStatus: 'paid',
        },
      ];

      setBookings(mockBookings);
    } catch (err: any) {
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailDialogOpen(true);
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'cancelled' as const }
            : booking
        )
      );
    } catch (err: any) {
      setError('Failed to cancel booking');
    }
  };

  const handleDownloadReceipt = (booking: Booking) => {
    // Simulate download
    console.log('Downloading receipt for:', booking.bookingReference);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const filteredBookings = bookings.filter(booking => {
    if (filters.status !== 'all' && booking.status !== filters.status) {
      return false;
    }
    if (filters.search && !booking.bookingReference.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getTabBookings = (tabIndex: number) => {
    switch (tabIndex) {
      case 0: // All
        return filteredBookings;
      case 1: // Upcoming
        return filteredBookings.filter(booking => 
          new Date(booking.travelDate) > new Date() && booking.status === 'confirmed'
        );
      case 2: // Past
        return filteredBookings.filter(booking => 
          new Date(booking.travelDate) <= new Date()
        );
      case 3: // Pending
        return filteredBookings.filter(booking => booking.status === 'pending');
      default:
        return filteredBookings;
    }
  };

  const tabBookings = getTabBookings(activeTab);

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
        My Bookings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Search bookings"
              placeholder="Booking reference..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              InputProps={{
                startAdornment: <Search />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              startIcon={<Flight />}
              onClick={() => navigate('/flights')}
              fullWidth
            >
              Book New Flight
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`All (${filteredBookings.length})`} />
          <Tab label={`Upcoming (${filteredBookings.filter(b => new Date(b.travelDate) > new Date() && b.status === 'confirmed').length})`} />
          <Tab label={`Past (${filteredBookings.filter(b => new Date(b.travelDate) <= new Date()).length})`} />
          <Tab label={`Pending (${filteredBookings.filter(b => b.status === 'pending').length})`} />
        </Tabs>
      </Paper>

      {/* Bookings Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Booking Ref</TableCell>
                <TableCell>Flight</TableCell>
                <TableCell>Travel Date</TableCell>
                <TableCell>Passengers</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tabBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {booking.bookingReference}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(booking.bookingDate)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {booking.flight.origin} → {booking.flight.destination}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {booking.flight.airline} {booking.flight.flightNumber}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(booking.travelDate)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatTime(booking.flight.departureTime)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {booking.passengers.length} passenger{booking.passengers.length > 1 ? 's' : ''}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {booking.cabinClass}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(booking.totalAmount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={booking.status}
                      color={getStatusColor(booking.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={booking.paymentStatus}
                      color={getPaymentStatusColor(booking.paymentStatus) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(booking)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download Receipt">
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadReceipt(booking)}
                        >
                          <Download />
                        </IconButton>
                      </Tooltip>
                      {booking.status === 'confirmed' && new Date(booking.travelDate) > new Date() && (
                        <Tooltip title="Cancel Booking">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            <Cancel />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {tabBookings.length === 0 && (
          <Box textAlign="center" py={4}>
            <BookOnline sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No bookings found
            </Typography>
            <Typography color="text.secondary">
              {activeTab === 0 ? 'You haven\'t made any bookings yet.' : 'No bookings match your current filter.'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Flight />}
              onClick={() => navigate('/flights')}
              sx={{ mt: 2 }}
            >
              Book Your First Flight
            </Button>
          </Box>
        )}
      </Paper>

      {/* Booking Details Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedBooking && (
          <>
            <DialogTitle>
              Booking Details - {selectedBooking.bookingReference}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Flight Information
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Flight />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${selectedBooking.flight.origin} → ${selectedBooking.flight.destination}`}
                        secondary={`${selectedBooking.flight.airline} ${selectedBooking.flight.flightNumber}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Schedule />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${formatDate(selectedBooking.travelDate)} at ${formatTime(selectedBooking.flight.departureTime)}`}
                        secondary={`Duration: ${formatTime(selectedBooking.flight.arrivalTime)}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Business />
                      </ListItemIcon>
                      <ListItemText
                        primary={selectedBooking.cabinClass.toUpperCase()}
                        secondary={`Seats: ${selectedBooking.seats.join(', ')}`}
                      />
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Passenger Information
                  </Typography>
                  <List>
                    {selectedBooking.passengers.map((passenger, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Person />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${passenger.firstName} ${passenger.lastName}`}
                          secondary={`${passenger.type.charAt(0).toUpperCase() + passenger.type.slice(1)}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="h6" gutterBottom>
                    Payment Information
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Total Amount"
                        secondary={formatCurrency(selectedBooking.totalAmount)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Payment Status"
                        secondary={
                          <Chip
                            label={selectedBooking.paymentStatus}
                            color={getPaymentStatusColor(selectedBooking.paymentStatus) as any}
                            size="small"
                          />
                        }
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={() => handleDownloadReceipt(selectedBooking)}
              >
                Download Receipt
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Bookings;