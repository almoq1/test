const { Agent, User, Booking, Commission, CommissionPayout, Company, Wallet, WalletTransaction } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
const crypto = require('crypto');

class AgentService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Agent Management
  async createAgent(agentData) {
    try {
      // Generate unique agent code
      const agentCode = await this.generateAgentCode();
      
      const agent = await Agent.create({
        ...agentData,
        agentCode,
        status: 'pending_approval'
      });

      // Create wallet for agent
      await Wallet.create({
        agentId: agent.id,
        balance: 0,
        currency: 'USD',
        status: 'active'
      });

      return {
        success: true,
        data: agent,
        message: 'Agent created successfully and pending approval'
      };
    } catch (error) {
      console.error('Agent Service - Create Agent Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async approveAgent(agentId, approvedBy) {
    try {
      const agent = await Agent.findByPk(agentId);
      if (!agent) {
        return {
          success: false,
          error: 'Agent not found'
        };
      }

      agent.status = 'active';
      agent.isVerified = true;
      agent.approvedBy = approvedBy;
      agent.approvedAt = new Date();
      agent.contractStartDate = new Date();

      await agent.save();

      // Clear cache
      this.cache.delete(`agent_${agentId}`);

      return {
        success: true,
        data: agent,
        message: 'Agent approved successfully'
      };
    } catch (error) {
      console.error('Agent Service - Approve Agent Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getAgentDetails(agentId) {
    try {
      const cacheKey = `agent_${agentId}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const agent = await Agent.findByPk(agentId, {
        include: [
          {
            model: User,
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
          },
          {
            model: Agent,
            as: 'subAgents',
            include: [{
              model: User,
              attributes: ['id', 'firstName', 'lastName', 'email']
            }]
          }
        ]
      });

      if (!agent) {
        return {
          success: false,
          error: 'Agent not found'
        };
      }

      const result = {
        success: true,
        data: agent
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('Agent Service - Get Agent Details Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateAgent(agentId, updateData) {
    try {
      const agent = await Agent.findByPk(agentId);
      if (!agent) {
        return {
          success: false,
          error: 'Agent not found'
        };
      }

      await agent.update(updateData);
      
      // Clear cache
      this.cache.delete(`agent_${agentId}`);

      return {
        success: true,
        data: agent,
        message: 'Agent updated successfully'
      };
    } catch (error) {
      console.error('Agent Service - Update Agent Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Commission Management
  async calculateCommission(agentId, bookingId, bookingAmount) {
    try {
      const agent = await Agent.findByPk(agentId);
      if (!agent) {
        return {
          success: false,
          error: 'Agent not found'
        };
      }

      const commissionAmount = agent.calculateCommission(bookingAmount);
      const commissionRate = agent.getCommissionRate(bookingAmount);

      const commission = await Commission.create({
        agentId,
        bookingId,
        commissionType: 'booking',
        baseAmount: bookingAmount,
        commissionRate,
        commissionAmount,
        status: 'pending',
        description: `Commission for booking ${bookingId}`
      });

      // Update agent performance metrics
      agent.updatePerformanceMetrics(bookingAmount, commissionAmount);
      await agent.save();

      // Add commission to agent's wallet when approved
      // This will be handled when commission is approved

      return {
        success: true,
        data: commission,
        message: 'Commission calculated and recorded'
      };
    } catch (error) {
      console.error('Agent Service - Calculate Commission Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async approveCommission(commissionId, approvedBy) {
    try {
      const commission = await Commission.findByPk(commissionId, {
        include: [{
          model: Agent,
          include: [{
            model: Wallet
          }]
        }]
      });
      
      if (!commission) {
        return {
          success: false,
          error: 'Commission not found'
        };
      }

      commission.approve(approvedBy);
      await commission.save();

      // Add commission to agent's wallet
      const wallet = commission.Agent.Wallet;
      if (wallet) {
        await wallet.addFunds(
          commission.commissionAmount,
          `Commission approved for booking ${commission.bookingId}`
        );

        // Create wallet transaction record
        await WalletTransaction.create({
          walletId: wallet.id,
          type: 'commission',
          amount: commission.commissionAmount,
          description: `Commission for booking ${commission.bookingId}`,
          balanceBefore: wallet.balance - parseFloat(commission.commissionAmount),
          balanceAfter: wallet.balance,
          status: 'completed',
          commissionId: commission.id,
          processedBy: approvedBy
        });
      }

      return {
        success: true,
        data: commission,
        message: 'Commission approved and added to wallet'
      };
    } catch (error) {
      console.error('Agent Service - Approve Commission Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getAgentCommissions(agentId, filters = {}) {
    try {
      const whereClause = {
        agentId,
        ...filters
      };

      const commissions = await Commission.findAll({
        where: whereClause,
        include: [
          {
            model: Booking,
            attributes: ['bookingReference', 'totalAmount', 'status']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return {
        success: true,
        data: commissions,
        message: `Found ${commissions.length} commissions`
      };
    } catch (error) {
      console.error('Agent Service - Get Agent Commissions Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Payout Management
  async createPayout(agentId, payoutPeriod) {
    try {
      const agent = await Agent.findByPk(agentId);
      if (!agent) {
        return {
          success: false,
          error: 'Agent not found'
        };
      }

      // Get all approved commissions for the period
      const commissions = await Commission.findAll({
        where: {
          agentId,
          status: 'approved',
          isPaid: false,
          payoutPeriod
        }
      });

      if (commissions.length === 0) {
        return {
          success: false,
          error: 'No commissions available for payout'
        };
      }

      const totalAmount = commissions.reduce((sum, commission) => sum + parseFloat(commission.commissionAmount), 0);
      const minimumPayout = agent.settings.commissionPayout.minimumPayout;

      if (totalAmount < minimumPayout) {
        return {
          success: false,
          error: `Total amount (${totalAmount}) is below minimum payout (${minimumPayout})`
        };
      }

      const payout = await CommissionPayout.create({
        agentId,
        payoutNumber: CommissionPayout.generatePayoutNumber(),
        payoutPeriod,
        totalAmount,
        commissionCount: commissions.length,
        paymentMethod: 'bank_transfer',
        bankDetails: agent.settings.commissionPayout.bankDetails,
        netAmount: totalAmount,
        dueDate: moment().add(7, 'days').toDate()
      });

      return {
        success: true,
        data: payout,
        message: 'Payout created successfully'
      };
    } catch (error) {
      console.error('Agent Service - Create Payout Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async processPayout(payoutId, processedBy) {
    try {
      const payout = await CommissionPayout.findByPk(payoutId);
      if (!payout) {
        return {
          success: false,
          error: 'Payout not found'
        };
      }

      if (!payout.canBeProcessed()) {
        return {
          success: false,
          error: 'Payout cannot be processed'
        };
      }

      payout.process(processedBy);
      await payout.save();

      // Mark commissions as paid
      await Commission.update(
        { 
          status: 'paid',
          isPaid: true,
          paidAt: new Date(),
          payoutId: payout.id
        },
        {
          where: {
            agentId: payout.agentId,
            status: 'approved',
            isPaid: false,
            payoutPeriod: payout.payoutPeriod
          }
        }
      );

      return {
        success: true,
        data: payout,
        message: 'Payout processed successfully'
      };
    } catch (error) {
      console.error('Agent Service - Process Payout Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Performance Analytics
  async getAgentPerformance(agentId, dateRange = 'month') {
    try {
      const agent = await Agent.findByPk(agentId);
      if (!agent) {
        return {
          success: false,
          error: 'Agent not found'
        };
      }

      const startDate = this.getDateRange(dateRange);
      const endDate = moment().endOf('day');

      const [
        bookings,
        commissions,
        payouts,
        performanceTrends
      ] = await Promise.all([
        this.getAgentBookings(agentId, startDate, endDate),
        this.getAgentCommissions(agentId, { createdAt: { [Op.between]: [startDate, endDate] } }),
        this.getAgentPayouts(agentId, startDate, endDate),
        this.getPerformanceTrends(agentId, startDate, endDate)
      ]);

      return {
        success: true,
        data: {
          agent: agent,
          performance: agent.performanceMetrics,
          bookings: bookings.data || [],
          commissions: commissions.data || [],
          payouts: payouts.data || [],
          trends: performanceTrends
        }
      };
    } catch (error) {
      console.error('Agent Service - Get Agent Performance Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getAgentBookings(agentId, startDate, endDate) {
    try {
      const bookings = await Booking.findAll({
        where: {
          agentId,
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        },
        include: [
          {
            model: User,
            attributes: ['firstName', 'lastName', 'email']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return {
        success: true,
        data: bookings
      };
    } catch (error) {
      console.error('Agent Service - Get Agent Bookings Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getAgentPayouts(agentId, startDate, endDate) {
    try {
      const payouts = await CommissionPayout.findAll({
        where: {
          agentId,
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        },
        order: [['createdAt', 'DESC']]
      });

      return {
        success: true,
        data: payouts
      };
    } catch (error) {
      console.error('Agent Service - Get Agent Payouts Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getPerformanceTrends(agentId, startDate, endDate) {
    try {
      const commissions = await Commission.findAll({
        where: {
          agentId,
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
          [sequelize.fn('SUM', sequelize.col('commissionAmount')), 'amount'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
      });

      return commissions.map(commission => ({
        date: commission.dataValues.date,
        amount: parseFloat(commission.dataValues.amount || 0),
        count: parseInt(commission.dataValues.count || 0)
      }));
    } catch (error) {
      console.error('Agent Service - Get Performance Trends Error:', error);
      return [];
    }
  }

  // Utility methods
  async generateAgentCode() {
    const prefix = 'AGT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    const agentCode = `${prefix}${timestamp}${random}`;
    
    // Check if code already exists
    const existing = await Agent.findOne({ where: { agentCode } });
    if (existing) {
      return this.generateAgentCode(); // Recursive call if duplicate
    }
    
    return agentCode;
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

  // Cache management
  clearCache(agentId = null) {
    if (agentId) {
      this.cache.delete(`agent_${agentId}`);
    } else {
      this.cache.clear();
    }
  }
}

module.exports = new AgentService();