import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Paper,
  Box,
  Grid,
  TextField,
  Button,
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
  Checkbox,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Flight,
  Search,
  Business,
  Schedule,
  AirplaneTicket,
  Favorite,
  FavoriteBorder,
  Sort,
  FilterList,
} from '@mui/icons-material';

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
  stops: number;
  aircraft: string;
}

interface SearchForm {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  passengers: number;
  cabinClass: string;
  direct: boolean;
  roundTrip: boolean;
}

const FlightSearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchForm, setSearchForm] = useState<SearchForm>({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    passengers: 1,
    cabinClass: 'economy',
    direct: false,
    roundTrip: false,
  });
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [sortBy, setSortBy] = useState('price');
  const [favorites, setFavorites] = useState<string[]>([]);

  const popularRoutes = [
    { origin: 'JFK', destination: 'LAX', label: 'New York → Los Angeles' },
    { origin: 'LAX', destination: 'JFK', label: 'Los Angeles → New York' },
    { origin: 'ORD', destination: 'LAX', label: 'Chicago → Los Angeles' },
    { origin: 'DFW', destination: 'JFK', label: 'Dallas → New York' },
    { origin: 'ATL', destination: 'LAX', label: 'Atlanta → Los Angeles' },
    { origin: 'SFO', destination: 'JFK', label: 'San Francisco → New York' },
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchForm.origin || !searchForm.destination || !searchForm.departureDate) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock flight data
      const mockFlights: Flight[] = [
        {
          id: '1',
          origin: searchForm.origin,
          destination: searchForm.destination,
          departureTime: '2024-12-15T08:00:00Z',
          arrivalTime: '2024-12-15T11:30:00Z',
          airline: { name: 'American Airlines', iataCode: 'AA' },
          price: 450,
          availableSeats: 12,
          cabinClass: searchForm.cabinClass,
          duration: 'PT3H30M',
          stops: 0,
          aircraft: 'Boeing 737',
        },
        {
          id: '2',
          origin: searchForm.origin,
          destination: searchForm.destination,
          departureTime: '2024-12-15T10:30:00Z',
          arrivalTime: '2024-12-15T14:15:00Z',
          airline: { name: 'Delta Air Lines', iataCode: 'DL' },
          price: 380,
          availableSeats: 8,
          cabinClass: searchForm.cabinClass,
          duration: 'PT3H45M',
          stops: 1,
          aircraft: 'Airbus A320',
        },
        {
          id: '3',
          origin: searchForm.origin,
          destination: searchForm.destination,
          departureTime: '2024-12-15T14:00:00Z',
          arrivalTime: '2024-12-15T17:30:00Z',
          airline: { name: 'United Airlines', iataCode: 'UA' },
          price: 520,
          availableSeats: 15,
          cabinClass: searchForm.cabinClass,
          duration: 'PT3H30M',
          stops: 0,
          aircraft: 'Boeing 787',
        },
      ];

      setFlights(mockFlights);
    } catch (err: any) {
      setError('Failed to search flights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSearch = (route: { origin: string; destination: string }) => {
    setSearchForm(prev => ({
      ...prev,
      origin: route.origin,
      destination: route.destination,
    }));
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

  const toggleFavorite = (flightId: string) => {
    setFavorites(prev => 
      prev.includes(flightId) 
        ? prev.filter(id => id !== flightId)
        : [...prev, flightId]
    );
  };

  const formatDuration = (duration: string) => {
    return duration.replace('PT', '').replace('H', 'h ').replace('M', 'm');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const sortedFlights = [...flights].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price;
      case 'duration':
        return a.duration.localeCompare(b.duration);
      case 'departure':
        return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
      default:
        return 0;
    }
  });

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Flight Search
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
                onChange={(e) => setSearchForm(prev => ({ ...prev, origin: e.target.value.toUpperCase() }))}
                inputProps={{ maxLength: 3 }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="To"
                placeholder="Airport code (e.g., LAX)"
                value={searchForm.destination}
                onChange={(e) => setSearchForm(prev => ({ ...prev, destination: e.target.value.toUpperCase() }))}
                inputProps={{ maxLength: 3 }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Departure Date"
                type="date"
                value={searchForm.departureDate}
                onChange={(e) => setSearchForm(prev => ({ ...prev, departureDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Return Date"
                type="date"
                value={searchForm.returnDate}
                onChange={(e) => setSearchForm(prev => ({ ...prev, returnDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                disabled={!searchForm.roundTrip}
              />
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
                    checked={searchForm.roundTrip}
                    onChange={(e) => setSearchForm(prev => ({ ...prev, roundTrip: e.target.checked }))}
                  />
                }
                label="Round Trip"
              />
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

      {/* Popular Routes */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Popular Routes
        </Typography>
        <Grid container spacing={2}>
          {popularRoutes.map((route, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => handleQuickSearch(route)}
                startIcon={<Flight />}
              >
                {route.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Flight Results */}
      {flights.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Found {flights.length} flights
            </Typography>
            <Box display="flex" gap={2}>
              <FormControl size="small">
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort by"
                  onChange={(e) => setSortBy(e.target.value)}
                  startAdornment={<Sort />}
                >
                  <MenuItem value="price">Price</MenuItem>
                  <MenuItem value="duration">Duration</MenuItem>
                  <MenuItem value="departure">Departure Time</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Grid container spacing={2}>
            {sortedFlights.map((flight) => (
              <Grid item xs={12} key={flight.id}>
                <Card>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={3}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Business color="primary" />
                          <Box>
                            <Typography variant="h6">
                              {flight.airline.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {flight.airline.iataCode}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box textAlign="center">
                            <Typography variant="h6">
                              {formatTime(flight.departureTime)}
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
                            <Chip 
                              label={flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                              size="small"
                              color={flight.stops === 0 ? 'success' : 'default'}
                            />
                          </Box>
                          <Box textAlign="center">
                            <Typography variant="h6">
                              {formatTime(flight.arrivalTime)}
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
                        <Box display="flex" flexDirection="column" gap={1}>
                          <Tooltip title={favorites.includes(flight.id) ? 'Remove from favorites' : 'Add to favorites'}>
                            <IconButton
                              onClick={() => toggleFavorite(flight.id)}
                              color={favorites.includes(flight.id) ? 'error' : 'default'}
                            >
                              {favorites.includes(flight.id) ? <Favorite /> : <FavoriteBorder />}
                            </IconButton>
                          </Tooltip>
                          <Button
                            variant="contained"
                            fullWidth
                            onClick={() => handleBookFlight(flight)}
                            startIcon={<AirplaneTicket />}
                          >
                            Book
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
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