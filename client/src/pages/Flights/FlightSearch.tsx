import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Flight,
  Search,
  Schedule,
  AirplaneTicket,
  Business
} from '@mui/icons-material';
import axios from 'axios';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

interface Flight {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  airline: {
    name: string;
    iataCode: string;
    logo?: string;
  };
  price: number;
  availableSeats: number;
  cabinClass: string;
  duration: string;
}

const FlightSearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchForm, setSearchForm] = useState({
    origin: '',
    destination: '',
    departureDate: null as Date | null,
    returnDate: null as Date | null,
    passengers: 1,
    cabinClass: 'economy',
    direct: false
  });
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [airlines, setAirlines] = useState<any[]>([]);

  useEffect(() => {
    fetchAirlines();
  }, []);

  const fetchAirlines = async () => {
    try {
      const response = await axios.get('/api/flights/airlines/available');
      setAirlines(response.data.airlines);
    } catch (error) {
      console.error('Failed to fetch airlines:', error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchForm.origin || !searchForm.destination || !searchForm.departureDate) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        origin: searchForm.origin.toUpperCase(),
        destination: searchForm.destination.toUpperCase(),
        departureDate: searchForm.departureDate.toISOString().split('T')[0],
        passengers: searchForm.passengers.toString(),
        cabinClass: searchForm.cabinClass,
        direct: searchForm.direct.toString()
      });

      if (searchForm.returnDate) {
        params.append('returnDate', searchForm.returnDate.toISOString().split('T')[0]);
      }

      const response = await axios.get(`/api/flights/search?${params}`);
      setFlights(response.data.flights);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to search flights');
    } finally {
      setLoading(false);
    }
  };

  const handleBookFlight = (flight: Flight) => {
    navigate('/bookings/create', { 
      state: { 
        flight,
        passengers: searchForm.passengers,
        cabinClass: searchForm.cabinClass
      }
    });
  };

  const formatDuration = (duration: string) => {
    // Assuming duration is in format "PT2H30M" or similar
    return duration.replace('PT', '').replace('H', 'h ').replace('M', 'm');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Search Flights
      </Typography>

      {/* Search Form */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSearch}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="From"
                placeholder="Airport code (e.g., JFK)"
                value={searchForm.origin}
                onChange={(e) => setSearchForm(prev => ({ ...prev, origin: e.target.value }))}
                inputProps={{ maxLength: 3, style: { textTransform: 'uppercase' } }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="To"
                placeholder="Airport code (e.g., LAX)"
                value={searchForm.destination}
                onChange={(e) => setSearchForm(prev => ({ ...prev, destination: e.target.value }))}
                inputProps={{ maxLength: 3, style: { textTransform: 'uppercase' } }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Departure Date"
                  value={searchForm.departureDate}
                  onChange={(date) => setSearchForm(prev => ({ ...prev, departureDate: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                  minDate={new Date()}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Return Date (Optional)"
                  value={searchForm.returnDate}
                  onChange={(date) => setSearchForm(prev => ({ ...prev, returnDate: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  minDate={searchForm.departureDate || new Date()}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Passengers</InputLabel>
                <Select
                  value={searchForm.passengers}
                  label="Passengers"
                  onChange={(e) => setSearchForm(prev => ({ ...prev, passengers: e.target.value as number }))}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <MenuItem key={num} value={num}>{num}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Cabin Class</InputLabel>
                <Select
                  value={searchForm.cabinClass}
                  label="Cabin Class"
                  onChange={(e) => setSearchForm(prev => ({ ...prev, cabinClass: e.target.value }))}
                >
                  <MenuItem value="economy">Economy</MenuItem>
                  <MenuItem value="premium_economy">Premium Economy</MenuItem>
                  <MenuItem value="business">Business</MenuItem>
                  <MenuItem value="first">First Class</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={searchForm.direct}
                    onChange={(e) => setSearchForm(prev => ({ ...prev, direct: e.target.checked }))}
                  />
                }
                label="Direct flights only"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<Search />}
                disabled={loading}
                sx={{ minWidth: 200 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Search Flights'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && <LoadingSpinner message="Searching flights..." />}

      {/* Flight Results */}
      {!loading && flights.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Found {flights.length} flights
          </Typography>
          <Grid container spacing={2}>
            {flights.map((flight) => (
              <Grid item xs={12} key={flight.id}>
                <Card>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={3}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Business color="primary" />
                          <Typography variant="h6">
                            {flight.airline.name}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {flight.airline.iataCode}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box textAlign="center">
                            <Typography variant="h6">
                              {new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {flight.origin}
                            </Typography>
                          </Box>
                          <Box textAlign="center" flex={1}>
                            <Flight sx={{ transform: 'rotate(90deg)', color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {formatDuration(flight.duration)}
                            </Typography>
                          </Box>
                          <Box textAlign="center">
                            <Typography variant="h6">
                              {new Date(flight.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {flight.destination}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Box textAlign="center">
                          <Chip 
                            label={flight.cabinClass.replace('_', ' ').toUpperCase()} 
                            color="primary" 
                            size="small" 
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {flight.availableSeats} seats left
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Box textAlign="center">
                          <Typography variant="h5" color="primary" gutterBottom>
                            {formatPrice(flight.price)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            per passenger
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={1}>
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => handleBookFlight(flight)}
                          startIcon={<AirplaneTicket />}
                        >
                          Book
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* No Results */}
      {!loading && flights.length === 0 && !error && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Flight sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No flights found
          </Typography>
          <Typography color="text.secondary">
            Try adjusting your search criteria or dates
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default FlightSearch;