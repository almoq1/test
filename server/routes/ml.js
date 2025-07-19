const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const mlService = require('../services/mlService');
const automationService = require('../services/automationService');

// ML Model Management
router.get('/models/status', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const modelStatus = await mlService.getModelPerformance();
    const automationStatus = await automationService.getAutomationStatus();
    
    res.json({
      mlService: {
        isInitialized: mlService.isInitialized,
        models: modelStatus
      },
      automationService: automationStatus
    });
  } catch (error) {
    console.error('ML status error:', error);
    res.status(500).json({ error: 'Failed to get ML status' });
  }
});

router.post('/models/train', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { modelType } = req.body;
    
    if (modelType) {
      // Train specific model
      switch (modelType) {
        case 'pricePrediction':
          await mlService.trainPricePredictionModel();
          break;
        case 'demandForecast':
          await mlService.trainDemandForecastModel();
          break;
        case 'churnPrediction':
          await mlService.trainChurnPredictionModel();
          break;
        case 'fraudDetection':
          await mlService.trainFraudDetectionModel();
          break;
        case 'recommendation':
          await mlService.trainRecommendationModel();
          break;
        default:
          return res.status(400).json({ error: 'Invalid model type' });
      }
    } else {
      // Train all models
      await mlService.trainModels();
    }
    
    res.json({ message: 'Model training completed successfully' });
  } catch (error) {
    console.error('Model training error:', error);
    res.status(500).json({ error: 'Failed to train models' });
  }
});

// Price Prediction
router.post('/predict/price', authenticateToken, async (req, res) => {
  try {
    const { flightData } = req.body;
    
    if (!flightData) {
      return res.status(400).json({ error: 'Flight data is required' });
    }
    
    const predictedPrice = await mlService.predictPrice(flightData);
    
    res.json({
      predictedPrice,
      originalPrice: flightData.price,
      difference: predictedPrice - flightData.price,
      confidence: 0.85 // Mock confidence score
    });
  } catch (error) {
    console.error('Price prediction error:', error);
    res.status(500).json({ error: 'Failed to predict price' });
  }
});

// Demand Forecasting
router.post('/predict/demand', authenticateToken, requireRole(['admin', 'company_admin']), async (req, res) => {
  try {
    const { route, date } = req.body;
    
    if (!route || !date) {
      return res.status(400).json({ error: 'Route and date are required' });
    }
    
    const predictedDemand = await mlService.predictDemand(route, new Date(date));
    
    res.json({
      route,
      date,
      predictedDemand,
      confidence: 0.78 // Mock confidence score
    });
  } catch (error) {
    console.error('Demand prediction error:', error);
    res.status(500).json({ error: 'Failed to predict demand' });
  }
});

// Churn Prediction
router.get('/predict/churn/:userId', authenticateToken, requireRole(['admin', 'company_admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    
    const churnPrediction = await mlService.predictChurn(userId);
    
    res.json(churnPrediction);
  } catch (error) {
    console.error('Churn prediction error:', error);
    res.status(500).json({ error: 'Failed to predict churn' });
  }
});

// Fraud Detection
router.post('/detect/fraud', authenticateToken, async (req, res) => {
  try {
    const { bookingData, userData } = req.body;
    
    if (!bookingData || !userData) {
      return res.status(400).json({ error: 'Booking data and user data are required' });
    }
    
    const fraudAssessment = await mlService.detectFraud(bookingData, userData);
    
    res.json(fraudAssessment);
  } catch (error) {
    console.error('Fraud detection error:', error);
    res.status(500).json({ error: 'Failed to detect fraud' });
  }
});

// Personalized Recommendations
router.get('/recommendations/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { context } = req.query;
    
    const recommendations = await mlService.getRecommendations(userId, context ? JSON.parse(context) : {});
    
    res.json({
      userId,
      recommendations,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Automation Management
router.get('/automation/status', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const status = await automationService.getAutomationStatus();
    res.json(status);
  } catch (error) {
    console.error('Automation status error:', error);
    res.status(500).json({ error: 'Failed to get automation status' });
  }
});

router.post('/automation/trigger', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { workflowType } = req.body;
    
    switch (workflowType) {
      case 'daily':
        await automationService.runDailyAutomations();
        break;
      case 'hourly':
        await automationService.runHourlyAutomations();
        break;
      case 'realtime':
        await automationService.runRealTimeAutomations();
        break;
      default:
        return res.status(400).json({ error: 'Invalid workflow type' });
    }
    
    res.json({ message: `${workflowType} automation triggered successfully` });
  } catch (error) {
    console.error('Automation trigger error:', error);
    res.status(500).json({ error: 'Failed to trigger automation' });
  }
});

// Dynamic Pricing
router.post('/pricing/dynamic', authenticateToken, requireRole(['admin', 'company_admin']), async (req, res) => {
  try {
    const { flightId } = req.body;
    
    if (!flightId) {
      return res.status(400).json({ error: 'Flight ID is required' });
    }
    
    // Trigger dynamic pricing for specific flight
    await automationService.processDynamicPricing();
    
    res.json({ message: 'Dynamic pricing processed successfully' });
  } catch (error) {
    console.error('Dynamic pricing error:', error);
    res.status(500).json({ error: 'Failed to process dynamic pricing' });
  }
});

// Flash Sales
router.post('/pricing/flash-sales', authenticateToken, requireRole(['admin', 'company_admin']), async (req, res) => {
  try {
    const { flightId } = req.body;
    
    if (!flightId) {
      return res.status(400).json({ error: 'Flight ID is required' });
    }
    
    // Trigger flash sales for specific flight
    await automationService.processFlashSales();
    
    res.json({ message: 'Flash sales processed successfully' });
  } catch (error) {
    console.error('Flash sales error:', error);
    res.status(500).json({ error: 'Failed to process flash sales' });
  }
});

// Customer Insights
router.get('/insights/customer/:userId', authenticateToken, requireRole(['admin', 'company_admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [churnPrediction, recommendations] = await Promise.all([
      mlService.predictChurn(userId),
      mlService.getRecommendations(userId)
    ]);
    
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Booking,
          as: 'bookings',
          include: [{ model: Flight, as: 'flight' }]
        }
      ]
    });
    
    const insights = {
      userId,
      churnPrediction,
      recommendations,
      userProfile: {
        totalBookings: user.bookings.length,
        totalSpent: user.bookings.reduce((sum, b) => sum + b.totalAmount, 0),
        averageBookingValue: user.bookings.length > 0 ? 
          user.bookings.reduce((sum, b) => sum + b.totalAmount, 0) / user.bookings.length : 0,
        preferredRoutes: this.getPreferredRoutes(user.bookings),
        bookingFrequency: this.calculateBookingFrequency(user.bookings),
        lastActivity: user.bookings.length > 0 ? 
          user.bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt : null
      },
      generatedAt: new Date()
    };
    
    res.json(insights);
  } catch (error) {
    console.error('Customer insights error:', error);
    res.status(500).json({ error: 'Failed to get customer insights' });
  }
});

// Route Insights
router.get('/insights/route/:origin/:destination', authenticateToken, requireRole(['admin', 'company_admin']), async (req, res) => {
  try {
    const { origin, destination } = req.params;
    const { date } = req.query;
    
    const route = `${origin}-${destination}`;
    const targetDate = date ? new Date(date) : new Date();
    
    const [predictedDemand, historicalData] = await Promise.all([
      mlService.predictDemand(route, targetDate),
      this.getRouteHistoricalData(route)
    ]);
    
    const insights = {
      route,
      date: targetDate,
      predictedDemand,
      historicalData,
      recommendations: this.getRouteRecommendations(predictedDemand, historicalData),
      generatedAt: new Date()
    };
    
    res.json(insights);
  } catch (error) {
    console.error('Route insights error:', error);
    res.status(500).json({ error: 'Failed to get route insights' });
  }
});

// Performance Monitoring
router.get('/performance/metrics', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [systemMetrics, businessMetrics] = await Promise.all([
      automationService.getSystemPerformanceMetrics(),
      this.getBusinessMetrics()
    ]);
    
    res.json({
      system: systemMetrics,
      business: businessMetrics,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Performance metrics error:', error);
    res.status(500).json({ error: 'Failed to get performance metrics' });
  }
});

// Model Performance Analytics
router.get('/analytics/model-performance', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const modelPerformance = await mlService.getModelPerformance();
    
    const analytics = {
      models: modelPerformance,
      summary: {
        averageAccuracy: Object.values(modelPerformance).reduce((sum, model) => sum + model.accuracy, 0) / Object.keys(modelPerformance).length,
        bestPerformingModel: Object.entries(modelPerformance).reduce((best, [name, model]) => 
          model.accuracy > best.accuracy ? { name, ...model } : best
        ),
        modelsNeedingRetraining: Object.entries(modelPerformance).filter(([name, model]) => 
          moment().diff(moment(model.lastTrained), 'days') > 30
        ).map(([name]) => name)
      },
      generatedAt: new Date()
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Model performance analytics error:', error);
    res.status(500).json({ error: 'Failed to get model performance analytics' });
  }
});

// Helper methods
getPreferredRoutes(bookings) {
  const routeCount = {};
  bookings.forEach(booking => {
    const route = `${booking.flight.origin}-${booking.flight.destination}`;
    routeCount[route] = (routeCount[route] || 0) + 1;
  });
  return Object.entries(routeCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([route]) => route);
}

calculateBookingFrequency(bookings) {
  if (bookings.length < 2) return 0;
  const firstBooking = bookings[0].createdAt;
  const lastBooking = bookings[bookings.length - 1].createdAt;
  const daysDiff = moment(lastBooking).diff(moment(firstBooking), 'days');
  return bookings.length / Math.max(daysDiff / 30, 1); // Bookings per month
}

async getRouteHistoricalData(route) {
  // Simplified historical data
  return {
    last30Days: [10, 15, 12, 18, 20, 16, 14, 22, 19, 25, 28, 30, 27, 24, 26, 29, 31, 33, 35, 32, 30, 28, 26, 24, 22, 20, 18, 16, 14, 12],
    last7Days: [28, 30, 27, 24, 26, 29, 31],
    average: 22.5,
    trend: 'increasing'
  };
}

getRouteRecommendations(predictedDemand, historicalData) {
  const recommendations = [];
  
  if (predictedDemand > 80) {
    recommendations.push('Consider increasing capacity');
    recommendations.push('Implement dynamic pricing');
  } else if (predictedDemand < 30) {
    recommendations.push('Consider promotional pricing');
    recommendations.push('Target marketing campaigns');
  }
  
  if (historicalData.trend === 'increasing') {
    recommendations.push('Monitor for capacity constraints');
  }
  
  return recommendations;
}

async getBusinessMetrics() {
  // Simplified business metrics
  return {
    totalBookings: 1250,
    totalRevenue: 450000,
    averageBookingValue: 360,
    conversionRate: 0.15,
    customerSatisfaction: 0.92
  };
}

module.exports = router;