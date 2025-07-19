import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  IconButton,
  Collapse,
  Alert,
  CircularProgress,
  Fab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Flight,
  LocationOn,
  CalendarToday,
  People,
  BusinessClass,
  FilterList,
  Search,
  SwapHoriz,
  MyLocation,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addDays } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import pwaService from '../../services/pwaService';

interface FlightSearchForm {
  origin: string;
  destination: string;
  departureDate: Date | null;
  returnDate: Date | null;
  passengers: number;
  cabinClass: string;
  directFlights: boolean;
  flexibleDates: boolean;
}

interface FlightResult {
  id: string;
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  stops: number;
  cabinClass: string;
}

const MobileFlightSearch: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  
  const [form, setForm] = useState<FlightSearchForm>({
    origin: '',
    destination: '',
    departureDate: addDays(new Date(), 7),
    returnDate: addDays(new Date(), 14),
    passengers: 1,
    cabinClass: 'economy',
    directFlights: false,
    flexibleDates: false
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FlightResult[]>([]);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Popular destinations for quick selection
  const popularDestinations = [
    { code: 'NYC', name: 'New York' },
    { code: 'LAX', name: 'Los Angeles' },
    { code: 'LHR', name: 'London' },
    { code: 'CDG', name: 'Paris' },
    { code: 'DXB', name: 'Dubai' },
    { code: 'SIN', name: 'Singapore' }
  ];

  // Cabin class options
  const cabinClasses = [
    { value: 'economy', label: 'Economy' },
    { value: 'premium_economy', label: 'Premium Economy' },
    { value: 'business', label: 'Business' },
    { value: 'first', label: 'First Class' }
  ];

  useEffect(() => {
    // Listen for connection changes
    const handleConnectionChange = (event: CustomEvent) => {
      setIsOnline(event.detail.isOnline);
    };

    window.addEventListener('connectionChange', handleConnectionChange as EventListener);
    
    return () => {
      window.removeEventListener('connectionChange', handleConnectionChange as EventListener);
    };
  }, []);

  const handleInputChange = (field: keyof FlightSearchForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const swapLocations = () => {
    setForm(prev => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin
    }));
  };

  const selectPopularDestination = (destination: { code: string; name: string }) => {
    setForm(prev => ({ ...prev, destination: destination.code }));
  };

  const handleSearch = async () => {
    if (!form.origin || !form.destination || !form.departureDate) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.get('/api/flights/search', {
        params: {
          origin: form.origin,
          destination: form.destination,
          departureDate: format(form.departureDate!, 'yyyy-MM-dd'),
          returnDate: form.returnDate ? format(form.returnDate, 'yyyy-MM-dd') : undefined,
          passengers: form.passengers,
          cabinClass: form.cabinClass,
          directFlights: form.directFlights
        }
      });

      setResults(response.data.data || []);
      
      // Store search in offline cache if offline
      if (!isOnline) {
        await pwaService.storeOfflineAction({
          type: 'CREATE_BOOKING',
          data: { searchQuery: form, results: response.data.data }
        });
      }

    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to search flights');
      
      // If offline, store the search action
      if (!isOnline) {
        await pwaService.storeOfflineAction({
          type: 'CREATE_BOOKING',
          data: { searchQuery: form }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBookFlight = async (flight: FlightResult) => {
    try {
      const bookingData = {
        flightId: flight.id,
        passengers: form.passengers,
        cabinClass: form.cabinClass,
        totalAmount: flight.price * form.passengers
      };

      if (!isOnline) {
        // Store offline action
        await pwaService.storeOfflineAction({
          type: 'CREATE_BOOKING',
          data: bookingData
        });
        alert('Booking will be processed when you are back online');
      } else {
        // Process booking immediately
        const response = await axios.post('/api/bookings', bookingData);
        alert('Booking created successfully!');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create booking');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatTime = (time: string) => {
    return new Date(time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ pb: isMobile ? 8 : 0 }}>
        {/* Connection Status */}
        {!isOnline && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            You are offline. Some features may be limited.
          </Alert>
        )}

        {/* Search Form */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Search Flights
            </Typography>

            {/* Origin and Destination */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={5}>
                <TextField
                  fullWidth
                  label="From"
                  value={form.origin}
                  onChange={(e) => handleInputChange('origin', e.target.value)}
                  placeholder="Airport code"
                  InputProps={{
                    startAdornment: <LocationOn color="action" sx={{ mr: 1 }} />
                  }}
                />
              </Grid>
              <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconButton onClick={swapLocations} size="small">
                  <SwapHoriz />
                </IconButton>
              </Grid>
              <Grid item xs={5}>
                <TextField
                  fullWidth
                  label="To"
                  value={form.destination}
                  onChange={(e) => handleInputChange('destination', e.target.value)}
                  placeholder="Airport code"
                  InputProps={{
                    startAdornment: <LocationOn color="action" sx={{ mr: 1 }} />
                  }}
                />
              </Grid>
            </Grid>

            {/* Popular Destinations */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Popular destinations:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {popularDestinations.map((dest) => (
                  <Chip
                    key={dest.code}
                    label={dest.name}
                    size="small"
                    onClick={() => selectPopularDestination(dest)}
                    variant={form.destination === dest.code ? 'filled' : 'outlined'}
                    color={form.destination === dest.code ? 'primary' : 'default'}
                  />
                ))}
              </Box>
            </Box>

            {/* Dates */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <DatePicker
                  label="Departure"
                  value={form.departureDate}
                  onChange={(date) => handleInputChange('departureDate', date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  minDate={new Date()}
                />
              </Grid>
              <Grid item xs={6}>
                <DatePicker
                  label="Return (Optional)"
                  value={form.returnDate}
                  onChange={(date) => handleInputChange('returnDate', date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  minDate={form.departureDate || new Date()}
                />
              </Grid>
            </Grid>

            {/* Passengers and Cabin Class */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Passengers"
                  type="number"
                  value={form.passengers}
                  onChange={(e) => handleInputChange('passengers', parseInt(e.target.value))}
                  inputProps={{ min: 1, max: 9 }}
                  InputProps={{
                    startAdornment: <People color="action" sx={{ mr: 1 }} />
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Cabin Class</InputLabel>
                  <Select
                    value={form.cabinClass}
                    label="Cabin Class"
                    onChange={(e) => handleInputChange('cabinClass', e.target.value)}
                  >
                    {cabinClasses.map((cabin) => (
                      <MenuItem key={cabin.value} value={cabin.value}>
                        {cabin.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Filters Toggle */}
            <Box sx={{ mb: 2 }}>
              <Button
                startIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
                onClick={() => setShowFilters(!showFilters)}
                size="small"
              >
                Filters
              </Button>
            </Box>

            {/* Filters */}
            <Collapse in={showFilters}>
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.directFlights}
                      onChange={(e) => handleInputChange('directFlights', e.target.checked)}
                    />
                  }
                  label="Direct flights only"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.flexibleDates}
                      onChange={(e) => handleInputChange('flexibleDates', e.target.checked)}
                    />
                  }
                  label="Flexible dates"
                />
              </Box>
            </Collapse>

            {/* Search Button */}
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Search />}
              sx={{ mb: 2 }}
            >
              {loading ? 'Searching...' : 'Search Flights'}
            </Button>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {results.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {results.length} flights found
            </Typography>
            
            {results.map((flight) => (
              <Card key={flight.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={8}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {flight.airline} {flight.flightNumber}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {flight.origin} → {flight.destination}
                      </Typography>
                      <Typography variant="body2">
                        {formatTime(flight.departureTime)} - {formatTime(flight.arrivalTime)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {flight.duration} • {flight.stops} stop{flight.stops !== 1 ? 's' : ''}
                      </Typography>
                    </Grid>
                    <Grid item xs={4} sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        {formatPrice(flight.price)}
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleBookFlight(flight)}
                        sx={{ mt: 1 }}
                      >
                        Book
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {/* Floating Action Button for Quick Search */}
        {isMobile && (
          <Fab
            color="primary"
            aria-label="search"
            sx={{
              position: 'fixed',
              bottom: 80,
              right: 16,
              zIndex: 1000
            }}
            onClick={handleSearch}
            disabled={loading}
          >
            <Search />
          </Fab>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default MobileFlightSearch;