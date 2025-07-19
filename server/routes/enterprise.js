const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const enterpriseService = require('../services/enterpriseService');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// Multi-tenant management routes
router.post('/companies', 
  requireRole(['admin']),
  [
    body('name').notEmpty().withMessage('Company name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
    body('address').optional().isString().withMessage('Address must be a string'),
    body('industry').optional().isString().withMessage('Industry must be a string'),
    body('size').optional().isIn(['small', 'medium', 'large', 'enterprise']).withMessage('Invalid company size')
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

      const result = await enterpriseService.createCompany(req.body);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Enterprise Route - Create Company Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

router.get('/companies/:companyId',
  requireRole(['admin', 'company_admin']),
  [
    param('companyId').isUUID().withMessage('Valid company ID is required')
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

      const result = await enterpriseService.getCompanyDetails(req.params.companyId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      console.error('Enterprise Route - Get Company Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

router.put('/companies/:companyId',
  requireRole(['admin', 'company_admin']),
  [
    param('companyId').isUUID().withMessage('Valid company ID is required'),
    body('name').optional().notEmpty().withMessage('Company name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
    body('address').optional().isString().withMessage('Address must be a string'),
    body('industry').optional().isString().withMessage('Industry must be a string'),
    body('size').optional().isIn(['small', 'medium', 'large', 'enterprise']).withMessage('Invalid company size')
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

      const result = await enterpriseService.updateCompany(req.params.companyId, req.body);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Enterprise Route - Update Company Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// Enterprise analytics routes
router.get('/analytics/:companyId',
  requireRole(['admin', 'company_admin']),
  [
    param('companyId').isUUID().withMessage('Valid company ID is required'),
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

      const result = await enterpriseService.getEnterpriseAnalytics(
        req.params.companyId,
        req.query.dateRange || 'month'
      );
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Enterprise Route - Get Analytics Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// Enterprise integrations routes
router.post('/integrations/:companyId/erp',
  requireRole(['admin', 'company_admin']),
  [
    param('companyId').isUUID().withMessage('Valid company ID is required'),
    body('apiUrl').isURL().withMessage('Valid API URL is required'),
    body('apiKey').notEmpty().withMessage('API key is required'),
    body('system').optional().isString().withMessage('System must be a string'),
    body('version').optional().isString().withMessage('Version must be a string')
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

      const result = await enterpriseService.setupERPIntegration(req.params.companyId, req.body);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Enterprise Route - ERP Integration Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

router.post('/integrations/:companyId/crm',
  requireRole(['admin', 'company_admin']),
  [
    param('companyId').isUUID().withMessage('Valid company ID is required'),
    body('apiUrl').isURL().withMessage('Valid API URL is required'),
    body('apiKey').notEmpty().withMessage('API key is required'),
    body('system').optional().isString().withMessage('System must be a string'),
    body('version').optional().isString().withMessage('Version must be a string')
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

      const result = await enterpriseService.setupCRMIntegration(req.params.companyId, req.body);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Enterprise Route - CRM Integration Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

router.post('/integrations/:companyId/accounting',
  requireRole(['admin', 'company_admin']),
  [
    param('companyId').isUUID().withMessage('Valid company ID is required'),
    body('apiUrl').isURL().withMessage('Valid API URL is required'),
    body('apiKey').notEmpty().withMessage('API key is required'),
    body('system').optional().isString().withMessage('System must be a string'),
    body('version').optional().isString().withMessage('Version must be a string')
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

      const result = await enterpriseService.setupAccountingIntegration(req.params.companyId, req.body);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Enterprise Route - Accounting Integration Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// Bulk operations routes
router.post('/bulk/users/:companyId/import',
  requireRole(['admin', 'company_admin']),
  [
    param('companyId').isUUID().withMessage('Valid company ID is required'),
    body('users').isArray({ min: 1 }).withMessage('Users array is required with at least one user'),
    body('users.*.firstName').notEmpty().withMessage('First name is required'),
    body('users.*.lastName').notEmpty().withMessage('Last name is required'),
    body('users.*.email').isEmail().withMessage('Valid email is required'),
    body('users.*.role').optional().isIn(['user', 'company_admin']).withMessage('Invalid role'),
    body('users.*.password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
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

      const result = await enterpriseService.bulkUserImport(req.params.companyId, req.body.users);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Enterprise Route - Bulk User Import Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

router.get('/bulk/bookings/:companyId/export',
  requireRole(['admin', 'company_admin']),
  [
    param('companyId').isUUID().withMessage('Valid company ID is required'),
    query('startDate').optional().isISO8601().withMessage('Valid start date is required'),
    query('endDate').optional().isISO8601().withMessage('Valid end date is required'),
    query('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed']).withMessage('Invalid status')
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
      if (req.query.startDate && req.query.endDate) {
        filters.createdAt = {
          [require('sequelize').Op.between]: [req.query.startDate, req.query.endDate]
        };
      }
      if (req.query.status) {
        filters.status = req.query.status;
      }

      const result = await enterpriseService.bulkBookingExport(req.params.companyId, filters);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Enterprise Route - Bulk Booking Export Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// Business settings routes
router.put('/settings/:companyId/booking-limits',
  requireRole(['admin', 'company_admin']),
  [
    param('companyId').isUUID().withMessage('Valid company ID is required'),
    body('daily').optional().isInt({ min: 1 }).withMessage('Daily limit must be a positive integer'),
    body('monthly').optional().isInt({ min: 1 }).withMessage('Monthly limit must be a positive integer'),
    body('yearly').optional().isInt({ min: 1 }).withMessage('Yearly limit must be a positive integer')
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

      const result = await enterpriseService.setBookingLimits(req.params.companyId, req.body);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Enterprise Route - Set Booking Limits Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

router.put('/settings/:companyId/payment',
  requireRole(['admin', 'company_admin']),
  [
    param('companyId').isUUID().withMessage('Valid company ID is required'),
    body('autoRecharge').optional().isBoolean().withMessage('Auto recharge must be a boolean'),
    body('rechargeThreshold').optional().isFloat({ min: 0 }).withMessage('Recharge threshold must be a positive number'),
    body('rechargeAmount').optional().isFloat({ min: 0 }).withMessage('Recharge amount must be a positive number')
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

      const result = await enterpriseService.setPaymentSettings(req.params.companyId, req.body);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Enterprise Route - Set Payment Settings Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

router.put('/settings/:companyId/notifications',
  requireRole(['admin', 'company_admin']),
  [
    param('companyId').isUUID().withMessage('Valid company ID is required'),
    body('email').optional().isBoolean().withMessage('Email setting must be a boolean'),
    body('sms').optional().isBoolean().withMessage('SMS setting must be a boolean'),
    body('push').optional().isBoolean().withMessage('Push setting must be a boolean')
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

      const result = await enterpriseService.setNotificationSettings(req.params.companyId, req.body);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Enterprise Route - Set Notification Settings Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// Enterprise reporting routes
router.get('/reports/:companyId/performance',
  requireRole(['admin', 'company_admin']),
  [
    param('companyId').isUUID().withMessage('Valid company ID is required'),
    query('startDate').isISO8601().withMessage('Valid start date is required'),
    query('endDate').isISO8601().withMessage('Valid end date is required'),
    query('format').optional().isIn(['json', 'csv', 'pdf']).withMessage('Invalid format')
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

      // Generate performance report
      const report = await enterpriseService.generatePerformanceReport(
        req.params.companyId,
        req.query.startDate,
        req.query.endDate,
        req.query.format || 'json'
      );

      if (report.success) {
        if (req.query.format === 'csv') {
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', 'attachment; filename=performance-report.csv');
          res.send(report.data);
        } else if (req.query.format === 'pdf') {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'attachment; filename=performance-report.pdf');
          res.send(report.data);
        } else {
          res.json(report);
        }
      } else {
        res.status(400).json(report);
      }
    } catch (error) {
      console.error('Enterprise Route - Performance Report Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// Enterprise dashboard routes
router.get('/dashboard/:companyId',
  requireRole(['admin', 'company_admin']),
  [
    param('companyId').isUUID().withMessage('Valid company ID is required')
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

      const result = await enterpriseService.getEnterpriseDashboard(req.params.companyId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Enterprise Route - Dashboard Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// Enterprise API management routes
router.post('/api-keys/:companyId/regenerate',
  requireRole(['admin', 'company_admin']),
  [
    param('companyId').isUUID().withMessage('Valid company ID is required')
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

      const result = await enterpriseService.regenerateApiKey(req.params.companyId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Enterprise Route - Regenerate API Key Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// Enterprise audit logs
router.get('/audit-logs/:companyId',
  requireRole(['admin', 'company_admin']),
  [
    param('companyId').isUUID().withMessage('Valid company ID is required'),
    query('startDate').optional().isISO8601().withMessage('Valid start date is required'),
    query('endDate').optional().isISO8601().withMessage('Valid end date is required'),
    query('action').optional().isString().withMessage('Action must be a string'),
    query('userId').optional().isUUID().withMessage('Valid user ID is required'),
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

      const result = await enterpriseService.getAuditLogs(
        req.params.companyId,
        req.query
      );
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Enterprise Route - Audit Logs Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

module.exports = router;