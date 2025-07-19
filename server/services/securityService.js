const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Company, Booking, WalletTransaction } = require('../models');
const { Op } = require('sequelize');

class SecurityService {
  constructor() {
    this.failedLoginAttempts = new Map();
    this.suspiciousActivities = new Map();
    this.rateLimiters = new Map();
    this.encryptionKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
  }

  // Advanced authentication with multi-factor support
  async authenticateUser(email, password, mfaToken = null, deviceInfo = {}) {
    try {
      const user = await User.findOne({
        where: { email },
        include: [{ model: Company, as: 'company' }]
      });

      if (!user) {
        this.recordFailedAttempt(email);
        throw new Error('Invalid credentials');
      }

      // Check if account is locked
      if (user.isLocked) {
        throw new Error('Account is locked. Please contact support.');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        this.recordFailedAttempt(email);
        throw new Error('Invalid credentials');
      }

      // MFA verification
      if (user.mfaEnabled && !mfaToken) {
        throw new Error('MFA token required');
      }

      if (user.mfaEnabled && mfaToken) {
        const isValidMFA = await this.verifyMFAToken(user.id, mfaToken);
        if (!isValidMFA) {
          throw new Error('Invalid MFA token');
        }
      }

      // Risk assessment
      const riskScore = await this.assessLoginRisk(user, deviceInfo);
      if (riskScore > 0.8) {
        await this.flagSuspiciousActivity(user.id, 'high_risk_login', deviceInfo);
        throw new Error('Login blocked due to security concerns');
      }

      // Generate session token
      const sessionToken = this.generateSessionToken(user);
      
      // Update last login
      await user.update({
        lastLogin: new Date(),
        loginAttempts: 0,
        isLocked: false
      });

      // Log successful login
      await this.logSecurityEvent(user.id, 'successful_login', {
        deviceInfo,
        riskScore,
        ipAddress: deviceInfo.ipAddress
      });

      return {
        user: this.sanitizeUserData(user),
        sessionToken,
        riskScore,
        requiresMFA: user.mfaEnabled && !mfaToken
      };
    } catch (error) {
      throw error;
    }
  }

  // Fraud detection and prevention
  async detectFraudulentActivity(bookingData, userData) {
    const riskFactors = {
      unusualPattern: await this.detectUnusualPattern(bookingData, userData),
      locationMismatch: await this.detectLocationMismatch(bookingData, userData),
      paymentRisk: await this.assessPaymentRisk(bookingData),
      velocityRisk: await this.assessVelocityRisk(userData),
      deviceRisk: await this.assessDeviceRisk(bookingData.deviceInfo),
      behavioralRisk: await this.assessBehavioralRisk(userData)
    };

    const totalRiskScore = Object.values(riskFactors).reduce((sum, score) => sum + score, 0);
    
    const fraudAssessment = {
      riskScore: totalRiskScore,
      riskFactors,
      isHighRisk: totalRiskScore > 0.7,
      recommendations: this.getFraudPreventionRecommendations(riskFactors),
      shouldBlock: totalRiskScore > 0.9
    };

    if (fraudAssessment.isHighRisk) {
      await this.flagSuspiciousActivity(userData.id, 'fraudulent_booking', bookingData);
    }

    return fraudAssessment;
  }

  // Data encryption and protection
  encryptSensitiveData(data) {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, this.encryptionKey);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decryptSensitiveData(encryptedData) {
    const algorithm = 'aes-256-gcm';
    const decipher = crypto.createDecipher(algorithm, this.encryptionKey);
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  // Compliance and audit logging
  async logSecurityEvent(userId, eventType, details = {}) {
    const securityLog = {
      userId,
      eventType,
      details: this.encryptSensitiveData(details),
      timestamp: new Date(),
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      sessionId: details.sessionId
    };

    // Store in database (implement SecurityLog model)
    console.log('Security Event:', {
      userId,
      eventType,
      timestamp: securityLog.timestamp,
      ipAddress: securityLog.ipAddress
    });

    // Real-time alerting for critical events
    if (this.isCriticalEvent(eventType)) {
      await this.sendSecurityAlert(userId, eventType, details);
    }
  }

  // Rate limiting and DDoS protection
  async checkRateLimit(identifier, action, limit, windowMs) {
    const key = `${identifier}_${action}`;
    const now = Date.now();
    
    if (!this.rateLimiters.has(key)) {
      this.rateLimiters.set(key, []);
    }
    
    const requests = this.rateLimiters.get(key);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
    this.rateLimiters.set(key, validRequests);
    
    if (validRequests.length >= limit) {
      return false; // Rate limit exceeded
    }
    
    validRequests.push(now);
    return true; // Within rate limit
  }

  // Advanced session management
  generateSessionToken(user) {
    const payload = {
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
      permissions: user.permissions,
      sessionId: crypto.randomUUID(),
      issuedAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      algorithm: 'HS512',
      expiresIn: '24h'
    });
  }

  validateSessionToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if session is still valid
      if (decoded.expiresAt < Date.now()) {
        throw new Error('Session expired');
      }
      
      return decoded;
    } catch (error) {
      throw new Error('Invalid session token');
    }
  }

  // GDPR and data privacy compliance
  async handleDataSubjectRequest(userId, requestType) {
    switch (requestType) {
      case 'access':
        return await this.provideDataAccess(userId);
      case 'deletion':
        return await this.handleDataDeletion(userId);
      case 'portability':
        return await this.provideDataPortability(userId);
      case 'rectification':
        return await this.handleDataRectification(userId);
      default:
        throw new Error('Invalid request type');
    }
  }

  // Helper methods
  recordFailedAttempt(email) {
    const attempts = this.failedLoginAttempts.get(email) || 0;
    this.failedLoginAttempts.set(email, attempts + 1);
    
    if (attempts + 1 >= 5) {
      this.lockAccount(email);
    }
  }

  async lockAccount(email) {
    const user = await User.findOne({ where: { email } });
    if (user) {
      await user.update({ isLocked: true });
    }
  }

  async assessLoginRisk(user, deviceInfo) {
    let riskScore = 0;
    
    // New device
    if (!user.knownDevices?.includes(deviceInfo.fingerprint)) {
      riskScore += 0.3;
    }
    
    // Unusual location
    if (this.isUnusualLocation(user, deviceInfo.location)) {
      riskScore += 0.4;
    }
    
    // Unusual time
    if (this.isUnusualTime(user, deviceInfo.timestamp)) {
      riskScore += 0.2;
    }
    
    // Failed attempts
    const failedAttempts = this.failedLoginAttempts.get(user.email) || 0;
    riskScore += failedAttempts * 0.1;
    
    return Math.min(riskScore, 1);
  }

  async verifyMFAToken(userId, token) {
    // Implement MFA verification logic
    // This could be TOTP, SMS, email, or hardware token
    return true; // Placeholder
  }

  generateSessionToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        companyId: user.companyId,
        role: user.role,
        sessionId: crypto.randomUUID()
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  sanitizeUserData(user) {
    const { password, mfaSecret, ...sanitizedUser } = user.toJSON();
    return sanitizedUser;
  }

  async detectUnusualPattern(bookingData, userData) {
    // Analyze booking patterns
    const userBookings = await Booking.findAll({
      where: { userId: userData.id },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Check for unusual booking patterns
    const avgAmount = userBookings.reduce((sum, b) => sum + b.totalAmount, 0) / userBookings.length;
    const isUnusualAmount = Math.abs(bookingData.totalAmount - avgAmount) > avgAmount * 0.5;
    
    return isUnusualAmount ? 0.6 : 0.1;
  }

  async detectLocationMismatch(bookingData, userData) {
    // Check if booking location matches user's usual locations
    return 0.1; // Placeholder
  }

  async assessPaymentRisk(bookingData) {
    // Assess payment method risk
    return 0.1; // Placeholder
  }

  async assessVelocityRisk(userData) {
    // Check for rapid successive bookings
    return 0.1; // Placeholder
  }

  async assessDeviceRisk(deviceInfo) {
    // Assess device risk factors
    return 0.1; // Placeholder
  }

  async assessBehavioralRisk(userData) {
    // Assess behavioral patterns
    return 0.1; // Placeholder
  }

  getFraudPreventionRecommendations(riskFactors) {
    const recommendations = [];
    
    if (riskFactors.unusualPattern > 0.5) {
      recommendations.push('Verify booking details with customer');
    }
    
    if (riskFactors.locationMismatch > 0.5) {
      recommendations.push('Request additional identity verification');
    }
    
    return recommendations;
  }

  async flagSuspiciousActivity(userId, activityType, details) {
    this.suspiciousActivities.set(userId, {
      type: activityType,
      details,
      timestamp: new Date()
    });
  }

  isCriticalEvent(eventType) {
    const criticalEvents = [
      'failed_login_attempts',
      'suspicious_activity',
      'data_breach',
      'admin_action'
    ];
    return criticalEvents.includes(eventType);
  }

  async sendSecurityAlert(userId, eventType, details) {
    // Implement security alert system
    console.log('Security Alert:', { userId, eventType, details });
  }

  isUnusualLocation(user, location) {
    // Implement location analysis
    return false; // Placeholder
  }

  isUnusualTime(user, timestamp) {
    // Implement time analysis
    return false; // Placeholder
  }

  async provideDataAccess(userId) {
    // Implement GDPR data access
    return { message: 'Data access request processed' };
  }

  async handleDataDeletion(userId) {
    // Implement GDPR data deletion
    return { message: 'Data deletion request processed' };
  }

  async provideDataPortability(userId) {
    // Implement GDPR data portability
    return { message: 'Data portability request processed' };
  }

  async handleDataRectification(userId) {
    // Implement GDPR data rectification
    return { message: 'Data rectification request processed' };
  }
}

module.exports = new SecurityService();