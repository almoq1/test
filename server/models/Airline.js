const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Airline = sequelize.define('Airline', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    iataCode: {
      type: DataTypes.STRING(3),
      allowNull: false,
      unique: true
    },
    icaoCode: {
      type: DataTypes.STRING(4),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true
    },
    headquarters: {
      type: DataTypes.STRING,
      allowNull: true
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    partnershipType: {
      type: DataTypes.ENUM('direct', 'gds', 'api', 'codeshare'),
      defaultValue: 'api'
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    contractStartDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    contractEndDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    fleet: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    routes: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {
        allowBooking: true,
        requireApproval: false,
        maxAdvanceBooking: 365, // days
        minAdvanceBooking: 0, // hours
        cancellationPolicy: 'standard',
        refundPolicy: 'standard'
      }
    }
  }, {
    tableName: 'airlines',
    timestamps: true,
    indexes: [
      {
        fields: ['iataCode']
      },
      {
        fields: ['status']
      },
      {
        fields: ['partnershipType']
      }
    ]
  });

  // Instance methods
  Airline.prototype.isActive = function() {
    return this.status === 'active';
  };

  Airline.prototype.canBook = function() {
    return this.isActive() && this.settings.allowBooking;
  };

  Airline.prototype.getCommissionAmount = function(bookingAmount) {
    return (bookingAmount * this.commissionRate) / 100;
  };

  return Airline;
};