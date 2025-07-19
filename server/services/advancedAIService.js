const { User, Booking, Flight, AnalyticsEvent, ChatSession, Document } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
const natural = require('natural');
const tf = require('@tensorflow/tfjs-node');
const cv = require('opencv4nodejs');
const speech = require('@google-cloud/speech');
const textToSpeech = require('@google-cloud/text-to-speech');
const { Configuration, OpenAIApi } = require('openai');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

class AdvancedAIService {
  constructor() {
    this.isInitialized = false;
    this.nlpProcessor = new natural.LanguageProcessor();
    this.tokenizer = new natural.WordTokenizer();
    this.sentiment = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
    this.classifier = new natural.BayesClassifier();
    this.speechClient = new speech.SpeechClient();
    this.ttsClient = new textToSpeech.TextToSpeechClient();
    
    // Initialize OpenAI for advanced AI features
    this.openai = new OpenAIApi(new Configuration({
      apiKey: process.env.OPENAI_API_KEY
    }));
    
    this.initializeAI();
  }

  // Initialize AI service
  async initializeAI() {
    try {
      console.log('🤖 Initializing Advanced AI Service...');
      
      // Train NLP models
      await this.trainNLPModels();
      
      // Initialize computer vision
      await this.initializeComputerVision();
      
      // Setup voice recognition
      await this.initializeVoiceRecognition();
      
      // Initialize advanced chatbot
      await this.initializeAdvancedChatbot();
      
      this.isInitialized = true;
      console.log('✅ Advanced AI Service initialized successfully');
    } catch (error) {
      console.error('❌ Advanced AI Service initialization failed:', error);
      throw error;
    }
  }

  // Train NLP models
  async trainNLPModels() {
    try {
      console.log('📚 Training NLP models...');
      
      // Train intent classification
      this.trainIntentClassifier();
      
      // Train entity recognition
      this.trainEntityRecognizer();
      
      // Train sentiment analysis
      this.trainSentimentAnalyzer();
      
      console.log('✅ NLP models trained successfully');
    } catch (error) {
      console.error('❌ NLP training failed:', error);
      throw error;
    }
  }

  // Train intent classifier
  trainIntentClassifier() {
    // Booking intents
    this.classifier.addDocument('I want to book a flight', 'book_flight');
    this.classifier.addDocument('Book me a ticket', 'book_flight');
    this.classifier.addDocument('I need to reserve a seat', 'book_flight');
    this.classifier.addDocument('Can I get a flight to New York?', 'book_flight');
    
    // Search intents
    this.classifier.addDocument('Search for flights', 'search_flights');
    this.classifier.addDocument('Find available flights', 'search_flights');
    this.classifier.addDocument('Show me flight options', 'search_flights');
    this.classifier.addDocument('What flights are available?', 'search_flights');
    
    // Cancellation intents
    this.classifier.addDocument('I want to cancel my booking', 'cancel_booking');
    this.classifier.addDocument('Cancel my flight', 'cancel_booking');
    this.classifier.addDocument('I need to cancel my reservation', 'cancel_booking');
    
    // Information intents
    this.classifier.addDocument('What is my booking status?', 'booking_status');
    this.classifier.addDocument('Check my reservation', 'booking_status');
    this.classifier.addDocument('Show my booking details', 'booking_status');
    
    // Support intents
    this.classifier.addDocument('I need help', 'support');
    this.classifier.addDocument('Can you help me?', 'support');
    this.classifier.addDocument('I have a problem', 'support');
    this.classifier.addDocument('Support please', 'support');
    
    // Pricing intents
    this.classifier.addDocument('What is the price?', 'pricing');
    this.classifier.addDocument('How much does it cost?', 'pricing');
    this.classifier.addDocument('Show me the fare', 'pricing');
    
    this.classifier.train();
  }

  // Train entity recognizer
  trainEntityRecognizer() {
    this.entityPatterns = {
      location: [
        /(?:to|from|in|at)\s+([A-Z]{3}|[A-Za-z\s]+(?:Airport|City|Town))/gi,
        /(?:destination|origin|departure|arrival)\s+(?:is\s+)?([A-Z]{3}|[A-Za-z\s]+)/gi
      ],
      date: [
        /(?:on|for|by)\s+(\d{1,2}\/\d{1,2}\/\d{4})/gi,
        /(?:date|when)\s+(?:is\s+)?(\d{1,2}\/\d{1,2}\/\d{4})/gi,
        /(\d{1,2}\/\d{1,2}\/\d{4})/gi
      ],
      time: [
        /(?:at|by)\s+(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi,
        /(?:time|when)\s+(?:is\s+)?(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi
      ],
      passenger: [
        /(\d+)\s+(?:passenger|person|people|adult|child)/gi,
        /(?:for|with)\s+(\d+)\s+(?:passenger|person|people)/gi
      ],
      cabin: [
        /(?:in|class|cabin)\s+(economy|business|first|premium)/gi,
        /(economy|business|first|premium)\s+(?:class|cabin)/gi
      ]
    };
  }

  // Train sentiment analyzer
  trainSentimentAnalyzer() {
    // Custom sentiment training data
    this.customSentimentData = {
      positive: [
        'great service', 'excellent', 'amazing', 'wonderful', 'fantastic',
        'smooth booking', 'easy to use', 'helpful', 'satisfied', 'happy'
      ],
      negative: [
        'terrible', 'awful', 'horrible', 'disappointed', 'frustrated',
        'difficult', 'confusing', 'expensive', 'delayed', 'cancelled'
      ],
      neutral: [
        'okay', 'fine', 'normal', 'standard', 'regular', 'usual'
      ]
    };
  }

  // Initialize computer vision
  async initializeComputerVision() {
    try {
      console.log('👁️ Initializing Computer Vision...');
      
      // Load pre-trained models
      this.faceCascade = new cv.CascadeClassifier(cv.FACE_CASCADE_HAAR);
      this.eyeCascade = new cv.CascadeClassifier(cv.EYE_CASCADE_HAAR);
      
      // Initialize document processing
      this.documentProcessor = new DocumentProcessor();
      
      console.log('✅ Computer Vision initialized');
    } catch (error) {
      console.error('❌ Computer Vision initialization failed:', error);
    }
  }

  // Initialize voice recognition
  async initializeVoiceRecognition() {
    try {
      console.log('🎤 Initializing Voice Recognition...');
      
      // Test speech client connection
      await this.speechClient.initialize();
      await this.ttsClient.initialize();
      
      console.log('✅ Voice Recognition initialized');
    } catch (error) {
      console.error('❌ Voice Recognition initialization failed:', error);
    }
  }

  // Initialize advanced chatbot
  async initializeAdvancedChatbot() {
    try {
      console.log('💬 Initializing Advanced Chatbot...');
      
      // Load conversation history
      this.conversationContext = new Map();
      
      // Initialize response templates
      this.responseTemplates = this.loadResponseTemplates();
      
      console.log('✅ Advanced Chatbot initialized');
    } catch (error) {
      console.error('❌ Advanced Chatbot initialization failed:', error);
    }
  }

  // Natural Language Processing

  // Process user input
  async processUserInput(input, userId = null) {
    try {
      const processedInput = {
        original: input,
        intent: this.classifyIntent(input),
        entities: this.extractEntities(input),
        sentiment: this.analyzeSentiment(input),
        confidence: this.calculateConfidence(input),
        timestamp: new Date()
      };

      // Store context for conversation
      if (userId) {
        this.updateConversationContext(userId, processedInput);
      }

      return processedInput;
    } catch (error) {
      console.error('❌ User input processing failed:', error);
      throw error;
    }
  }

  // Classify user intent
  classifyIntent(input) {
    try {
      const classification = this.classifier.classify(input);
      const confidence = this.classifier.getClassifications(input);
      
      return {
        intent: classification,
        confidence: confidence.find(c => c.label === classification)?.value || 0,
        alternatives: confidence.slice(0, 3)
      };
    } catch (error) {
      console.error('❌ Intent classification failed:', error);
      return { intent: 'unknown', confidence: 0, alternatives: [] };
    }
  }

  // Extract entities from text
  extractEntities(input) {
    const entities = {};
    
    Object.entries(this.entityPatterns).forEach(([entityType, patterns]) => {
      entities[entityType] = [];
      
      patterns.forEach(pattern => {
        const matches = input.match(pattern);
        if (matches) {
          entities[entityType].push(...matches.slice(1));
        }
      });
    });
    
    return entities;
  }

  // Analyze sentiment
  analyzeSentiment(input) {
    try {
      const tokens = this.tokenizer.tokenize(input.toLowerCase());
      const score = this.sentiment.getSentiment(tokens);
      
      let sentiment = 'neutral';
      if (score > 0.5) sentiment = 'positive';
      else if (score < -0.5) sentiment = 'negative';
      
      return {
        sentiment,
        score,
        confidence: Math.abs(score)
      };
    } catch (error) {
      console.error('❌ Sentiment analysis failed:', error);
      return { sentiment: 'neutral', score: 0, confidence: 0 };
    }
  }

  // Calculate confidence score
  calculateConfidence(input) {
    const intentConfidence = this.classifyIntent(input).confidence;
    const entityCount = Object.values(this.extractEntities(input)).flat().length;
    const entityConfidence = Math.min(entityCount / 5, 1); // Normalize to 0-1
    
    return (intentConfidence + entityConfidence) / 2;
  }

  // Update conversation context
  updateConversationContext(userId, processedInput) {
    if (!this.conversationContext.has(userId)) {
      this.conversationContext.set(userId, []);
    }
    
    const context = this.conversationContext.get(userId);
    context.push(processedInput);
    
    // Keep only last 10 interactions
    if (context.length > 10) {
      context.shift();
    }
    
    this.conversationContext.set(userId, context);
  }

  // Computer Vision Features

  // Process document image
  async processDocumentImage(imageBuffer, documentType = 'passport') {
    try {
      const image = cv.imdecode(imageBuffer);
      
      // Preprocess image
      const processed = this.preprocessImage(image);
      
      // Extract text using OCR
      const extractedText = await this.extractTextFromImage(processed);
      
      // Extract structured data
      const structuredData = this.extractStructuredData(extractedText, documentType);
      
      // Validate document
      const validation = this.validateDocument(structuredData, documentType);
      
      return {
        success: validation.isValid,
        extractedText,
        structuredData,
        validation,
        confidence: validation.confidence
      };
    } catch (error) {
      console.error('❌ Document processing failed:', error);
      throw error;
    }
  }

  // Preprocess image
  preprocessImage(image) {
    // Convert to grayscale
    const gray = image.cvtColor(cv.COLOR_BGR2GRAY);
    
    // Apply Gaussian blur
    const blurred = gray.gaussianBlur(new cv.Size(5, 5), 0);
    
    // Apply threshold
    const threshold = blurred.threshold(0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
    
    // Apply morphological operations
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
    const processed = threshold.morphologyEx(kernel, cv.MORPH_CLOSE);
    
    return processed;
  }

  // Extract text from image
  async extractTextFromImage(image) {
    try {
      // Convert image to base64
      const buffer = cv.imencode('.png', image);
      const base64Image = buffer.toString('base64');
      
      // Use OpenAI Vision API for text extraction
      const response = await this.openai.createChatCompletion({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all text from this image. Return only the extracted text without any additional formatting or explanation.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      });
      
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('❌ Text extraction failed:', error);
      return '';
    }
  }

  // Extract structured data
  extractStructuredData(text, documentType) {
    const data = {};
    
    switch (documentType) {
      case 'passport':
        data.passportNumber = this.extractPassportNumber(text);
        data.name = this.extractName(text);
        data.dateOfBirth = this.extractDateOfBirth(text);
        data.expiryDate = this.extractExpiryDate(text);
        data.nationality = this.extractNationality(text);
        break;
        
      case 'id_card':
        data.idNumber = this.extractIDNumber(text);
        data.name = this.extractName(text);
        data.dateOfBirth = this.extractDateOfBirth(text);
        data.address = this.extractAddress(text);
        break;
        
      case 'boarding_pass':
        data.flightNumber = this.extractFlightNumber(text);
        data.passengerName = this.extractName(text);
        data.departureTime = this.extractDepartureTime(text);
        data.gate = this.extractGate(text);
        data.seat = this.extractSeat(text);
        break;
    }
    
    return data;
  }

  // Document validation
  validateDocument(data, documentType) {
    const validation = {
      isValid: true,
      errors: [],
      confidence: 0
    };
    
    switch (documentType) {
      case 'passport':
        if (!data.passportNumber) {
          validation.errors.push('Passport number not found');
          validation.isValid = false;
        }
        if (!data.name) {
          validation.errors.push('Name not found');
          validation.isValid = false;
        }
        if (!data.dateOfBirth) {
          validation.errors.push('Date of birth not found');
          validation.isValid = false;
        }
        break;
        
      case 'boarding_pass':
        if (!data.flightNumber) {
          validation.errors.push('Flight number not found');
          validation.isValid = false;
        }
        if (!data.passengerName) {
          validation.errors.push('Passenger name not found');
          validation.isValid = false;
        }
        break;
    }
    
    // Calculate confidence based on extracted fields
    const requiredFields = this.getRequiredFields(documentType);
    const extractedFields = Object.keys(data).filter(key => data[key]);
    validation.confidence = extractedFields.length / requiredFields.length;
    
    return validation;
  }

  // Voice Recognition Features

  // Convert speech to text
  async speechToText(audioBuffer, language = 'en-US') {
    try {
      const audio = {
        content: audioBuffer.toString('base64')
      };
      
      const config = {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: language,
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: true
      };
      
      const request = {
        audio: audio,
        config: config
      };
      
      const [response] = await this.speechClient.recognize(request);
      
      return {
        text: response.results
          .map(result => result.alternatives[0].transcript)
          .join(' '),
        confidence: response.results[0]?.alternatives[0]?.confidence || 0,
        words: response.results.flatMap(result => 
          result.alternatives[0].words || []
        )
      };
    } catch (error) {
      console.error('❌ Speech to text failed:', error);
      throw error;
    }
  }

  // Convert text to speech
  async textToSpeech(text, voice = 'en-US-Standard-A') {
    try {
      const request = {
        input: { text: text },
        voice: { languageCode: 'en-US', name: voice },
        audioConfig: { audioEncoding: 'MP3' }
      };
      
      const [response] = await this.ttsClient.synthesizeSpeech(request);
      
      return {
        audio: response.audioContent,
        format: 'mp3',
        duration: this.calculateAudioDuration(text)
      };
    } catch (error) {
      console.error('❌ Text to speech failed:', error);
      throw error;
    }
  }

  // Advanced Chatbot Features

  // Generate intelligent response
  async generateResponse(userInput, userId = null, context = {}) {
    try {
      // Process user input
      const processedInput = await this.processUserInput(userInput, userId);
      
      // Get conversation context
      const conversationContext = userId ? this.conversationContext.get(userId) || [] : [];
      
      // Generate response using OpenAI
      const response = await this.generateOpenAIResponse(processedInput, conversationContext, context);
      
      // Store conversation
      if (userId) {
        await this.storeConversation(userId, userInput, response.text, processedInput);
      }
      
      return {
        text: response.text,
        intent: processedInput.intent.intent,
        confidence: processedInput.confidence,
        entities: processedInput.entities,
        sentiment: processedInput.sentiment,
        actions: response.actions || [],
        suggestions: response.suggestions || []
      };
    } catch (error) {
      console.error('❌ Response generation failed:', error);
      return {
        text: 'I apologize, but I\'m having trouble processing your request. Please try again.',
        intent: 'error',
        confidence: 0,
        entities: {},
        sentiment: { sentiment: 'neutral', score: 0 },
        actions: [],
        suggestions: []
      };
    }
  }

  // Generate OpenAI response
  async generateOpenAIResponse(processedInput, conversationContext, context) {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are an intelligent travel assistant for a B2B flight booking portal. 
          You help users with flight bookings, searches, cancellations, and support.
          Be helpful, professional, and concise. If you need to perform actions, 
          include them in your response as JSON actions.`
        }
      ];
      
      // Add conversation context
      conversationContext.slice(-5).forEach(interaction => {
        messages.push({
          role: 'user',
          content: interaction.original
        });
      });
      
      // Add current user input
      messages.push({
        role: 'user',
        content: processedInput.original
      });
      
      // Add context information
      if (Object.keys(context).length > 0) {
        messages.push({
          role: 'system',
          content: `Context: ${JSON.stringify(context)}`
        });
      }
      
      const response = await this.openai.createChatCompletion({
        model: 'gpt-4',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      });
      
      const responseText = response.data.choices[0].message.content;
      
      // Extract actions and suggestions
      const actions = this.extractActions(responseText);
      const suggestions = this.generateSuggestions(processedInput);
      
      return {
        text: responseText,
        actions,
        suggestions
      };
    } catch (error) {
      console.error('❌ OpenAI response generation failed:', error);
      return {
        text: 'I apologize, but I\'m having trouble processing your request. Please try again.',
        actions: [],
        suggestions: []
      };
    }
  }

  // Extract actions from response
  extractActions(responseText) {
    const actions = [];
    
    // Look for action patterns in the response
    if (responseText.includes('search_flights')) {
      actions.push({ type: 'search_flights', parameters: {} });
    }
    
    if (responseText.includes('book_flight')) {
      actions.push({ type: 'book_flight', parameters: {} });
    }
    
    if (responseText.includes('cancel_booking')) {
      actions.push({ type: 'cancel_booking', parameters: {} });
    }
    
    return actions;
  }

  // Generate suggestions
  generateSuggestions(processedInput) {
    const suggestions = [];
    
    switch (processedInput.intent.intent) {
      case 'search_flights':
        suggestions.push('Search for flights to New York', 'Find flights to London', 'Show me available routes');
        break;
      case 'book_flight':
        suggestions.push('Book economy class', 'Book business class', 'Book for tomorrow');
        break;
      case 'support':
        suggestions.push('Contact customer service', 'View FAQ', 'Check booking status');
        break;
      default:
        suggestions.push('Search flights', 'Book a flight', 'Check my bookings', 'Get help');
    }
    
    return suggestions;
  }

  // Store conversation
  async storeConversation(userId, userInput, botResponse, processedInput) {
    try {
      await ChatSession.create({
        userId,
        userMessage: userInput,
        botResponse,
        intent: processedInput.intent.intent,
        confidence: processedInput.confidence,
        sentiment: processedInput.sentiment.sentiment,
        entities: processedInput.entities,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('❌ Failed to store conversation:', error);
    }
  }

  // Helper methods

  // Extract passport number
  extractPassportNumber(text) {
    const pattern = /[A-Z]{1,2}[0-9]{6,9}/g;
    const matches = text.match(pattern);
    return matches ? matches[0] : null;
  }

  // Extract name
  extractName(text) {
    const pattern = /([A-Z][a-z]+)\s+([A-Z][a-z]+)/g;
    const matches = text.match(pattern);
    return matches ? matches[0] : null;
  }

  // Extract date of birth
  extractDateOfBirth(text) {
    const pattern = /(\d{2}\/\d{2}\/\d{4})/g;
    const matches = text.match(pattern);
    return matches ? matches[0] : null;
  }

  // Extract expiry date
  extractExpiryDate(text) {
    const pattern = /EXP\s*(\d{2}\/\d{2}\/\d{4})/gi;
    const matches = text.match(pattern);
    return matches ? matches[1] : null;
  }

  // Extract nationality
  extractNationality(text) {
    const pattern = /NAT\s*([A-Z]{3})/gi;
    const matches = text.match(pattern);
    return matches ? matches[1] : null;
  }

  // Extract ID number
  extractIDNumber(text) {
    const pattern = /ID\s*([A-Z0-9]{6,12})/gi;
    const matches = text.match(pattern);
    return matches ? matches[1] : null;
  }

  // Extract address
  extractAddress(text) {
    const pattern = /ADDR\s*([A-Za-z0-9\s,]+)/gi;
    const matches = text.match(pattern);
    return matches ? matches[1].trim() : null;
  }

  // Extract flight number
  extractFlightNumber(text) {
    const pattern = /FLT\s*([A-Z]{2,3}\d{3,4})/gi;
    const matches = text.match(pattern);
    return matches ? matches[1] : null;
  }

  // Extract departure time
  extractDepartureTime(text) {
    const pattern = /DEP\s*(\d{2}:\d{2})/gi;
    const matches = text.match(pattern);
    return matches ? matches[1] : null;
  }

  // Extract gate
  extractGate(text) {
    const pattern = /GATE\s*([A-Z0-9]+)/gi;
    const matches = text.match(pattern);
    return matches ? matches[1] : null;
  }

  // Extract seat
  extractSeat(text) {
    const pattern = /SEAT\s*([A-Z0-9]+)/gi;
    const matches = text.match(pattern);
    return matches ? matches[1] : null;
  }

  // Get required fields for document type
  getRequiredFields(documentType) {
    const fields = {
      passport: ['passportNumber', 'name', 'dateOfBirth', 'expiryDate', 'nationality'],
      id_card: ['idNumber', 'name', 'dateOfBirth', 'address'],
      boarding_pass: ['flightNumber', 'passengerName', 'departureTime', 'gate', 'seat']
    };
    
    return fields[documentType] || [];
  }

  // Calculate audio duration
  calculateAudioDuration(text) {
    // Rough estimation: 150 words per minute
    const words = text.split(' ').length;
    return Math.ceil(words / 2.5); // seconds
  }

  // Load response templates
  loadResponseTemplates() {
    return {
      greeting: [
        'Hello! How can I help you with your flight booking today?',
        'Welcome! I\'m here to assist you with your travel needs.',
        'Hi there! Ready to help you find the perfect flight.'
      ],
      booking: [
        'I\'d be happy to help you book a flight. Where would you like to go?',
        'Let\'s get you booked! What\'s your destination?',
        'Booking a flight is easy! Where are you traveling to?'
      ],
      search: [
        'I\'ll search for available flights for you.',
        'Let me find the best flight options for your trip.',
        'Searching for flights that match your criteria.'
      ],
      support: [
        'I\'m here to help! What issue are you experiencing?',
        'Let me assist you with that. Can you provide more details?',
        'I\'ll do my best to resolve your concern. What happened?'
      ]
    };
  }

  // Get service status
  async getServiceStatus() {
    return {
      isInitialized: this.isInitialized,
      nlp: {
        intentClassifier: this.classifier ? 'ready' : 'not_ready',
        entityRecognizer: this.entityPatterns ? 'ready' : 'not_ready',
        sentimentAnalyzer: this.sentiment ? 'ready' : 'not_ready'
      },
      computerVision: {
        faceDetection: this.faceCascade ? 'ready' : 'not_ready',
        documentProcessing: this.documentProcessor ? 'ready' : 'not_ready'
      },
      voiceRecognition: {
        speechToText: this.speechClient ? 'ready' : 'not_ready',
        textToSpeech: this.ttsClient ? 'ready' : 'not_ready'
      },
      chatbot: {
        conversationContext: this.conversationContext ? 'ready' : 'not_ready',
        responseTemplates: this.responseTemplates ? 'ready' : 'not_ready'
      }
    };
  }
}

module.exports = new AdvancedAIService();