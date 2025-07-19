const express = require('express');
const { body, validationResult } = require('express-validator');
const { Booking, Flight, Passenger, User, Company, Wallet, Airline } = require('../models');
const { auth, requireRole } = require('../middleware/auth');
const airlineApiService = require('../services/airlineApiService');

const router = express.Router();

// Create a new booking
router.post('/', auth, [
  body('flightId').isUUID().withMessage('Valid flight ID is required'),
  body('passengers').isArray({ min: 1, max: 9 }).withMessage('At least 1 passenger required, max 9'),
  body('passengers.*.firstName').trim().notEmpty().withMessage('First name is required'),
  body('passengers.*.lastName').trim().notEmpty().withMessage('Last name is required'),
  body('passengers.*.dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('passengers.*.gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
  body('passengers.*.nationality').isLength({ min: 2, max: 2 }).withMessage('Valid nationality code is required'),
  body('cabinClass').optional().isIn(['economy', 'premium_economy', 'business', 'first']),
  body('specialRequests').optional().trim(),
  body('paymentMethod').isIn(['wallet', 'credit_card', 'bank_transfer', 'invoice']).withMessage('Valid payment method is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      flightId,
      passengers,
      cabinClass = 'economy',
      specialRequests,
      paymentMethod
    } = req.body;

    // Get flight details
    const flight = await Flight.findByPk(flightId, {
      include: [{
        model: Airline,
        as: 'airline'
      }]
    });

    if (!flight) {
      return res.status(404).json({ error: 'Flight not found.' });
    }

    if (!flight.isAvailable()) {
      return res.status(400).json({ error: 'Flight is not available for booking.' });
    }

    if (flight.availableSeats < passengers.length) {
      return res.status(400).json({ error: 'Insufficient seats available.' });
    }

    // Calculate total amount
    const company = req.user.company;
    const basePrice = company ? flight.getPriceForCompany(company) : flight.basePrice;
    const totalAmount = basePrice * passengers.length;

    // Check wallet balance if using wallet payment
    if (paymentMethod === 'wallet') {
      const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
      if (!wallet || wallet.balance < totalAmount) {
        return res.status(400).json({ error: 'Insufficient wallet balance.' });
      }
    }

    // Create booking
    const booking = await Booking.create({
      userId: req.user.id,
      companyId: req.user.companyId,
      flightId,
      totalAmount,
      currency: flight.currency,
      paymentMethod,
      numberOfPassengers: passengers.length,
      cabinClass,
      specialRequests,
      travelDate: flight.departureTime,
      status: 'pending',
      paymentStatus: paymentMethod === 'wallet' ? 'paid' : 'pending'
    });

    // Create passengers
    const passengerRecords = await Promise.all(
      passengers.map(passenger => 
        Passenger.create({
          bookingId: booking.id,
          ...passenger
        })
      )
    );

    // Process payment if using wallet
    if (paymentMethod === 'wallet') {
      const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
      await wallet.deductFunds(totalAmount, `Flight booking: ${booking.bookingReference}`);
      
      booking.paymentStatus = 'paid';
      booking.status = 'confirmed';
      await booking.save();
    }

    // Update flight availability
    flight.availableSeats -= passengers.length;
    await flight.save();

    // Try to book with airline API if available
    try {
      if (flight.externalId) {
        const apiBooking = await airlineApiService.createBooking({
          flightId: flight.externalId,
          passengers: passengerRecords.map(p => ({
            firstName: p.firstName,
            lastName: p.lastName,
            dateOfBirth: p.dateOfBirth,
            gender: p.gender,
            nationality: p.nationality,
            passportNumber: p.passportNumber
          })),
          cabinClass,
          specialRequests
        });

        booking.externalBookingId = apiBooking.bookingId;
        booking.confirmationNumber = apiBooking.confirmationNumber;
        booking.status = 'confirmed';
        await booking.save();
      }
    } catch (apiError) {
      console.error('Airline API booking error:', apiError);
      // Continue with local booking
    }

    // Get complete booking details
    const completeBooking = await Booking.findByPk(booking.id, {
      include: [
        {
          model: Flight,
          as: 'flight',
          include: [{
            model: Airline,
            as: 'airline'
          }]
        },
        {
          model: Passenger,
          as: 'passengers'
        },
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email']
        }
      ]
    });

    res.status(201).json({
      message: 'Booking created successfully',
      booking: completeBooking.toJSON()
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ error: 'Error creating booking.' });
  }
});

// Get user's bookings
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { userId: req.user.id };
    
    if (status) {
      whereClause.status = status;
    }
    
    if (startDate || endDate) {
      whereClause.travelDate = {};
      if (startDate) whereClause.travelDate.$gte = new Date(startDate);
      if (endDate) whereClause.travelDate.$lte = new Date(endDate);
    }

    const bookings = await Booking.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Flight,
          as: 'flight',
          include: [{
            model: Airline,
            as: 'airline'
          }]
        },
        {
          model: Passenger,
          as: 'passengers'
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      bookings: bookings.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(bookings.count / limit),
        totalItems: bookings.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('My bookings error:', error);
    res.status(500).json({ error: 'Error fetching bookings.' });
  }
});

// Get booking details
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        {
          model: Flight,
          as: 'flight',
          include: [{
            model: Airline,
            as: 'airline'
          }]
        },
        {
          model: Passenger,
          as: 'passengers'
        },
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['name', 'registrationNumber']
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    // Check access permission
    if (req.user.role !== 'admin' && booking.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this booking.' });
    }

    res.json({
      booking: booking.toJSON()
    });
  } catch (error) {
    console.error('Booking details error:', error);
    res.status(500).json({ error: 'Error fetching booking details.' });
  }
});

// Cancel booking
router.post('/:id/cancel', auth, [
  body('reason').optional().trim()
], async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findByPk(req.params.id, {
      include: [{
        model: Flight,
        as: 'flight'
      }]
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    // Check access permission
    if (req.user.role !== 'admin' && booking.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this booking.' });
    }

    if (!booking.canBeCancelled()) {
      return res.status(400).json({ error: 'Booking cannot be cancelled.' });
    }

    // Calculate refund amount
    const refundAmount = booking.getCancellationFee();
    const actualRefund = booking.totalAmount - refundAmount;

    // Cancel with airline API if external booking exists
    if (booking.externalBookingId) {
      try {
        await airlineApiService.cancelBooking(booking.externalBookingId);
      } catch (apiError) {
        console.error('Airline API cancellation error:', apiError);
        // Continue with local cancellation
      }
    }

    // Update booking status
    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.refundAmount = actualRefund;
    await booking.save();

    // Refund to wallet if payment was made via wallet
    if (booking.paymentMethod === 'wallet' && actualRefund > 0) {
      const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
      if (wallet) {
        await wallet.addFunds(actualRefund, `Refund for cancelled booking: ${booking.bookingReference}`);
      }
    }

    // Update flight availability
    const flight = booking.flight;
    flight.availableSeats += booking.numberOfPassengers;
    await flight.save();

    res.json({
      message: 'Booking cancelled successfully',
      booking: booking.toJSON(),
      refundAmount: actualRefund
    });
  } catch (error) {
    console.error('Booking cancellation error:', error);
    res.status(500).json({ error: 'Error cancelling booking.' });
  }
});

// Get company bookings (for company admins)
router.get('/company/:companyId', auth, requireRole(['admin', 'company_admin']), async (req, res) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    // Check company access
    if (req.user.role !== 'admin' && req.user.companyId !== companyId) {
      return res.status(403).json({ error: 'Access denied to this company.' });
    }

    const whereClause = { companyId };
    
    if (status) {
      whereClause.status = status;
    }
    
    if (startDate || endDate) {
      whereClause.travelDate = {};
      if (startDate) whereClause.travelDate.$gte = new Date(startDate);
      if (endDate) whereClause.travelDate.$lte = new Date(endDate);
    }

    const bookings = await Booking.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Flight,
          as: 'flight',
          include: [{
            model: Airline,
            as: 'airline'
          }]
        },
        {
          model: Passenger,
          as: 'passengers'
        },
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      bookings: bookings.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(bookings.count / limit),
        totalItems: bookings.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Company bookings error:', error);
    res.status(500).json({ error: 'Error fetching company bookings.' });
  }
});

// Get booking statistics
router.get('/statistics/company/:companyId', auth, requireRole(['admin', 'company_admin']), async (req, res) => {
  try {
    const { companyId } = req.params;
    const { startDate, endDate } = req.query;

    // Check company access
    if (req.user.role !== 'admin' && req.user.companyId !== companyId) {
      return res.status(403).json({ error: 'Access denied to this company.' });
    }

    const whereClause = { companyId };
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.$gte = new Date(startDate);
      if (endDate) whereClause.createdAt.$lte = new Date(endDate);
    }

    const bookings = await Booking.findAll({
      where: whereClause,
      attributes: ['status', 'totalAmount', 'createdAt', 'travelDate']
    });

    const stats = {
      totalBookings: bookings.length,
      totalAmount: 0,
      confirmedBookings: 0,
      cancelledBookings: 0,
      pendingBookings: 0,
      averageBookingValue: 0,
      bookingsByStatus: {},
      monthlyBookings: {}
    };

    bookings.forEach(booking => {
      stats.totalAmount += parseFloat(booking.totalAmount);
      
      if (booking.status === 'confirmed') stats.confirmedBookings++;
      else if (booking.status === 'cancelled') stats.cancelledBookings++;
      else if (booking.status === 'pending') stats.pendingBookings++;

      // Group by status
      stats.bookingsByStatus[booking.status] = (stats.bookingsByStatus[booking.status] || 0) + 1;

      // Group by month
      const month = booking.createdAt.toISOString().substring(0, 7);
      stats.monthlyBookings[month] = (stats.monthlyBookings[month] || 0) + 1;
    });

    if (stats.totalBookings > 0) {
      stats.averageBookingValue = stats.totalAmount / stats.totalBookings;
    }

    res.json({
      statistics: stats,
      period: { startDate, endDate }
    });
  } catch (error) {
    console.error('Booking statistics error:', error);
    res.status(500).json({ error: 'Error fetching booking statistics.' });
  }
});

module.exports = router;