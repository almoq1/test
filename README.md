# B2B Ticket Booking Portal

A comprehensive B2B (Business-to-Business) ticket booking portal with integrated wallet functionality and airline API support. Built with Node.js, Express, PostgreSQL, React, and TypeScript.

## 🚀 Features

### Core Features
- **Multi-tenant B2B Platform**: Support for multiple companies with role-based access control
- **Wallet System**: Integrated wallet for managing funds and transactions
- **Airline API Integration**: Support for multiple airline APIs (Amadeus, Sabre, Travelport, etc.)
- **Flight Search & Booking**: Real-time flight search with booking capabilities
- **Bulk Booking**: Support for booking multiple passengers at once
- **Payment Integration**: Multiple payment methods including wallet, credit card, and invoice

### User Management
- **Role-based Access Control**: Admin, Company Admin, Travel Manager, Employee roles
- **Company Management**: Multi-tenant architecture with company-specific settings
- **User Profiles**: Comprehensive user management with permissions

### Booking System
- **Flight Search**: Advanced search with filters (date, route, airline, cabin class)
- **Booking Management**: Create, view, and cancel bookings
- **Passenger Management**: Handle multiple passengers with detailed information
- **Booking History**: Complete booking history and tracking

### Wallet & Payments
- **Wallet Balance**: Real-time balance tracking
- **Transaction History**: Detailed transaction logs
- **Fund Management**: Add, deduct, and transfer funds
- **Auto-recharge**: Configurable auto-recharge settings
- **Spending Limits**: Daily and monthly spending limits

### Admin Features
- **Dashboard Analytics**: Comprehensive analytics and reporting
- **User Management**: Create, edit, and manage users across companies
- **Company Management**: Manage B2B clients and their settings
- **Airline Management**: Configure airline partnerships and APIs
- **System Monitoring**: Monitor system health and performance

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** with Sequelize ORM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation
- **Axios** for HTTP requests
- **Node-cron** for scheduled tasks

### Frontend
- **React 18** with TypeScript
- **Material-UI** for UI components
- **React Router** for navigation
- **React Query** for state management
- **React Hook Form** for form handling
- **Recharts** for data visualization
- **Framer Motion** for animations

### DevOps & Tools
- **Docker** support
- **Environment configuration**
- **API documentation**
- **Error handling and logging**

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd b2b-ticket-booking-portal
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all dependencies (server + client)
npm run install:all
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb b2b_booking_portal

# Or using psql
psql -U postgres
CREATE DATABASE b2b_booking_portal;
```

### 4. Environment Configuration

```bash
# Copy environment file
cp server/.env.example server/.env

# Edit the environment file with your configuration
nano server/.env
```

Update the following variables in `server/.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=b2b_booking_portal
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# Airline API Keys (optional for testing)
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
```

### 5. Database Migration

```bash
# Run database migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

### 6. Start the Application

```bash
# Start both server and client in development mode
npm run dev

# Or start them separately
npm run server:dev  # Backend on http://localhost:5000
npm run client:dev  # Frontend on http://localhost:3000
```

## 📁 Project Structure

```
b2b-ticket-booking-portal/
├── server/                 # Backend application
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── services/          # Business logic services
│   ├── index.js           # Server entry point
│   └── package.json
├── client/                # Frontend application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Utility functions
│   │   ├── App.tsx        # Main app component
│   │   └── index.tsx      # Entry point
│   └── package.json
├── package.json           # Root package.json
└── README.md
```

## 🔧 Configuration

### Database Models

The application includes the following main models:

- **User**: User accounts with role-based permissions
- **Company**: B2B client companies
- **Wallet**: User wallet for fund management
- **WalletTransaction**: Transaction history
- **Flight**: Flight information from airlines
- **Booking**: Flight bookings
- **Passenger**: Passenger information
- **Airline**: Airline partnerships
- **AirlineApi**: API configurations for airlines

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

#### Flights
- `GET /api/flights/search` - Search flights
- `GET /api/flights/:id` - Get flight details
- `GET /api/flights/airlines/available` - Get available airlines

#### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my-bookings` - Get user bookings
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings/:id/cancel` - Cancel booking

#### Wallet
- `GET /api/wallet/balance` - Get wallet balance
- `GET /api/wallet/transactions` - Get transaction history
- `POST /api/wallet/add-funds` - Add funds to wallet
- `POST /api/wallet/deduct-funds` - Deduct funds from wallet

#### Admin (Admin only)
- `GET /api/users` - Get all users
- `GET /api/companies` - Get all companies
- `GET /api/airlines` - Get all airlines

## 🧪 Testing

```bash
# Run backend tests
cd server
npm test

# Run frontend tests
cd client
npm test
```

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Docker Build

```bash
# Build server image
docker build -t b2b-booking-server ./server

# Build client image
docker build -t b2b-booking-client ./client

# Run containers
docker run -p 5000:5000 b2b-booking-server
docker run -p 3000:3000 b2b-booking-client
```

## 📊 Monitoring & Logging

The application includes comprehensive logging and monitoring:

- **Request logging** with Morgan
- **Error tracking** with detailed error messages
- **Database query logging** in development
- **API rate limiting** to prevent abuse
- **Health check endpoints** for monitoring

## 🔒 Security Features

- **JWT Authentication** with secure token handling
- **Password hashing** with bcryptjs
- **Input validation** with express-validator
- **CORS protection** with configurable origins
- **Rate limiting** to prevent abuse
- **Helmet.js** for security headers
- **SQL injection protection** with Sequelize ORM

## 🚀 Production Deployment

### Environment Variables

Make sure to set the following production environment variables:

```env
NODE_ENV=production
JWT_SECRET=your-production-jwt-secret
DB_HOST=your-production-db-host
DB_PASSWORD=your-production-db-password
```

### Performance Optimization

- **Database indexing** for frequently queried fields
- **API response caching** with Redis (optional)
- **Static file serving** with compression
- **CDN integration** for static assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the API documentation

## 🔄 Updates & Maintenance

### Regular Maintenance Tasks

- **Database backups** - Set up automated backups
- **Security updates** - Keep dependencies updated
- **Performance monitoring** - Monitor API response times
- **Error tracking** - Monitor and fix application errors

### Version Updates

```bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix security issues
npm audit fix
```

---

**Built with ❤️ for modern B2B travel management**