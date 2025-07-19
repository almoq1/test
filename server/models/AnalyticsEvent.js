const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AnalyticsEvent = sequelize.define('AnalyticsEvent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    eventType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    eventCategory: {
      type: DataTypes.ENUM('user_action', 'system_event', 'business_event', 'error', 'performance'),
      allowNull: false
    },
    eventName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Companies',
        key: 'id'
      }
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    properties: {
      type: DataTypes.JSONB,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('properties');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('properties', JSON.stringify(value));
      }
    },
    context: {
      type: DataTypes.JSONB,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('context');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('context', JSON.stringify(value));
      }
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    deviceInfo: {
      type: DataTypes.JSONB,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('deviceInfo');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('deviceInfo', JSON.stringify(value));
      }
    },
    location: {
      type: DataTypes.JSONB,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('location');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('location', JSON.stringify(value));
      }
    },
    duration: {
      type: DataTypes.INTEGER, // in milliseconds
      allowNull: true
    },
    value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: true
    },
    success: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    errorCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'low'
    },
    tags: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    isProcessed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'analytics_events',
    timestamps: true,
    indexes: [
      {
        fields: ['eventType']
      },
      {
        fields: ['eventCategory']
      },
      {
        fields: ['eventName']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['companyId']
      },
      {
        fields: ['sessionId']
      },
      {
        fields: ['timestamp']
      },
      {
        fields: ['isProcessed']
      },
      {
        fields: ['success']
      },
      {
        fields: ['severity']
      }
    ]
  });

  AnalyticsEvent.associate = (models) => {
    AnalyticsEvent.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    AnalyticsEvent.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company'
    });
  };

  // Instance methods
  AnalyticsEvent.prototype.markAsProcessed = function() {
    this.isProcessed = true;
    this.processedAt = new Date();
    return this.save();
  };

  AnalyticsEvent.prototype.addTag = function(tag) {
    if (!this.tags) {
      this.tags = [];
    }
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
    return this.save();
  };

  AnalyticsEvent.prototype.addProperty = function(key, value) {
    if (!this.properties) {
      this.properties = {};
    }
    this.properties[key] = value;
    return this.save();
  };

  return AnalyticsEvent;
};