const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Flight = sequelize.define('Flight', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    airlineId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Airlines',
        key: 'id'
      }
    },
    flightNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    origin: {
      type: DataTypes.STRING(3),
      allowNull: false
    },
    destination: {
      type: DataTypes.STRING(3),
      allowNull: false
    },
    departureTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    arrivalTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    aircraft: {
      type: DataTypes.STRING,
      allowNull: true
    },
    totalSeats: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    availableSeats: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    basePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD'
    },
    cabinClass: {
      type: DataTypes.ENUM('economy', 'premium_economy', 'business', 'first'),
      defaultValue: 'economy'
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'delayed', 'cancelled', 'completed'),
      defaultValue: 'scheduled'
    },
    externalId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    apiSource: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lastUpdated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'flights',
    timestamps: true,
    indexes: [
      {
        fields: ['origin', 'destination']
      },
      {
        fields: ['departureTime']
      },
      {
        fields: ['airlineId']
      },
      {
        fields: ['status']
      }
    ]
  });

  // Instance methods
  Flight.prototype.isAvailable = function() {
    return this.status === 'scheduled' && this.availableSeats > 0;
  };

  Flight.prototype.getPriceForCompany = function(company) {
    let price = this.basePrice;
    
    if (company && company.discountPercentage > 0) {
      price = price * (1 - company.discountPercentage / 100);
    }
    
    return Math.round(price * 100) / 100; // Round to 2 decimal places
  };

  return Flight;
};