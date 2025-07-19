const { Company, User, Booking, Flight, Wallet, Transaction } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
const crypto = require('crypto');

class EnterpriseService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Multi-tenant management
  async createCompany(companyData) {
    try {
      const company = await Company.create({
        ...companyData,
        apiKey: this.generateApiKey(),
        settings: {
          bookingLimits: {
            daily: 1000,
            monthly: 25000,
            yearly: 300000
          },
          paymentSettings: {
            autoRecharge: false,
            rechargeThreshold: 1000,
            rechargeAmount: 5000
          },
          notificationSettings: {
            email: true,
            sms: false,
            push: true
          },
          integrationSettings: {
            erp: false,
            crm: false,
            accounting: false
          }
        }
      });

      return {
        success: true,
        data: company,
        message: 'Company created successfully'
      };
    } catch (error) {
      console.error('Enterprise Service - Create Company Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateCompany(companyId, updateData) {
    try {
      const company = await Company.findByPk(companyId);
      if (!company) {
        return {
          success: false,
          error: 'Company not found'
        };
      }

      await company.update(updateData);
      
      // Clear cache
      this.cache.delete(`company_${companyId}`);

      return {
        success: true,
        data: company,
        message: 'Company updated successfully'
      };
    } catch (error) {
      console.error('Enterprise Service - Update Company Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getCompanyDetails(companyId) {
    try {
      const cacheKey = `company_${companyId}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const company = await Company.findByPk(companyId, {
        include: [
          {
            model: User,
            as: 'users',
            attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'status']
          }
        ]
      });

      if (!company) {
        return {
          success: false,
          error: 'Company not found'
        };
      }

      const result = {
        success: true,
        data: company
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('Enterprise Service - Get Company Details Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Enterprise analytics and reporting
  async getEnterpriseAnalytics(companyId, dateRange = 'month') {
    try {
      const startDate = this.getDateRange(dateRange);
      const endDate = moment().endOf('day');

      const [
        totalBookings,
        totalRevenue,
        userStats,
        bookingTrends,
        topRoutes,
        walletStats
      ] = await Promise.all([
        this.getBookingStats(companyId, startDate, endDate),
        this.getRevenueStats(companyId, startDate, endDate),
        this.getUserStats(companyId, startDate, endDate),
        this.getBookingTrends(companyId, startDate, endDate),
        this.getTopRoutes(companyId, startDate, endDate),
        this.getWalletStats(companyId, startDate, endDate)
      ]);

      return {
        success: true,
        data: {
          overview: {
            totalBookings: totalBookings.total,
            totalRevenue: totalRevenue.total,
            activeUsers: userStats.activeUsers,
            averageBookingValue: totalRevenue.total / totalBookings.total || 0
          },
          trends: bookingTrends,
          topRoutes,
          walletStats,
          userStats
        }
      };
    } catch (error) {
      console.error('Enterprise Service - Get Analytics Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getBookingStats(companyId, startDate, endDate) {
    const bookings = await Booking.findAll({
      where: {
        companyId,
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalAmount']
      ],
      group: ['status']
    });

    const total = bookings.reduce((sum, booking) => sum + parseInt(booking.dataValues.count), 0);
    const totalAmount = bookings.reduce((sum, booking) => sum + parseFloat(booking.dataValues.totalAmount || 0), 0);

    return {
      total,
      totalAmount,
      byStatus: bookings.map(booking => ({
        status: booking.status,
        count: parseInt(booking.dataValues.count),
        amount: parseFloat(booking.dataValues.totalAmount || 0)
      }))
    };
  }

  async getRevenueStats(companyId, startDate, endDate) {
    const transactions = await Transaction.findAll({
      where: {
        companyId,
        type: 'booking',
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
        [sequelize.fn('AVG', sequelize.col('amount')), 'average'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ]
    });

    const result = transactions[0];
    return {
      total: parseFloat(result.dataValues.total || 0),
      average: parseFloat(result.dataValues.average || 0),
      count: parseInt(result.dataValues.count || 0)
    };
  }

  async getUserStats(companyId, startDate, endDate) {
    const users = await User.findAll({
      where: {
        companyId,
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    const totalUsers = users.reduce((sum, user) => sum + parseInt(user.dataValues.count), 0);
    const activeUsers = users.find(user => user.status === 'active')?.dataValues.count || 0;

    return {
      totalUsers,
      activeUsers: parseInt(activeUsers),
      byStatus: users.map(user => ({
        status: user.status,
        count: parseInt(user.dataValues.count)
      }))
    };
  }

  async getBookingTrends(companyId, startDate, endDate) {
    const bookings = await Booking.findAll({
      where: {
        companyId,
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'amount']
      ],
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
    });

    return bookings.map(booking => ({
      date: booking.dataValues.date,
      count: parseInt(booking.dataValues.count),
      amount: parseFloat(booking.dataValues.amount || 0)
    }));
  }

  async getTopRoutes(companyId, startDate, endDate) {
    const routes = await Booking.findAll({
      where: {
        companyId,
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [{
        model: Flight,
        attributes: ['origin', 'destination']
      }],
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'amount']
      ],
      group: ['Flight.origin', 'Flight.destination'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10
    });

    return routes.map(route => ({
      route: `${route.Flight.origin} → ${route.Flight.destination}`,
      count: parseInt(route.dataValues.count),
      amount: parseFloat(route.dataValues.amount || 0)
    }));
  }

  async getWalletStats(companyId, startDate, endDate) {
    const wallet = await Wallet.findOne({
      where: { companyId }
    });

    const transactions = await Transaction.findAll({
      where: {
        walletId: wallet.id,
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        'type',
        [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['type']
    });

    return {
      currentBalance: wallet.balance,
      transactions: transactions.map(tx => ({
        type: tx.type,
        total: parseFloat(tx.dataValues.total || 0),
        count: parseInt(tx.dataValues.count || 0)
      }))
    };
  }

  // Enterprise integrations
  async setupERPIntegration(companyId, erpConfig) {
    try {
      const company = await Company.findByPk(companyId);
      if (!company) {
        return {
          success: false,
          error: 'Company not found'
        };
      }

      // Validate ERP configuration
      const validation = this.validateERPConfig(erpConfig);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Update company settings
      const settings = company.settings || {};
      settings.integrationSettings = {
        ...settings.integrationSettings,
        erp: {
          enabled: true,
          config: erpConfig,
          lastSync: null,
          status: 'connected'
        }
      };

      await company.update({ settings });

      return {
        success: true,
        message: 'ERP integration setup successfully',
        data: {
          status: 'connected',
          lastSync: null
        }
      };
    } catch (error) {
      console.error('Enterprise Service - ERP Integration Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async setupCRMIntegration(companyId, crmConfig) {
    try {
      const company = await Company.findByPk(companyId);
      if (!company) {
        return {
          success: false,
          error: 'Company not found'
        };
      }

      // Validate CRM configuration
      const validation = this.validateCRMConfig(crmConfig);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Update company settings
      const settings = company.settings || {};
      settings.integrationSettings = {
        ...settings.integrationSettings,
        crm: {
          enabled: true,
          config: crmConfig,
          lastSync: null,
          status: 'connected'
        }
      };

      await company.update({ settings });

      return {
        success: true,
        message: 'CRM integration setup successfully',
        data: {
          status: 'connected',
          lastSync: null
        }
      };
    } catch (error) {
      console.error('Enterprise Service - CRM Integration Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async setupAccountingIntegration(companyId, accountingConfig) {
    try {
      const company = await Company.findByPk(companyId);
      if (!company) {
        return {
          success: false,
          error: 'Company not found'
        };
      }

      // Validate accounting configuration
      const validation = this.validateAccountingConfig(accountingConfig);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Update company settings
      const settings = company.settings || {};
      settings.integrationSettings = {
        ...settings.integrationSettings,
        accounting: {
          enabled: true,
          config: accountingConfig,
          lastSync: null,
          status: 'connected'
        }
      };

      await company.update({ settings });

      return {
        success: true,
        message: 'Accounting integration setup successfully',
        data: {
          status: 'connected',
          lastSync: null
        }
      };
    } catch (error) {
      console.error('Enterprise Service - Accounting Integration Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Bulk operations
  async bulkUserImport(companyId, usersData) {
    try {
      const company = await Company.findByPk(companyId);
      if (!company) {
        return {
          success: false,
          error: 'Company not found'
        };
      }

      const results = [];
      const errors = [];

      for (const userData of usersData) {
        try {
          const user = await User.create({
            ...userData,
            companyId,
            password: this.hashPassword(userData.password || 'default123'),
            status: 'active'
          });

          results.push({
            email: userData.email,
            status: 'created',
            userId: user.id
          });
        } catch (error) {
          errors.push({
            email: userData.email,
            error: error.message
          });
        }
      }

      return {
        success: true,
        data: {
          created: results.length,
          failed: errors.length,
          results,
          errors
        },
        message: `Bulk import completed. ${results.length} users created, ${errors.length} failed.`
      };
    } catch (error) {
      console.error('Enterprise Service - Bulk User Import Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async bulkBookingExport(companyId, filters = {}) {
    try {
      const whereClause = {
        companyId,
        ...filters
      };

      const bookings = await Booking.findAll({
        where: whereClause,
        include: [
          {
            model: Flight,
            attributes: ['flightNumber', 'origin', 'destination', 'departureTime', 'arrivalTime']
          },
          {
            model: User,
            attributes: ['firstName', 'lastName', 'email']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      const exportData = bookings.map(booking => ({
        bookingId: booking.id,
        flightNumber: booking.Flight.flightNumber,
        route: `${booking.Flight.origin} → ${booking.Flight.destination}`,
        departureTime: booking.Flight.departureTime,
        arrivalTime: booking.Flight.arrivalTime,
        passengerName: `${booking.User.firstName} ${booking.User.lastName}`,
        passengerEmail: booking.User.email,
        totalAmount: booking.totalAmount,
        status: booking.status,
        createdAt: booking.createdAt
      }));

      return {
        success: true,
        data: exportData,
        message: `Exported ${exportData.length} bookings`
      };
    } catch (error) {
      console.error('Enterprise Service - Bulk Booking Export Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Advanced business features
  async setBookingLimits(companyId, limits) {
    try {
      const company = await Company.findByPk(companyId);
      if (!company) {
        return {
          success: false,
          error: 'Company not found'
        };
      }

      const settings = company.settings || {};
      settings.bookingLimits = {
        ...settings.bookingLimits,
        ...limits
      };

      await company.update({ settings });

      return {
        success: true,
        message: 'Booking limits updated successfully',
        data: settings.bookingLimits
      };
    } catch (error) {
      console.error('Enterprise Service - Set Booking Limits Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async setPaymentSettings(companyId, paymentSettings) {
    try {
      const company = await Company.findByPk(companyId);
      if (!company) {
        return {
          success: false,
          error: 'Company not found'
        };
      }

      const settings = company.settings || {};
      settings.paymentSettings = {
        ...settings.paymentSettings,
        ...paymentSettings
      };

      await company.update({ settings });

      return {
        success: true,
        message: 'Payment settings updated successfully',
        data: settings.paymentSettings
      };
    } catch (error) {
      console.error('Enterprise Service - Set Payment Settings Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async setNotificationSettings(companyId, notificationSettings) {
    try {
      const company = await Company.findByPk(companyId);
      if (!company) {
        return {
          success: false,
          error: 'Company not found'
        };
      }

      const settings = company.settings || {};
      settings.notificationSettings = {
        ...settings.notificationSettings,
        ...notificationSettings
      };

      await company.update({ settings });

      return {
        success: true,
        message: 'Notification settings updated successfully',
        data: settings.notificationSettings
      };
    } catch (error) {
      console.error('Enterprise Service - Set Notification Settings Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Utility methods
  generateApiKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  getDateRange(range) {
    switch (range) {
      case 'week':
        return moment().subtract(7, 'days').startOf('day');
      case 'month':
        return moment().subtract(30, 'days').startOf('day');
      case 'quarter':
        return moment().subtract(90, 'days').startOf('day');
      case 'year':
        return moment().subtract(365, 'days').startOf('day');
      default:
        return moment().subtract(30, 'days').startOf('day');
    }
  }

  validateERPConfig(config) {
    if (!config.apiUrl || !config.apiKey) {
      return {
        valid: false,
        error: 'ERP configuration requires apiUrl and apiKey'
      };
    }
    return { valid: true };
  }

  validateCRMConfig(config) {
    if (!config.apiUrl || !config.apiKey) {
      return {
        valid: false,
        error: 'CRM configuration requires apiUrl and apiKey'
      };
    }
    return { valid: true };
  }

  validateAccountingConfig(config) {
    if (!config.apiUrl || !config.apiKey) {
      return {
        valid: false,
        error: 'Accounting configuration requires apiUrl and apiKey'
      };
    }
    return { valid: true };
  }

  // Cache management
  clearCache(companyId = null) {
    if (companyId) {
      this.cache.delete(`company_${companyId}`);
    } else {
      this.cache.clear();
    }
  }
}

module.exports = new EnterpriseService();