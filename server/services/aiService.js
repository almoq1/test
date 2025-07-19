const OpenAI = require('openai');
const { Flight, Booking, User } = require('../models');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.pricePredictionModel = null;
    this.recommendationEngine = null;
  }

  // AI-powered flight recommendations
  async getPersonalizedRecommendations(userId, searchCriteria) {
    try {
      // Get user's booking history
      const userBookings = await Booking.findAll({
        where: { userId },
        include: [{
          model: Flight,
          as: 'flight'
        }],
        order: [['createdAt', 'DESC']],
        limit: 50
      });

      // Analyze user preferences
      const preferences = this.analyzeUserPreferences(userBookings);
      
      // Get AI recommendations
      const prompt = this.buildRecommendationPrompt(preferences, searchCriteria);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a travel recommendation expert. Provide personalized flight recommendations based on user preferences and search criteria."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500
      });

      return {
        recommendations: completion.choices[0].message.content,
        preferences: preferences,
        confidence: this.calculateRecommendationConfidence(preferences)
      };
    } catch (error) {
      console.error('AI recommendation error:', error);
      return { recommendations: [], preferences: {}, confidence: 0 };
    }
  }

  // Price prediction using ML
  async predictFlightPrice(flightData) {
    try {
      // Historical price analysis
      const historicalPrices = await this.getHistoricalPrices(flightData);
      
      // Market demand analysis
      const demandFactor = await this.analyzeMarketDemand(flightData);
      
      // Seasonal factors
      const seasonalFactor = this.calculateSeasonalFactor(flightData.departureDate);
      
      // Fuel price impact
      const fuelImpact = await this.getFuelPriceImpact();
      
      // Predict price
      const basePrice = flightData.basePrice;
      const predictedPrice = basePrice * demandFactor * seasonalFactor * fuelImpact;
      
      return {
        predictedPrice: Math.round(predictedPrice * 100) / 100,
        confidence: this.calculatePricePredictionConfidence(historicalPrices),
        factors: {
          demandFactor,
          seasonalFactor,
          fuelImpact,
          historicalTrend: this.calculateHistoricalTrend(historicalPrices)
        }
      };
    } catch (error) {
      console.error('Price prediction error:', error);
      return { predictedPrice: flightData.basePrice, confidence: 0 };
    }
  }

  // Intelligent customer support chatbot
  async getChatbotResponse(userMessage, context = {}) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a helpful customer support agent for a B2B flight booking portal. 
            You can help with booking inquiries, flight information, wallet management, and general support.
            Be professional, concise, and helpful. If you need to escalate, mention that a human agent will contact them.`
          },
          {
            role: "user",
            content: `Context: ${JSON.stringify(context)}\n\nUser: ${userMessage}`
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      return {
        response: completion.choices[0].message.content,
        confidence: this.calculateResponseConfidence(userMessage),
        shouldEscalate: this.shouldEscalateToHuman(userMessage)
      };
    } catch (error) {
      console.error('Chatbot error:', error);
      return {
        response: "I apologize, but I'm having trouble processing your request. Please contact our support team for assistance.",
        confidence: 0,
        shouldEscalate: true
      };
    }
  }

  // Fraud detection
  async detectFraudulentActivity(bookingData, userData) {
    try {
      const riskFactors = {
        unusualPattern: this.detectUnusualPattern(bookingData, userData),
        locationMismatch: this.detectLocationMismatch(bookingData, userData),
        paymentRisk: this.assessPaymentRisk(bookingData),
        velocityRisk: this.assessVelocityRisk(userData)
      };

      const totalRiskScore = Object.values(riskFactors).reduce((sum, score) => sum + score, 0);
      
      return {
        riskScore: totalRiskScore,
        riskFactors,
        isHighRisk: totalRiskScore > 0.7,
        recommendations: this.getFraudPreventionRecommendations(riskFactors)
      };
    } catch (error) {
      console.error('Fraud detection error:', error);
      return { riskScore: 0, riskFactors: {}, isHighRisk: false };
    }
  }

  // Dynamic pricing optimization
  async optimizePricing(flightId, marketConditions) {
    try {
      const flight = await Flight.findByPk(flightId);
      if (!flight) throw new Error('Flight not found');

      const demand = await this.analyzeDemand(flight);
      const competition = await this.analyzeCompetition(flight);
      const costs = await this.analyzeCosts(flight);

      const optimalPrice = this.calculateOptimalPrice(demand, competition, costs, marketConditions);

      return {
        currentPrice: flight.basePrice,
        optimalPrice,
        priceChange: optimalPrice - flight.basePrice,
        recommendations: this.getPricingRecommendations(demand, competition, costs)
      };
    } catch (error) {
      console.error('Pricing optimization error:', error);
      return null;
    }
  }

  // Helper methods
  analyzeUserPreferences(bookings) {
    const preferences = {
      preferredAirlines: {},
      preferredRoutes: {},
      preferredCabinClass: {},
      preferredTimes: {},
      averageBudget: 0
    };

    bookings.forEach(booking => {
      // Analyze airline preferences
      const airline = booking.flight.airline?.name;
      preferences.preferredAirlines[airline] = (preferences.preferredAirlines[airline] || 0) + 1;

      // Analyze route preferences
      const route = `${booking.flight.origin}-${booking.flight.destination}`;
      preferences.preferredRoutes[route] = (preferences.preferredRoutes[route] || 0) + 1;

      // Analyze cabin class preferences
      preferences.preferredCabinClass[booking.cabinClass] = (preferences.preferredCabinClass[booking.cabinClass] || 0) + 1;

      // Analyze budget
      preferences.averageBudget += booking.totalAmount;
    });

    preferences.averageBudget /= bookings.length;

    return preferences;
  }

  buildRecommendationPrompt(preferences, searchCriteria) {
    return `
    User Preferences Analysis:
    - Preferred Airlines: ${JSON.stringify(preferences.preferredAirlines)}
    - Preferred Routes: ${JSON.stringify(preferences.preferredRoutes)}
    - Preferred Cabin Class: ${JSON.stringify(preferences.preferredCabinClass)}
    - Average Budget: $${preferences.averageBudget}

    Search Criteria:
    - Origin: ${searchCriteria.origin}
    - Destination: ${searchCriteria.destination}
    - Date: ${searchCriteria.departureDate}
    - Passengers: ${searchCriteria.passengers}

    Please provide personalized flight recommendations based on this data.
    `;
  }

  calculateRecommendationConfidence(preferences) {
    const totalBookings = Object.values(preferences.preferredAirlines).reduce((sum, count) => sum + count, 0);
    return Math.min(totalBookings / 10, 1); // Higher confidence with more booking history
  }

  shouldEscalateToHuman(message) {
    const escalationKeywords = [
      'complaint', 'refund', 'cancel', 'urgent', 'emergency', 'problem',
      'issue', 'wrong', 'error', 'broken', 'not working'
    ];
    
    return escalationKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  detectUnusualPattern(bookingData, userData) {
    // Implement pattern detection logic
    return 0.1; // Placeholder
  }

  detectLocationMismatch(bookingData, userData) {
    // Implement location mismatch detection
    return 0.05; // Placeholder
  }

  assessPaymentRisk(bookingData) {
    // Implement payment risk assessment
    return 0.1; // Placeholder
  }

  assessVelocityRisk(userData) {
    // Implement velocity risk assessment
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

  async getHistoricalPrices(flightData) {
    // Implement historical price fetching
    return [];
  }

  async analyzeMarketDemand(flightData) {
    // Implement market demand analysis
    return 1.0; // Placeholder
  }

  calculateSeasonalFactor(departureDate) {
    // Implement seasonal factor calculation
    return 1.0; // Placeholder
  }

  async getFuelPriceImpact() {
    // Implement fuel price impact calculation
    return 1.0; // Placeholder
  }

  calculatePricePredictionConfidence(historicalPrices) {
    // Implement confidence calculation based on data quality
    return 0.8; // Placeholder
  }

  calculateHistoricalTrend(historicalPrices) {
    // Implement historical trend calculation
    return 'stable'; // Placeholder
  }

  calculateResponseConfidence(message) {
    // Implement response confidence calculation
    return 0.9; // Placeholder
  }
}

module.exports = new AIService();