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

// Import models
const User = require('./User');
const Company = require('./Company');
const Wallet = require('./Wallet');
const WalletTransaction = require('./WalletTransaction');
const Flight = require('./Flight');
const Booking = require('./Booking');
const Passenger = require('./Passenger');
const Airline = require('./Airline');
const AirlineApi = require('./AirlineApi');

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
  AirlineApi
};