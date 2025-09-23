#!/usr/bin/env node

/**
 * AI Server for FUZO
 * Express server providing AI endpoints for the Vite development environment
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { aiUtils } from '../lib/ai-utils.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.AI_SERVER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    aiConfigured: !!process.env.OPENAI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// AI Status endpoint
app.get('/api/ai/status', (req, res) => {
  try {
    const status = aiUtils.getModelStatus();
    res.json(status);
  } catch (error) {
    console.error('AI status error:', error);
    res.status(500).json({ error: 'Failed to load AI status' });
  }
});

// AI Complete endpoint with streaming
app.post('/api/ai/complete', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ 
        error: 'AI not configured',
        message: 'OpenAI API key is not set'
      });
    }

    // Use the streaming text response
    const result = await aiUtils.streamTextResponse(prompt);
    
    // Set headers for streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Stream the response using Node.js streams
    const nodeStream = result.toNodeStream();
    nodeStream.pipe(res);
    
  } catch (error) {
    console.error('AI complete error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// AI Actions endpoint
app.post('/api/ai/actions', async (req, res) => {
  try {
    const { action, ...params } = req.body;
    
    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ 
        error: 'AI not configured',
        message: 'OpenAI API key is not set'
      });
    }

    let result;
    
    switch (action) {
      case 'food':
        result = await aiUtils.generateFoodRecommendations(
          params.userInput,
          params.preferences,
          params.dietaryRestrictions
        );
        break;
      case 'sentiment':
        result = { sentiment: await aiUtils.analyzeSentiment(params.message) };
        break;
      case 'masterbot-response':
        result = await aiUtils.generateMasterBotResponse(
          params.userMessage,
          params.botSpecialty,
          params.conversationHistory
        );
        break;
      case 'masterbot-post':
        result = { text: await aiUtils.generateMasterBotPost(
          params.specialty,
          params.topic,
          params.location
        ) };
        break;
      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('AI actions error:', error);
    res.status(500).json({ error: 'Failed to process action' });
  }
});

// AI Chat endpoint (for compatibility)
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ 
        error: 'AI not configured',
        message: 'OpenAI API key is not set'
      });
    }

    // Use the streaming text response
    const result = await aiUtils.streamTextResponse(
      `You are Tako, FUZO's friendly AI food assistant. Help users discover amazing food experiences with enthusiasm and local knowledge.

Context: ${context || "General food conversation"}
User Message: ${message}

Please respond as Tako with helpful food-related advice, restaurant recommendations, or cooking tips. Be friendly and enthusiastic!`
    );
    
    // Set headers for streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Stream the response using Node.js streams
    const nodeStream = result.toNodeStream();
    nodeStream.pipe(res);
    
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🤖 AI Server running on port ${PORT}`);
  console.log(`📊 AI Status: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Not Configured'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 AI Status: http://localhost:${PORT}/api/ai/status`);
  console.log(`🔗 AI Complete: http://localhost:${PORT}/api/ai/complete`);
});
