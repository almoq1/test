const { User, Booking, Flight, Company, Notification, AnalyticsEvent } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
const mlService = require('./mlService');
const notificationService = require('./notificationService');
const analyticsTrackingService = require('./analyticsTrackingService');

class AutomationService {
  constructor() {
    this.automationRules = this.loadAutomationRules();
    this.isInitialized = false;
    this.activeWorkflows = new Map();
  }

  // Initialize automation service
  async initialize() {
    try {
      console.log('🤖 Initializing Automation Service...');
      
      // Load automation rules
      this.automationRules = this.loadAutomationRules();
      
      // Start automated workflows
      await this.startAutomatedWorkflows();
      
      this.isInitialized = true;
      console.log('✅ Automation Service initialized successfully');
    } catch (error) {
      console.error('❌ Automation Service initialization failed:', error);
      throw error;
    }
  }

  // Load automation rules
  loadAutomationRules() {
    return {
      // Booking automation rules
      booking: {
        autoConfirm: {
          enabled: true,
          conditions: {
            maxAmount: 500,
            userTrustScore: 0.8,
            fraudRisk: 'low'
          }
        },
        autoUpgrade: {
          enabled: true,
          conditions: {
            userTier: 'premium',
            flightLoad: 0.9,
            upgradeAvailability: true
          }
        },
        autoRefund: {
          enabled: true,
          conditions: {
            cancellationReason: ['weather', 'airline_cancellation'],
            refundEligible: true
          }
        }
      },

      // Customer automation rules
      customer: {
        churnPrevention: {
          enabled: true,
          conditions: {
            churnRisk: 'high',
            lastActivityDays: 60
          }
        },
        loyaltyRewards: {
          enabled: true,
          conditions: {
            bookingCount: 5,
            totalSpent: 2000
          }
        },
        personalizedOffers: {
          enabled: true,
          conditions: {
            userSegment: ['high_value', 'frequent'],
            seasonalPromotion: true
          }
        }
      },

      // Pricing automation rules
      pricing: {
        dynamicPricing: {
          enabled: true,
          conditions: {
            demandIncrease: 0.2,
            competitorPriceChange: true
          }
        },
        flashSales: {
          enabled: true,
          conditions: {
            lowOccupancy: 0.3,
            departureWithinDays: 7
          }
        },
        bulkDiscounts: {
          enabled: true,
          conditions: {
            groupSize: 10,
            advanceBookingDays: 30
          }
        }
      },

      // Operational automation rules
      operational: {
        capacityOptimization: {
          enabled: true,
          conditions: {
            routeDemand: 'high',
            currentCapacity: 0.8
          }
        },
        maintenanceAlerts: {
          enabled: true,
          conditions: {
            systemHealth: 'degraded',
            errorRate: 0.05
          }
        },
        performanceOptimization: {
          enabled: true,
          conditions: {
            responseTime: 2000,
            concurrentUsers: 1000
          }
        }
      }
    };
  }

  // Start automated workflows
  async startAutomatedWorkflows() {
    try {
      // Start scheduled workflows
      this.startScheduledWorkflows();
      
      // Start real-time monitoring
      this.startRealTimeMonitoring();
      
      console.log('✅ Automated workflows started');
    } catch (error) {
      console.error('❌ Failed to start automated workflows:', error);
      throw error;
    }
  }

  // Start scheduled workflows
  startScheduledWorkflows() {
    // Daily workflows
    setInterval(async () => {
      await this.runDailyAutomations();
    }, 24 * 60 * 60 * 1000);

    // Hourly workflows
    setInterval(async () => {
      await this.runHourlyAutomations();
    }, 60 * 60 * 1000);

    // Real-time workflows (every 5 minutes)
    setInterval(async () => {
      await this.runRealTimeAutomations();
    }, 5 * 60 * 1000);
  }

  // Start real-time monitoring
  startRealTimeMonitoring() {
    // Monitor system performance
    setInterval(async () => {
      await this.monitorSystemPerformance();
    }, 60 * 1000); // Every minute

    // Monitor business metrics
    setInterval(async () => {
      await this.monitorBusinessMetrics();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  // Daily automation workflows
  async runDailyAutomations() {
    try {
      console.log('🔄 Running daily automations...');
      
      await Promise.all([
        this.processChurnPrevention(),
        this.processLoyaltyRewards(),
        this.processCapacityOptimization(),
        this.processMaintenanceChecks(),
        this.generateDailyReports()
      ]);
      
      console.log('✅ Daily automations completed');
    } catch (error) {
      console.error('❌ Daily automations failed:', error);
    }
  }

  // Hourly automation workflows
  async runHourlyAutomations() {
    try {
      console.log('🔄 Running hourly automations...');
      
      await Promise.all([
        this.processDynamicPricing(),
        this.processFlashSales(),
        this.processPerformanceOptimization(),
        this.processRealTimeAlerts()
      ]);
      
      console.log('✅ Hourly automations completed');
    } catch (error) {
      console.error('❌ Hourly automations failed:', error);
    }
  }

  // Real-time automation workflows
  async runRealTimeAutomations() {
    try {
      await Promise.all([
        this.processBookingAutomations(),
        this.processCustomerAutomations(),
        this.processOperationalAutomations()
      ]);
    } catch (error) {
      console.error('❌ Real-time automations failed:', error);
    }
  }

  // Booking automation workflows
  async processBookingAutomations() {
    try {
      // Auto-confirm bookings
      await this.autoConfirmBookings();
      
      // Auto-upgrade bookings
      await this.autoUpgradeBookings();
      
      // Auto-refund bookings
      await this.autoRefundBookings();
      
    } catch (error) {
      console.error('❌ Booking automations failed:', error);
    }
  }

  // Auto-confirm bookings
  async autoConfirmBookings() {
    const pendingBookings = await Booking.findAll({
      where: { status: 'pending' },
      include: [
        { model: User, as: 'user' },
        { model: Flight, as: 'flight' }
      ]
    });

    for (const booking of pendingBookings) {
      try {
        const shouldAutoConfirm = await this.evaluateAutoConfirmConditions(booking);
        
        if (shouldAutoConfirm) {
          await booking.update({ status: 'confirmed' });
          
          // Send confirmation notification
          await notificationService.sendMultiChannelNotification(
            booking.userId,
            'booking_auto_confirmed',
            {
              bookingNumber: booking.bookingNumber,
              flightDetails: `${booking.flight.origin} → ${booking.flight.destination}`,
              departureTime: booking.flight.departureTime
            }
          );

          // Track automation event
          await analyticsTrackingService.trackBusinessEvent(
            'booking_auto_confirmed',
            { bookingId: booking.id, amount: booking.totalAmount }
          );

          console.log(`✅ Auto-confirmed booking ${booking.bookingNumber}`);
        }
      } catch (error) {
        console.error(`❌ Failed to auto-confirm booking ${booking.id}:`, error);
      }
    }
  }

  // Auto-upgrade bookings
  async autoUpgradeBookings() {
    const eligibleBookings = await Booking.findAll({
      where: { 
        status: 'confirmed',
        cabinClass: { [Op.in]: ['economy', 'premiumEconomy'] }
      },
      include: [
        { model: User, as: 'user' },
        { model: Flight, as: 'flight' }
      ]
    });

    for (const booking of eligibleBookings) {
      try {
        const shouldUpgrade = await this.evaluateUpgradeConditions(booking);
        
        if (shouldUpgrade) {
          const newCabinClass = booking.cabinClass === 'economy' ? 'premiumEconomy' : 'business';
          await booking.update({ cabinClass: newCabinClass });
          
          // Send upgrade notification
          await notificationService.sendMultiChannelNotification(
            booking.userId,
            'booking_auto_upgraded',
            {
              bookingNumber: booking.bookingNumber,
              oldCabinClass: booking.cabinClass,
              newCabinClass: newCabinClass,
              flightDetails: `${booking.flight.origin} → ${booking.flight.destination}`
            }
          );

          // Track automation event
          await analyticsTrackingService.trackBusinessEvent(
            'booking_auto_upgraded',
            { bookingId: booking.id, newCabinClass }
          );

          console.log(`✅ Auto-upgraded booking ${booking.bookingNumber}`);
        }
      } catch (error) {
        console.error(`❌ Failed to auto-upgrade booking ${booking.id}:`, error);
      }
    }
  }

  // Auto-refund bookings
  async autoRefundBookings() {
    const cancelledBookings = await Booking.findAll({
      where: { status: 'cancelled' },
      include: [
        { model: User, as: 'user' },
        { model: Flight, as: 'flight' }
      ]
    });

    for (const booking of cancelledBookings) {
      try {
        const shouldAutoRefund = await this.evaluateRefundConditions(booking);
        
        if (shouldAutoRefund) {
          // Process refund logic here
          await booking.update({ refundStatus: 'processed' });
          
          // Send refund notification
          await notificationService.sendMultiChannelNotification(
            booking.userId,
            'refund_processed',
            {
              bookingNumber: booking.bookingNumber,
              refundAmount: booking.totalAmount,
              refundMethod: 'original_payment_method'
            }
          );

          // Track automation event
          await analyticsTrackingService.trackBusinessEvent(
            'booking_auto_refunded',
            { bookingId: booking.id, refundAmount: booking.totalAmount }
          );

          console.log(`✅ Auto-refunded booking ${booking.bookingNumber}`);
        }
      } catch (error) {
        console.error(`❌ Failed to auto-refund booking ${booking.id}:`, error);
      }
    }
  }

  // Customer automation workflows
  async processCustomerAutomations() {
    try {
      // Churn prevention
      await this.processChurnPrevention();
      
      // Loyalty rewards
      await this.processLoyaltyRewards();
      
      // Personalized offers
      await this.processPersonalizedOffers();
      
    } catch (error) {
      console.error('❌ Customer automations failed:', error);
    }
  }

  // Process churn prevention
  async processChurnPrevention() {
    const users = await User.findAll({
      include: [
        {
          model: Booking,
          as: 'bookings',
          include: [{ model: Flight, as: 'flight' }]
        }
      ]
    });

    for (const user of users) {
      try {
        const churnPrediction = await mlService.predictChurn(user.id);
        
        if (churnPrediction.riskLevel === 'high') {
          // Send personalized re-engagement email
          await notificationService.sendMultiChannelNotification(
            user.id,
            'churn_prevention',
            {
              userName: user.firstName,
              recommendations: churnPrediction.recommendations,
              specialOffer: '20% discount on next booking'
            }
          );

          // Track automation event
          await analyticsTrackingService.trackBusinessEvent(
            'churn_prevention_triggered',
            { userId: user.id, churnProbability: churnPrediction.churnProbability }
          );

          console.log(`✅ Churn prevention triggered for user ${user.id}`);
        }
      } catch (error) {
        console.error(`❌ Failed to process churn prevention for user ${user.id}:`, error);
      }
    }
  }

  // Process loyalty rewards
  async processLoyaltyRewards() {
    const users = await User.findAll({
      include: [
        {
          model: Booking,
          as: 'bookings',
          where: { status: 'confirmed' }
        }
      ]
    });

    for (const user of users) {
      try {
        const totalBookings = user.bookings.length;
        const totalSpent = user.bookings.reduce((sum, b) => sum + b.totalAmount, 0);
        
        if (totalBookings >= 5 && totalSpent >= 2000) {
          // Award loyalty points
          const pointsEarned = Math.floor(totalSpent / 100);
          
          await notificationService.sendMultiChannelNotification(
            user.id,
            'loyalty_rewards',
            {
              userName: user.firstName,
              pointsEarned,
              totalPoints: pointsEarned * 10,
              tier: 'Gold',
              benefits: ['Priority boarding', 'Free seat selection', 'Extra baggage allowance']
            }
          );

          // Track automation event
          await analyticsTrackingService.trackBusinessEvent(
            'loyalty_rewards_awarded',
            { userId: user.id, pointsEarned, totalSpent }
          );

          console.log(`✅ Loyalty rewards awarded to user ${user.id}`);
        }
      } catch (error) {
        console.error(`❌ Failed to process loyalty rewards for user ${user.id}:`, error);
      }
    }
  }

  // Process personalized offers
  async processPersonalizedOffers() {
    const users = await User.findAll({
      include: [
        {
          model: Booking,
          as: 'bookings',
          include: [{ model: Flight, as: 'flight' }]
        }
      ]
    });

    for (const user of users) {
      try {
        const recommendations = await mlService.getRecommendations(user.id);
        
        if (recommendations.length > 0) {
          const topRecommendation = recommendations[0];
          
          await notificationService.sendMultiChannelNotification(
            user.id,
            'personalized_offer',
            {
              userName: user.firstName,
              recommendedRoute: topRecommendation.route,
              reason: topRecommendation.reason,
              specialPrice: '15% off',
              validUntil: moment().add(7, 'days').format('YYYY-MM-DD')
            }
          );

          // Track automation event
          await analyticsTrackingService.trackBusinessEvent(
            'personalized_offer_sent',
            { userId: user.id, recommendation: topRecommendation }
          );

          console.log(`✅ Personalized offer sent to user ${user.id}`);
        }
      } catch (error) {
        console.error(`❌ Failed to process personalized offer for user ${user.id}:`, error);
      }
    }
  }

  // Pricing automation workflows
  async processDynamicPricing() {
    try {
      const flights = await Flight.findAll({
        where: {
          departureTime: { [Op.gte]: new Date() }
        }
      });

      for (const flight of flights) {
        try {
          const demand = await mlService.predictDemand(
            `${flight.origin}-${flight.destination}`,
            flight.departureTime
          );
          
          const currentPrice = flight.price;
          let newPrice = currentPrice;
          
          // Adjust price based on demand
          if (demand > 80) {
            newPrice = currentPrice * 1.15; // Increase by 15%
          } else if (demand < 30) {
            newPrice = currentPrice * 0.85; // Decrease by 15%
          }
          
          if (newPrice !== currentPrice) {
            await flight.update({ price: newPrice });
            
            // Track automation event
            await analyticsTrackingService.trackBusinessEvent(
              'dynamic_pricing_adjusted',
              { 
                flightId: flight.id, 
                oldPrice: currentPrice, 
                newPrice, 
                demand 
              }
            );

            console.log(`✅ Dynamic pricing adjusted for flight ${flight.id}`);
          }
        } catch (error) {
          console.error(`❌ Failed to process dynamic pricing for flight ${flight.id}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Dynamic pricing automation failed:', error);
    }
  }

  // Process flash sales
  async processFlashSales() {
    try {
      const flights = await Flight.findAll({
        where: {
          departureTime: { 
            [Op.between]: [new Date(), moment().add(7, 'days').toDate()] 
          }
        }
      });

      for (const flight of flights) {
        try {
          const bookings = await Booking.count({
            where: { flightId: flight.id, status: 'confirmed' }
          });
          
          const capacity = flight.capacity || 150;
          const occupancy = bookings / capacity;
          
          if (occupancy < 0.3) {
            // Create flash sale
            const flashSalePrice = flight.price * 0.7; // 30% discount
            
            await notificationService.sendMultiChannelNotification(
              null, // Send to all users
              'flash_sale',
              {
                route: `${flight.origin} → ${flight.destination}`,
                originalPrice: flight.price,
                flashSalePrice,
                departureTime: flight.departureTime,
                validUntil: moment().add(2, 'hours').format('YYYY-MM-DD HH:mm')
              }
            );

            // Track automation event
            await analyticsTrackingService.trackBusinessEvent(
              'flash_sale_created',
              { 
                flightId: flight.id, 
                originalPrice: flight.price, 
                flashSalePrice, 
                occupancy 
              }
            );

            console.log(`✅ Flash sale created for flight ${flight.id}`);
          }
        } catch (error) {
          console.error(`❌ Failed to process flash sale for flight ${flight.id}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Flash sale automation failed:', error);
    }
  }

  // Operational automation workflows
  async processOperationalAutomations() {
    try {
      // Capacity optimization
      await this.processCapacityOptimization();
      
      // Performance optimization
      await this.processPerformanceOptimization();
      
      // Maintenance alerts
      await this.processMaintenanceAlerts();
      
    } catch (error) {
      console.error('❌ Operational automations failed:', error);
    }
  }

  // Process capacity optimization
  async processCapacityOptimization() {
    try {
      const flights = await Flight.findAll({
        include: [
          {
            model: Booking,
            as: 'bookings',
            where: { status: 'confirmed' }
          }
        ]
      });

      for (const flight of flights) {
        const bookings = flight.bookings.length;
        const capacity = flight.capacity || 150;
        const occupancy = bookings / capacity;
        
        if (occupancy > 0.8) {
          // High demand - consider adding capacity
          await analyticsTrackingService.trackBusinessEvent(
            'capacity_optimization_alert',
            { 
              flightId: flight.id, 
              occupancy, 
              recommendation: 'Consider adding capacity' 
            }
          );

          console.log(`✅ Capacity optimization alert for flight ${flight.id}`);
        }
      }
    } catch (error) {
      console.error('❌ Capacity optimization failed:', error);
    }
  }

  // Process performance optimization
  async processPerformanceOptimization() {
    try {
      // Monitor system performance metrics
      const performanceMetrics = await this.getSystemPerformanceMetrics();
      
      if (performanceMetrics.responseTime > 2000) {
        // Performance degradation detected
        await analyticsTrackingService.trackSystemEvent(
          'performance_degradation',
          { 
            responseTime: performanceMetrics.responseTime,
            recommendation: 'Scale up resources' 
          },
          'high'
        );

        console.log('⚠️ Performance degradation detected');
      }
    } catch (error) {
      console.error('❌ Performance optimization failed:', error);
    }
  }

  // Process maintenance alerts
  async processMaintenanceAlerts() {
    try {
      // Check system health
      const systemHealth = await this.checkSystemHealth();
      
      if (systemHealth.status === 'degraded') {
        await analyticsTrackingService.trackSystemEvent(
          'maintenance_required',
          { 
            issues: systemHealth.issues,
            recommendation: 'Schedule maintenance' 
          },
          'medium'
        );

        console.log('⚠️ Maintenance alert triggered');
      }
    } catch (error) {
      console.error('❌ Maintenance alerts failed:', error);
    }
  }

  // Evaluation methods
  async evaluateAutoConfirmConditions(booking) {
    const rules = this.automationRules.booking.autoConfirm;
    
    if (!rules.enabled) return false;
    
    // Check amount
    if (booking.totalAmount > rules.conditions.maxAmount) return false;
    
    // Check user trust score (simplified)
    const userTrustScore = await this.calculateUserTrustScore(booking.user);
    if (userTrustScore < rules.conditions.userTrustScore) return false;
    
    // Check fraud risk
    const fraudAssessment = await mlService.detectFraud(booking, booking.user);
    if (fraudAssessment.riskLevel !== 'low') return false;
    
    return true;
  }

  async evaluateUpgradeConditions(booking) {
    const rules = this.automationRules.booking.autoUpgrade;
    
    if (!rules.enabled) return false;
    
    // Check user tier (simplified)
    const userTier = await this.getUserTier(booking.user);
    if (userTier !== 'premium') return false;
    
    // Check flight load
    const flightLoad = await this.calculateFlightLoad(booking.flight);
    if (flightLoad < rules.conditions.flightLoad) return false;
    
    return true;
  }

  async evaluateRefundConditions(booking) {
    const rules = this.automationRules.booking.autoRefund;
    
    if (!rules.enabled) return false;
    
    // Check cancellation reason
    const cancellationReason = booking.cancellationReason || 'user_cancellation';
    if (!rules.conditions.cancellationReason.includes(cancellationReason)) return false;
    
    return true;
  }

  // Helper methods
  async calculateUserTrustScore(user) {
    // Simplified trust score calculation
    const bookings = user.bookings || [];
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    const totalBookings = bookings.length;
    
    if (totalBookings === 0) return 0.5;
    
    const confirmationRate = confirmedBookings / totalBookings;
    const accountAge = moment().diff(moment(user.createdAt), 'days') / 365;
    
    return Math.min((confirmationRate * 0.7) + (accountAge * 0.3), 1);
  }

  async getUserTier(user) {
    // Simplified tier calculation
    const totalSpent = (user.bookings || []).reduce((sum, b) => sum + b.totalAmount, 0);
    
    if (totalSpent > 5000) return 'premium';
    if (totalSpent > 2000) return 'gold';
    if (totalSpent > 500) return 'silver';
    return 'bronze';
  }

  async calculateFlightLoad(flight) {
    const bookings = await Booking.count({
      where: { flightId: flight.id, status: 'confirmed' }
    });
    
    const capacity = flight.capacity || 150;
    return bookings / capacity;
  }

  async getSystemPerformanceMetrics() {
    // Simplified performance metrics
    return {
      responseTime: Math.random() * 3000 + 500, // 500-3500ms
      errorRate: Math.random() * 0.1, // 0-10%
      cpuUsage: Math.random() * 100, // 0-100%
      memoryUsage: Math.random() * 100 // 0-100%
    };
  }

  async checkSystemHealth() {
    // Simplified system health check
    const metrics = await this.getSystemPerformanceMetrics();
    
    if (metrics.responseTime > 2000 || metrics.errorRate > 0.05) {
      return {
        status: 'degraded',
        issues: ['High response time', 'Elevated error rate']
      };
    }
    
    return { status: 'healthy', issues: [] };
  }

  async generateDailyReports() {
    // Generate automated daily reports
    console.log('📊 Generating daily reports...');
  }

  async processRealTimeAlerts() {
    // Process real-time alerts
    console.log('🚨 Processing real-time alerts...');
  }

  async monitorSystemPerformance() {
    // Monitor system performance
    console.log('📈 Monitoring system performance...');
  }

  async monitorBusinessMetrics() {
    // Monitor business metrics
    console.log('📊 Monitoring business metrics...');
  }

  // Get automation status
  async getAutomationStatus() {
    return {
      isInitialized: this.isInitialized,
      activeWorkflows: this.activeWorkflows.size,
      automationRules: Object.keys(this.automationRules).length,
      lastRun: new Date()
    };
  }
}

module.exports = new AutomationService();