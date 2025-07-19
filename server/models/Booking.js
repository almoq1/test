const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Booking = sequelize.define('Booking', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    bookingReference: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Companies',
        key: 'id'
      }
    },
    flightId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Flights',
        key: 'id'
      }
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD'
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed', 'refunded'),
      defaultValue: 'pending'
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
      defaultValue: 'pending'
    },
    paymentMethod: {
      type: DataTypes.ENUM('wallet', 'credit_card', 'bank_transfer', 'invoice'),
      allowNull: true
    },
    numberOfPassengers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    cabinClass: {
      type: DataTypes.ENUM('economy', 'premium_economy', 'business', 'first'),
      defaultValue: 'economy'
    },
    specialRequests: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    externalBookingId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    confirmationNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bookingDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    travelDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    refundAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'bookings',
    timestamps: true,
    hooks: {
      beforeCreate: async (booking) => {
        // Generate booking reference if not provided
        if (!booking.bookingReference) {
          const timestamp = Date.now().toString(36);
          const random = Math.random().toString(36).substr(2, 5);
          booking.bookingReference = `BK${timestamp}${random}`.toUpperCase();
        }
      }
    },
    indexes: [
      {
        fields: ['bookingReference']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['companyId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['travelDate']
      }
    ]
  });

  // Instance methods
  Booking.prototype.calculateTotal = function() {
    // This would be calculated based on passengers and pricing
    return this.totalAmount;
  };

  Booking.prototype.canBeCancelled = function() {
    const now = new Date();
    const travelDate = new Date(this.travelDate);
    const hoursUntilTravel = (travelDate - now) / (1000 * 60 * 60);
    
    return this.status === 'confirmed' && hoursUntilTravel > 24;
  };

  Booking.prototype.getCancellationFee = function() {
    if (!this.canBeCancelled()) {
      return this.totalAmount; // Full amount if cancelled within 24 hours
    }
    
    // 10% cancellation fee if cancelled more than 24 hours before travel
    return this.totalAmount * 0.1;
  };

  return Booking;
};