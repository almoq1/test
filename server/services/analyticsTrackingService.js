const { AnalyticsEvent } = require('../models');
const geoip = require('geoip-lite');
const UserAgent = require('user-agents');

class AnalyticsTrackingService {
  constructor() {
    this.batchSize = 100;
    this.batchTimeout = 5000; // 5 seconds
    this.eventQueue = [];
    this.batchTimer = null;
  }

  // Track user event
  async trackEvent(eventType, eventName, properties = {}, context = {}) {
    const event = {
      eventType,
      eventName,
      eventCategory: this.categorizeEvent(eventType),
      properties,
      context,
      timestamp: new Date(),
      success: true
    };

    this.addToQueue(event);
  }

  // Track user action
  async trackUserAction(userId, action, properties = {}, req = null) {
    const event = {
      eventType: 'user_action',
      eventName: action,
      eventCategory: 'user_action',
      userId,
      properties,
      context: this.extractContext(req),
      timestamp: new Date(),
      success: true
    };

    this.addToQueue(event);
  }

  // Track business event
  async trackBusinessEvent(eventName, properties = {}, context = {}) {
    const event = {
      eventType: 'business_event',
      eventName,
      eventCategory: 'business_event',
      properties,
      context,
      timestamp: new Date(),
      success: true
    };

    this.addToQueue(event);
  }

  // Track system event
  async trackSystemEvent(eventName, properties = {}, severity = 'low') {
    const event = {
      eventType: 'system_event',
      eventName,
      eventCategory: 'system_event',
      properties,
      severity,
      timestamp: new Date(),
      success: true
    };

    this.addToQueue(event);
  }

  // Track error
  async trackError(error, context = {}, req = null) {
    const event = {
      eventType: 'error',
      eventName: error.name || 'Unknown Error',
      eventCategory: 'error',
      properties: {
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      context: { ...context, ...this.extractContext(req) },
      timestamp: new Date(),
      success: false,
      errorMessage: error.message,
      errorCode: error.code,
      severity: this.determineErrorSeverity(error)
    };

    this.addToQueue(event);
  }

  // Track performance metric
  async trackPerformance(metricName, value, unit = 'ms', context = {}) {
    const event = {
      eventType: 'performance',
      eventName: metricName,
      eventCategory: 'performance',
      properties: {
        value,
        unit
      },
      context,
      timestamp: new Date(),
      success: true
    };

    this.addToQueue(event);
  }

  // Track booking event
  async trackBookingEvent(bookingId, eventName, properties = {}, userId = null) {
    const event = {
      eventType: 'booking_event',
      eventName,
      eventCategory: 'business_event',
      properties: {
        bookingId,
        ...properties
      },
      userId,
      timestamp: new Date(),
      success: true
    };

    this.addToQueue(event);
  }

  // Track wallet transaction
  async trackWalletTransaction(transactionId, eventName, properties = {}, userId = null) {
    const event = {
      eventType: 'wallet_transaction',
      eventName,
      eventCategory: 'business_event',
      properties: {
        transactionId,
        ...properties
      },
      userId,
      timestamp: new Date(),
      success: true
    };

    this.addToQueue(event);
  }

  // Track search event
  async trackSearchEvent(searchCriteria, results, userId = null, req = null) {
    const event = {
      eventType: 'search',
      eventName: 'flight_search',
      eventCategory: 'user_action',
      properties: {
        searchCriteria,
        resultsCount: results.length,
        hasResults: results.length > 0
      },
      context: this.extractContext(req),
      userId,
      timestamp: new Date(),
      success: true
    };

    this.addToQueue(event);
  }

  // Track conversion event
  async trackConversion(bookingId, amount, currency, userId = null) {
    const event = {
      eventType: 'conversion',
      eventName: 'booking_conversion',
      eventCategory: 'business_event',
      properties: {
        bookingId,
        amount,
        currency
      },
      userId,
      value: amount,
      currency,
      timestamp: new Date(),
      success: true
    };

    this.addToQueue(event);
  }

  // Add event to queue
  addToQueue(event) {
    this.eventQueue.push(event);

    // Process batch if queue is full
    if (this.eventQueue.length >= this.batchSize) {
      this.processBatch();
    } else if (!this.batchTimer) {
      // Set timer to process batch after timeout
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.batchTimeout);
    }
  }

  // Process batch of events
  async processBatch() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await AnalyticsEvent.bulkCreate(events);
      console.log(`✅ Processed ${events.length} analytics events`);
    } catch (error) {
      console.error('❌ Failed to process analytics events:', error);
      // Re-queue failed events
      this.eventQueue.unshift(...events);
    }
  }

  // Extract context from request
  extractContext(req) {
    if (!req) return {};

    const context = {
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      sessionId: req.session?.id,
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      query: req.query
    };

    // Add location data if IP is available
    if (context.ipAddress) {
      const geo = geoip.lookup(context.ipAddress);
      if (geo) {
        context.location = {
          country: geo.country,
          region: geo.region,
          city: geo.city,
          timezone: geo.timezone
        };
      }
    }

    // Add device info if user agent is available
    if (context.userAgent) {
      const userAgent = new UserAgent(context.userAgent);
      context.deviceInfo = {
        browser: userAgent.browser.name,
        browserVersion: userAgent.browser.version,
        os: userAgent.os.name,
        osVersion: userAgent.os.version,
        device: userAgent.device.type,
        isMobile: userAgent.device.isMobile,
        isTablet: userAgent.device.isTablet
      };
    }

    return context;
  }

  // Categorize event
  categorizeEvent(eventType) {
    const categories = {
      'user_action': 'user_action',
      'business_event': 'business_event',
      'system_event': 'system_event',
      'error': 'error',
      'performance': 'performance',
      'booking_event': 'business_event',
      'wallet_transaction': 'business_event',
      'search': 'user_action',
      'conversion': 'business_event'
    };

    return categories[eventType] || 'user_action';
  }

  // Determine error severity
  determineErrorSeverity(error) {
    if (error.status >= 500) return 'critical';
    if (error.status >= 400) return 'high';
    if (error.status >= 300) return 'medium';
    return 'low';
  }

  // Get analytics summary
  async getAnalyticsSummary(companyId = null, dateRange = '30d') {
    const { startDate, endDate } = this.getDateRange(dateRange);
    const whereClause = companyId ? { companyId } : {};

    const [totalEvents, userActions, businessEvents, errors, conversions] = await Promise.all([
      AnalyticsEvent.count({
        where: {
          ...whereClause,
          timestamp: { [Op.between]: [startDate, endDate] }
        }
      }),
      AnalyticsEvent.count({
        where: {
          ...whereClause,
          eventCategory: 'user_action',
          timestamp: { [Op.between]: [startDate, endDate] }
        }
      }),
      AnalyticsEvent.count({
        where: {
          ...whereClause,
          eventCategory: 'business_event',
          timestamp: { [Op.between]: [startDate, endDate] }
        }
      }),
      AnalyticsEvent.count({
        where: {
          ...whereClause,
          eventCategory: 'error',
          timestamp: { [Op.between]: [startDate, endDate] }
        }
      }),
      AnalyticsEvent.count({
        where: {
          ...whereClause,
          eventType: 'conversion',
          timestamp: { [Op.between]: [startDate, endDate] }
        }
      })
    ]);

    return {
      totalEvents,
      userActions,
      businessEvents,
      errors,
      conversions,
      conversionRate: totalEvents > 0 ? (conversions / totalEvents) * 100 : 0,
      errorRate: totalEvents > 0 ? (errors / totalEvents) * 100 : 0
    };
  }

  // Get user behavior analytics
  async getUserBehaviorAnalytics(userId, companyId = null, dateRange = '30d') {
    const { startDate, endDate } = this.getDateRange(dateRange);
    const whereClause = companyId ? { companyId } : {};

    const events = await AnalyticsEvent.findAll({
      where: {
        ...whereClause,
        userId,
        timestamp: { [Op.between]: [startDate, endDate] }
      },
      order: [['timestamp', 'ASC']]
    });

    const behavior = {
      totalEvents: events.length,
      eventTypes: {},
      sessionCount: 0,
      averageSessionDuration: 0,
      mostActiveHours: {},
      mostActiveDays: {},
      conversionEvents: 0,
      searchEvents: 0,
      bookingEvents: 0
    };

    events.forEach(event => {
      // Count event types
      behavior.eventTypes[event.eventType] = (behavior.eventTypes[event.eventType] || 0) + 1;

      // Count specific events
      if (event.eventType === 'conversion') behavior.conversionEvents++;
      if (event.eventType === 'search') behavior.searchEvents++;
      if (event.eventType === 'booking_event') behavior.bookingEvents++;

      // Track active hours
      const hour = new Date(event.timestamp).getHours();
      behavior.mostActiveHours[hour] = (behavior.mostActiveHours[hour] || 0) + 1;

      // Track active days
      const day = new Date(event.timestamp).getDay();
      behavior.mostActiveDays[day] = (behavior.mostActiveDays[day] || 0) + 1;
    });

    return behavior;
  }

  // Get date range
  getDateRange(range) {
    const endDate = new Date();
    let startDate;

    switch (range) {
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate };
  }

  // Clean up old events
  async cleanupOldEvents(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    try {
      const deletedCount = await AnalyticsEvent.destroy({
        where: {
          timestamp: { [Op.lt]: cutoffDate }
        }
      });

      console.log(`🧹 Cleaned up ${deletedCount} old analytics events`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Failed to cleanup old events:', error);
      throw error;
    }
  }

  // Process pending events
  async processPendingEvents() {
    try {
      const pendingEvents = await AnalyticsEvent.findAll({
        where: { isProcessed: false },
        limit: 1000
      });

      for (const event of pendingEvents) {
        await event.markAsProcessed();
      }

      console.log(`✅ Processed ${pendingEvents.length} pending events`);
      return pendingEvents.length;
    } catch (error) {
      console.error('❌ Failed to process pending events:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsTrackingService();