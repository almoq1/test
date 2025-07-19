const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Passenger = sequelize.define('Passenger', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'bookings',
        key: 'id'
      }
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: false
    },
    nationality: {
      type: DataTypes.STRING(2),
      allowNull: false
    },
    passportNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    passportExpiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    seatNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    mealPreference: {
      type: DataTypes.ENUM('regular', 'vegetarian', 'vegan', 'halal', 'kosher', 'none'),
      defaultValue: 'regular'
    },
    specialAssistance: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    assistanceDetails: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    frequentFlyerNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    frequentFlyerAirline: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ticketNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('confirmed', 'waitlisted', 'cancelled'),
      defaultValue: 'confirmed'
    }
  }, {
    tableName: 'passengers',
    timestamps: true,
    indexes: [
      {
        fields: ['bookingId']
      },
      {
        fields: ['passportNumber']
      },
      {
        fields: ['email']
      }
    ]
  });

  // Instance methods
  Passenger.prototype.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
  };

  Passenger.prototype.getAge = function() {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  Passenger.prototype.isAdult = function() {
    return this.getAge() >= 18;
  };

  Passenger.prototype.isChild = function() {
    const age = this.getAge();
    return age >= 2 && age < 12;
  };

  Passenger.prototype.isInfant = function() {
    return this.getAge() < 2;
  };

  return Passenger;
};