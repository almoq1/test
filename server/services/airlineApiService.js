const axios = require('axios');
const { Airline, AirlineApi, Flight } = require('../models');

class AirlineApiService {
  constructor() {
    this.cache = new Map();
    this.rateLimiters = new Map();
  }

  // Search flights across all airline APIs
  async searchFlights(searchParams) {
    const { origin, destination, departureDate, returnDate, passengers, cabinClass, direct } = searchParams;
    
    try {
      // Get all active airline APIs
      const airlineApis = await AirlineApi.findAll({
        where: { status: 'active' },
        include: [{
          model: Airline,
          as: 'airline',
          where: { status: 'active' }
        }]
      });

      const searchPromises = airlineApis.map(api => 
        this.searchAirlineFlights(api, searchParams)
      );

      const results = await Promise.allSettled(searchPromises);
      const flights = [];

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          flights.push(...result.value);
        }
      });

      return flights;
    } catch (error) {
      console.error('Multi-airline search error:', error);
      throw new Error('Error searching flights across airlines');
    }
  }

  // Search flights for a specific airline
  async searchAirlineFlights(airlineApi, searchParams) {
    const { origin, destination, departureDate, returnDate, passengers, cabinClass, direct } = searchParams;

    try {
      // Check rate limiting
      if (!this.checkRateLimit(airlineApi)) {
        console.log(`Rate limit exceeded for airline ${airlineApi.airline.name}`);
        return [];
      }

      // Prepare request payload
      const payload = this.buildSearchPayload(airlineApi, searchParams);
      
      // Get authentication headers
      const headers = await this.getAuthHeaders(airlineApi);
      
      // Make API request
      const response = await axios({
        method: 'POST',
        url: `${airlineApi.baseUrl}${airlineApi.getEndpoint('search')}`,
        headers: {
          ...airlineApi.headers,
          ...headers
        },
        data: payload,
        timeout: airlineApi.timeout * 1000
      });

      // Parse and transform response
      const flights = this.parseFlightResponse(airlineApi, response.data);
      
      // Update rate limiter
      this.updateRateLimit(airlineApi);

      return flights;
    } catch (error) {
      console.error(`Error searching ${airlineApi.airline.name} flights:`, error.message);
      
      // Update API status if there are repeated failures
      if (error.response?.status >= 500) {
        await this.updateApiStatus(airlineApi.id, 'error');
      }
      
      return [];
    }
  }

  // Build search payload based on API type
  buildSearchPayload(airlineApi, searchParams) {
    const { origin, destination, departureDate, returnDate, passengers, cabinClass, direct } = searchParams;
    const mapping = airlineApi.mapping;

    switch (airlineApi.apiType) {
      case 'amadeus':
        return {
          originLocationCode: origin,
          destinationLocationCode: destination,
          departureDate: departureDate,
          returnDate: returnDate,
          adults: passengers,
          cabinClass: cabinClass.toUpperCase(),
          nonStop: direct,
          currencyCode: 'USD',
          max: 50
        };

      case 'sabre':
        return {
          OriginLocation: origin,
          DestinationLocation: destination,
          DepartureDateTime: departureDate,
          ReturnDateTime: returnDate,
          PassengerNumber: passengers,
          CabinClass: cabinClass,
          DirectFlightsOnly: direct
        };

      case 'travelport':
        return {
          searchAirLeg: [{
            origin: origin,
            destination: destination,
            departureDate: departureDate
          }],
          searchPassenger: [{
            type: 'ADT',
            count: passengers
          }],
          searchModifiers: {
            cabinClass: cabinClass,
            directFlightsOnly: direct
          }
        };

      default: // Generic REST API
        return {
          [mapping.origin || 'origin']: origin,
          [mapping.destination || 'destination']: destination,
          [mapping.departureTime || 'departureDate']: departureDate,
          [mapping.returnTime || 'returnDate']: returnDate,
          [mapping.passengers || 'passengers']: passengers,
          [mapping.cabinClass || 'cabinClass']: cabinClass,
          [mapping.direct || 'direct']: direct
        };
    }
  }

  // Get authentication headers
  async getAuthHeaders(airlineApi) {
    const auth = airlineApi.authentication;

    // Check if token needs refresh
    if (auth.type === 'bearer' && airlineApi.needsTokenRefresh()) {
      await this.refreshToken(airlineApi);
    }

    const headers = {};
    
    switch (auth.type) {
      case 'bearer':
        headers[auth.header] = airlineApi.getAuthHeader();
        break;
      case 'basic':
        headers[auth.header] = airlineApi.getAuthHeader();
        break;
      case 'api_key':
        headers[auth.header] = airlineApi.getAuthHeader();
        break;
      case 'oauth':
        // Implement OAuth flow if needed
        break;
    }

    return headers;
  }

  // Refresh access token
  async refreshToken(airlineApi) {
    try {
      const response = await axios({
        method: 'POST',
        url: `${airlineApi.baseUrl}/auth/token`,
        headers: airlineApi.headers,
        data: {
          grant_type: 'client_credentials',
          client_id: airlineApi.apiKey,
          client_secret: airlineApi.secretKey
        },
        timeout: airlineApi.timeout * 1000
      });

      const { access_token, expires_in } = response.data;
      
      airlineApi.accessToken = access_token;
      airlineApi.tokenExpiry = new Date(Date.now() + (expires_in * 1000));
      await airlineApi.save();

    } catch (error) {
      console.error(`Error refreshing token for ${airlineApi.airline.name}:`, error.message);
      throw new Error('Token refresh failed');
    }
  }

  // Parse flight response from different API formats
  parseFlightResponse(airlineApi, responseData) {
    const flights = [];
    const mapping = airlineApi.mapping;

    let flightData;
    switch (airlineApi.apiType) {
      case 'amadeus':
        flightData = responseData.data || [];
        break;
      case 'sabre':
        flightData = responseData.PricedItineraries || [];
        break;
      case 'travelport':
        flightData = responseData.airSolution || [];
        break;
      default:
        flightData = responseData.flights || responseData.data || [];
    }

    flightData.forEach(flight => {
      try {
        const parsedFlight = this.mapFlightData(airlineApi, flight, mapping);
        if (parsedFlight) {
          flights.push(parsedFlight);
        }
      } catch (error) {
        console.error('Error parsing flight data:', error);
      }
    });

    return flights;
  }

  // Map flight data to standard format
  mapFlightData(airlineApi, flight, mapping) {
    try {
      const mappedFlight = {
        airlineId: airlineApi.airlineId,
        flightNumber: this.extractValue(flight, mapping.flightNumber),
        origin: this.extractValue(flight, mapping.origin),
        destination: this.extractValue(flight, mapping.destination),
        departureTime: new Date(this.extractValue(flight, mapping.departureTime)),
        arrivalTime: new Date(this.extractValue(flight, mapping.arrivalTime)),
        aircraft: this.extractValue(flight, mapping.aircraft),
        totalSeats: this.extractValue(flight, mapping.totalSeats) || 180,
        availableSeats: this.extractValue(flight, mapping.availableSeats) || 180,
        basePrice: parseFloat(this.extractValue(flight, mapping.price)) || 0,
        currency: this.extractValue(flight, mapping.currency) || 'USD',
        cabinClass: this.extractValue(flight, mapping.cabinClass) || 'economy',
        status: 'scheduled',
        externalId: this.extractValue(flight, mapping.externalId),
        apiSource: airlineApi.apiName,
        lastUpdated: new Date()
      };

      // Validate required fields
      if (!mappedFlight.flightNumber || !mappedFlight.origin || !mappedFlight.destination) {
        return null;
      }

      return mappedFlight;
    } catch (error) {
      console.error('Error mapping flight data:', error);
      return null;
    }
  }

  // Extract value from nested object using dot notation
  extractValue(obj, path) {
    if (!path) return null;
    
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  // Rate limiting
  checkRateLimit(airlineApi) {
    const key = airlineApi.id;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = airlineApi.rateLimit;

    if (!this.rateLimiters.has(key)) {
      this.rateLimiters.set(key, []);
    }

    const requests = this.rateLimiters.get(key);
    const validRequests = requests.filter(time => now - time < windowMs);

    if (validRequests.length >= maxRequests) {
      return false;
    }

    return true;
  }

  updateRateLimit(airlineApi) {
    const key = airlineApi.id;
    const requests = this.rateLimiters.get(key) || [];
    requests.push(Date.now());
    this.rateLimiters.set(key, requests);
  }

  // Sync flights from airline APIs
  async syncAirlineFlights(airlineId) {
    try {
      const airlineApi = await AirlineApi.findOne({
        where: { airlineId, status: 'active' },
        include: [{
          model: Airline,
          as: 'airline'
        }]
      });

      if (!airlineApi) {
        throw new Error('Airline API not found or inactive');
      }

      // Get flights for next 30 days
      const startDate = new Date();
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const searchParams = {
        origin: 'JFK', // Example - you might want to sync popular routes
        destination: 'LAX',
        departureDate: startDate.toISOString().split('T')[0],
        returnDate: endDate.toISOString().split('T')[0],
        passengers: 1,
        cabinClass: 'economy'
      };

      const flights = await this.searchAirlineFlights(airlineApi, searchParams);
      
      // Save flights to database
      const savedFlights = [];
      for (const flightData of flights) {
        try {
          const [flight, created] = await Flight.findOrCreate({
            where: {
              externalId: flightData.externalId,
              airlineId: flightData.airlineId
            },
            defaults: flightData
          });

          if (!created) {
            // Update existing flight
            await flight.update(flightData);
          }

          savedFlights.push(flight);
        } catch (error) {
          console.error('Error saving flight:', error);
        }
      }

      // Update last sync time
      airlineApi.lastSync = new Date();
      await airlineApi.save();

      return {
        airline: airlineApi.airline.name,
        flightsFound: flights.length,
        flightsSaved: savedFlights.length,
        lastSync: airlineApi.lastSync
      };

    } catch (error) {
      console.error('Sync airline flights error:', error);
      throw error;
    }
  }

  // Sync all airlines
  async syncAllFlights() {
    try {
      const airlineApis = await AirlineApi.findAll({
        where: { status: 'active' },
        include: [{
          model: Airline,
          as: 'airline'
        }]
      });

      const results = await Promise.allSettled(
        airlineApis.map(api => this.syncAirlineFlights(api.airlineId))
      );

      return results.map((result, index) => ({
        airline: airlineApis[index].airline.name,
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : result.reason
      }));

    } catch (error) {
      console.error('Sync all flights error:', error);
      throw error;
    }
  }

  // Create booking with airline API
  async createBooking(bookingData) {
    // Implementation for creating booking with airline API
    // This would vary based on the airline's API structure
    throw new Error('Booking creation not implemented for this airline');
  }

  // Cancel booking with airline API
  async cancelBooking(bookingId) {
    // Implementation for cancelling booking with airline API
    // This would vary based on the airline's API structure
    throw new Error('Booking cancellation not implemented for this airline');
  }

  // Update API status
  async updateApiStatus(apiId, status) {
    try {
      await AirlineApi.update(
        { status },
        { where: { id: apiId } }
      );
    } catch (error) {
      console.error('Error updating API status:', error);
    }
  }
}

module.exports = new AirlineApiService();