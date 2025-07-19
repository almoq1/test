const express = require('express');
const { body, validationResult } = require('express-validator');
const { Wallet, WalletTransaction, User } = require('../models');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get wallet balance and details
router.get('/balance', auth, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({
      where: { userId: req.user.id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName', 'email']
      }]
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found.' });
    }

    res.json({
      wallet: wallet.toJSON()
    });
  } catch (error) {
    console.error('Wallet balance error:', error);
    res.status(500).json({ error: 'Error fetching wallet balance.' });
  }
});

// Get wallet transactions
router.get('/transactions', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found.' });
    }

    const whereClause = { walletId: wallet.id };
    
    if (type) {
      whereClause.type = type;
    }
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.$gte = new Date(startDate);
      if (endDate) whereClause.createdAt.$lte = new Date(endDate);
    }

    const transactions = await WalletTransaction.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      transactions: transactions.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(transactions.count / limit),
        totalItems: transactions.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Wallet transactions error:', error);
    res.status(500).json({ error: 'Error fetching wallet transactions.' });
  }
});

// Add funds to wallet (admin/company admin only)
router.post('/add-funds', auth, requireRole(['admin', 'company_admin']), [
  body('amount').isFloat({ min: 0.01 }),
  body('description').trim().notEmpty(),
  body('userId').optional().isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, description, userId } = req.body;
    const targetUserId = userId || req.user.id;

    // Check if user has permission to add funds to this user's wallet
    if (userId && req.user.role !== 'admin') {
      const targetUser = await User.findByPk(userId);
      if (!targetUser || targetUser.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Access denied to this user.' });
      }
    }

    const wallet = await Wallet.findOne({ where: { userId: targetUserId } });
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found.' });
    }

    const transaction = await wallet.addFunds(amount, description);

    res.json({
      message: 'Funds added successfully',
      transaction: transaction.toJSON(),
      newBalance: wallet.balance
    });
  } catch (error) {
    console.error('Add funds error:', error);
    res.status(500).json({ error: 'Error adding funds to wallet.' });
  }
});

// Deduct funds from wallet
router.post('/deduct-funds', auth, [
  body('amount').isFloat({ min: 0.01 }),
  body('description').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, description } = req.body;
    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found.' });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient funds in wallet.' });
    }

    const transaction = await wallet.deductFunds(amount, description);

    res.json({
      message: 'Funds deducted successfully',
      transaction: transaction.toJSON(),
      newBalance: wallet.balance
    });
  } catch (error) {
    console.error('Deduct funds error:', error);
    res.status(500).json({ error: 'Error deducting funds from wallet.' });
  }
});

// Transfer funds between wallets (admin/company admin only)
router.post('/transfer', auth, requireRole(['admin', 'company_admin']), [
  body('fromUserId').isUUID(),
  body('toUserId').isUUID(),
  body('amount').isFloat({ min: 0.01 }),
  body('description').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fromUserId, toUserId, amount, description } = req.body;

    // Check permissions
    if (req.user.role !== 'admin') {
      const fromUser = await User.findByPk(fromUserId);
      const toUser = await User.findByPk(toUserId);
      
      if (!fromUser || !toUser || 
          fromUser.companyId !== req.user.companyId || 
          toUser.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Access denied to these users.' });
      }
    }

    const fromWallet = await Wallet.findOne({ where: { userId: fromUserId } });
    const toWallet = await Wallet.findOne({ where: { userId: toUserId } });

    if (!fromWallet || !toWallet) {
      return res.status(404).json({ error: 'One or both wallets not found.' });
    }

    if (fromWallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient funds in source wallet.' });
    }

    // Perform transfer
    const debitTransaction = await fromWallet.deductFunds(amount, `Transfer to ${toUser?.email || toUserId}: ${description}`);
    const creditTransaction = await toWallet.addFunds(amount, `Transfer from ${fromUser?.email || fromUserId}: ${description}`);

    res.json({
      message: 'Transfer completed successfully',
      debitTransaction: debitTransaction.toJSON(),
      creditTransaction: creditTransaction.toJSON(),
      fromWalletBalance: fromWallet.balance,
      toWalletBalance: toWallet.balance
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Error processing transfer.' });
  }
});

// Get wallet statistics
router.get('/statistics', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found.' });
    }

    const whereClause = { walletId: wallet.id };
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.$gte = new Date(startDate);
      if (endDate) whereClause.createdAt.$lte = new Date(endDate);
    }

    const transactions = await WalletTransaction.findAll({
      where: whereClause,
      attributes: ['type', 'amount', 'createdAt']
    });

    const stats = {
      totalCredits: 0,
      totalDebits: 0,
      totalTransactions: transactions.length,
      averageTransactionAmount: 0,
      currentBalance: wallet.balance
    };

    transactions.forEach(transaction => {
      if (transaction.type === 'credit') {
        stats.totalCredits += parseFloat(transaction.amount);
      } else {
        stats.totalDebits += parseFloat(transaction.amount);
      }
    });

    if (stats.totalTransactions > 0) {
      stats.averageTransactionAmount = (stats.totalCredits + stats.totalDebits) / stats.totalTransactions;
    }

    res.json({
      statistics: stats,
      period: { startDate, endDate }
    });
  } catch (error) {
    console.error('Wallet statistics error:', error);
    res.status(500).json({ error: 'Error fetching wallet statistics.' });
  }
});

// Update wallet settings
router.put('/settings', auth, [
  body('autoRechargeEnabled').optional().isBoolean(),
  body('autoRechargeAmount').optional().isFloat({ min: 0 }),
  body('autoRechargeThreshold').optional().isFloat({ min: 0 }),
  body('monthlySpendingLimit').optional().isFloat({ min: 0 }),
  body('dailySpendingLimit').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found.' });
    }

    const updateFields = ['autoRechargeEnabled', 'autoRechargeAmount', 'autoRechargeThreshold', 'monthlySpendingLimit', 'dailySpendingLimit'];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        wallet[field] = req.body[field];
      }
    });

    await wallet.save();

    res.json({
      message: 'Wallet settings updated successfully',
      wallet: wallet.toJSON()
    });
  } catch (error) {
    console.error('Wallet settings error:', error);
    res.status(500).json({ error: 'Error updating wallet settings.' });
  }
});

module.exports = router;