const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AirlineApi = sequelize.define('AirlineApi', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    airlineId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'airlines',
        key: 'id'
      }
    },
    apiName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    apiType: {
      type: DataTypes.ENUM('rest', 'soap', 'graphql', 'amadeus', 'sabre', 'travelport'),
      allowNull: false
    },
    baseUrl: {
      type: DataTypes.STRING,
      allowNull: false
    },
    apiKey: {
      type: DataTypes.STRING,
      allowNull: true
    },
    secretKey: {
      type: DataTypes.STRING,
      allowNull: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true
    },
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'error'),
      defaultValue: 'active'
    },
    lastSync: {
      type: DataTypes.DATE,
      allowNull: true
    },
    syncInterval: {
      type: DataTypes.INTEGER, // minutes
      defaultValue: 30
    },
    rateLimit: {
      type: DataTypes.INTEGER, // requests per minute
      defaultValue: 100
    },
    timeout: {
      type: DataTypes.INTEGER, // seconds
      defaultValue: 30
    },
    retryAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 3
    },
    endpoints: {
      type: DataTypes.JSONB,
      defaultValue: {
        search: '/flights/search',
        pricing: '/flights/pricing',
        booking: '/bookings/create',
        cancellation: '/bookings/cancel',
        status: '/bookings/status'
      }
    },
    headers: {
      type: DataTypes.JSONB,
      defaultValue: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
    authentication: {
      type: DataTypes.JSONB,
      defaultValue: {
        type: 'bearer', // bearer, basic, api_key, oauth
        header: 'Authorization',
        prefix: 'Bearer'
      }
    },
    mapping: {
      type: DataTypes.JSONB,
      defaultValue: {
        flightNumber: 'flight_number',
        origin: 'departure_airport',
        destination: 'arrival_airport',
        departureTime: 'departure_time',
        arrivalTime: 'arrival_time',
        price: 'base_price'
      }
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {
        enableCaching: true,
        cacheDuration: 300, // seconds
        enableLogging: true,
        enableMetrics: true
      }
    }
  }, {
    tableName: 'airline_apis',
    timestamps: true,
    indexes: [
      {
        fields: ['airlineId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['apiType']
      }
    ]
  });

  // Instance methods
  AirlineApi.prototype.isTokenValid = function() {
    if (!this.accessToken || !this.tokenExpiry) {
      return false;
    }
    
    return new Date() < new Date(this.tokenExpiry);
  };

  AirlineApi.prototype.needsTokenRefresh = function() {
    if (!this.tokenExpiry) {
      return false;
    }
    
    const now = new Date();
    const expiry = new Date(this.tokenExpiry);
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
    
    return (expiry.getTime() - now.getTime()) < bufferTime;
  };

  AirlineApi.prototype.getEndpoint = function(endpointName) {
    return this.endpoints[endpointName] || null;
  };

  AirlineApi.prototype.getAuthHeader = function() {
    const auth = this.authentication;
    
    switch (auth.type) {
      case 'bearer':
        return `${auth.prefix} ${this.accessToken}`;
      case 'basic':
        const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
        return `Basic ${credentials}`;
      case 'api_key':
        return this.apiKey;
      default:
        return null;
    }
  };

  return AirlineApi;
};