const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Company = sequelize.define('Company', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    registrationNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    industry: {
      type: DataTypes.STRING,
      allowNull: true
    },
    size: {
      type: DataTypes.ENUM('small', 'medium', 'large', 'enterprise'),
      defaultValue: 'medium'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    contractStartDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    contractEndDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    billingCycle: {
      type: DataTypes.ENUM('monthly', 'quarterly', 'annually'),
      defaultValue: 'monthly'
    },
    creditLimit: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    discountPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {
        allowBulkBooking: true,
        requireApproval: false,
        maxPassengersPerBooking: 10,
        allowedAirlines: [],
        allowedRoutes: [],
        budgetLimits: {}
      }
    }
  }, {
    tableName: 'companies',
    timestamps: true
  });

  return Company;
};