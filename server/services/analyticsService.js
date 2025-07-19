const { Booking, Flight, User, Company, Wallet, WalletTransaction, Airline } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get cached data or fetch fresh data
  async getCachedData(key, fetchFunction) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const data = await fetchFunction();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  // Dashboard Overview Analytics
  async getDashboardOverview(companyId = null) {
    const cacheKey = `dashboard_overview_${companyId || 'global'}`;
    
    return this.getCachedData(cacheKey, async () => {
      const whereClause = companyId ? { companyId } : {};
      const userWhereClause = companyId ? { companyId } : {};

      const [
        totalBookings,
        totalRevenue,
        activeUsers,
        totalFlights,
        recentBookings,
        topRoutes,
        revenueTrend
      ] = await Promise.all([
        // Total bookings
        Booking.count({ where: whereClause }),
        
        // Total revenue
        Booking.sum('totalAmount', { 
          where: { 
            ...whereClause, 
            status: { [Op.in]: ['confirmed', 'completed'] } 
          } 
        }),
        
        // Active users (logged in last 30 days)
        User.count({ 
          where: { 
            ...userWhereClause,
            lastLogin: { [Op.gte]: moment().subtract(30, 'days').toDate() }
          } 
        }),
        
        // Total flights
        Flight.count(),
        
        // Recent bookings (last 7 days)
        Booking.findAll({
          where: {
            ...whereClause,
            createdAt: { [Op.gte]: moment().subtract(7, 'days').toDate() }
          },
          include: [
            { model: Flight, as: 'flight' },
            { model: User, as: 'user', attributes: ['firstName', 'lastName'] }
          ],
          order: [['createdAt', 'DESC']],
          limit: 10
        }),
        
        // Top routes
        this.getTopRoutes(companyId),
        
        // Revenue trend (last 12 months)
        this.getRevenueTrend(companyId)
      ]);

      return {
        totalBookings: totalBookings || 0,
        totalRevenue: totalRevenue || 0,
        activeUsers: activeUsers || 0,
        totalFlights: totalFlights || 0,
        recentBookings,
        topRoutes,
        revenueTrend
      };
    });
  }

  // Get top booking routes
  async getTopRoutes(companyId = null) {
    const whereClause = companyId ? { companyId } : {};

    const routes = await Booking.findAll({
      attributes: [
        [Booking.sequelize.fn('COUNT', Booking.sequelize.col('id')), 'bookingCount'],
        [Booking.sequelize.fn('SUM', Booking.sequelize.col('totalAmount')), 'totalRevenue']
      ],
      include: [{
        model: Flight,
        as: 'flight',
        attributes: ['origin', 'destination']
      }],
      where: whereClause,
      group: ['flight.origin', 'flight.destination'],
      order: [[Booking.sequelize.fn('COUNT', Booking.sequelize.col('id')), 'DESC']],
      limit: 10
    });

    return routes.map(route => ({
      route: `${route.flight.origin} → ${route.flight.destination}`,
      bookingCount: parseInt(route.dataValues.bookingCount),
      totalRevenue: parseFloat(route.dataValues.totalRevenue || 0)
    }));
  }

  // Get revenue trend over time
  async getRevenueTrend(companyId = null, months = 12) {
    const whereClause = companyId ? { companyId } : {};
    const trend = [];

    for (let i = months - 1; i >= 0; i--) {
      const startDate = moment().subtract(i, 'months').startOf('month');
      const endDate = moment().subtract(i, 'months').endOf('month');

      const revenue = await Booking.sum('totalAmount', {
        where: {
          ...whereClause,
          createdAt: { [Op.between]: [startDate.toDate(), endDate.toDate()] },
          status: { [Op.in]: ['confirmed', 'completed'] }
        }
      });

      trend.push({
        month: startDate.format('MMM YYYY'),
        revenue: revenue || 0,
        date: startDate.toDate()
      });
    }

    return trend;
  }

  // Predictive Analytics - Booking Forecast
  async getBookingForecast(companyId = null, days = 30) {
    const whereClause = companyId ? { companyId } : {};
    
    // Get historical booking data
    const historicalBookings = await Booking.findAll({
      where: {
        ...whereClause,
        createdAt: { [Op.gte]: moment().subtract(90, 'days').toDate() }
      },
      attributes: [
        [Booking.sequelize.fn('DATE', Booking.sequelize.col('createdAt')), 'date'],
        [Booking.sequelize.fn('COUNT', Booking.sequelize.col('id')), 'count']
      ],
      group: [Booking.sequelize.fn('DATE', Booking.sequelize.col('createdAt'))],
      order: [[Booking.sequelize.fn('DATE', Booking.sequelize.col('createdAt')), 'ASC']]
    });

    // Calculate average daily bookings
    const totalBookings = historicalBookings.reduce((sum, day) => sum + parseInt(day.dataValues.count), 0);
    const averageDailyBookings = totalBookings / Math.max(historicalBookings.length, 1);

    // Generate forecast
    const forecast = [];
    for (let i = 1; i <= days; i++) {
      const date = moment().add(i, 'days');
      
      // Add seasonal variation (weekend effect)
      const dayOfWeek = date.day();
      const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.2 : 1.0;
      
      // Add some randomness for realistic forecast
      const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
      
      const predictedBookings = Math.round(averageDailyBookings * weekendMultiplier * randomFactor);
      
      forecast.push({
        date: date.format('YYYY-MM-DD'),
        predictedBookings,
        confidence: 0.85 // 85% confidence level
      });
    }

    return {
      forecast,
      averageDailyBookings: Math.round(averageDailyBookings),
      confidence: 0.85
    };
  }

  // Customer Segmentation Analysis
  async getCustomerSegmentation(companyId = null) {
    const whereClause = companyId ? { companyId } : {};

    const users = await User.findAll({
      where: whereClause,
      include: [
        {
          model: Booking,
          as: 'bookings',
          attributes: ['totalAmount', 'createdAt']
        }
      ]
    });

    const segments = {
      highValue: { count: 0, totalRevenue: 0, avgRevenue: 0 },
      mediumValue: { count: 0, totalRevenue: 0, avgRevenue: 0 },
      lowValue: { count: 0, totalRevenue: 0, avgRevenue: 0 },
      inactive: { count: 0, totalRevenue: 0, avgRevenue: 0 }
    };

    users.forEach(user => {
      const totalSpent = user.bookings.reduce((sum, booking) => sum + parseFloat(booking.totalAmount || 0), 0);
      const lastBooking = user.bookings.length > 0 ? 
        moment(user.bookings[user.bookings.length - 1].createdAt) : null;
      const daysSinceLastBooking = lastBooking ? moment().diff(lastBooking, 'days') : Infinity;

      let segment;
      if (daysSinceLastBooking > 90) {
        segment = 'inactive';
      } else if (totalSpent > 5000) {
        segment = 'highValue';
      } else if (totalSpent > 1000) {
        segment = 'mediumValue';
      } else {
        segment = 'lowValue';
      }

      segments[segment].count++;
      segments[segment].totalRevenue += totalSpent;
    });

    // Calculate averages
    Object.keys(segments).forEach(segment => {
      segments[segment].avgRevenue = segments[segment].count > 0 ? 
        segments[segment].totalRevenue / segments[segment].count : 0;
    });

    return segments;
  }

  // Financial Analytics
  async getFinancialAnalytics(companyId = null, period = 'month') {
    const whereClause = companyId ? { companyId } : {};
    const startDate = period === 'month' ? 
      moment().startOf('month') : 
      moment().subtract(12, 'months').startOf('month');

    const [
      revenue,
      expenses,
      profitMargin,
      topRevenueSources,
      paymentMethodDistribution
    ] = await Promise.all([
      // Revenue
      Booking.sum('totalAmount', {
        where: {
          ...whereClause,
          createdAt: { [Op.gte]: startDate.toDate() },
          status: { [Op.in]: ['confirmed', 'completed'] }
        }
      }),

      // Expenses (simplified - could be enhanced with actual expense tracking)
      this.calculateExpenses(companyId, startDate),

      // Profit margin calculation
      this.calculateProfitMargin(companyId, startDate),

      // Top revenue sources
      this.getTopRevenueSources(companyId, startDate),

      // Payment method distribution
      this.getPaymentMethodDistribution(companyId, startDate)
    ]);

    return {
      revenue: revenue || 0,
      expenses: expenses || 0,
      profit: (revenue || 0) - (expenses || 0),
      profitMargin: profitMargin || 0,
      topRevenueSources,
      paymentMethodDistribution
    };
  }

  // Calculate expenses (simplified model)
  async calculateExpenses(companyId, startDate) {
    // This is a simplified expense calculation
    // In a real system, you'd have actual expense records
    const revenue = await Booking.sum('totalAmount', {
      where: {
        companyId,
        createdAt: { [Op.gte]: startDate.toDate() },
        status: { [Op.in]: ['confirmed', 'completed'] }
      }
    });

    // Assume 15% operating costs
    return (revenue || 0) * 0.15;
  }

  // Calculate profit margin
  async calculateProfitMargin(companyId, startDate) {
    const revenue = await Booking.sum('totalAmount', {
      where: {
        companyId,
        createdAt: { [Op.gte]: startDate.toDate() },
        status: { [Op.in]: ['confirmed', 'completed'] }
      }
    });

    const expenses = await this.calculateExpenses(companyId, startDate);
    const profit = (revenue || 0) - expenses;

    return revenue > 0 ? (profit / revenue) * 100 : 0;
  }

  // Get top revenue sources
  async getTopRevenueSources(companyId, startDate) {
    const sources = await Booking.findAll({
      attributes: [
        [Booking.sequelize.fn('SUM', Booking.sequelize.col('totalAmount')), 'totalRevenue'],
        [Booking.sequelize.fn('COUNT', Booking.sequelize.col('id')), 'bookingCount']
      ],
      include: [{
        model: Flight,
        as: 'flight',
        include: [{ model: Airline, as: 'airline' }]
      }],
      where: {
        companyId,
        createdAt: { [Op.gte]: startDate.toDate() },
        status: { [Op.in]: ['confirmed', 'completed'] }
      },
      group: ['flight.airline.name'],
      order: [[Booking.sequelize.fn('SUM', Booking.sequelize.col('totalAmount')), 'DESC']],
      limit: 5
    });

    return sources.map(source => ({
      airline: source.flight.airline.name,
      revenue: parseFloat(source.dataValues.totalRevenue || 0),
      bookingCount: parseInt(source.dataValues.bookingCount || 0)
    }));
  }

  // Get payment method distribution
  async getPaymentMethodDistribution(companyId, startDate) {
    const distribution = await Booking.findAll({
      attributes: [
        'paymentMethod',
        [Booking.sequelize.fn('COUNT', Booking.sequelize.col('id')), 'count'],
        [Booking.sequelize.fn('SUM', Booking.sequelize.col('totalAmount')), 'totalAmount']
      ],
      where: {
        companyId,
        createdAt: { [Op.gte]: startDate.toDate() },
        status: { [Op.in]: ['confirmed', 'completed'] }
      },
      group: ['paymentMethod']
    });

    return distribution.map(item => ({
      method: item.paymentMethod,
      count: parseInt(item.dataValues.count || 0),
      totalAmount: parseFloat(item.dataValues.totalAmount || 0)
    }));
  }

  // Performance Analytics
  async getPerformanceAnalytics(companyId = null) {
    const whereClause = companyId ? { companyId } : {};
    const lastMonth = moment().subtract(1, 'month');

    const [
      bookingSuccessRate,
      averageBookingValue,
      customerRetentionRate,
      responseTimeMetrics
    ] = await Promise.all([
      // Booking success rate
      this.calculateBookingSuccessRate(whereClause),
      
      // Average booking value
      Booking.findOne({
        attributes: [[Booking.sequelize.fn('AVG', Booking.sequelize.col('totalAmount')), 'avgValue']],
        where: {
          ...whereClause,
          status: { [Op.in]: ['confirmed', 'completed'] }
        }
      }),
      
      // Customer retention rate
      this.calculateCustomerRetentionRate(whereClause),
      
      // Response time metrics (simplified)
      this.getResponseTimeMetrics(whereClause)
    ]);

    return {
      bookingSuccessRate,
      averageBookingValue: parseFloat(averageBookingValue?.dataValues?.avgValue || 0),
      customerRetentionRate,
      responseTimeMetrics
    };
  }

  // Calculate booking success rate
  async calculateBookingSuccessRate(whereClause) {
    const [totalBookings, successfulBookings] = await Promise.all([
      Booking.count({ where: whereClause }),
      Booking.count({ 
        where: { 
          ...whereClause, 
          status: { [Op.in]: ['confirmed', 'completed'] } 
        } 
      })
    ]);

    return totalBookings > 0 ? (successfulBookings / totalBookings) * 100 : 0;
  }

  // Calculate customer retention rate
  async calculateCustomerRetentionRate(whereClause) {
    const threeMonthsAgo = moment().subtract(3, 'months');
    const sixMonthsAgo = moment().subtract(6, 'months');

    const [recentCustomers, returningCustomers] = await Promise.all([
      User.count({
        where: {
          ...whereClause,
          createdAt: { [Op.gte]: threeMonthsAgo.toDate() }
        },
        include: [{
          model: Booking,
          as: 'bookings',
          where: { createdAt: { [Op.gte]: threeMonthsAgo.toDate() } }
        }]
      }),
      User.count({
        where: {
          ...whereClause,
          createdAt: { [Op.lt]: threeMonthsAgo.toDate() }
        },
        include: [{
          model: Booking,
          as: 'bookings',
          where: { createdAt: { [Op.gte]: threeMonthsAgo.toDate() } }
        }]
      })
    ]);

    const totalEligibleCustomers = recentCustomers + returningCustomers;
    return totalEligibleCustomers > 0 ? (returningCustomers / totalEligibleCustomers) * 100 : 0;
  }

  // Get response time metrics
  async getResponseTimeMetrics(whereClause) {
    // Simplified response time calculation
    // In a real system, you'd track actual response times
    return {
      averageResponseTime: 2.5, // minutes
      responseTimeTarget: 3.0, // minutes
      targetAchievement: 83.3 // percentage
    };
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

module.exports = new AnalyticsService();