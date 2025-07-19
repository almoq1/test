const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Wallet = sequelize.define('Wallet', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    agentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'agents',
        key: 'id'
      }
    },
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
      validate: {
        isIn: [['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']]
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'frozen', 'closed'),
      defaultValue: 'active'
    },
    lastTransactionDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    autoRechargeEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    autoRechargeAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    autoRechargeThreshold: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    monthlySpendingLimit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    dailySpendingLimit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    }
  }, {
    tableName: 'wallets',
    timestamps: true,
    hooks: {
      beforeCreate: async (wallet) => {
        // Ensure balance is never negative
        if (wallet.balance < 0) {
          wallet.balance = 0;
        }
      },
      beforeUpdate: async (wallet) => {
        // Ensure balance is never negative
        if (wallet.balance < 0) {
          wallet.balance = 0;
        }
      }
    }
  });

  // Instance methods
  Wallet.prototype.addFunds = async function(amount, description = 'Fund addition') {
    const { WalletTransaction } = require('./index');
    
    const transaction = await WalletTransaction.create({
      walletId: this.id,
      type: 'credit',
      amount: amount,
      description: description,
      balanceBefore: this.balance,
      balanceAfter: this.balance + parseFloat(amount)
    });

    this.balance += parseFloat(amount);
    this.lastTransactionDate = new Date();
    await this.save();

    return transaction;
  };

  Wallet.prototype.deductFunds = async function(amount, description = 'Fund deduction') {
    if (this.balance < amount) {
      throw new Error('Insufficient funds');
    }

    const { WalletTransaction } = require('./index');
    
    const transaction = await WalletTransaction.create({
      walletId: this.id,
      type: 'debit',
      amount: amount,
      description: description,
      balanceBefore: this.balance,
      balanceAfter: this.balance - parseFloat(amount)
    });

    this.balance -= parseFloat(amount);
    this.lastTransactionDate = new Date();
    await this.save();

    return transaction;
  };

  return Wallet;
};