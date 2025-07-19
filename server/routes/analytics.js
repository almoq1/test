const express = require('express');
const { query, validationResult } = require('express-validator');
const analyticsService = require('../services/analyticsService');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get dashboard overview analytics
router.get('/dashboard', auth, [
  query('companyId').optional().isUUID(),
  query('period').optional().isIn(['7d', '30d', '90d', '12m'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { companyId, period = '30d' } = req.query;
    const userCompanyId = req.user.role === 'admin' ? companyId : req.user.companyId;

    const analytics = await analyticsService.getDashboardOverview(userCompanyId);

    res.json({
      success: true,
      data: analytics,
      period,
      companyId: userCompanyId
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Error fetching dashboard analytics.' });
  }
});

// Get predictive analytics and forecasts
router.get('/predictive', auth, requireRole(['admin', 'company_admin']), [
  query('companyId').optional().isUUID(),
  query('days').optional().isInt({ min: 7, max: 90 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { companyId, days = 30 } = req.query;
    const userCompanyId = req.user.role === 'admin' ? companyId : req.user.companyId;

    const [bookingForecast, customerSegmentation] = await Promise.all([
      analyticsService.getBookingForecast(userCompanyId, parseInt(days)),
      analyticsService.getCustomerSegmentation(userCompanyId)
    ]);

    res.json({
      success: true,
      data: {
        bookingForecast,
        customerSegmentation,
        insights: {
          trendAnalysis: 'Booking trends show steady growth',
          seasonalPatterns: 'Peak booking times identified',
          growthOpportunities: 'High-value customer segment growing'
        }
      }
    });
  } catch (error) {
    console.error('Predictive analytics error:', error);
    res.status(500).json({ error: 'Error fetching predictive analytics.' });
  }
});

// Get customer segmentation analysis
router.get('/customers/segmentation', auth, requireRole(['admin', 'company_admin']), [
  query('companyId').optional().isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { companyId } = req.query;
    const userCompanyId = req.user.role === 'admin' ? companyId : req.user.companyId;

    const segmentation = await analyticsService.getCustomerSegmentation(userCompanyId);

    // Add insights and recommendations
    const insights = {
      highValueCustomers: {
        count: segmentation.highValue.count,
        percentage: (segmentation.highValue.count / Object.values(segmentation).reduce((sum, seg) => sum + seg.count, 0)) * 100,
        recommendations: [
          'Implement VIP loyalty program',
          'Offer exclusive deals and upgrades',
          'Personalized communication strategy'
        ]
      },
      inactiveCustomers: {
        count: segmentation.inactive.count,
        percentage: (segmentation.inactive.count / Object.values(segmentation).reduce((sum, seg) => sum + seg.count, 0)) * 100,
        recommendations: [
          'Re-engagement email campaigns',
          'Special reactivation offers',
          'Customer feedback surveys'
        ]
      }
    };

    res.json({
      success: true,
      data: {
        segmentation,
        insights,
        totalCustomers: Object.values(segmentation).reduce((sum, seg) => sum + seg.count, 0)
      }
    });
  } catch (error) {
    console.error('Customer segmentation error:', error);
    res.status(500).json({ error: 'Error fetching customer segmentation.' });
  }
});

// Get financial analytics
router.get('/financial', auth, requireRole(['admin', 'company_admin']), [
  query('companyId').optional().isUUID(),
  query('period').optional().isIn(['month', 'quarter', 'year'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { companyId, period = 'month' } = req.query;
    const userCompanyId = req.user.role === 'admin' ? companyId : req.user.companyId;

    const financials = await analyticsService.getFinancialAnalytics(userCompanyId, period);

    // Add financial insights
    const insights = {
      revenueGrowth: financials.revenue > 0 ? 'Positive revenue growth' : 'Revenue needs attention',
      profitMargin: financials.profitMargin > 20 ? 'Healthy profit margin' : 'Profit margin optimization needed',
      topPerformer: financials.topRevenueSources[0]?.airline || 'No data available',
      paymentTrends: financials.paymentMethodDistribution
    };

    res.json({
      success: true,
      data: {
        ...financials,
        insights,
        period,
        currency: 'USD'
      }
    });
  } catch (error) {
    console.error('Financial analytics error:', error);
    res.status(500).json({ error: 'Error fetching financial analytics.' });
  }
});

// Get performance analytics
router.get('/performance', auth, requireRole(['admin', 'company_admin']), [
  query('companyId').optional().isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { companyId } = req.query;
    const userCompanyId = req.user.role === 'admin' ? companyId : req.user.companyId;

    const performance = await analyticsService.getPerformanceAnalytics(userCompanyId);

    // Add performance insights and KPIs
    const kpis = {
      bookingSuccessRate: {
        value: performance.bookingSuccessRate,
        status: performance.bookingSuccessRate > 90 ? 'excellent' : performance.bookingSuccessRate > 80 ? 'good' : 'needs_improvement',
        target: 95
      },
      averageBookingValue: {
        value: performance.averageBookingValue,
        status: performance.averageBookingValue > 500 ? 'excellent' : performance.averageBookingValue > 300 ? 'good' : 'needs_improvement',
        target: 600
      },
      customerRetentionRate: {
        value: performance.customerRetentionRate,
        status: performance.customerRetentionRate > 80 ? 'excellent' : performance.customerRetentionRate > 60 ? 'good' : 'needs_improvement',
        target: 85
      }
    };

    res.json({
      success: true,
      data: {
        ...performance,
        kpis,
        recommendations: [
          'Optimize booking flow for better success rates',
          'Implement upselling strategies to increase average booking value',
          'Enhance customer engagement programs for better retention'
        ]
      }
    });
  } catch (error) {
    console.error('Performance analytics error:', error);
    res.status(500).json({ error: 'Error fetching performance analytics.' });
  }
});

// Get revenue trends
router.get('/revenue/trends', auth, requireRole(['admin', 'company_admin']), [
  query('companyId').optional().isUUID(),
  query('months').optional().isInt({ min: 3, max: 24 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { companyId, months = 12 } = req.query;
    const userCompanyId = req.user.role === 'admin' ? companyId : req.user.companyId;

    const revenueTrend = await analyticsService.getRevenueTrend(userCompanyId, parseInt(months));

    // Calculate growth metrics
    const currentMonth = revenueTrend[revenueTrend.length - 1];
    const previousMonth = revenueTrend[revenueTrend.length - 2];
    const growthRate = previousMonth && previousMonth.revenue > 0 ? 
      ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100 : 0;

    res.json({
      success: true,
      data: {
        trend: revenueTrend,
        metrics: {
          totalRevenue: revenueTrend.reduce((sum, month) => sum + month.revenue, 0),
          averageMonthlyRevenue: revenueTrend.reduce((sum, month) => sum + month.revenue, 0) / revenueTrend.length,
          growthRate: growthRate,
          peakMonth: revenueTrend.reduce((max, month) => month.revenue > max.revenue ? month : max, revenueTrend[0])
        }
      }
    });
  } catch (error) {
    console.error('Revenue trends error:', error);
    res.status(500).json({ error: 'Error fetching revenue trends.' });
  }
});

// Get top routes analytics
router.get('/routes/top', auth, [
  query('companyId').optional().isUUID(),
  query('limit').optional().isInt({ min: 5, max: 20 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { companyId, limit = 10 } = req.query;
    const userCompanyId = req.user.role === 'admin' ? companyId : req.user.companyId;

    const topRoutes = await analyticsService.getTopRoutes(userCompanyId);

    res.json({
      success: true,
      data: {
        routes: topRoutes.slice(0, parseInt(limit)),
        totalRoutes: topRoutes.length,
        insights: {
          mostPopular: topRoutes[0]?.route || 'No data available',
          highestRevenue: topRoutes.reduce((max, route) => route.totalRevenue > max.totalRevenue ? route : max, topRoutes[0])
        }
      }
    });
  } catch (error) {
    console.error('Top routes error:', error);
    res.status(500).json({ error: 'Error fetching top routes.' });
  }
});

// Get booking forecast
router.get('/forecast/bookings', auth, requireRole(['admin', 'company_admin']), [
  query('companyId').optional().isUUID(),
  query('days').optional().isInt({ min: 7, max: 90 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { companyId, days = 30 } = req.query;
    const userCompanyId = req.user.role === 'admin' ? companyId : req.user.companyId;

    const forecast = await analyticsService.getBookingForecast(userCompanyId, parseInt(days));

    // Add forecast insights
    const totalPredicted = forecast.forecast.reduce((sum, day) => sum + day.predictedBookings, 0);
    const averageDaily = totalPredicted / forecast.forecast.length;

    res.json({
      success: true,
      data: {
        ...forecast,
        insights: {
          totalPredictedBookings: totalPredicted,
          averageDailyBookings: Math.round(averageDaily),
          confidenceLevel: `${forecast.confidence * 100}%`,
          recommendations: [
            'Prepare for peak booking days',
            'Optimize inventory for predicted demand',
            'Plan marketing campaigns for low-demand periods'
          ]
        }
      }
    });
  } catch (error) {
    console.error('Booking forecast error:', error);
    res.status(500).json({ error: 'Error fetching booking forecast.' });
  }
});

// Get analytics cache statistics (admin only)
router.get('/cache/stats', auth, requireRole(['admin']), async (req, res) => {
  try {
    const stats = analyticsService.getCacheStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({ error: 'Error fetching cache statistics.' });
  }
});

// Clear analytics cache (admin only)
router.post('/cache/clear', auth, requireRole(['admin']), async (req, res) => {
  try {
    analyticsService.clearCache();
    
    res.json({
      success: true,
      message: 'Analytics cache cleared successfully'
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({ error: 'Error clearing analytics cache.' });
  }
});

// Get comprehensive analytics report
router.get('/report/comprehensive', auth, requireRole(['admin', 'company_admin']), [
  query('companyId').optional().isUUID(),
  query('period').optional().isIn(['month', 'quarter', 'year'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { companyId, period = 'month' } = req.query;
    const userCompanyId = req.user.role === 'admin' ? companyId : req.user.companyId;

    const [
      dashboard,
      financials,
      performance,
      customerSegmentation,
      bookingForecast
    ] = await Promise.all([
      analyticsService.getDashboardOverview(userCompanyId),
      analyticsService.getFinancialAnalytics(userCompanyId, period),
      analyticsService.getPerformanceAnalytics(userCompanyId),
      analyticsService.getCustomerSegmentation(userCompanyId),
      analyticsService.getBookingForecast(userCompanyId, 30)
    ]);

    const report = {
      executiveSummary: {
        totalRevenue: financials.revenue,
        totalBookings: dashboard.totalBookings,
        activeUsers: dashboard.activeUsers,
        profitMargin: financials.profitMargin,
        customerRetentionRate: performance.customerRetentionRate
      },
      keyMetrics: {
        financial: financials,
        performance: performance,
        customer: customerSegmentation,
        forecast: bookingForecast
      },
      insights: {
        revenueGrowth: financials.revenue > 0 ? 'positive' : 'negative',
        bookingTrend: dashboard.totalBookings > 0 ? 'increasing' : 'stable',
        customerHealth: customerSegmentation.highValue.count > customerSegmentation.inactive.count ? 'good' : 'needs_attention'
      },
      recommendations: [
        'Focus on high-value customer retention',
        'Optimize booking success rates',
        'Implement revenue optimization strategies',
        'Enhance customer engagement programs'
      ],
      generatedAt: new Date().toISOString(),
      period,
      companyId: userCompanyId
    };

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Comprehensive report error:', error);
    res.status(500).json({ error: 'Error generating comprehensive report.' });
  }
});

module.exports = router;