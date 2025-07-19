const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const agentService = require('../services/agentService');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// Agent management routes
router.post('/register',
  [
    body('userId').isUUID().withMessage('Valid user ID is required'),
    body('agentType').isIn(['individual', 'agency', 'corporate', 'super_agent']).withMessage('Valid agent type is required'),
    body('businessName').optional().isString().withMessage('Business name must be a string'),
    body('businessLicense').optional().isString().withMessage('Business license must be a string'),
    body('taxId').optional().isString().withMessage('Tax ID must be a string'),
    body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
    body('website').optional().isURL().withMessage('Valid website URL is required'),
    body('address').optional().isObject().withMessage('Address must be an object'),
    body('territories').optional().isArray().withMessage('Territories must be an array'),
    body('specializations').optional().isArray().withMessage('Specializations must be an array'),
    body('parentAgentId').optional().isUUID().withMessage('Valid parent agent ID is required'),
    body('commissionStructure').optional().isObject().withMessage('Commission structure must be an object')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const result = await agentService.createAgent(req.body);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Agent Route - Register Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

router.get('/:agentId',
  requireRole(['admin', 'company_admin', 'agent', 'super_agent']),
  [
    param('agentId').isUUID().withMessage('Valid agent ID is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const result = await agentService.getAgentDetails(req.params.agentId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      console.error('Agent Route - Get Agent Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

router.put('/:agentId',
  requireRole(['admin', 'company_admin', 'agent', 'super_agent']),
  [
    param('agentId').isUUID().withMessage('Valid agent ID is required'),
    body('businessName').optional().isString().withMessage('Business name must be a string'),
    body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
    body('website').optional().isURL().withMessage('Valid website URL is required'),
    body('address').optional().isObject().withMessage('Address must be an object'),
    body('territories').optional().isArray().withMessage('Territories must be an array'),
    body('specializations').optional().isArray().withMessage('Specializations must be an array'),
    body('commissionStructure').optional().isObject().withMessage('Commission structure must be an object'),
    body('settings').optional().isObject().withMessage('Settings must be an object')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const result = await agentService.updateAgent(req.params.agentId, req.body);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Agent Route - Update Agent Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

router.post('/:agentId/approve',
  requireRole(['admin', 'company_admin']),
  [
    param('agentId').isUUID().withMessage('Valid agent ID is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const result = await agentService.approveAgent(req.params.agentId, req.user.id);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Agent Route - Approve Agent Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// Commission management routes
router.post('/:agentId/commissions/calculate',
  requireRole(['admin', 'company_admin']),
  [
    param('agentId').isUUID().withMessage('Valid agent ID is required'),
    body('bookingId').isUUID().withMessage('Valid booking ID is required'),
    body('bookingAmount').isFloat({ min: 0 }).withMessage('Valid booking amount is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const result = await agentService.calculateCommission(
        req.params.agentId,
        req.body.bookingId,
        req.body.bookingAmount
      );
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Agent Route - Calculate Commission Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

router.post('/commissions/:commissionId/approve',
  requireRole(['admin', 'company_admin']),
  [
    param('commissionId').isUUID().withMessage('Valid commission ID is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const result = await agentService.approveCommission(req.params.commissionId, req.user.id);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Agent Route - Approve Commission Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

router.get('/:agentId/commissions',
  requireRole(['admin', 'company_admin', 'agent', 'super_agent']),
  [
    param('agentId').isUUID().withMessage('Valid agent ID is required'),
    query('status').optional().isIn(['pending', 'approved', 'paid', 'cancelled', 'disputed']).withMessage('Invalid status'),
    query('startDate').optional().isISO8601().withMessage('Valid start date is required'),
    query('endDate').optional().isISO8601().withMessage('Valid end date is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const filters = {};
      if (req.query.status) {
        filters.status = req.query.status;
      }
      if (req.query.startDate && req.query.endDate) {
        filters.createdAt = {
          [require('sequelize').Op.between]: [req.query.startDate, req.query.endDate]
        };
      }

      const result = await agentService.getAgentCommissions(req.params.agentId, filters);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Agent Route - Get Commissions Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// Payout management routes
router.post('/:agentId/payouts',
  requireRole(['admin', 'company_admin']),
  [
    param('agentId').isUUID().withMessage('Valid agent ID is required'),
    body('payoutPeriod').matches(/^\d{4}-\d{2}$/).withMessage('Payout period must be in YYYY-MM format')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const result = await agentService.createPayout(req.params.agentId, req.body.payoutPeriod);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Agent Route - Create Payout Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

router.post('/payouts/:payoutId/process',
  requireRole(['admin', 'company_admin']),
  [
    param('payoutId').isUUID().withMessage('Valid payout ID is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const result = await agentService.processPayout(req.params.payoutId, req.user.id);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Agent Route - Process Payout Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// Performance analytics routes
router.get('/:agentId/performance',
  requireRole(['admin', 'company_admin', 'agent', 'super_agent']),
  [
    param('agentId').isUUID().withMessage('Valid agent ID is required'),
    query('dateRange').optional().isIn(['week', 'month', 'quarter', 'year']).withMessage('Invalid date range')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const result = await agentService.getAgentPerformance(
        req.params.agentId,
        req.query.dateRange || 'month'
      );
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Agent Route - Get Performance Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// Agent dashboard routes
router.get('/:agentId/dashboard',
  requireRole(['admin', 'company_admin', 'agent', 'super_agent']),
  [
    param('agentId').isUUID().withMessage('Valid agent ID is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const [
        performance,
        recentBookings,
        pendingCommissions,
        recentPayouts
      ] = await Promise.all([
        agentService.getAgentPerformance(req.params.agentId, 'month'),
        agentService.getAgentBookings(req.params.agentId, moment().subtract(7, 'days').startOf('day'), moment().endOf('day')),
        agentService.getAgentCommissions(req.params.agentId, { status: 'pending' }),
        agentService.getAgentPayouts(req.params.agentId, moment().subtract(30, 'days').startOf('day'), moment().endOf('day'))
      ]);

      const dashboard = {
        performance: performance.data,
        recentBookings: recentBookings.data || [],
        pendingCommissions: pendingCommissions.data || [],
        recentPayouts: recentPayouts.data || []
      };

      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      console.error('Agent Route - Dashboard Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// Agent hierarchy routes
router.get('/:agentId/sub-agents',
  requireRole(['admin', 'company_admin', 'super_agent']),
  [
    param('agentId').isUUID().withMessage('Valid agent ID is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const subAgents = await Agent.findAll({
        where: { parentAgentId: req.params.agentId },
        include: [{
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email']
        }],
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: subAgents
      });
    } catch (error) {
      console.error('Agent Route - Get Sub Agents Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// Agent search and listing routes
router.get('/',
  requireRole(['admin', 'company_admin']),
  [
    query('status').optional().isIn(['active', 'inactive', 'suspended', 'pending_approval']).withMessage('Invalid status'),
    query('agentType').optional().isIn(['individual', 'agency', 'corporate', 'super_agent']).withMessage('Invalid agent type'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const whereClause = {};
      if (req.query.status) {
        whereClause.status = req.query.status;
      }
      if (req.query.agentType) {
        whereClause.agentType = req.query.agentType;
      }
      if (req.query.search) {
        whereClause[require('sequelize').Op.or] = [
          { agentCode: { [require('sequelize').Op.iLike]: `%${req.query.search}%` } },
          { businessName: { [require('sequelize').Op.iLike]: `%${req.query.search}%` } }
        ];
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const { count, rows } = await Agent.findAndCountAll({
        where: whereClause,
        include: [{
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email']
        }],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      res.json({
        success: true,
        data: {
          agents: rows,
          pagination: {
            page,
            limit,
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Agent Route - List Agents Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

module.exports = router;