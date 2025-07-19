const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// Database configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || 'b2b_booking_portal',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Import and initialize models
const User = require('./User')(sequelize);
const Company = require('./Company')(sequelize);
const Wallet = require('./Wallet')(sequelize);
const WalletTransaction = require('./WalletTransaction')(sequelize);
const Flight = require('./Flight')(sequelize);
const Booking = require('./Booking')(sequelize);
const Passenger = require('./Passenger')(sequelize);
const Airline = require('./Airline')(sequelize);
const AirlineApi = require('./AirlineApi')(sequelize);
const Notification = require('./Notification')(sequelize);
const AnalyticsEvent = require('./AnalyticsEvent')(sequelize);
const Report = require('./Report')(sequelize);
const Agent = require('./Agent')(sequelize);
const Commission = require('./Commission')(sequelize);
const CommissionPayout = require('./CommissionPayout')(sequelize);

// Define associations
const defineAssociations = () => {
  // User associations
  User.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  Company.hasMany(User, { foreignKey: 'companyId', as: 'users' });

  // Wallet associations
  User.hasOne(Wallet, { foreignKey: 'userId', as: 'wallet' });
  Wallet.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  
  Wallet.hasMany(WalletTransaction, { foreignKey: 'walletId', as: 'transactions' });
  WalletTransaction.belongsTo(Wallet, { foreignKey: 'walletId', as: 'wallet' });

  // Booking associations
  User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
  Booking.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  
  Company.hasMany(Booking, { foreignKey: 'companyId', as: 'bookings' });
  Booking.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

  Flight.hasMany(Booking, { foreignKey: 'flightId', as: 'bookings' });
  Booking.belongsTo(Flight, { foreignKey: 'flightId', as: 'flight' });

  // Passenger associations
  Booking.hasMany(Passenger, { foreignKey: 'bookingId', as: 'passengers' });
  Passenger.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

  // Airline associations
  Airline.hasMany(Flight, { foreignKey: 'airlineId', as: 'flights' });
  Flight.belongsTo(Airline, { foreignKey: 'airlineId', as: 'airline' });

  Airline.hasMany(AirlineApi, { foreignKey: 'airlineId', as: 'apis' });
  AirlineApi.belongsTo(Airline, { foreignKey: 'airlineId', as: 'airline' });

  // Notification associations
  User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
  Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // Analytics associations
  User.hasMany(AnalyticsEvent, { foreignKey: 'userId', as: 'events' });
  AnalyticsEvent.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  Company.hasMany(AnalyticsEvent, { foreignKey: 'companyId', as: 'events' });
  AnalyticsEvent.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

  // Report associations
  User.hasMany(Report, { foreignKey: 'userId', as: 'reports' });
  Report.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  Company.hasMany(Report, { foreignKey: 'companyId', as: 'reports' });
  Report.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

  // Agent associations
  User.hasOne(Agent, { foreignKey: 'userId', as: 'agent' });
  Agent.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  Agent.hasMany(Commission, { foreignKey: 'agentId', as: 'commissions' });
  Commission.belongsTo(Agent, { foreignKey: 'agentId', as: 'agent' });

  Agent.hasMany(CommissionPayout, { foreignKey: 'agentId', as: 'payouts' });
  CommissionPayout.belongsTo(Agent, { foreignKey: 'agentId', as: 'agent' });

  // Commission associations
  Booking.hasMany(Commission, { foreignKey: 'bookingId', as: 'commissions' });
  Commission.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

  CommissionPayout.hasMany(Commission, { foreignKey: 'payoutId', as: 'commissions' });
  Commission.belongsTo(CommissionPayout, { foreignKey: 'payoutId', as: 'payout' });
};

// Initialize associations
defineAssociations();

module.exports = {
  sequelize,
  User,
  Company,
  Wallet,
  WalletTransaction,
  Flight,
  Booking,
  Passenger,
  Airline,
  AirlineApi,
  Notification,
  AnalyticsEvent,
  Report,
  Agent,
  Commission,
  CommissionPayout
};