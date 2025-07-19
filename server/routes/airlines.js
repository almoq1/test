const express = require('express');
const { body, validationResult } = require('express-validator');
const { Airline, AirlineApi } = require('../models');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all airlines
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, partnershipType } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (partnershipType) {
      whereClause.partnershipType = partnershipType;
    }

    const airlines = await Airline.findAndCountAll({
      where: whereClause,
      include: [{
        model: AirlineApi,
        as: 'apis',
        attributes: ['id', 'apiName', 'status', 'lastSync']
      }],
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      airlines: airlines.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(airlines.count / limit),
        totalItems: airlines.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get airlines error:', error);
    res.status(500).json({ error: 'Error fetching airlines.' });
  }
});

// Get airline by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const airline = await Airline.findByPk(req.params.id, {
      include: [{
        model: AirlineApi,
        as: 'apis'
      }]
    });

    if (!airline) {
      return res.status(404).json({ error: 'Airline not found.' });
    }

    res.json({
      airline: airline.toJSON()
    });
  } catch (error) {
    console.error('Get airline error:', error);
    res.status(500).json({ error: 'Error fetching airline.' });
  }
});

// Create new airline (admin only)
router.post('/', auth, requireRole(['admin']), [
  body('name').trim().notEmpty().withMessage('Airline name is required'),
  body('iataCode').isLength({ min: 2, max: 3 }).withMessage('IATA code must be 2-3 characters'),
  body('icaoCode').optional().isLength({ min: 3, max: 4 }),
  body('country').optional().trim(),
  body('headquarters').optional().trim(),
  body('website').optional().isURL(),
  body('phone').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('partnershipType').optional().isIn(['direct', 'gds', 'api', 'codeshare']),
  body('commissionRate').optional().isFloat({ min: 0, max: 100 }),
  body('contractStartDate').optional().isISO8601(),
  body('contractEndDate').optional().isISO8601(),
  body('logo').optional().trim(),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      iataCode,
      icaoCode,
      country,
      headquarters,
      website,
      phone,
      email,
      partnershipType,
      commissionRate,
      contractStartDate,
      contractEndDate,
      logo,
      description
    } = req.body;

    // Check if airline already exists
    const existingAirline = await Airline.findOne({
      where: { iataCode: iataCode.toUpperCase() }
    });
    if (existingAirline) {
      return res.status(400).json({ error: 'Airline with this IATA code already exists.' });
    }

    // Create airline
    const airline = await Airline.create({
      name,
      iataCode: iataCode.toUpperCase(),
      icaoCode: icaoCode ? icaoCode.toUpperCase() : null,
      country,
      headquarters,
      website,
      phone,
      email,
      partnershipType: partnershipType || 'api',
      commissionRate: commissionRate || 0,
      contractStartDate: contractStartDate ? new Date(contractStartDate) : null,
      contractEndDate: contractEndDate ? new Date(contractEndDate) : null,
      logo,
      description
    });

    res.status(201).json({
      message: 'Airline created successfully',
      airline: airline.toJSON()
    });
  } catch (error) {
    console.error('Create airline error:', error);
    res.status(500).json({ error: 'Error creating airline.' });
  }
});

// Update airline (admin only)
router.put('/:id', auth, requireRole(['admin']), [
  body('name').optional().trim().notEmpty(),
  body('icaoCode').optional().isLength({ min: 3, max: 4 }),
  body('country').optional().trim(),
  body('headquarters').optional().trim(),
  body('website').optional().isURL(),
  body('phone').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('status').optional().isIn(['active', 'inactive', 'suspended']),
  body('partnershipType').optional().isIn(['direct', 'gds', 'api', 'codeshare']),
  body('commissionRate').optional().isFloat({ min: 0, max: 100 }),
  body('contractStartDate').optional().isISO8601(),
  body('contractEndDate').optional().isISO8601(),
  body('logo').optional().trim(),
  body('description').optional().trim(),
  body('fleet').optional().isArray(),
  body('routes').optional().isArray(),
  body('settings').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const airline = await Airline.findByPk(req.params.id);
    if (!airline) {
      return res.status(404).json({ error: 'Airline not found.' });
    }

    const updateFields = [
      'name', 'icaoCode', 'country', 'headquarters', 'website', 'phone', 'email',
      'status', 'partnershipType', 'commissionRate', 'contractStartDate', 'contractEndDate',
      'logo', 'description', 'fleet', 'routes', 'settings'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'contractStartDate' || field === 'contractEndDate') {
          airline[field] = req.body[field] ? new Date(req.body[field]) : null;
        } else {
          airline[field] = req.body[field];
        }
      }
    });

    await airline.save();

    res.json({
      message: 'Airline updated successfully',
      airline: airline.toJSON()
    });
  } catch (error) {
    console.error('Update airline error:', error);
    res.status(500).json({ error: 'Error updating airline.' });
  }
});

// Delete airline (admin only)
router.delete('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const airline = await Airline.findByPk(req.params.id);
    if (!airline) {
      return res.status(404).json({ error: 'Airline not found.' });
    }

    await airline.destroy();

    res.json({
      message: 'Airline deleted successfully'
    });
  } catch (error) {
    console.error('Delete airline error:', error);
    res.status(500).json({ error: 'Error deleting airline.' });
  }
});

// Create airline API configuration (admin only)
router.post('/:id/apis', auth, requireRole(['admin']), [
  body('apiName').trim().notEmpty().withMessage('API name is required'),
  body('apiType').isIn(['rest', 'soap', 'graphql', 'amadeus', 'sabre', 'travelport']).withMessage('Valid API type is required'),
  body('baseUrl').isURL().withMessage('Valid base URL is required'),
  body('apiKey').optional().trim(),
  body('secretKey').optional().trim(),
  body('username').optional().trim(),
  body('password').optional().trim(),
  body('syncInterval').optional().isInt({ min: 1 }),
  body('rateLimit').optional().isInt({ min: 1 }),
  body('timeout').optional().isInt({ min: 1 }),
  body('retryAttempts').optional().isInt({ min: 0 }),
  body('endpoints').optional().isObject(),
  body('headers').optional().isObject(),
  body('authentication').optional().isObject(),
  body('mapping').optional().isObject(),
  body('settings').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const airline = await Airline.findByPk(req.params.id);
    if (!airline) {
      return res.status(404).json({ error: 'Airline not found.' });
    }

    const {
      apiName,
      apiType,
      baseUrl,
      apiKey,
      secretKey,
      username,
      password,
      syncInterval,
      rateLimit,
      timeout,
      retryAttempts,
      endpoints,
      headers,
      authentication,
      mapping,
      settings
    } = req.body;

    // Create airline API configuration
    const airlineApi = await AirlineApi.create({
      airlineId: airline.id,
      apiName,
      apiType,
      baseUrl,
      apiKey,
      secretKey,
      username,
      password,
      syncInterval: syncInterval || 30,
      rateLimit: rateLimit || 100,
      timeout: timeout || 30,
      retryAttempts: retryAttempts || 3,
      endpoints: endpoints || {},
      headers: headers || {},
      authentication: authentication || {},
      mapping: mapping || {},
      settings: settings || {}
    });

    res.status(201).json({
      message: 'Airline API configuration created successfully',
      airlineApi: airlineApi.toJSON()
    });
  } catch (error) {
    console.error('Create airline API error:', error);
    res.status(500).json({ error: 'Error creating airline API configuration.' });
  }
});

// Update airline API configuration (admin only)
router.put('/:id/apis/:apiId', auth, requireRole(['admin']), [
  body('apiName').optional().trim().notEmpty(),
  body('baseUrl').optional().isURL(),
  body('apiKey').optional().trim(),
  body('secretKey').optional().trim(),
  body('username').optional().trim(),
  body('password').optional().trim(),
  body('status').optional().isIn(['active', 'inactive', 'error']),
  body('syncInterval').optional().isInt({ min: 1 }),
  body('rateLimit').optional().isInt({ min: 1 }),
  body('timeout').optional().isInt({ min: 1 }),
  body('retryAttempts').optional().isInt({ min: 0 }),
  body('endpoints').optional().isObject(),
  body('headers').optional().isObject(),
  body('authentication').optional().isObject(),
  body('mapping').optional().isObject(),
  body('settings').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const airlineApi = await AirlineApi.findOne({
      where: { id: req.params.apiId, airlineId: req.params.id }
    });

    if (!airlineApi) {
      return res.status(404).json({ error: 'Airline API configuration not found.' });
    }

    const updateFields = [
      'apiName', 'baseUrl', 'apiKey', 'secretKey', 'username', 'password',
      'status', 'syncInterval', 'rateLimit', 'timeout', 'retryAttempts',
      'endpoints', 'headers', 'authentication', 'mapping', 'settings'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        airlineApi[field] = req.body[field];
      }
    });

    await airlineApi.save();

    res.json({
      message: 'Airline API configuration updated successfully',
      airlineApi: airlineApi.toJSON()
    });
  } catch (error) {
    console.error('Update airline API error:', error);
    res.status(500).json({ error: 'Error updating airline API configuration.' });
  }
});

// Delete airline API configuration (admin only)
router.delete('/:id/apis/:apiId', auth, requireRole(['admin']), async (req, res) => {
  try {
    const airlineApi = await AirlineApi.findOne({
      where: { id: req.params.apiId, airlineId: req.params.id }
    });

    if (!airlineApi) {
      return res.status(404).json({ error: 'Airline API configuration not found.' });
    }

    await airlineApi.destroy();

    res.json({
      message: 'Airline API configuration deleted successfully'
    });
  } catch (error) {
    console.error('Delete airline API error:', error);
    res.status(500).json({ error: 'Error deleting airline API configuration.' });
  }
});

// Test airline API connection (admin only)
router.post('/:id/apis/:apiId/test', auth, requireRole(['admin']), async (req, res) => {
  try {
    const airlineApi = await AirlineApi.findOne({
      where: { id: req.params.apiId, airlineId: req.params.id },
      include: [{
        model: Airline,
        as: 'airline'
      }]
    });

    if (!airlineApi) {
      return res.status(404).json({ error: 'Airline API configuration not found.' });
    }

    // Test the API connection
    const airlineApiService = require('../services/airlineApiService');
    
    try {
      const testResult = await airlineApiService.testApiConnection(airlineApi);
      
      res.json({
        message: 'API connection test successful',
        result: testResult
      });
    } catch (testError) {
      res.status(400).json({
        message: 'API connection test failed',
        error: testError.message
      });
    }
  } catch (error) {
    console.error('Test airline API error:', error);
    res.status(500).json({ error: 'Error testing airline API connection.' });
  }
});

module.exports = router;