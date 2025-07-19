# 🛫 B2B Flight Booking System - Complete Edition

A comprehensive **Business-to-Business (B2B) Flight Booking Platform** with advanced features including agent management, commission systems, enterprise analytics, and AI-powered automation.

## 🎯 **System Overview**

This platform transforms from a basic flight booking system into a complete **Travel Agency Management Ecosystem** with the following phases:

- **Phase 1**: Core booking system, authentication, and wallet management
- **Phase 2**: Analytics and reporting with event tracking
- **Phase 3**: Machine Learning and AI automation services
- **Phase 4**: Enterprise features with multi-tenant architecture
- **Phase 5**: Agent & Commission System with automated payouts

## 🚀 **Key Features**

### ✈️ **Flight Booking System**
- Real-time flight search and booking
- Multi-airline integration
- Seat selection and meal preferences
- Booking management and cancellation
- Payment processing with multiple gateways

### 👥 **User Management**
- Multi-role authentication (Admin, Company Admin, Travel Manager, Employee, Agent)
- Company-based user organization
- Role-based access control
- User profile management

### 💰 **Wallet System**
- Digital wallet for users and agents
- Transaction history and tracking
- Multiple payment methods
- Auto-recharge and spending limits
- Commission integration for agents

### 📊 **Analytics & Reporting**
- Real-time dashboard with key metrics
- Custom report generation
- Event tracking and user behavior analysis
- Predictive analytics and insights
- Export functionality (PDF, Excel, CSV)

### 🤖 **AI & Machine Learning**
- Flight price prediction
- Demand forecasting
- Personalized recommendations
- Automated customer support
- Fraud detection and prevention

### 🏢 **Enterprise Features**
- Multi-tenant architecture
- Company-specific dashboards
- Bulk operations (user import/export)
- Advanced business settings
- ERP/CRM/Accounting integrations
- Audit logging and compliance

### 👨‍💼 **Agent & Commission System**
- Multi-tier agent hierarchy (Individual → Agency → Corporate → Super Agent)
- Automated commission calculation (5-12% tiered structure)
- Performance bonuses and incentives
- Automated payout processing
- Real-time performance tracking
- Territory and specialization management

## 🏗️ **Architecture**

### **Backend Stack**
- **Node.js** with Express.js
- **PostgreSQL** database with Sequelize ORM
- **Redis** for caching and session management
- **JWT** for authentication
- **Socket.io** for real-time features
- **Multer** for file uploads
- **Nodemailer** for email notifications

### **Frontend Stack**
- **React.js** with TypeScript
- **Material-UI** for UI components
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Recharts** for data visualization
- **Axios** for API communication
- **PWA** capabilities with offline support

### **AI/ML Stack**
- **TensorFlow.js** for client-side ML
- **Python** with scikit-learn for server-side ML
- **OpenAI API** for natural language processing
- **Recommendation algorithms**
- **Predictive analytics models**

## 📁 **Project Structure**

```
├── server/
│   ├── models/                 # Database models
│   │   ├── User.js
│   │   ├── Company.js
│   │   ├── Flight.js
│   │   ├── Booking.js
│   │   ├── Wallet.js
│   │   ├── Agent.js
│   │   ├── Commission.js
│   │   └── CommissionPayout.js
│   ├── routes/                 # API routes
│   │   ├── auth.js
│   │   ├── flights.js
│   │   ├── bookings.js
│   │   ├── wallet.js
│   │   ├── analytics.js
│   │   ├── enterprise.js
│   │   └── agents.js
│   ├── services/               # Business logic
│   │   ├── flightService.js
│   │   ├── bookingService.js
│   │   ├── walletService.js
│   │   ├── analyticsService.js
│   │   ├── enterpriseService.js
│   │   └── agentService.js
│   ├── middleware/             # Custom middleware
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   └── utils/                  # Utility functions
├── client/
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── pages/              # Page components
│   │   │   ├── Dashboard/
│   │   │   ├── Flights/
│   │   │   ├── Bookings/
│   │   │   ├── Wallet/
│   │   │   ├── Analytics/
│   │   │   ├── Enterprise/
│   │   │   └── Agent/
│   │   ├── contexts/           # React contexts
│   │   ├── hooks/              # Custom hooks
│   │   ├── utils/              # Utility functions
│   │   └── types/              # TypeScript types
│   └── public/                 # Static assets
├── docs/                       # Documentation
│   ├── PHASE1_IMPLEMENTATION.md
│   ├── PHASE2_IMPLEMENTATION.md
│   ├── PHASE3_IMPLEMENTATION.md
│   ├── PHASE4_IMPLEMENTATION.md
│   └── PHASE5_IMPLEMENTATION.md
└── scripts/                    # Build and deployment scripts
```

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Redis (v6 or higher)
- npm or yarn

### **Installation**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd b2b-flight-booking-system
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files
   cp .env.example .env
   
   # Configure your environment variables
   # Database, Redis, JWT, API keys, etc.
   ```

4. **Database Setup**
   ```bash
   # Run database migrations
   npm run migrate
   
   # Seed initial data
   npm run seed
   ```

5. **Start the application**
   ```bash
   # Start server (from server directory)
   npm run dev
   
   # Start client (from client directory)
   npm start
   ```

## 🔧 **Configuration**

### **Environment Variables**

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=b2b_flight_booking
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# AI Services
OPENAI_API_KEY=sk-...
TENSORFLOW_MODEL_URL=...

# Agent System
AGENT_COMMISSION_BASE_RATE=5.0
AGENT_MINIMUM_PAYOUT=100
AGENT_PAYOUT_FREQUENCY=monthly
```

## 📊 **API Documentation**

### **Authentication**
```
POST   /api/auth/register          # User registration
POST   /api/auth/login             # User login
POST   /api/auth/logout            # User logout
GET    /api/auth/profile           # Get user profile
PUT    /api/auth/profile           # Update user profile
```

### **Flights**
```
GET    /api/flights                # Search flights
GET    /api/flights/:id            # Get flight details
POST   /api/flights                # Create flight (admin)
PUT    /api/flights/:id            # Update flight (admin)
DELETE /api/flights/:id            # Delete flight (admin)
```

### **Bookings**
```
GET    /api/bookings               # Get user bookings
POST   /api/bookings               # Create booking
GET    /api/bookings/:id           # Get booking details
PUT    /api/bookings/:id           # Update booking
DELETE /api/bookings/:id           # Cancel booking
```

### **Wallet**
```
GET    /api/wallet                 # Get wallet balance
POST   /api/wallet/add-funds       # Add funds
POST   /api/wallet/withdraw        # Withdraw funds
GET    /api/wallet/transactions    # Get transaction history
```

### **Analytics**
```
GET    /api/analytics/dashboard    # Get dashboard data
GET    /api/analytics/reports      # Generate reports
GET    /api/analytics/events       # Get event data
POST   /api/analytics/track        # Track custom events
```

### **Enterprise**
```
GET    /api/enterprise/companies   # Get companies
POST   /api/enterprise/companies   # Create company
GET    /api/enterprise/analytics   # Enterprise analytics
POST   /api/enterprise/bulk-import # Bulk user import
```

### **Agents**
```
POST   /api/agents/register        # Register agent
GET    /api/agents/:id             # Get agent details
PUT    /api/agents/:id             # Update agent
POST   /api/agents/:id/approve     # Approve agent
GET    /api/agents/:id/commissions # Get commissions
POST   /api/agents/:id/payouts     # Create payout
```

## 🎨 **User Interface**

### **Dashboard Features**
- **Real-time Metrics**: Bookings, revenue, user activity
- **Interactive Charts**: Performance trends and analytics
- **Quick Actions**: Common tasks and shortcuts
- **Notifications**: System alerts and updates

### **Flight Booking**
- **Advanced Search**: Multiple filters and preferences
- **Real-time Pricing**: Live price updates
- **Seat Selection**: Interactive seat map
- **Booking Management**: Easy modifications and cancellations

### **Agent Dashboard**
- **Performance Tracking**: Commission and booking metrics
- **Commission Management**: Real-time commission tracking
- **Payout Monitoring**: Payment status and history
- **Analytics**: Performance trends and insights

### **Enterprise Features**
- **Multi-tenant Management**: Company-specific views
- **Bulk Operations**: User import/export
- **Advanced Analytics**: Business intelligence
- **Integration Hub**: ERP/CRM connections

## 🔐 **Security Features**

- **JWT Authentication**: Secure token-based auth
- **Role-based Access Control**: Granular permissions
- **Data Encryption**: Sensitive data protection
- **Rate Limiting**: API abuse prevention
- **Input Validation**: XSS and injection protection
- **Audit Logging**: Complete activity tracking

## 📈 **Performance Optimization**

- **Database Indexing**: Optimized queries
- **Redis Caching**: Fast data access
- **CDN Integration**: Static asset delivery
- **Image Optimization**: Compressed media
- **Code Splitting**: Lazy loading
- **PWA Support**: Offline capabilities

## 🧪 **Testing**

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

## 🚀 **Deployment**

### **Docker Deployment**
```bash
# Build and run with Docker
docker-compose up -d

# Production build
docker-compose -f docker-compose.prod.yml up -d
```

### **Cloud Deployment**
- **AWS**: EC2, RDS, ElastiCache, S3
- **Google Cloud**: Compute Engine, Cloud SQL, Redis
- **Azure**: Virtual Machines, SQL Database, Redis Cache
- **Heroku**: Easy deployment with add-ons

## 📚 **Documentation**

- [Phase 1: Core System](docs/PHASE1_IMPLEMENTATION.md)
- [Phase 2: Analytics](docs/PHASE2_IMPLEMENTATION.md)
- [Phase 3: AI/ML Services](docs/PHASE3_IMPLEMENTATION.md)
- [Phase 4: Enterprise Features](docs/PHASE4_IMPLEMENTATION.md)
- [Phase 5: Agent System](docs/PHASE5_IMPLEMENTATION.md)
- [API Reference](docs/API_REFERENCE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

- **Documentation**: Check the docs folder
- **Issues**: Create an issue on GitHub
- **Email**: support@b2bflightbooking.com
- **Discord**: Join our community server

## 🎉 **Acknowledgments**

- **Material-UI** for the beautiful UI components
- **Sequelize** for the excellent ORM
- **Recharts** for the amazing charts
- **OpenAI** for AI capabilities
- **All contributors** who made this project possible

---

**Built with ❤️ for the travel industry**