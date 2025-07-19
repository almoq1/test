const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Commission = sequelize.define('Commission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    agentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'agents',
        key: 'id'
      }
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'bookings',
        key: 'id'
      }
    },
    // Commission Details
    commissionType: {
      type: DataTypes.ENUM('booking', 'bonus', 'override', 'sub_agent', 'referral'),
      defaultValue: 'booking'
    },
    baseAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    commissionAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    // Hierarchy Commission
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
    // Status and Processing
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'paid', 'cancelled', 'disputed'),
      defaultValue: 'pending'
    },
    isPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Payout Information
    payoutId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'commission_payouts',
        key: 'id'
      }
    },
    payoutPeriod: {
      type: DataTypes.STRING(7), // YYYY-MM format
      allowNull: true
    },
    // Approval Process
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
    // Dispute Information
    isDisputed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    disputeReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    disputeResolvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    disputeResolvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Additional Information
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    // Timestamps for tracking
    calculatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'commissions',
    timestamps: true,
    indexes: [
      {
        fields: ['agentId']
      },
      {
        fields: ['bookingId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['commissionType']
      },
      {
        fields: ['payoutPeriod']
      },
      {
        fields: ['isPaid']
      },
      {
        fields: ['parentAgentId']
      }
    ]
  });

  // Instance methods
  Commission.prototype.isPending = function() {
    return this.status === 'pending';
  };

  Commission.prototype.isApproved = function() {
    return this.status === 'approved';
  };

  Commission.prototype.isPaid = function() {
    return this.status === 'paid' && this.isPaid;
  };

  Commission.prototype.canBePaid = function() {
    return this.isApproved() && !this.isPaid && !this.isDisputed;
  };

  Commission.prototype.approve = function(approvedBy) {
    this.status = 'approved';
    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
  };

  Commission.prototype.pay = function(payoutId) {
    this.status = 'paid';
    this.isPaid = true;
    this.paidAt = new Date();
    this.payoutId = payoutId;
  };

  Commission.prototype.dispute = function(reason) {
    this.isDisputed = true;
    this.disputeReason = reason;
  };

  Commission.prototype.resolveDispute = function(resolvedBy) {
    this.isDisputed = false;
    this.disputeResolvedBy = resolvedBy;
    this.disputeResolvedAt = new Date();
  };

  Commission.prototype.getFormattedAmount = function() {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(this.commissionAmount);
  };

  return Commission;
};