const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WalletTransaction = sequelize.define('WalletTransaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    walletId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Wallets',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('credit', 'debit', 'refund', 'adjustment'),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: true
    },
    balanceBefore: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    balanceAfter: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
      defaultValue: 'completed'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    processedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    tableName: 'wallet_transactions',
    timestamps: true,
    indexes: [
      {
        fields: ['walletId']
      },
      {
        fields: ['type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  return WalletTransaction;
};