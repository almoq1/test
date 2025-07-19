const express = require('express');
const httpProxy = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const circuitBreaker = require('opossum');
const { createClient } = require('redis');

class APIGateway {
  constructor() {
    this.app = express();
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    this.serviceRegistry = new Map();
    this.circuitBreakers = new Map();
    this.loadBalancers = new Map();
    
    this.initializeServices();
    this.setupMiddleware();
    this.setupRoutes();
  }

  // Service discovery and registration
  async initializeServices() {
    this.serviceRegistry.set('auth', {
      url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
      health: '/health',
      weight: 1
    });

    this.serviceRegistry.set('booking', {
      url: process.env.BOOKING_SERVICE_URL || 'http://localhost:3002',
      health: '/health',
      weight: 1
    });

    this.serviceRegistry.set('flight', {
      url: process.env.FLIGHT_SERVICE_URL || 'http://localhost:3003',
      health: '/health',
      weight: 1
    });

    this.serviceRegistry.set('wallet', {
      url: process.env.WALLET_SERVICE_URL || 'http://localhost:3004',
      health: '/health',
      weight: 1
    });

    this.serviceRegistry.set('notification', {
      url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005',
      health: '/health',
      weight: 1
    });

    this.serviceRegistry.set('analytics', {
      url: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3006',
      health: '/health',
      weight: 1
    });

    // Initialize circuit breakers for each service
    for (const [serviceName, serviceConfig] of this.serviceRegistry) {
      this.initializeCircuitBreaker(serviceName, serviceConfig);
    }

    // Start health checks
    this.startHealthChecks();
  }

  // Circuit breaker pattern implementation
  initializeCircuitBreaker(serviceName, serviceConfig) {
    const breaker = circuitBreaker(async (req, res, next) => {
      const target = this.selectServiceInstance(serviceName);
      return await this.forwardRequest(target, req, res, next);
    }, {
      timeout: 3000, // 3 seconds
      errorThresholdPercentage: 50, // 50% error threshold
      resetTimeout: 30000, // 30 seconds reset timeout
      volumeThreshold: 10 // Minimum number of calls before circuit opens
    });

    breaker.on('open', () => {
      console.log(`Circuit breaker opened for ${serviceName}`);
      this.handleCircuitOpen(serviceName);
    });

    breaker.on('close', () => {
      console.log(`Circuit breaker closed for ${serviceName}`);
    });

    breaker.on('fallback', (result) => {
      console.log(`Circuit breaker fallback for ${serviceName}:`, result);
    });

    this.circuitBreakers.set(serviceName, breaker);
  }

  // Load balancing with health checks
  selectServiceInstance(serviceName) {
    const service = this.serviceRegistry.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    // Simple round-robin load balancing
    if (!this.loadBalancers.has(serviceName)) {
      this.loadBalancers.set(serviceName, 0);
    }

    const currentIndex = this.loadBalancers.get(serviceName);
    this.loadBalancers.set(serviceName, (currentIndex + 1) % service.instances?.length || 1);

    return service.instances?.[currentIndex] || service.url;
  }

  // Health check monitoring
  async startHealthChecks() {
    setInterval(async () => {
      for (const [serviceName, serviceConfig] of this.serviceRegistry) {
        await this.checkServiceHealth(serviceName, serviceConfig);
      }
    }, 30000); // Check every 30 seconds
  }

  async checkServiceHealth(serviceName, serviceConfig) {
    try {
      const response = await fetch(`${serviceConfig.url}${serviceConfig.health}`);
      const isHealthy = response.ok;
      
      if (!isHealthy) {
        console.warn(`Service ${serviceName} is unhealthy`);
        this.markServiceUnhealthy(serviceName);
      } else {
        this.markServiceHealthy(serviceName);
      }
    } catch (error) {
      console.error(`Health check failed for ${serviceName}:`, error);
      this.markServiceUnhealthy(serviceName);
    }
  }

  markServiceUnhealthy(serviceName) {
    const service = this.serviceRegistry.get(serviceName);
    if (service) {
      service.healthy = false;
      service.lastFailure = Date.now();
    }
  }

  markServiceHealthy(serviceName) {
    const service = this.serviceRegistry.get(serviceName);
    if (service) {
      service.healthy = true;
      service.lastSuccess = Date.now();
    }
  }

  // Request forwarding with middleware
  async forwardRequest(target, req, res, next) {
    const proxy = httpProxy.createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        '^/api/gateway': ''
      },
      onProxyReq: (proxyReq, req, res) => {
        // Add request tracing
        proxyReq.setHeader('X-Request-ID', req.headers['x-request-id'] || this.generateRequestId());
        proxyReq.setHeader('X-User-ID', req.user?.id);
        proxyReq.setHeader('X-Company-ID', req.user?.companyId);
      },
      onProxyRes: (proxyRes, req, res) => {
        // Add response headers
        proxyRes.headers['X-Gateway-Processed'] = 'true';
        proxyRes.headers['X-Service-Response-Time'] = Date.now() - req.startTime;
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(502).json({
          error: 'Service temporarily unavailable',
          message: 'The requested service is currently unavailable'
        });
      }
    });

    return new Promise((resolve, reject) => {
      proxy(req, res, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Middleware setup
  setupMiddleware() {
    // Request timing
    this.app.use((req, res, next) => {
      req.startTime = Date.now();
      next();
    });

    // Request ID generation
    this.app.use((req, res, next) => {
      req.headers['x-request-id'] = req.headers['x-request-id'] || this.generateRequestId();
      next();
    });

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests',
        message: 'Please try again later'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/gateway', limiter);

    // Authentication middleware
    this.app.use('/api/gateway', this.authenticateRequest.bind(this));

    // Request logging
    this.app.use('/api/gateway', this.logRequest.bind(this));

    // CORS
    this.app.use('/api/gateway', (req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      next();
    });
  }

  // Route setup
  setupRoutes() {
    // Service routing
    this.app.use('/api/gateway/auth', this.routeToService('auth'));
    this.app.use('/api/gateway/bookings', this.routeToService('booking'));
    this.app.use('/api/gateway/flights', this.routeToService('flight'));
    this.app.use('/api/gateway/wallet', this.routeToService('wallet'));
    this.app.use('/api/gateway/notifications', this.routeToService('notification'));
    this.app.use('/api/gateway/analytics', this.routeToService('analytics'));

    // Gateway health check
    this.app.get('/api/gateway/health', (req, res) => {
      const healthStatus = this.getGatewayHealth();
      res.json(healthStatus);
    });

    // Service discovery endpoint
    this.app.get('/api/gateway/services', (req, res) => {
      const services = Array.from(this.serviceRegistry.entries()).map(([name, config]) => ({
        name,
        url: config.url,
        healthy: config.healthy,
        lastCheck: config.lastSuccess || config.lastFailure
      }));
      res.json(services);
    });

    // Metrics endpoint
    this.app.get('/api/gateway/metrics', (req, res) => {
      const metrics = this.getGatewayMetrics();
      res.json(metrics);
    });
  }

  // Service routing with circuit breaker
  routeToService(serviceName) {
    return async (req, res, next) => {
      try {
        const breaker = this.circuitBreakers.get(serviceName);
        if (!breaker) {
          return res.status(503).json({
            error: 'Service not available',
            message: `Service ${serviceName} is not configured`
          });
        }

        await breaker.fire(req, res, next);
      } catch (error) {
        console.error(`Error routing to ${serviceName}:`, error);
        res.status(503).json({
          error: 'Service temporarily unavailable',
          message: 'The requested service is currently unavailable'
        });
      }
    };
  }

  // Authentication middleware
  async authenticateRequest(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No authorization header provided'
      });
    }

    try {
      // Forward authentication to auth service
      const authService = this.serviceRegistry.get('auth');
      const response = await fetch(`${authService.url}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid or expired token'
        });
      }

      const userData = await response.json();
      req.user = userData;
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(500).json({
        error: 'Authentication service error',
        message: 'Unable to verify authentication'
      });
    }
  }

  // Request logging
  logRequest(req, res, next) {
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      userId: req.user?.id,
      companyId: req.user?.companyId,
      requestId: req.headers['x-request-id']
    };

    console.log('API Gateway Request:', logData);
    
    // Store in Redis for analytics
    this.redis.lpush('gateway_logs', JSON.stringify(logData));
    this.redis.ltrim('gateway_logs', 0, 9999); // Keep last 10,000 logs

    next();
  }

  // Circuit breaker fallback handling
  handleCircuitOpen(serviceName) {
    // Implement fallback strategies
    console.log(`Implementing fallback for ${serviceName}`);
    
    // Could implement:
    // - Cached responses
    // - Alternative service endpoints
    // - Graceful degradation
  }

  // Gateway health status
  getGatewayHealth() {
    const services = Array.from(this.serviceRegistry.entries()).map(([name, config]) => ({
      name,
      healthy: config.healthy,
      lastCheck: config.lastSuccess || config.lastFailure
    }));

    const healthyServices = services.filter(s => s.healthy).length;
    const totalServices = services.length;

    return {
      status: healthyServices === totalServices ? 'healthy' : 'degraded',
      services,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  // Gateway metrics
  getGatewayMetrics() {
    const metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0
      },
      services: {},
      circuitBreakers: {}
    };

    // Get circuit breaker stats
    for (const [serviceName, breaker] of this.circuitBreakers) {
      metrics.circuitBreakers[serviceName] = {
        state: breaker.opened ? 'open' : 'closed',
        fallbackCount: breaker.fallbackCount,
        successCount: breaker.successCount,
        failureCount: breaker.failureCount
      };
    }

    return metrics;
  }

  // Utility methods
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Start the gateway
  start(port = 3000) {
    this.app.listen(port, () => {
      console.log(`API Gateway running on port ${port}`);
    });
  }
}

module.exports = APIGateway;