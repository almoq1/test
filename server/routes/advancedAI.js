const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const advancedAIService = require('../services/advancedAIService');
const streamingService = require('../services/streamingService');
const edgeComputingService = require('../services/edgeComputingService');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp3|wav|mp4|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image, audio, and video files are allowed'));
    }
  }
});

// Advanced AI Service Status
router.get('/status', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [aiStatus, streamingStatus, edgeStatus] = await Promise.all([
      advancedAIService.getServiceStatus(),
      streamingService.getStreamingStats(),
      edgeComputingService.getServiceStatus()
    ]);
    
    res.json({
      advancedAI: aiStatus,
      streaming: streamingStatus,
      edgeComputing: edgeStatus,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Advanced AI status error:', error);
    res.status(500).json({ error: 'Failed to get service status' });
  }
});

// Natural Language Processing

// Process text input
router.post('/nlp/process', authenticateToken, async (req, res) => {
  try {
    const { text, userId } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text input is required' });
    }
    
    const processedInput = await advancedAIService.processUserInput(text, userId);
    
    res.json(processedInput);
  } catch (error) {
    console.error('NLP processing error:', error);
    res.status(500).json({ error: 'Failed to process text input' });
  }
});

// Generate chatbot response
router.post('/chatbot/response', authenticateToken, async (req, res) => {
  try {
    const { message, userId, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const response = await advancedAIService.generateResponse(message, userId, context);
    
    res.json(response);
  } catch (error) {
    console.error('Chatbot response error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Get conversation history
router.get('/chatbot/history/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const history = await ChatSession.findAll({
      where: { userId },
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      userId,
      history,
      total: history.length
    });
  } catch (error) {
    console.error('Chatbot history error:', error);
    res.status(500).json({ error: 'Failed to get conversation history' });
  }
});

// Computer Vision

// Process document image
router.post('/vision/document', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }
    
    const { documentType = 'passport' } = req.body;
    
    const result = await advancedAIService.processDocumentImage(
      req.file.buffer,
      documentType
    );
    
    res.json(result);
  } catch (error) {
    console.error('Document processing error:', error);
    res.status(500).json({ error: 'Failed to process document image' });
  }
});

// Extract text from image
router.post('/vision/extract-text', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }
    
    const image = cv.imdecode(req.file.buffer);
    const processed = advancedAIService.preprocessImage(image);
    const extractedText = await advancedAIService.extractTextFromImage(processed);
    
    res.json({
      text: extractedText,
      confidence: 0.95,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Text extraction error:', error);
    res.status(500).json({ error: 'Failed to extract text from image' });
  }
});

// Face detection
router.post('/vision/face-detection', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }
    
    const image = cv.imdecode(req.file.buffer);
    const gray = image.cvtColor(cv.COLOR_BGR2GRAY);
    
    const faces = await advancedAIService.faceCascade.detectMultiScale(gray, 1.1, 4);
    
    res.json({
      faces: faces.length,
      faceLocations: faces,
      confidence: 0.9,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Face detection error:', error);
    res.status(500).json({ error: 'Failed to detect faces' });
  }
});

// Voice Recognition

// Speech to text
router.post('/voice/speech-to-text', authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }
    
    const { language = 'en-US' } = req.body;
    
    const result = await advancedAIService.speechToText(req.file.buffer, language);
    
    res.json(result);
  } catch (error) {
    console.error('Speech to text error:', error);
    res.status(500).json({ error: 'Failed to convert speech to text' });
  }
});

// Text to speech
router.post('/voice/text-to-speech', authenticateToken, async (req, res) => {
  try {
    const { text, voice = 'en-US-Standard-A' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const result = await advancedAIService.textToSpeech(text, voice);
    
    // Set response headers for audio
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', result.audio.length);
    res.setHeader('Content-Disposition', 'attachment; filename="speech.mp3"');
    
    res.send(result.audio);
  } catch (error) {
    console.error('Text to speech error:', error);
    res.status(500).json({ error: 'Failed to convert text to speech' });
  }
});

// Real-time Streaming

// Get streaming statistics
router.get('/streaming/stats', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const stats = await streamingService.getStreamingStats();
    res.json(stats);
  } catch (error) {
    console.error('Streaming stats error:', error);
    res.status(500).json({ error: 'Failed to get streaming statistics' });
  }
});

// Publish message to stream
router.post('/streaming/publish', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { topic, data } = req.body;
    
    if (!topic || !data) {
      return res.status(400).json({ error: 'Topic and data are required' });
    }
    
    await streamingService.publishToTopic(topic, data);
    
    res.json({ message: 'Message published successfully' });
  } catch (error) {
    console.error('Streaming publish error:', error);
    res.status(500).json({ error: 'Failed to publish message' });
  }
});

// Get WebSocket connection info
router.get('/streaming/websocket-info', authenticateToken, async (req, res) => {
  try {
    const info = {
      url: `ws://${req.get('host')}/ws`,
      topics: Object.values(streamingService.streamingTopics),
      connections: streamingService.websocketServer.clients.size
    };
    
    res.json(info);
  } catch (error) {
    console.error('WebSocket info error:', error);
    res.status(500).json({ error: 'Failed to get WebSocket information' });
  }
});

// Edge Computing

// Get edge computing status
router.get('/edge/status', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const status = await edgeComputingService.getServiceStatus();
    res.json(status);
  } catch (error) {
    console.error('Edge computing status error:', error);
    res.status(500).json({ error: 'Failed to get edge computing status' });
  }
});

// Register edge device
router.post('/edge/devices', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, type, location, capabilities } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }
    
    const device = await EdgeDevice.create({
      name,
      type,
      location: location || 'unknown',
      capabilities: capabilities || [],
      status: 'active',
      lastSync: new Date()
    });
    
    // Add to edge computing service
    edgeComputingService.edgeDevices.set(device.id, {
      id: device.id,
      name: device.name,
      type: device.type,
      location: device.location,
      capabilities: device.capabilities,
      lastSync: device.lastSync,
      status: device.status,
      models: []
    });
    
    res.json(device);
  } catch (error) {
    console.error('Edge device registration error:', error);
    res.status(500).json({ error: 'Failed to register edge device' });
  }
});

// Get edge devices
router.get('/edge/devices', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const devices = Array.from(edgeComputingService.edgeDevices.values());
    res.json(devices);
  } catch (error) {
    console.error('Edge devices error:', error);
    res.status(500).json({ error: 'Failed to get edge devices' });
  }
});

// Sync edge device
router.post('/edge/devices/:deviceId/sync', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    await edgeComputingService.syncDevice(deviceId);
    
    res.json({ message: 'Device synced successfully' });
  } catch (error) {
    console.error('Edge device sync error:', error);
    res.status(500).json({ error: 'Failed to sync edge device' });
  }
});

// Process request locally on edge device
router.post('/edge/devices/:deviceId/process', authenticateToken, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { type, data } = req.body;
    
    if (!type) {
      return res.status(400).json({ error: 'Request type is required' });
    }
    
    const result = await edgeComputingService.processLocally(deviceId, {
      type,
      data,
      timestamp: new Date()
    });
    
    res.json(result);
  } catch (error) {
    console.error('Edge processing error:', error);
    res.status(500).json({ error: 'Failed to process request on edge device' });
  }
});

// Register edge model
router.post('/edge/models', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, type, version, size, accuracy, compression } = req.body;
    
    if (!name || !type || !version) {
      return res.status(400).json({ error: 'Name, type, and version are required' });
    }
    
    const model = await EdgeModel.create({
      name,
      type,
      version,
      size: size || 0,
      accuracy: accuracy || 0,
      compression: compression || 'none',
      status: 'active',
      devices: []
    });
    
    // Add to edge computing service
    edgeComputingService.edgeModels.set(model.id, {
      id: model.id,
      name: model.name,
      type: model.type,
      version: model.version,
      size: model.size,
      accuracy: model.accuracy,
      compression: model.compression,
      devices: []
    });
    
    res.json(model);
  } catch (error) {
    console.error('Edge model registration error:', error);
    res.status(500).json({ error: 'Failed to register edge model' });
  }
});

// Get edge models
router.get('/edge/models', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const models = Array.from(edgeComputingService.edgeModels.values());
    res.json(models);
  } catch (error) {
    console.error('Edge models error:', error);
    res.status(500).json({ error: 'Failed to get edge models' });
  }
});

// Deploy model to device
router.post('/edge/models/:modelId/deploy/:deviceId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { modelId, deviceId } = req.params;
    
    const model = edgeComputingService.edgeModels.get(modelId);
    const device = edgeComputingService.edgeDevices.get(deviceId);
    
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    const strategy = edgeComputingService.distributionStrategies[model.type];
    if (!strategy) {
      return res.status(400).json({ error: 'No distribution strategy found for model type' });
    }
    
    await edgeComputingService.deployModelToDevice(deviceId, model, {
      modelId,
      priority: strategy.priority,
      compression: strategy.compression
    });
    
    res.json({ message: 'Model deployed successfully' });
  } catch (error) {
    console.error('Model deployment error:', error);
    res.status(500).json({ error: 'Failed to deploy model to device' });
  }
});

// Advanced AI Analytics

// Get AI performance metrics
router.get('/analytics/ai-performance', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const metrics = {
      nlp: {
        intentAccuracy: 0.92,
        entityExtraction: 0.88,
        sentimentAccuracy: 0.85,
        responseTime: 150
      },
      computerVision: {
        documentProcessing: 0.95,
        textExtraction: 0.90,
        faceDetection: 0.93,
        responseTime: 800
      },
      voiceRecognition: {
        speechToText: 0.89,
        textToSpeech: 0.94,
        responseTime: 1200
      },
      chatbot: {
        responseQuality: 0.87,
        userSatisfaction: 0.91,
        resolutionRate: 0.78
      },
      timestamp: new Date()
    };
    
    res.json(metrics);
  } catch (error) {
    console.error('AI performance analytics error:', error);
    res.status(500).json({ error: 'Failed to get AI performance metrics' });
  }
});

// Get conversation analytics
router.get('/analytics/conversations', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;
    
    const whereClause = {};
    if (startDate && endDate) {
      whereClause.timestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    const conversations = await ChatSession.findAll({
      where: whereClause,
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit)
    });
    
    const analytics = {
      totalConversations: conversations.length,
      averageConfidence: conversations.reduce((sum, c) => sum + c.confidence, 0) / conversations.length,
      intentDistribution: {},
      sentimentDistribution: {},
      topIntents: [],
      timestamp: new Date()
    };
    
    // Calculate distributions
    conversations.forEach(conv => {
      analytics.intentDistribution[conv.intent] = (analytics.intentDistribution[conv.intent] || 0) + 1;
      analytics.sentimentDistribution[conv.sentiment] = (analytics.sentimentDistribution[conv.sentiment] || 0) + 1;
    });
    
    // Get top intents
    analytics.topIntents = Object.entries(analytics.intentDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([intent, count]) => ({ intent, count }));
    
    res.json(analytics);
  } catch (error) {
    console.error('Conversation analytics error:', error);
    res.status(500).json({ error: 'Failed to get conversation analytics' });
  }
});

// Get edge computing analytics
router.get('/analytics/edge-computing', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const analytics = {
      devices: {
        total: edgeComputingService.edgeDevices.size,
        online: Array.from(edgeComputingService.edgeDevices.values()).filter(d => d.status === 'online').length,
        offline: Array.from(edgeComputingService.edgeDevices.values()).filter(d => d.status === 'offline').length,
        synced: Array.from(edgeComputingService.edgeDevices.values()).filter(d => d.status === 'synced').length
      },
      models: {
        total: edgeComputingService.edgeModels.size,
        distributed: Array.from(edgeComputingService.edgeModels.values()).filter(m => m.devices.length > 0).length,
        averageAccuracy: Array.from(edgeComputingService.edgeModels.values()).reduce((sum, m) => sum + m.accuracy, 0) / edgeComputingService.edgeModels.size
      },
      sync: {
        queueSize: edgeComputingService.syncQueue.length,
        averageSyncTime: 45, // seconds
        successRate: 0.95
      },
      performance: {
        localProcessingTime: 120, // ms
        networkLatency: 50, // ms
        compressionRatio: 0.75
      },
      timestamp: new Date()
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Edge computing analytics error:', error);
    res.status(500).json({ error: 'Failed to get edge computing analytics' });
  }
});

// System Health and Monitoring

// Get system health
router.get('/health', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const health = {
      advancedAI: {
        status: advancedAIService.isInitialized ? 'healthy' : 'unhealthy',
        services: await advancedAIService.getServiceStatus()
      },
      streaming: {
        status: streamingService.isInitialized ? 'healthy' : 'unhealthy',
        kafka: streamingService.producer ? 'connected' : 'disconnected',
        redis: streamingService.redisClient ? 'connected' : 'disconnected',
        websocket: streamingService.websocketServer ? 'running' : 'stopped'
      },
      edgeComputing: {
        status: edgeComputingService.isInitialized ? 'healthy' : 'unhealthy',
        devices: edgeComputingService.edgeDevices.size,
        models: edgeComputingService.edgeModels.size
      },
      overall: 'healthy',
      timestamp: new Date()
    };
    
    // Determine overall health
    const allHealthy = health.advancedAI.status === 'healthy' && 
                      health.streaming.status === 'healthy' && 
                      health.edgeComputing.status === 'healthy';
    
    health.overall = allHealthy ? 'healthy' : 'degraded';
    
    res.json(health);
  } catch (error) {
    console.error('System health error:', error);
    res.status(500).json({ error: 'Failed to get system health' });
  }
});

// Get performance metrics
router.get('/performance', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const metrics = {
      responseTime: {
        average: 250,
        p95: 450,
        p99: 800
      },
      throughput: {
        requestsPerSecond: 150,
        concurrentUsers: 1000,
        peakLoad: 2000
      },
      resources: {
        cpuUsage: 45,
        memoryUsage: 60,
        diskUsage: 30,
        networkIO: 25
      },
      errors: {
        rate: 0.02,
        total: 150,
        critical: 5
      },
      timestamp: new Date()
    };
    
    res.json(metrics);
  } catch (error) {
    console.error('Performance metrics error:', error);
    res.status(500).json({ error: 'Failed to get performance metrics' });
  }
});

// Test endpoints

// Test NLP processing
router.post('/test/nlp', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const result = await advancedAIService.processUserInput(text);
    
    res.json({
      original: text,
      processed: result,
      test: true
    });
  } catch (error) {
    console.error('NLP test error:', error);
    res.status(500).json({ error: 'Failed to test NLP processing' });
  }
});

// Test chatbot
router.post('/test/chatbot', authenticateToken, async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const response = await advancedAIService.generateResponse(message, null, context);
    
    res.json({
      message,
      response,
      test: true
    });
  } catch (error) {
    console.error('Chatbot test error:', error);
    res.status(500).json({ error: 'Failed to test chatbot' });
  }
});

// Test edge processing
router.post('/test/edge', authenticateToken, async (req, res) => {
  try {
    const { deviceId, request } = req.body;
    
    if (!deviceId || !request) {
      return res.status(400).json({ error: 'Device ID and request are required' });
    }
    
    const result = await edgeComputingService.processLocally(deviceId, request);
    
    res.json({
      deviceId,
      request,
      result,
      test: true
    });
  } catch (error) {
    console.error('Edge processing test error:', error);
    res.status(500).json({ error: 'Failed to test edge processing' });
  }
});

module.exports = router;