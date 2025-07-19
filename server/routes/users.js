const express = require('express');
const { body, validationResult } = require('express-validator');
const { User, Company, Wallet } = require('../models');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20, role, companyId, isActive } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    if (role) {
      whereClause.role = role;
    }
    
    if (companyId) {
      whereClause.companyId = companyId;
    }
    
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const users = await User.findAndCountAll({
      where: whereClause,
      include: [{
        model: Company,
        as: 'company',
        attributes: ['name', 'registrationNumber']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      users: users.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(users.count / limit),
        totalItems: users.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Error fetching users.' });
  }
});

// Get company users (company admin only)
router.get('/company/:companyId', auth, requireRole(['admin', 'company_admin']), async (req, res) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 20, role, isActive } = req.query;
    const offset = (page - 1) * limit;

    // Check company access
    if (req.user.role !== 'admin' && req.user.companyId !== companyId) {
      return res.status(403).json({ error: 'Access denied to this company.' });
    }

    const whereClause = { companyId };
    
    if (role) {
      whereClause.role = role;
    }
    
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const users = await User.findAndCountAll({
      where: whereClause,
      include: [{
        model: Company,
        as: 'company',
        attributes: ['name', 'registrationNumber']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      users: users.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(users.count / limit),
        totalItems: users.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get company users error:', error);
    res.status(500).json({ error: 'Error fetching company users.' });
  }
});

// Get user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{
        model: Company,
        as: 'company',
        attributes: ['name', 'registrationNumber']
      }]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check access permission
    if (req.user.role !== 'admin' && req.user.id !== user.id && req.user.companyId !== user.companyId) {
      return res.status(403).json({ error: 'Access denied to this user.' });
    }

    res.json({
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Error fetching user.' });
  }
});

// Create new user (admin/company admin only)
router.post('/', auth, requireRole(['admin', 'company_admin']), [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('phone').optional().trim(),
  body('role').isIn(['admin', 'company_admin', 'travel_manager', 'employee']),
  body('companyId').optional().isUUID(),
  body('permissions').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, phone, role, companyId, permissions } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    // Set company ID based on user role
    let targetCompanyId = companyId;
    if (req.user.role === 'company_admin') {
      targetCompanyId = req.user.companyId;
    }

    // Validate role permissions
    if (req.user.role === 'company_admin' && role === 'admin') {
      return res.status(403).json({ error: 'Company admins cannot create admin users.' });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
      companyId: targetCompanyId,
      permissions: permissions || {}
    });

    // Create wallet for user
    await Wallet.create({
      userId: user.id,
      balance: 0,
      currency: 'USD'
    });

    res.status(201).json({
      message: 'User created successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Error creating user.' });
  }
});

// Update user
router.put('/:id', auth, [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('phone').optional().trim(),
  body('role').optional().isIn(['admin', 'company_admin', 'travel_manager', 'employee']),
  body('isActive').optional().isBoolean(),
  body('permissions').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check access permission
    if (req.user.role !== 'admin' && req.user.id !== user.id && req.user.companyId !== user.companyId) {
      return res.status(403).json({ error: 'Access denied to this user.' });
    }

    // Validate role changes
    if (req.body.role && req.user.role === 'company_admin' && req.body.role === 'admin') {
      return res.status(403).json({ error: 'Company admins cannot promote users to admin.' });
    }

    const updateFields = ['firstName', 'lastName', 'phone', 'role', 'isActive', 'permissions'];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Error updating user.' });
  }
});

// Delete user (admin only)
router.delete('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Prevent self-deletion
    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account.' });
    }

    await user.destroy();

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Error deleting user.' });
  }
});

// Get user statistics
router.get('/statistics/company/:companyId', auth, requireRole(['admin', 'company_admin']), async (req, res) => {
  try {
    const { companyId } = req.params;

    // Check company access
    if (req.user.role !== 'admin' && req.user.companyId !== companyId) {
      return res.status(403).json({ error: 'Access denied to this company.' });
    }

    const users = await User.findAll({
      where: { companyId },
      attributes: ['role', 'isActive', 'lastLogin', 'createdAt']
    });

    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      inactiveUsers: users.filter(u => !u.isActive).length,
      usersByRole: {},
      recentLogins: 0,
      newUsersThisMonth: 0
    };

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    users.forEach(user => {
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

    res.json({
      statistics: stats
    });
  } catch (error) {
    console.error('User statistics error:', error);
    res.status(500).json({ error: 'Error fetching user statistics.' });
  }
});

module.exports = router;