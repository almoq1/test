const express = require('express');
const { query, validationResult } = require('express-validator');
const { Flight, Airline, AirlineApi } = require('../models');
const { auth, requireRole } = require('../middleware/auth');
const airlineApiService = require('../services/airlineApiService');

const router = express.Router();

// Search flights
router.get('/search', auth, [
  query('origin').isLength({ min: 3, max: 3 }).withMessage('Origin must be a 3-letter airport code'),
  query('destination').isLength({ min: 3, max: 3 }).withMessage('Destination must be a 3-letter airport code'),
  query('departureDate').isISO8601().withMessage('Departure date must be a valid date'),
  query('returnDate').optional().isISO8601().withMessage('Return date must be a valid date'),
  query('passengers').optional().isInt({ min: 1, max: 9 }).withMessage('Passengers must be between 1 and 9'),
  query('cabinClass').optional().isIn(['economy', 'premium_economy', 'business', 'first']),
  query('direct').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers = 1,
      cabinClass = 'economy',
      direct = false,
      airlines
    } = req.query;

    // Build search criteria
    const searchCriteria = {
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureTime: {
        $gte: new Date(departureDate),
        $lt: new Date(new Date(departureDate).getTime() + 24 * 60 * 60 * 1000)
      },
      availableSeats: {
        $gte: parseInt(passengers)
      },
      status: 'scheduled'
    };

    if (direct) {
      searchCriteria.aircraft = { $not: null };
    }

    // Include airline filter
    const includeAirline = {
      model: Airline,
      as: 'airline',
      where: { status: 'active' }
    };

    if (airlines) {
      const airlineCodes = airlines.split(',');
      includeAirline.where.iataCode = airlineCodes;
    }

    // Search in database first
    let flights = await Flight.findAll({
      where: searchCriteria,
      include: [includeAirline],
      order: [['departureTime', 'ASC']]
    });

    // If no flights found or need real-time data, search airline APIs
    if (flights.length === 0 || req.query.realtime === 'true') {
      try {
        const apiFlights = await airlineApiService.searchFlights({
          origin,
          destination,
          departureDate,
          returnDate,
          passengers: parseInt(passengers),
          cabinClass,
          direct: direct === 'true'
        });

        // Merge API results with database results
        flights = [...flights, ...apiFlights];
      } catch (apiError) {
        console.error('Airline API search error:', apiError);
        // Continue with database results only
      }
    }

    // Filter by cabin class if specified
    if (cabinClass && cabinClass !== 'economy') {
      flights = flights.filter(flight => flight.cabinClass === cabinClass);
    }

    // Apply company-specific pricing
    const company = req.user.company;
    if (company) {
      flights = flights.map(flight => ({
        ...flight.toJSON(),
        price: flight.getPriceForCompany(company)
      }));
    }

    res.json({
      flights,
      searchCriteria: {
        origin,
        destination,
        departureDate,
        returnDate,
        passengers: parseInt(passengers),
        cabinClass,
        direct: direct === 'true'
      }
    });
  } catch (error) {
    console.error('Flight search error:', error);
    res.status(500).json({ error: 'Error searching flights.' });
  }
});

// Get flight details
router.get('/:id', auth, async (req, res) => {
  try {
    const flight = await Flight.findByPk(req.params.id, {
      include: [{
        model: Airline,
        as: 'airline'
      }]
    });

    if (!flight) {
      return res.status(404).json({ error: 'Flight not found.' });
    }

    // Apply company-specific pricing
    const company = req.user.company;
    if (company) {
      flight.price = flight.getPriceForCompany(company);
    }

    res.json({
      flight: flight.toJSON()
    });
  } catch (error) {
    console.error('Flight details error:', error);
    res.status(500).json({ error: 'Error fetching flight details.' });
  }
});

// Get available airlines
router.get('/airlines/available', auth, async (req, res) => {
  try {
    const airlines = await Airline.findAll({
      where: { status: 'active' },
      attributes: ['id', 'name', 'iataCode', 'logo', 'description'],
      order: [['name', 'ASC']]
    });

    res.json({
      airlines
    });
  } catch (error) {
    console.error('Available airlines error:', error);
    res.status(500).json({ error: 'Error fetching available airlines.' });
  }
});

// Get popular routes
router.get('/routes/popular', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const popularRoutes = await Flight.findAll({
      attributes: [
        'origin',
        'destination',
        [Flight.sequelize.fn('COUNT', Flight.sequelize.col('id')), 'flightCount']
      ],
      group: ['origin', 'destination'],
      order: [[Flight.sequelize.fn('COUNT', Flight.sequelize.col('id')), 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      popularRoutes
    });
  } catch (error) {
    console.error('Popular routes error:', error);
    res.status(500).json({ error: 'Error fetching popular routes.' });
  }
});

// Get flight prices for date range
router.get('/prices/range', auth, [
  query('origin').isLength({ min: 3, max: 3 }),
  query('destination').isLength({ min: 3, max: 3 }),
  query('startDate').isISO8601(),
  query('endDate').isISO8601(),
  query('passengers').optional().isInt({ min: 1, max: 9 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { origin, destination, startDate, endDate, passengers = 1 } = req.query;

    const flights = await Flight.findAll({
      where: {
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        departureTime: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        },
        availableSeats: {
          $gte: parseInt(passengers)
        },
        status: 'scheduled'
      },
      include: [{
        model: Airline,
        as: 'airline',
        attributes: ['name', 'iataCode']
      }],
      attributes: ['id', 'departureTime', 'basePrice', 'cabinClass'],
      order: [['departureTime', 'ASC']]
    });

    // Group by date and find lowest price
    const priceByDate = {};
    flights.forEach(flight => {
      const date = flight.departureTime.toISOString().split('T')[0];
      const company = req.user.company;
      const price = company ? flight.getPriceForCompany(company) : flight.basePrice;

      if (!priceByDate[date] || price < priceByDate[date].price) {
        priceByDate[date] = {
          date,
          price,
          flightId: flight.id,
          airline: flight.airline.name
        };
      }
    });

    res.json({
      priceRange: Object.values(priceByDate)
    });
  } catch (error) {
    console.error('Price range error:', error);
    res.status(500).json({ error: 'Error fetching price range.' });
  }
});

// Sync flights from airline APIs (admin only)
router.post('/sync', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { airlineId } = req.body;

    if (airlineId) {
      // Sync specific airline
      const result = await airlineApiService.syncAirlineFlights(airlineId);
      res.json({
        message: 'Airline flights synced successfully',
        result
      });
    } else {
      // Sync all airlines
      const results = await airlineApiService.syncAllFlights();
      res.json({
        message: 'All airline flights synced successfully',
        results
      });
    }
  } catch (error) {
    console.error('Flight sync error:', error);
    res.status(500).json({ error: 'Error syncing flights.' });
  }
});

module.exports = router;