const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Agent = sequelize.define('Agent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    agentCode: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true
    },
    agentType: {
      type: DataTypes.ENUM('individual', 'agency', 'corporate', 'super_agent'),
      defaultValue: 'individual'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended', 'pending_approval'),
      defaultValue: 'pending_approval'
    },
    // Hierarchy
    parentAgentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'agents',
        key: 'id'
      }
    },
    hierarchyLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    // Business Information
    businessName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    businessLicense: {
      type: DataTypes.STRING,
      allowNull: true
    },
    taxId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Contact Information
    address: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Territory and Specialization
    territories: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    specializations: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    // Commission Structure
    commissionStructure: {
      type: DataTypes.JSONB,
      defaultValue: {
        baseRate: 5.0, // Base commission rate
        tiers: [
          { minAmount: 0, maxAmount: 10000, rate: 5.0 },
          { minAmount: 10001, maxAmount: 50000, rate: 7.0 },
          { minAmount: 50001, maxAmount: 100000, rate: 10.0 },
          { minAmount: 100001, maxAmount: null, rate: 12.0 }
        ],
        bonuses: {
          monthlyTarget: 50000,
          monthlyBonus: 2.0,
          quarterlyTarget: 150000,
          quarterlyBonus: 5.0,
          yearlyTarget: 500000,
          yearlyBonus: 10.0
        },
        subAgentCommission: 2.0 // Commission for sub-agents
      }
    },
    // Performance Tracking
    performanceMetrics: {
      type: DataTypes.JSONB,
      defaultValue: {
        totalBookings: 0,
        totalRevenue: 0,
        totalCommission: 0,
        monthlyBookings: 0,
        monthlyRevenue: 0,
        monthlyCommission: 0,
        quarterlyBookings: 0,
        quarterlyRevenue: 0,
        quarterlyCommission: 0,
        yearlyBookings: 0,
        yearlyRevenue: 0,
        yearlyCommission: 0,
        averageBookingValue: 0,
        customerCount: 0,
        repeatCustomerRate: 0
      }
    },
    // Settings
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {
        autoApproveBookings: false,
        maxBookingAmount: 10000,
        requireApproval: true,
        notificationPreferences: {
          email: true,
          sms: false,
          push: true
        },
        commissionPayout: {
          frequency: 'monthly', // weekly, biweekly, monthly, quarterly
          minimumPayout: 100,
          bankDetails: null
        }
      }
    },
    // Approval and Verification
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    verificationDocuments: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Contract Information
    contractStartDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    contractEndDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    contractTerms: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'agents',
    timestamps: true,
    indexes: [
      {
        fields: ['agentCode']
      },
      {
        fields: ['status']
      },
      {
        fields: ['agentType']
      },
      {
        fields: ['parentAgentId']
      },
      {
        fields: ['userId']
      }
    ]
  });

  // Instance methods
  Agent.prototype.isActive = function() {
    return this.status === 'active';
  };

  Agent.prototype.canBook = function() {
    return this.isActive() && this.isVerified;
  };

  Agent.prototype.getCommissionRate = function(bookingAmount) {
    const tiers = this.commissionStructure.tiers;
    for (const tier of tiers) {
      if (bookingAmount >= tier.minAmount && (tier.maxAmount === null || bookingAmount <= tier.maxAmount)) {
        return tier.rate;
      }
    }
    return this.commissionStructure.baseRate;
  };

  Agent.prototype.calculateCommission = function(bookingAmount) {
    const rate = this.getCommissionRate(bookingAmount);
    return (bookingAmount * rate) / 100;
  };

  Agent.prototype.getSubAgentCommission = function(bookingAmount) {
    return (bookingAmount * this.commissionStructure.subAgentCommission) / 100;
  };

  Agent.prototype.updatePerformanceMetrics = function(bookingAmount, commissionAmount) {
    this.performanceMetrics.totalBookings += 1;
    this.performanceMetrics.totalRevenue += bookingAmount;
    this.performanceMetrics.totalCommission += commissionAmount;
    this.performanceMetrics.monthlyBookings += 1;
    this.performanceMetrics.monthlyRevenue += bookingAmount;
    this.performanceMetrics.monthlyCommission += commissionAmount;
    this.performanceMetrics.quarterlyBookings += 1;
    this.performanceMetrics.quarterlyRevenue += bookingAmount;
    this.performanceMetrics.quarterlyCommission += commissionAmount;
    this.performanceMetrics.yearlyBookings += 1;
    this.performanceMetrics.yearlyRevenue += bookingAmount;
    this.performanceMetrics.yearlyCommission += commissionAmount;
    this.performanceMetrics.averageBookingValue = this.performanceMetrics.totalRevenue / this.performanceMetrics.totalBookings;
  };

  Agent.prototype.checkBonusEligibility = function() {
    const bonuses = [];
    const { monthlyTarget, monthlyBonus, quarterlyTarget, quarterlyBonus, yearlyTarget, yearlyBonus } = this.commissionStructure.bonuses;

    if (this.performanceMetrics.monthlyRevenue >= monthlyTarget) {
      bonuses.push({ type: 'monthly', amount: monthlyBonus });
    }
    if (this.performanceMetrics.quarterlyRevenue >= quarterlyTarget) {
      bonuses.push({ type: 'quarterly', amount: quarterlyBonus });
    }
    if (this.performanceMetrics.yearlyRevenue >= yearlyTarget) {
      bonuses.push({ type: 'yearly', amount: yearlyBonus });
    }

    return bonuses;
  };

  Agent.prototype.getHierarchyPath = function() {
    const path = [this.agentCode];
    let currentAgent = this;
    
    while (currentAgent.parentAgentId) {
      // This would need to be populated with the actual parent agent
      // For now, we'll return the current path
      break;
    }
    
    return path.reverse();
  };

  return Agent;
};