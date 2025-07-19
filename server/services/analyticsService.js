const { Booking, Flight, User, Company, Wallet, WalletTransaction } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Real-time dashboard analytics
  async getDashboardAnalytics(companyId = null, dateRange = '30d') {
    const cacheKey = `dashboard_${companyId}_${dateRange}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    const { startDate, endDate } = this.getDateRange(dateRange);
    const whereClause = companyId ? { companyId } : {};

    const [
      totalBookings,
      totalRevenue,
      activeUsers,
      walletBalance,
      topRoutes,
      bookingTrends,
      revenueTrends,
      userActivity
    ] = await Promise.all([
      this.getTotalBookings(whereClause, startDate, endDate),
      this.getTotalRevenue(whereClause, startDate, endDate),
      this.getActiveUsers(whereClause, startDate, endDate),
      this.getTotalWalletBalance(whereClause),
      this.getTopRoutes(whereClause, startDate, endDate),
      this.getBookingTrends(whereClause, startDate, endDate),
      this.getRevenueTrends(whereClause, startDate, endDate),
      this.getUserActivity(whereClause, startDate, endDate)
    ]);

    const analytics = {
      overview: {
        totalBookings,
        totalRevenue,
        activeUsers,
        walletBalance,
        averageBookingValue: totalRevenue / totalBookings,
        conversionRate: this.calculateConversionRate(whereClause, startDate, endDate)
      },
      trends: {
        bookings: bookingTrends,
        revenue: revenueTrends,
        userActivity
      },
      insights: {
        topRoutes,
        topAirlines: await this.getTopAirlines(whereClause, startDate, endDate),
        peakBookingTimes: await this.getPeakBookingTimes(whereClause, startDate, endDate),
        customerSegments: await this.getCustomerSegments(whereClause, startDate, endDate)
      },
      performance: {
        loadTimes: await this.getSystemPerformance(),
        errorRates: await this.getErrorRates(startDate, endDate),
        apiUsage: await this.getAPIUsage(startDate, endDate)
      }
    };

    this.setCache(cacheKey, analytics);
    return analytics;
  }

  // Predictive analytics
  async getPredictiveAnalytics(companyId = null) {
    const predictions = {
      revenue: await this.predictRevenue(companyId),
      bookings: await this.predictBookings(companyId),
      demand: await this.predictDemand(companyId),
      churn: await this.predictChurn(companyId),
      opportunities: await this.identifyOpportunities(companyId)
    };

    return predictions;
  }

  // Customer segmentation and behavior analysis
  async getCustomerAnalytics(companyId = null) {
    const customers = await User.findAll({
      where: companyId ? { companyId } : {},
      include: [
        {
          model: Booking,
          as: 'bookings',
          include: [{ model: Flight, as: 'flight' }]
        },
        {
          model: Wallet,
          as: 'wallet'
        }
      ]
    });

    const segments = this.segmentCustomers(customers);
    const behavior = this.analyzeCustomerBehavior(customers);
    const lifetimeValue = this.calculateCustomerLifetimeValue(customers);

    return {
      segments,
      behavior,
      lifetimeValue,
      retention: await this.calculateRetentionRate(companyId),
      satisfaction: await this.calculateSatisfactionScore(companyId)
    };
  }

  // Financial analytics
  async getFinancialAnalytics(companyId = null, dateRange = '12m') {
    const { startDate, endDate } = this.getDateRange(dateRange);
    const whereClause = companyId ? { companyId } : {};

    const [
      revenue,
      expenses,
      profit,
      cashFlow,
      walletTransactions
    ] = await Promise.all([
      this.getRevenueBreakdown(whereClause, startDate, endDate),
      this.getExpenseBreakdown(whereClause, startDate, endDate),
      this.getProfitAnalysis(whereClause, startDate, endDate),
      this.getCashFlowAnalysis(whereClause, startDate, endDate),
      this.getWalletTransactionAnalysis(whereClause, startDate, endDate)
    ]);

    return {
      revenue,
      expenses,
      profit,
      cashFlow,
      walletTransactions,
      metrics: {
        grossMargin: (profit.gross / revenue.total) * 100,
        netMargin: (profit.net / revenue.total) * 100,
        cashFlowRatio: cashFlow.operating / cashFlow.investing,
        walletUtilization: walletTransactions.utilization
      }
    };
  }

  // Operational analytics
  async getOperationalAnalytics(companyId = null) {
    const operations = {
      bookingEfficiency: await this.getBookingEfficiency(companyId),
      systemPerformance: await this.getSystemPerformance(),
      customerSupport: await this.getCustomerSupportMetrics(companyId),
      fraudMetrics: await this.getFraudMetrics(companyId),
      compliance: await this.getComplianceMetrics(companyId)
    };

    return operations;
  }

  // Helper methods
  async getTotalBookings(whereClause, startDate, endDate) {
    return await Booking.count({
      where: {
        ...whereClause,
        createdAt: { [Op.between]: [startDate, endDate] }
      }
    });
  }

  async getTotalRevenue(whereClause, startDate, endDate) {
    const result = await Booking.sum('totalAmount', {
      where: {
        ...whereClause,
        createdAt: { [Op.between]: [startDate, endDate] },
        status: 'confirmed'
      }
    });
    return result || 0;
  }

  async getActiveUsers(whereClause, startDate, endDate) {
    return await User.count({
      where: {
        ...whereClause,
        lastLogin: { [Op.between]: [startDate, endDate] }
      }
    });
  }

  async getTotalWalletBalance(whereClause) {
    const result = await Wallet.sum('balance', {
      include: [{
        model: User,
        as: 'user',
        where: whereClause
      }]
    });
    return result || 0;
  }

  async getTopRoutes(whereClause, startDate, endDate) {
    const routes = await Booking.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'bookingCount'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalRevenue']
      ],
      include: [{
        model: Flight,
        as: 'flight',
        attributes: ['origin', 'destination']
      }],
      where: {
        ...whereClause,
        createdAt: { [Op.between]: [startDate, endDate] }
      },
      group: ['flight.origin', 'flight.destination'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10
    });

    return routes.map(route => ({
      route: `${route.flight.origin}-${route.flight.destination}`,
      bookings: route.dataValues.bookingCount,
      revenue: route.dataValues.totalRevenue
    }));
  }

  async getBookingTrends(whereClause, startDate, endDate) {
    const trends = await Booking.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'bookings'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue']
      ],
      where: {
        ...whereClause,
        createdAt: { [Op.between]: [startDate, endDate] }
      },
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
    });

    return trends.map(trend => ({
      date: trend.dataValues.date,
      bookings: trend.dataValues.bookings,
      revenue: trend.dataValues.revenue
    }));
  }

  async getRevenueTrends(whereClause, startDate, endDate) {
    return await this.getBookingTrends(whereClause, startDate, endDate);
  }

  async getUserActivity(whereClause, startDate, endDate) {
    const activity = await User.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('lastLogin')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'activeUsers']
      ],
      where: {
        ...whereClause,
        lastLogin: { [Op.between]: [startDate, endDate] }
      },
      group: [sequelize.fn('DATE', sequelize.col('lastLogin'))],
      order: [[sequelize.fn('DATE', sequelize.col('lastLogin')), 'ASC']]
    });

    return activity.map(day => ({
      date: day.dataValues.date,
      activeUsers: day.dataValues.activeUsers
    }));
  }

  async getTopAirlines(whereClause, startDate, endDate) {
    const airlines = await Booking.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'bookingCount'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalRevenue']
      ],
      include: [{
        model: Flight,
        as: 'flight',
        include: [{
          model: Airline,
          as: 'airline',
          attributes: ['name']
        }]
      }],
      where: {
        ...whereClause,
        createdAt: { [Op.between]: [startDate, endDate] }
      },
      group: ['flight.airline.name'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10
    });

    return airlines.map(airline => ({
      airline: airline.flight.airline.name,
      bookings: airline.dataValues.bookingCount,
      revenue: airline.dataValues.totalRevenue
    }));
  }

  async getPeakBookingTimes(whereClause, startDate, endDate) {
    const peakTimes = await Booking.findAll({
      attributes: [
        [sequelize.fn('HOUR', sequelize.col('createdAt')), 'hour'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'bookings']
      ],
      where: {
        ...whereClause,
        createdAt: { [Op.between]: [startDate, endDate] }
      },
      group: [sequelize.fn('HOUR', sequelize.col('createdAt'))],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
    });

    return peakTimes.map(time => ({
      hour: time.dataValues.hour,
      bookings: time.dataValues.bookings
    }));
  }

  segmentCustomers(customers) {
    const segments = {
      highValue: [],
      frequent: [],
      occasional: [],
      inactive: []
    };

    customers.forEach(customer => {
      const totalSpent = customer.bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
      const bookingCount = customer.bookings.length;
      const lastBooking = customer.bookings.length > 0 ? 
        Math.max(...customer.bookings.map(b => new Date(b.createdAt))) : null;

      if (totalSpent > 10000 && bookingCount > 10) {
        segments.highValue.push(customer);
      } else if (bookingCount > 5) {
        segments.frequent.push(customer);
      } else if (bookingCount > 0) {
        segments.occasional.push(customer);
      } else {
        segments.inactive.push(customer);
      }
    });

    return segments;
  }

  analyzeCustomerBehavior(customers) {
    const behavior = {
      averageBookingValue: 0,
      averageBookingsPerCustomer: 0,
      preferredCabinClass: {},
      preferredAirlines: {},
      bookingLeadTime: 0
    };

    let totalBookings = 0;
    let totalValue = 0;
    let totalLeadTime = 0;

    customers.forEach(customer => {
      customer.bookings.forEach(booking => {
        totalBookings++;
        totalValue += booking.totalAmount;
        
        // Cabin class preference
        behavior.preferredCabinClass[booking.cabinClass] = 
          (behavior.preferredCabinClass[booking.cabinClass] || 0) + 1;

        // Lead time calculation
        const leadTime = moment(booking.travelDate).diff(moment(booking.createdAt), 'days');
        totalLeadTime += leadTime;
      });
    });

    behavior.averageBookingValue = totalValue / totalBookings;
    behavior.averageBookingsPerCustomer = totalBookings / customers.length;
    behavior.bookingLeadTime = totalLeadTime / totalBookings;

    return behavior;
  }

  calculateCustomerLifetimeValue(customers) {
    const ltv = customers.map(customer => {
      const totalSpent = customer.bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
      const avgOrderValue = totalSpent / customer.bookings.length;
      const purchaseFrequency = customer.bookings.length / 12; // per year
      const customerLifespan = 5; // years

      return {
        customerId: customer.id,
        ltv: avgOrderValue * purchaseFrequency * customerLifespan,
        totalSpent,
        avgOrderValue,
        purchaseFrequency
      };
    });

    return ltv.sort((a, b) => b.ltv - a.ltv);
  }

  getDateRange(range) {
    const endDate = new Date();
    let startDate;

    switch (range) {
      case '7d':
        startDate = moment().subtract(7, 'days').toDate();
        break;
      case '30d':
        startDate = moment().subtract(30, 'days').toDate();
        break;
      case '90d':
        startDate = moment().subtract(90, 'days').toDate();
        break;
      case '12m':
        startDate = moment().subtract(12, 'months').toDate();
        break;
      default:
        startDate = moment().subtract(30, 'days').toDate();
    }

    return { startDate, endDate };
  }

  calculateConversionRate(whereClause, startDate, endDate) {
    // Implementation for conversion rate calculation
    return 0.15; // Placeholder
  }

  isCacheValid(key) {
    const cached = this.cache.get(key);
    return cached && (Date.now() - cached.timestamp) < this.cacheTimeout;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Predictive methods (placeholders for ML implementation)
  async predictRevenue(companyId) {
    // Implement ML-based revenue prediction
    return {
      nextMonth: 50000,
      nextQuarter: 150000,
      confidence: 0.85
    };
  }

  async predictBookings(companyId) {
    // Implement ML-based booking prediction
    return {
      nextMonth: 150,
      nextQuarter: 450,
      confidence: 0.80
    };
  }

  async predictDemand(companyId) {
    // Implement demand prediction
    return {
      peakRoutes: ['JFK-LAX', 'LHR-CDG'],
      seasonalTrends: ['Summer peak', 'Holiday surge'],
      confidence: 0.75
    };
  }

  async predictChurn(companyId) {
    // Implement churn prediction
    return {
      riskCustomers: ['user1', 'user2'],
      churnProbability: 0.12,
      recommendations: ['Engage inactive users', 'Offer loyalty rewards']
    };
  }

  async identifyOpportunities(companyId) {
    // Implement opportunity identification
    return {
      upselling: ['Premium upgrades', 'Additional services'],
      crossSelling: ['Hotel bookings', 'Car rentals'],
      newMarkets: ['Asia Pacific', 'Middle East']
    };
  }
}

module.exports = new AnalyticsService();