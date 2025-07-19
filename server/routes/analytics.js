const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const analyticsService = require('../services/analyticsService');

// Dashboard analytics
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const { dateRange = '30d' } = req.query;
    const companyId = req.user.role === 'admin' ? null : req.user.companyId;
    
    const analytics = await analyticsService.getDashboardAnalytics(companyId, dateRange);
    res.json(analytics);
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
});

// Predictive analytics
router.get('/predictive', authenticateToken, requireRole(['admin', 'company_admin']), async (req, res) => {
  try {
    const companyId = req.user.role === 'admin' ? null : req.user.companyId;
    const predictions = await analyticsService.getPredictiveAnalytics(companyId);
    res.json(predictions);
  } catch (error) {
    console.error('Predictive analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch predictive analytics' });
  }
});

// Customer analytics
router.get('/customers', authenticateToken, requireRole(['admin', 'company_admin']), async (req, res) => {
  try {
    const companyId = req.user.role === 'admin' ? null : req.user.companyId;
    const customerAnalytics = await analyticsService.getCustomerAnalytics(companyId);
    res.json(customerAnalytics);
  } catch (error) {
    console.error('Customer analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch customer analytics' });
  }
});

// Financial analytics
router.get('/financial', authenticateToken, requireRole(['admin', 'company_admin']), async (req, res) => {
  try {
    const { dateRange = '12m' } = req.query;
    const companyId = req.user.role === 'admin' ? null : req.user.companyId;
    
    const financialAnalytics = await analyticsService.getFinancialAnalytics(companyId, dateRange);
    res.json(financialAnalytics);
  } catch (error) {
    console.error('Financial analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch financial analytics' });
  }
});

// Operational analytics
router.get('/operational', authenticateToken, requireRole(['admin', 'company_admin']), async (req, res) => {
  try {
    const companyId = req.user.role === 'admin' ? null : req.user.companyId;
    const operationalAnalytics = await analyticsService.getOperationalAnalytics(companyId);
    res.json(operationalAnalytics);
  } catch (error) {
    console.error('Operational analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch operational analytics' });
  }
});

// Custom reports
router.post('/reports', authenticateToken, requireRole(['admin', 'company_admin']), async (req, res) => {
  try {
    const { reportType, parameters, format = 'json' } = req.body;
    const companyId = req.user.role === 'admin' ? null : req.user.companyId;
    
    const report = await analyticsService.generateCustomReport(reportType, parameters, companyId, format);
    res.json(report);
  } catch (error) {
    console.error('Custom report error:', error);
    res.status(500).json({ error: 'Failed to generate custom report' });
  }
});

// Export analytics data
router.get('/export/:type', authenticateToken, requireRole(['admin', 'company_admin']), async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'csv', dateRange = '30d' } = req.query;
    const companyId = req.user.role === 'admin' ? null : req.user.companyId;
    
    const exportData = await analyticsService.exportAnalyticsData(type, format, dateRange, companyId);
    
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${type}_${dateRange}.${format}"`);
    res.send(exportData);
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({ error: 'Failed to export analytics data' });
  }
});

// Real-time metrics
router.get('/realtime', authenticateToken, async (req, res) => {
  try {
    const companyId = req.user.role === 'admin' ? null : req.user.companyId;
    const realtimeMetrics = await analyticsService.getRealtimeMetrics(companyId);
    res.json(realtimeMetrics);
  } catch (error) {
    console.error('Real-time metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch real-time metrics' });
  }
});

// Performance metrics
router.get('/performance', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const performanceMetrics = await analyticsService.getPerformanceMetrics();
    res.json(performanceMetrics);
  } catch (error) {
    console.error('Performance metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

// User behavior analytics
router.get('/user-behavior', authenticateToken, requireRole(['admin', 'company_admin']), async (req, res) => {
  try {
    const { userId } = req.query;
    const companyId = req.user.role === 'admin' ? null : req.user.companyId;
    
    const behaviorAnalytics = await analyticsService.getUserBehaviorAnalytics(userId, companyId);
    res.json(behaviorAnalytics);
  } catch (error) {
    console.error('User behavior analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch user behavior analytics' });
  }
});

// Revenue analytics
router.get('/revenue', authenticateToken, requireRole(['admin', 'company_admin']), async (req, res) => {
  try {
    const { dateRange = '12m', breakdown = 'monthly' } = req.query;
    const companyId = req.user.role === 'admin' ? null : req.user.companyId;
    
    const revenueAnalytics = await analyticsService.getRevenueAnalytics(companyId, dateRange, breakdown);
    res.json(revenueAnalytics);
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

// Booking analytics
router.get('/bookings', authenticateToken, async (req, res) => {
  try {
    const { dateRange = '30d', filters = {} } = req.query;
    const companyId = req.user.role === 'admin' ? null : req.user.companyId;
    
    const bookingAnalytics = await analyticsService.getBookingAnalytics(companyId, dateRange, filters);
    res.json(bookingAnalytics);
  } catch (error) {
    console.error('Booking analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch booking analytics' });
  }
});

module.exports = router;