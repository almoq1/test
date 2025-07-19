const nodemailer = require('nodemailer');
const twilio = require('twilio');
const WebSocket = require('ws');
const { User, Company, Booking, Notification } = require('../models');
const { Op } = require('sequelize');

class NotificationService {
  constructor() {
    this.emailTransporter = this.setupEmailTransporter();
    this.smsClient = this.setupSMSClient();
    this.websocketConnections = new Map();
    this.notificationTemplates = this.loadNotificationTemplates();
  }

  // Real-time WebSocket notifications
  setupWebSocketServer(server) {
    this.wss = new WebSocket.Server({ server });
    
    this.wss.on('connection', (ws, req) => {
      const userId = this.extractUserIdFromRequest(req);
      if (userId) {
        this.websocketConnections.set(userId, ws);
        
        ws.on('close', () => {
          this.websocketConnections.delete(userId);
        });
      }
    });
  }

  // Send real-time notification
  async sendRealTimeNotification(userId, notification) {
    const ws = this.websocketConnections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(notification));
    }
  }

  // Email notifications
  async sendEmailNotification(userId, template, data = {}) {
    try {
      const user = await User.findByPk(userId);
      if (!user) throw new Error('User not found');

      const emailContent = this.renderEmailTemplate(template, {
        ...data,
        user: user.toJSON(),
        company: user.company?.toJSON()
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      
      // Log notification
      await this.logNotification(userId, 'email', template, data, result);
      
      return result;
    } catch (error) {
      console.error('Email notification error:', error);
      throw error;
    }
  }

  // SMS notifications
  async sendSMSNotification(userId, template, data = {}) {
    try {
      const user = await User.findByPk(userId);
      if (!user?.phoneNumber) throw new Error('User phone number not found');

      const smsContent = this.renderSMSTemplate(template, {
        ...data,
        user: user.toJSON()
      });

      const result = await this.smsClient.messages.create({
        body: smsContent,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: user.phoneNumber
      });

      // Log notification
      await this.logNotification(userId, 'sms', template, data, result);
      
      return result;
    } catch (error) {
      console.error('SMS notification error:', error);
      throw error;
    }
  }

  // Push notifications
  async sendPushNotification(userId, notification) {
    try {
      const user = await User.findByPk(userId);
      if (!user?.pushToken) throw new Error('User push token not found');

      // Implement push notification logic (Firebase, OneSignal, etc.)
      const pushResult = await this.sendToPushService(user.pushToken, notification);
      
      // Log notification
      await this.logNotification(userId, 'push', 'custom', notification, pushResult);
      
      return pushResult;
    } catch (error) {
      console.error('Push notification error:', error);
      throw error;
    }
  }

  // Bulk notifications
  async sendBulkNotifications(userIds, template, data = {}) {
    const results = [];
    
    for (const userId of userIds) {
      try {
        const result = await this.sendMultiChannelNotification(userId, template, data);
        results.push({ userId, success: true, result });
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }
    
    return results;
  }

  // Multi-channel notification
  async sendMultiChannelNotification(userId, template, data = {}) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');

    const notificationPreferences = user.notificationPreferences || {};
    const results = {};

    // Send based on user preferences
    if (notificationPreferences.email !== false) {
      try {
        results.email = await this.sendEmailNotification(userId, template, data);
      } catch (error) {
        results.email = { error: error.message };
      }
    }

    if (notificationPreferences.sms && user.phoneNumber) {
      try {
        results.sms = await this.sendSMSNotification(userId, template, data);
      } catch (error) {
        results.sms = { error: error.message };
      }
    }

    if (notificationPreferences.push && user.pushToken) {
      try {
        results.push = await this.sendPushNotification(userId, data);
      } catch (error) {
        results.push = { error: error.message };
      }
    }

    // Real-time notification
    try {
      await this.sendRealTimeNotification(userId, {
        type: template,
        data,
        timestamp: new Date()
      });
      results.realtime = { success: true };
    } catch (error) {
      results.realtime = { error: error.message };
    }

    return results;
  }

  // Booking-specific notifications
  async sendBookingConfirmation(bookingId) {
    const booking = await Booking.findByPk(bookingId, {
      include: [
        { model: User, as: 'user' },
        { model: Flight, as: 'flight' }
      ]
    });

    if (!booking) throw new Error('Booking not found');

    const notificationData = {
      booking: booking.toJSON(),
      flight: booking.flight.toJSON(),
      user: booking.user.toJSON()
    };

    // Send to booking user
    await this.sendMultiChannelNotification(booking.userId, 'booking_confirmation', notificationData);

    // Send to company admin if different from user
    if (booking.user.companyId && booking.user.role !== 'company_admin') {
      const companyAdmin = await User.findOne({
        where: { 
          companyId: booking.user.companyId,
          role: 'company_admin'
        }
      });
      
      if (companyAdmin) {
        await this.sendMultiChannelNotification(companyAdmin.id, 'company_booking_notification', notificationData);
      }
    }
  }

  async sendBookingReminder(bookingId) {
    const booking = await Booking.findByPk(bookingId, {
      include: [
        { model: User, as: 'user' },
        { model: Flight, as: 'flight' }
      ]
    });

    if (!booking) throw new Error('Booking not found');

    const notificationData = {
      booking: booking.toJSON(),
      flight: booking.flight.toJSON(),
      user: booking.user.toJSON()
    };

    await this.sendMultiChannelNotification(booking.userId, 'booking_reminder', notificationData);
  }

  async sendFlightStatusUpdate(flightId, status) {
    const bookings = await Booking.findAll({
      where: { flightId },
      include: [
        { model: User, as: 'user' },
        { model: Flight, as: 'flight' }
      ]
    });

    for (const booking of bookings) {
      const notificationData = {
        booking: booking.toJSON(),
        flight: booking.flight.toJSON(),
        user: booking.user.toJSON(),
        status
      };

      await this.sendMultiChannelNotification(booking.userId, 'flight_status_update', notificationData);
    }
  }

  // Wallet notifications
  async sendWalletNotification(userId, transactionType, amount, balance) {
    const notificationData = {
      transactionType,
      amount,
      balance,
      timestamp: new Date()
    };

    await this.sendMultiChannelNotification(userId, 'wallet_transaction', notificationData);
  }

  // System notifications
  async sendSystemNotification(userIds, message, priority = 'normal') {
    const notificationData = {
      message,
      priority,
      timestamp: new Date()
    };

    for (const userId of userIds) {
      await this.sendMultiChannelNotification(userId, 'system_notification', notificationData);
    }
  }

  // Setup methods
  setupEmailTransporter() {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  setupSMSClient() {
    return twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  // Template rendering
  renderEmailTemplate(template, data) {
    const templateConfig = this.notificationTemplates.email[template];
    if (!templateConfig) throw new Error(`Email template '${template}' not found`);

    return {
      subject: this.interpolate(templateConfig.subject, data),
      html: this.interpolate(templateConfig.html, data),
      text: this.interpolate(templateConfig.text, data)
    };
  }

  renderSMSTemplate(template, data) {
    const templateConfig = this.notificationTemplates.sms[template];
    if (!templateConfig) throw new Error(`SMS template '${template}' not found`);

    return this.interpolate(templateConfig, data);
  }

  interpolate(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  loadNotificationTemplates() {
    return {
      email: {
        booking_confirmation: {
          subject: 'Booking Confirmation - {{booking.bookingNumber}}',
          html: `
            <h2>Booking Confirmed!</h2>
            <p>Dear {{user.firstName}},</p>
            <p>Your booking has been confirmed.</p>
            <h3>Flight Details:</h3>
            <p>From: {{flight.origin}} to {{flight.destination}}</p>
            <p>Date: {{flight.departureDate}}</p>
            <p>Amount: ${{booking.totalAmount}}</p>
          `,
          text: `
            Booking Confirmed!
            Dear {{user.firstName}},
            Your booking has been confirmed.
            Flight: {{flight.origin}} to {{flight.destination}}
            Date: {{flight.departureDate}}
            Amount: ${{booking.totalAmount}}
          `
        },
        booking_reminder: {
          subject: 'Flight Reminder - {{flight.origin}} to {{flight.destination}}',
          html: `
            <h2>Flight Reminder</h2>
            <p>Dear {{user.firstName}},</p>
            <p>This is a reminder for your upcoming flight.</p>
            <h3>Flight Details:</h3>
            <p>From: {{flight.origin}} to {{flight.destination}}</p>
            <p>Date: {{flight.departureDate}}</p>
            <p>Time: {{flight.departureTime}}</p>
          `,
          text: `
            Flight Reminder
            Dear {{user.firstName}},
            This is a reminder for your upcoming flight.
            Flight: {{flight.origin}} to {{flight.destination}}
            Date: {{flight.departureDate}}
            Time: {{flight.departureTime}}
          `
        },
        wallet_transaction: {
          subject: 'Wallet Transaction - {{transactionType}}',
          html: `
            <h2>Wallet Transaction</h2>
            <p>Transaction Type: {{transactionType}}</p>
            <p>Amount: ${{amount}}</p>
            <p>New Balance: ${{balance}}</p>
            <p>Time: {{timestamp}}</p>
          `,
          text: `
            Wallet Transaction
            Type: {{transactionType}}
            Amount: ${{amount}}
            Balance: ${{balance}}
            Time: {{timestamp}}
          `
        }
      },
      sms: {
        booking_confirmation: 'Booking confirmed! Flight {{flight.origin}}-{{flight.destination}} on {{flight.departureDate}}. Amount: ${{booking.totalAmount}}',
        booking_reminder: 'Flight reminder: {{flight.origin}}-{{flight.destination}} on {{flight.departureDate}} at {{flight.departureTime}}',
        wallet_transaction: 'Wallet {{transactionType}}: ${{amount}}. New balance: ${{balance}}',
        flight_status_update: 'Flight {{flight.origin}}-{{flight.destination}} status: {{status}}'
      }
    };
  }

  // Utility methods
  extractUserIdFromRequest(req) {
    // Extract user ID from request (implement based on your auth strategy)
    return req.headers['user-id'] || null;
  }

  async sendToPushService(pushToken, notification) {
    // Implement push notification service integration
    // This could be Firebase, OneSignal, or other services
    console.log('Push notification:', { pushToken, notification });
    return { success: true };
  }

  async logNotification(userId, channel, template, data, result) {
    try {
      await Notification.create({
        userId,
        channel,
        template,
        data: JSON.stringify(data),
        result: JSON.stringify(result),
        sentAt: new Date()
      });
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }

  // Notification preferences management
  async updateNotificationPreferences(userId, preferences) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');

    await user.update({
      notificationPreferences: {
        ...user.notificationPreferences,
        ...preferences
      }
    });
  }

  async getNotificationHistory(userId, limit = 50) {
    return await Notification.findAll({
      where: { userId },
      order: [['sentAt', 'DESC']],
      limit
    });
  }
}

module.exports = new NotificationService();