const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CommissionPayout = sequelize.define('CommissionPayout', {
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
    // Payout Details
    payoutNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    payoutPeriod: {
      type: DataTypes.STRING(7), // YYYY-MM format
      allowNull: false
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    commissionCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Payment Method
    paymentMethod: {
      type: DataTypes.ENUM('bank_transfer', 'check', 'paypal', 'stripe', 'wire_transfer'),
      defaultValue: 'bank_transfer'
    },
    // Bank Details
    bankDetails: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        accountName: null,
        accountNumber: null,
        routingNumber: null,
        bankName: null,
        swiftCode: null,
        iban: null
      }
    },
    // Status and Processing
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'),
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
    // Processing Information
    processedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Transaction Information
    transactionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    transactionReference: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Fees and Deductions
    processingFee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    taxDeduction: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    netAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    // Failure Information
    failureReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    retryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    nextRetryAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Additional Information
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    // Timestamps
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'commission_payouts',
    timestamps: true,
    indexes: [
      {
        fields: ['agentId']
      },
      {
        fields: ['payoutNumber']
      },
      {
        fields: ['payoutPeriod']
      },
      {
        fields: ['status']
      },
      {
        fields: ['isPaid']
      },
      {
        fields: ['paymentMethod']
      }
    ]
  });

  // Instance methods
  CommissionPayout.prototype.isPending = function() {
    return this.status === 'pending';
  };

  CommissionPayout.prototype.isProcessing = function() {
    return this.status === 'processing';
  };

  CommissionPayout.prototype.isCompleted = function() {
    return this.status === 'completed' && this.isPaid;
  };

  CommissionPayout.prototype.isFailed = function() {
    return this.status === 'failed';
  };

  CommissionPayout.prototype.canBeProcessed = function() {
    return this.isPending() && this.totalAmount > 0;
  };

  CommissionPayout.prototype.process = function(processedBy) {
    this.status = 'processing';
    this.processedBy = processedBy;
    this.processedAt = new Date();
  };

  CommissionPayout.prototype.complete = function(transactionId, transactionReference) {
    this.status = 'completed';
    this.isPaid = true;
    this.paidAt = new Date();
    this.transactionId = transactionId;
    this.transactionReference = transactionReference;
  };

  CommissionPayout.prototype.fail = function(reason) {
    this.status = 'failed';
    this.failureReason = reason;
    this.retryCount += 1;
  };

  CommissionPayout.prototype.cancel = function() {
    this.status = 'cancelled';
  };

  CommissionPayout.prototype.calculateNetAmount = function() {
    this.netAmount = this.totalAmount - this.processingFee - this.taxDeduction;
    return this.netAmount;
  };

  CommissionPayout.prototype.getFormattedAmount = function() {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(this.totalAmount);
  };

  CommissionPayout.prototype.getFormattedNetAmount = function() {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(this.netAmount);
  };

  // Generate payout number
  CommissionPayout.generatePayoutNumber = function() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `PAY-${timestamp.slice(-8)}-${random}`;
  };

  return CommissionPayout;
};