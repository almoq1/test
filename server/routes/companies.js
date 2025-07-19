const express = require('express');
const { body, validationResult } = require('express-validator');
const { Company, User } = require('../models');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all companies (admin only)
router.get('/', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, size, industry } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (size) {
      whereClause.size = size;
    }
    
    if (industry) {
      whereClause.industry = industry;
    }

    const companies = await Company.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'users',
        attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
        where: { isActive: true }
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      companies: companies.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(companies.count / limit),
        totalItems: companies.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Error fetching companies.' });
  }
});

// Get company by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'users',
        attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'isActive', 'lastLogin']
      }]
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    // Check access permission
    if (req.user.role !== 'admin' && req.user.companyId !== company.id) {
      return res.status(403).json({ error: 'Access denied to this company.' });
    }

    res.json({
      company: company.toJSON()
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Error fetching company.' });
  }
});

// Create new company (admin only)
router.post('/', auth, requireRole(['admin']), [
  body('name').trim().notEmpty().withMessage('Company name is required'),
  body('registrationNumber').trim().notEmpty().withMessage('Registration number is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('country').optional().trim(),
  body('postalCode').optional().trim(),
  body('industry').optional().trim(),
  body('size').optional().isIn(['small', 'medium', 'large', 'enterprise']),
  body('contractStartDate').optional().isISO8601(),
  body('contractEndDate').optional().isISO8601(),
  body('billingCycle').optional().isIn(['monthly', 'quarterly', 'annually']),
  body('creditLimit').optional().isFloat({ min: 0 }),
  body('discountPercentage').optional().isFloat({ min: 0, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      registrationNumber,
      email,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      industry,
      size,
      contractStartDate,
      contractEndDate,
      billingCycle,
      creditLimit,
      discountPercentage
    } = req.body;

    // Check if company already exists
    const existingCompany = await Company.findOne({
      where: { registrationNumber }
    });
    if (existingCompany) {
      return res.status(400).json({ error: 'Company with this registration number already exists.' });
    }

    // Create company
    const company = await Company.create({
      name,
      registrationNumber,
      email,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      industry,
      size: size || 'medium',
      contractStartDate: contractStartDate ? new Date(contractStartDate) : null,
      contractEndDate: contractEndDate ? new Date(contractEndDate) : null,
      billingCycle: billingCycle || 'monthly',
      creditLimit: creditLimit || 0,
      discountPercentage: discountPercentage || 0
    });

    res.status(201).json({
      message: 'Company created successfully',
      company: company.toJSON()
    });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ error: 'Error creating company.' });
  }
});

// Update company
router.put('/:id', auth, requireRole(['admin']), [
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('country').optional().trim(),
  body('postalCode').optional().trim(),
  body('industry').optional().trim(),
  body('size').optional().isIn(['small', 'medium', 'large', 'enterprise']),
  body('status').optional().isIn(['active', 'inactive', 'suspended']),
  body('contractStartDate').optional().isISO8601(),
  body('contractEndDate').optional().isISO8601(),
  body('billingCycle').optional().isIn(['monthly', 'quarterly', 'annually']),
  body('creditLimit').optional().isFloat({ min: 0 }),
  body('discountPercentage').optional().isFloat({ min: 0, max: 100 }),
  body('settings').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    const updateFields = [
      'name', 'email', 'phone', 'address', 'city', 'state', 'country', 'postalCode',
      'industry', 'size', 'status', 'contractStartDate', 'contractEndDate',
      'billingCycle', 'creditLimit', 'discountPercentage', 'settings'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'contractStartDate' || field === 'contractEndDate') {
          company[field] = req.body[field] ? new Date(req.body[field]) : null;
        } else {
          company[field] = req.body[field];
        }
      }
    });

    await company.save();

    res.json({
      message: 'Company updated successfully',
      company: company.toJSON()
    });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ error: 'Error updating company.' });
  }
});

// Delete company (admin only)
router.delete('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'users'
      }]
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    // Check if company has active users
    const activeUsers = company.users.filter(user => user.isActive);
    if (activeUsers.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete company with active users. Please deactivate users first.' 
      });
    }

    await company.destroy();

    res.json({
      message: 'Company deleted successfully'
    });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ error: 'Error deleting company.' });
  }
});

// Get company statistics
router.get('/statistics/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const company = await Company.findByPk(id, {
      include: [{
        model: User,
        as: 'users',
        attributes: ['id', 'role', 'isActive', 'createdAt', 'lastLogin']
      }]
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    const stats = {
      totalUsers: company.users.length,
      activeUsers: company.users.filter(u => u.isActive).length,
      usersByRole: {},
      recentLogins: 0,
      newUsersThisMonth: 0,
      contractStatus: 'active',
      daysUntilContractExpiry: null
    };

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    company.users.forEach(user => {
      // Count by role
      stats.usersByRole[user.role] = (stats.usersByRole[user.role] || 0) + 1;

      // Count recent logins (last 30 days)
      if (user.lastLogin && (now - user.lastLogin) < 30 * 24 * 60 * 60 * 1000) {
        stats.recentLogins++;
      }

      // Count new users this month
      if (user.createdAt >= thisMonth) {
        stats.newUsersThisMonth++;
      }
    });

    // Contract status
    if (company.contractEndDate) {
      const daysUntilExpiry = Math.ceil((company.contractEndDate - now) / (1000 * 60 * 60 * 24));
      stats.daysUntilContractExpiry = daysUntilExpiry;
      
      if (daysUntilExpiry < 0) {
        stats.contractStatus = 'expired';
      } else if (daysUntilExpiry <= 30) {
        stats.contractStatus = 'expiring_soon';
      }
    }

    res.json({
      statistics: stats,
      period: { startDate, endDate }
    });
  } catch (error) {
    console.error('Company statistics error:', error);
    res.status(500).json({ error: 'Error fetching company statistics.' });
  }
});

module.exports = router;