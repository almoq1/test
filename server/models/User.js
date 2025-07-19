const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('admin', 'company_admin', 'travel_manager', 'employee', 'agent', 'super_agent'),
      defaultValue: 'employee'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'companies',
        key: 'id'
      }
    },
    permissions: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    // MFA and Security fields
    mfaEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    mfaSecret: {
      type: DataTypes.STRING,
      allowNull: true
    },
    mfaBackupCodes: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    isLocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    loginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lockoutUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Notification preferences
    notificationPreferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        email: true,
        sms: false,
        push: false,
        realtime: true
      }
    },
    // Device and location tracking
    knownDevices: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    lastKnownLocation: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    // Language and localization
    preferredLanguage: {
      type: DataTypes.STRING,
      defaultValue: 'en'
    },
    preferredCurrency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },
    timezone: {
      type: DataTypes.STRING,
      defaultValue: 'UTC'
    },
    // Push notification token
    pushToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Phone number for SMS
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      }
    }
  });

  // Instance methods
  User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
  };

  return User;
};