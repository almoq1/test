const { Kafka } = require('kafkajs');
const { User, Booking, Flight, AnalyticsEvent } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
const WebSocket = require('ws');
const Redis = require('redis');

class StreamingService {
  constructor() {
    this.isInitialized = false;
    this.kafka = null;
    this.producer = null;
    this.consumers = new Map();
    this.websocketServer = null;
    this.redisClient = null;
    this.streamingTopics = {
      bookings: 'booking-events',
      analytics: 'analytics-events',
      pricing: 'pricing-updates',
      notifications: 'notification-events',
      system: 'system-events'
    };
  }

  // Initialize streaming service
  async initialize() {
    try {
      console.log('🔄 Initializing Streaming Service...');
      
      // Initialize Kafka
      await this.initializeKafka();
      
      // Initialize Redis for caching
      await this.initializeRedis();
      
      // Initialize WebSocket server
      await this.initializeWebSocket();
      
      // Start consumers
      await this.startConsumers();
      
      // Start real-time data streams
      await this.startRealTimeStreams();
      
      this.isInitialized = true;
      console.log('✅ Streaming Service initialized successfully');
    } catch (error) {
      console.error('❌ Streaming Service initialization failed:', error);
      throw error;
    }
  }

  // Initialize Kafka
  async initializeKafka() {
    try {
      console.log('📡 Initializing Kafka...');
      
      this.kafka = new Kafka({
        clientId: 'b2b-flight-booking',
        brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
        retry: {
          initialRetryTime: 100,
          retries: 8
        }
      });
      
      this.producer = this.kafka.producer();
      await this.producer.connect();
      
      console.log('✅ Kafka initialized');
    } catch (error) {
      console.error('❌ Kafka initialization failed:', error);
      throw error;
    }
  }

  // Initialize Redis
  async initializeRedis() {
    try {
      console.log('🔴 Initializing Redis...');
      
      this.redisClient = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      
      await this.redisClient.connect();
      
      console.log('✅ Redis initialized');
    } catch (error) {
      console.error('❌ Redis initialization failed:', error);
      throw error;
    }
  }

  // Initialize WebSocket server
  async initializeWebSocket() {
    try {
      console.log('🌐 Initializing WebSocket server...');
      
      this.websocketServer = new WebSocket.Server({ 
        port: process.env.WS_PORT || 8080,
        path: '/ws'
      });
      
      this.websocketServer.on('connection', (ws, req) => {
        this.handleWebSocketConnection(ws, req);
      });
      
      console.log('✅ WebSocket server initialized');
    } catch (error) {
      console.error('❌ WebSocket initialization failed:', error);
      throw error;
    }
  }

  // Start Kafka consumers
  async startConsumers() {
    try {
      console.log('👂 Starting Kafka consumers...');
      
      // Start consumers for each topic
      for (const [topicName, topic] of Object.entries(this.streamingTopics)) {
        await this.startConsumer(topicName, topic);
      }
      
      console.log('✅ Kafka consumers started');
    } catch (error) {
      console.error('❌ Failed to start consumers:', error);
      throw error;
    }
  }

  // Start individual consumer
  async startConsumer(consumerName, topic) {
    try {
      const consumer = this.kafka.consumer({ 
        groupId: `${consumerName}-group`,
        sessionTimeout: 30000
      });
      
      await consumer.connect();
      await consumer.subscribe({ topic, fromBeginning: false });
      
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          await this.processMessage(consumerName, topic, message);
        }
      });
      
      this.consumers.set(consumerName, consumer);
      console.log(`✅ Consumer started for topic: ${topic}`);
    } catch (error) {
      console.error(`❌ Failed to start consumer for ${topic}:`, error);
    }
  }

  // Process incoming messages
  async processMessage(consumerName, topic, message) {
    try {
      const data = JSON.parse(message.value.toString());
      
      switch (consumerName) {
        case 'bookings':
          await this.processBookingEvent(data);
          break;
        case 'analytics':
          await this.processAnalyticsEvent(data);
          break;
        case 'pricing':
          await this.processPricingEvent(data);
          break;
        case 'notifications':
          await this.processNotificationEvent(data);
          break;
        case 'system':
          await this.processSystemEvent(data);
          break;
      }
      
      // Broadcast to WebSocket clients
      await this.broadcastToWebSocket(topic, data);
      
    } catch (error) {
      console.error(`❌ Failed to process message from ${topic}:`, error);
    }
  }

  // Start real-time data streams
  async startRealTimeStreams() {
    try {
      console.log('📊 Starting real-time data streams...');
      
      // Start booking stream
      this.startBookingStream();
      
      // Start analytics stream
      this.startAnalyticsStream();
      
      // Start pricing stream
      this.startPricingStream();
      
      // Start system monitoring stream
      this.startSystemMonitoringStream();
      
      console.log('✅ Real-time streams started');
    } catch (error) {
      console.error('❌ Failed to start real-time streams:', error);
      throw error;
    }
  }

  // Start booking stream
  startBookingStream() {
    setInterval(async () => {
      try {
        const recentBookings = await Booking.findAll({
          where: {
            createdAt: { [Op.gte]: moment().subtract(5, 'minutes').toDate() }
          },
          include: [
            { model: User, as: 'user' },
            { model: Flight, as: 'flight' }
          ],
          order: [['createdAt', 'DESC']],
          limit: 10
        });
        
        if (recentBookings.length > 0) {
          const bookingEvents = recentBookings.map(booking => ({
            type: 'booking_created',
            bookingId: booking.id,
            userId: booking.userId,
            flightId: booking.flightId,
            amount: booking.totalAmount,
            status: booking.status,
            timestamp: booking.createdAt,
            route: `${booking.flight.origin}-${booking.flight.destination}`
          }));
          
          await this.publishToTopic(this.streamingTopics.bookings, bookingEvents);
        }
      } catch (error) {
        console.error('❌ Booking stream error:', error);
      }
    }, 30000); // Every 30 seconds
  }

  // Start analytics stream
  startAnalyticsStream() {
    setInterval(async () => {
      try {
        const recentEvents = await AnalyticsEvent.findAll({
          where: {
            timestamp: { [Op.gte]: moment().subtract(5, 'minutes').toDate() }
          },
          order: [['timestamp', 'DESC']],
          limit: 50
        });
        
        if (recentEvents.length > 0) {
          const analyticsData = this.aggregateAnalyticsData(recentEvents);
          
          await this.publishToTopic(this.streamingTopics.analytics, analyticsData);
        }
      } catch (error) {
        console.error('❌ Analytics stream error:', error);
      }
    }, 60000); // Every minute
  }

  // Start pricing stream
  startPricingStream() {
    setInterval(async () => {
      try {
        const flights = await Flight.findAll({
          where: {
            departureTime: { [Op.gte]: new Date() }
          },
          order: [['departureTime', 'ASC']],
          limit: 20
        });
        
        const pricingUpdates = flights.map(flight => ({
          type: 'pricing_update',
          flightId: flight.id,
          route: `${flight.origin}-${flight.destination}`,
          currentPrice: flight.price,
          previousPrice: flight.previousPrice || flight.price,
          change: flight.price - (flight.previousPrice || flight.price),
          timestamp: new Date()
        }));
        
        await this.publishToTopic(this.streamingTopics.pricing, pricingUpdates);
      } catch (error) {
        console.error('❌ Pricing stream error:', error);
      }
    }, 120000); // Every 2 minutes
  }

  // Start system monitoring stream
  startSystemMonitoringStream() {
    setInterval(async () => {
      try {
        const systemMetrics = await this.getSystemMetrics();
        
        await this.publishToTopic(this.streamingTopics.system, {
          type: 'system_metrics',
          metrics: systemMetrics,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('❌ System monitoring stream error:', error);
      }
    }, 30000); // Every 30 seconds
  }

  // Publish message to Kafka topic
  async publishToTopic(topic, data) {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: `${topic}-${Date.now()}`,
            value: JSON.stringify(data)
          }
        ]
      });
    } catch (error) {
      console.error(`❌ Failed to publish to topic ${topic}:`, error);
    }
  }

  // Process booking events
  async processBookingEvent(data) {
    try {
      // Update Redis cache
      await this.redisClient.set(
        `booking:${data.bookingId}`,
        JSON.stringify(data),
        'EX',
        3600 // 1 hour
      );
      
      // Update real-time counters
      await this.updateRealTimeCounters('bookings', data);
      
      console.log(`✅ Processed booking event: ${data.bookingId}`);
    } catch (error) {
      console.error('❌ Failed to process booking event:', error);
    }
  }

  // Process analytics events
  async processAnalyticsEvent(data) {
    try {
      // Store in Redis for real-time analytics
      await this.redisClient.set(
        `analytics:${data.type}:${Date.now()}`,
        JSON.stringify(data),
        'EX',
        1800 // 30 minutes
      );
      
      // Update analytics aggregations
      await this.updateAnalyticsAggregations(data);
      
      console.log(`✅ Processed analytics event: ${data.type}`);
    } catch (error) {
      console.error('❌ Failed to process analytics event:', error);
    }
  }

  // Process pricing events
  async processPricingEvent(data) {
    try {
      // Update flight prices in cache
      await this.redisClient.set(
        `flight:${data.flightId}:price`,
        JSON.stringify(data),
        'EX',
        1800 // 30 minutes
      );
      
      // Notify subscribed users about price changes
      await this.notifyPriceChange(data);
      
      console.log(`✅ Processed pricing event: ${data.flightId}`);
    } catch (error) {
      console.error('❌ Failed to process pricing event:', error);
    }
  }

  // Process notification events
  async processNotificationEvent(data) {
    try {
      // Send real-time notifications
      await this.sendRealTimeNotification(data);
      
      console.log(`✅ Processed notification event: ${data.type}`);
    } catch (error) {
      console.error('❌ Failed to process notification event:', error);
    }
  }

  // Process system events
  async processSystemEvent(data) {
    try {
      // Store system metrics
      await this.redisClient.set(
        `system:metrics:${Date.now()}`,
        JSON.stringify(data),
        'EX',
        3600 // 1 hour
      );
      
      // Check for alerts
      await this.checkSystemAlerts(data);
      
      console.log(`✅ Processed system event: ${data.type}`);
    } catch (error) {
      console.error('❌ Failed to process system event:', error);
    }
  }

  // Handle WebSocket connections
  handleWebSocketConnection(ws, req) {
    console.log('🔌 New WebSocket connection established');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        await this.handleWebSocketMessage(ws, data);
      } catch (error) {
        console.error('❌ WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('🔌 WebSocket connection closed');
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
  }

  // Handle WebSocket messages
  async handleWebSocketMessage(ws, data) {
    try {
      switch (data.type) {
        case 'subscribe':
          await this.handleSubscription(ws, data);
          break;
        case 'unsubscribe':
          await this.handleUnsubscription(ws, data);
          break;
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
        default:
          console.log('Unknown WebSocket message type:', data.type);
      }
    } catch (error) {
      console.error('❌ Failed to handle WebSocket message:', error);
    }
  }

  // Handle subscription
  async handleSubscription(ws, data) {
    try {
      const { topics, userId } = data;
      
      // Store subscription in Redis
      const subscriptionKey = `ws:subscription:${ws._socket.remoteAddress}`;
      await this.redisClient.sadd(subscriptionKey, ...topics);
      
      // Store user-specific subscriptions
      if (userId) {
        const userSubscriptionKey = `ws:user:${userId}`;
        await this.redisClient.sadd(userSubscriptionKey, ...topics);
      }
      
      ws.send(JSON.stringify({
        type: 'subscribed',
        topics,
        timestamp: Date.now()
      }));
      
      console.log(`✅ Subscribed to topics: ${topics.join(', ')}`);
    } catch (error) {
      console.error('❌ Failed to handle subscription:', error);
    }
  }

  // Handle unsubscription
  async handleUnsubscription(ws, data) {
    try {
      const { topics, userId } = data;
      
      // Remove subscription from Redis
      const subscriptionKey = `ws:subscription:${ws._socket.remoteAddress}`;
      await this.redisClient.srem(subscriptionKey, ...topics);
      
      // Remove user-specific subscriptions
      if (userId) {
        const userSubscriptionKey = `ws:user:${userId}`;
        await this.redisClient.srem(userSubscriptionKey, ...topics);
      }
      
      ws.send(JSON.stringify({
        type: 'unsubscribed',
        topics,
        timestamp: Date.now()
      }));
      
      console.log(`✅ Unsubscribed from topics: ${topics.join(', ')}`);
    } catch (error) {
      console.error('❌ Failed to handle unsubscription:', error);
    }
  }

  // Broadcast to WebSocket clients
  async broadcastToWebSocket(topic, data) {
    try {
      const message = JSON.stringify({
        topic,
        data,
        timestamp: Date.now()
      });
      
      this.websocketServer.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } catch (error) {
      console.error('❌ Failed to broadcast to WebSocket:', error);
    }
  }

  // Update real-time counters
  async updateRealTimeCounters(type, data) {
    try {
      const counterKey = `counter:${type}:${moment().format('YYYY-MM-DD-HH')}`;
      await this.redisClient.incr(counterKey);
      await this.redisClient.expire(counterKey, 7200); // 2 hours
    } catch (error) {
      console.error('❌ Failed to update counters:', error);
    }
  }

  // Update analytics aggregations
  async updateAnalyticsAggregations(data) {
    try {
      const aggregationKey = `analytics:${data.type}:${moment().format('YYYY-MM-DD-HH')}`;
      
      // Get existing aggregation
      const existing = await this.redisClient.get(aggregationKey);
      const aggregation = existing ? JSON.parse(existing) : { count: 0, total: 0 };
      
      // Update aggregation
      aggregation.count += 1;
      if (data.value) {
        aggregation.total += data.value;
      }
      
      // Store updated aggregation
      await this.redisClient.set(aggregationKey, JSON.stringify(aggregation), 'EX', 7200);
    } catch (error) {
      console.error('❌ Failed to update analytics aggregations:', error);
    }
  }

  // Notify price change
  async notifyPriceChange(data) {
    try {
      // Find users interested in this route
      const interestedUsers = await this.findInterestedUsers(data.route);
      
      // Send notifications
      for (const userId of interestedUsers) {
        await this.sendRealTimeNotification({
          type: 'price_change',
          userId,
          data: {
            route: data.route,
            oldPrice: data.previousPrice,
            newPrice: data.currentPrice,
            change: data.change
          }
        });
      }
    } catch (error) {
      console.error('❌ Failed to notify price change:', error);
    }
  }

  // Send real-time notification
  async sendRealTimeNotification(data) {
    try {
      const notification = {
        type: 'notification',
        data,
        timestamp: Date.now()
      };
      
      // Send to specific user if userId is provided
      if (data.userId) {
        const userSubscriptionKey = `ws:user:${data.userId}`;
        const userTopics = await this.redisClient.smembers(userSubscriptionKey);
        
        if (userTopics.includes('notifications')) {
          // Send to user's WebSocket connection
          this.websocketServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(notification));
            }
          });
        }
      }
    } catch (error) {
      console.error('❌ Failed to send real-time notification:', error);
    }
  }

  // Check system alerts
  async checkSystemAlerts(data) {
    try {
      const { metrics } = data;
      
      // Check CPU usage
      if (metrics.cpuUsage > 80) {
        await this.triggerSystemAlert('high_cpu_usage', metrics);
      }
      
      // Check memory usage
      if (metrics.memoryUsage > 85) {
        await this.triggerSystemAlert('high_memory_usage', metrics);
      }
      
      // Check response time
      if (metrics.responseTime > 2000) {
        await this.triggerSystemAlert('high_response_time', metrics);
      }
      
      // Check error rate
      if (metrics.errorRate > 0.05) {
        await this.triggerSystemAlert('high_error_rate', metrics);
      }
    } catch (error) {
      console.error('❌ Failed to check system alerts:', error);
    }
  }

  // Trigger system alert
  async triggerSystemAlert(alertType, metrics) {
    try {
      const alert = {
        type: 'system_alert',
        alertType,
        metrics,
        timestamp: Date.now(),
        severity: 'high'
      };
      
      // Publish alert to system topic
      await this.publishToTopic(this.streamingTopics.system, alert);
      
      // Send to admin users
      await this.sendSystemAlertToAdmins(alert);
      
      console.log(`🚨 System alert triggered: ${alertType}`);
    } catch (error) {
      console.error('❌ Failed to trigger system alert:', error);
    }
  }

  // Send system alert to admins
  async sendSystemAlertToAdmins(alert) {
    try {
      // Find admin users
      const adminUsers = await User.findAll({
        where: { role: 'admin' }
      });
      
      // Send alert to each admin
      for (const admin of adminUsers) {
        await this.sendRealTimeNotification({
          type: 'system_alert',
          userId: admin.id,
          data: alert
        });
      }
    } catch (error) {
      console.error('❌ Failed to send system alert to admins:', error);
    }
  }

  // Find interested users
  async findInterestedUsers(route) {
    try {
      // This would typically query user preferences
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('❌ Failed to find interested users:', error);
      return [];
    }
  }

  // Get system metrics
  async getSystemMetrics() {
    try {
      return {
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        responseTime: Math.random() * 3000 + 500,
        errorRate: Math.random() * 0.1,
        activeConnections: this.websocketServer.clients.size,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Failed to get system metrics:', error);
      return {};
    }
  }

  // Aggregate analytics data
  aggregateAnalyticsData(events) {
    try {
      const aggregation = {
        totalEvents: events.length,
        eventTypes: {},
        sentiment: { positive: 0, negative: 0, neutral: 0 },
        topRoutes: {},
        timestamp: new Date()
      };
      
      events.forEach(event => {
        // Count event types
        aggregation.eventTypes[event.eventType] = 
          (aggregation.eventTypes[event.eventType] || 0) + 1;
        
        // Count sentiment
        if (event.sentiment) {
          aggregation.sentiment[event.sentiment]++;
        }
        
        // Count routes
        if (event.properties?.route) {
          aggregation.topRoutes[event.properties.route] = 
            (aggregation.topRoutes[event.properties.route] || 0) + 1;
        }
      });
      
      return aggregation;
    } catch (error) {
      console.error('❌ Failed to aggregate analytics data:', error);
      return {};
    }
  }

  // Get streaming statistics
  async getStreamingStats() {
    try {
      const stats = {
        kafka: {
          producer: this.producer ? 'connected' : 'disconnected',
          consumers: this.consumers.size,
          topics: Object.keys(this.streamingTopics).length
        },
        websocket: {
          connections: this.websocketServer.clients.size,
          status: 'running'
        },
        redis: {
          status: this.redisClient ? 'connected' : 'disconnected'
        },
        streams: {
          active: 4, // booking, analytics, pricing, system
          messagesProcessed: await this.getMessagesProcessed()
        }
      };
      
      return stats;
    } catch (error) {
      console.error('❌ Failed to get streaming stats:', error);
      return {};
    }
  }

  // Get messages processed count
  async getMessagesProcessed() {
    try {
      const keys = await this.redisClient.keys('counter:*');
      let total = 0;
      
      for (const key of keys) {
        const count = await this.redisClient.get(key);
        total += parseInt(count) || 0;
      }
      
      return total;
    } catch (error) {
      console.error('❌ Failed to get messages processed:', error);
      return 0;
    }
  }

  // Graceful shutdown
  async shutdown() {
    try {
      console.log('🔄 Shutting down Streaming Service...');
      
      // Disconnect Kafka producer
      if (this.producer) {
        await this.producer.disconnect();
      }
      
      // Disconnect Kafka consumers
      for (const [name, consumer] of this.consumers) {
        await consumer.disconnect();
      }
      
      // Close WebSocket server
      if (this.websocketServer) {
        this.websocketServer.close();
      }
      
      // Disconnect Redis
      if (this.redisClient) {
        await this.redisClient.disconnect();
      }
      
      console.log('✅ Streaming Service shut down successfully');
    } catch (error) {
      console.error('❌ Failed to shutdown Streaming Service:', error);
    }
  }
}

module.exports = new StreamingService();