/**
 * Frontend AI Service Updates for GPT-OSS-20B Integration
 * Update your existing AI service files with these changes
 */

// ============================================
// aiMarketNewsService.js - UPDATED VERSION
// ============================================

import axiosInstance from '../../utils/axiosConfig';

class AIMarketNewsService {
  constructor() {
    // Use GPT-OSS endpoint instead of Mistral
    this.endpoint = '/api/gpt-oss';
    this.cache = new Map();
    this.cacheTimeout = 15 * 60 * 1000; // 15 minutes
  }

  async getMarketAnalysis() {
    const cacheKey = 'market-analysis';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Fetch current market data
      const marketData = await this.fetchMarketData();
      
      // Generate AI analysis using GPT-OSS-20B
      const response = await axiosInstance.post(`${this.endpoint}/market-analysis`, {
        sp500Price: marketData.sp500.price,
        sp500Change: marketData.sp500.change,
        nasdaqPrice: marketData.nasdaq.price,
        nasdaqChange: marketData.nasdaq.change,
        vix: marketData.vix,
        treasury10y: marketData.treasury10y,
        marketPhase: marketData.phase
      });

      const analysisData = {
        summary: response.data.data.analysis,
        bullets: this.extractBulletPoints(response.data.data.analysis),
        timestamp: new Date().toISOString(),
        model: 'gpt-oss-20b-local',
        gpuAccelerated: true
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: analysisData,
        timestamp: Date.now()
      });

      return analysisData;
    } catch (error) {
      console.error('Failed to generate market analysis:', error);
      
      // Return fallback message
      return {
        summary: 'Market analysis temporarily unavailable. Please check back shortly.',
        bullets: [
          'Real-time analysis is being generated',
          'Check individual indices for current performance',
          'Monitor sector movements for opportunities'
        ],
        timestamp: new Date().toISOString(),
        model: 'fallback'
      };
    }
  }

  async explainConcept(concept, context = {}) {
    try {
      const response = await axiosInstance.post(`${this.endpoint}/explain`, {
        concept,
        context
      });

      return {
        explanation: response.data.data.explanation,
        model: response.data.data.model,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to explain concept:', error);
      throw error;
    }
  }

  async analyzePortfolio(portfolioData) {
    try {
      const response = await axiosInstance.post(`${this.endpoint}/portfolio-analysis`, {
        portfolio: portfolioData,
        marketConditions: await this.fetchMarketConditions()
      });

      return {
        insights: response.data.data.insights,
        recommendations: response.data.data.recommendations,
        model: response.data.data.model,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to analyze portfolio:', error);
      throw error;
    }
  }

  // Helper methods
  extractBulletPoints(text) {
    const bullets = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        bullets.push(trimmed.substring(1).trim());
      } else if (trimmed.match(/^\d+\./)) {
        bullets.push(trimmed.replace(/^\d+\./, '').trim());
      }
    }
    
    // Return top 5 bullets or generate from text if none found
    if (bullets.length === 0) {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
      return sentences.slice(0, 3).map(s => s.trim());
    }
    
    return bullets.slice(0, 5);
  }

  async fetchMarketData() {
    // Fetch from your existing market data endpoints
    const response = await axiosInstance.get('/api/market/indices');
    return response.data;
  }

  async fetchMarketConditions() {
    // Fetch current market conditions
    const response = await axiosInstance.get('/api/market/conditions');
    return response.data;
  }

  // Check if GPT-OSS is available
  async checkHealth() {
    try {
      const response = await axiosInstance.get(`${this.endpoint}/health`);
      return response.data;
    } catch (error) {
      return { status: 'offline', fallback: 'mistral' };
    }
  }
}

export default new AIMarketNewsService();


// ============================================
// Component Update Example - AIMarketNews.jsx
// ============================================

import React, { useState, useEffect } from 'react';
import aiMarketNewsService from '../../services/ai/aiMarketNewsService';
import { AlertCircle, TrendingUp, Cpu } from 'lucide-react';

const AIMarketNews = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMarketAnalysis();
    
    // Refresh every 15 minutes
    const interval = setInterval(loadMarketAnalysis, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadMarketAnalysis = async () => {
    try {
      setLoading(true);
      const data = await aiMarketNewsService.getMarketAnalysis();
      setAnalysis(data);
      setError(null);
    } catch (err) {
      setError('Unable to load market analysis');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-400">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          AI Market Analysis
        </h3>
        {analysis.gpuAccelerated && (
          <div className="flex items-center gap-1 text-xs text-green-400">
            <Cpu className="w-3 h-3" />
            GPU Accelerated
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        {analysis.bullets.map((bullet, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span className="text-gray-300 text-sm">{bullet}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Updated {new Date(analysis.timestamp).toLocaleTimeString()}
        </span>
        <span className="text-xs text-gray-500">
          Model: {analysis.model}
        </span>
      </div>
    </div>
  );
};

export default AIMarketNews;


// ============================================
// Chat Component with Streaming - ChatInterface.jsx
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import axiosInstance from '../../utils/axiosConfig';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setStreaming(true);

    // Add placeholder for AI response
    const aiMessage = { role: 'assistant', content: '' };
    setMessages([...newMessages, aiMessage]);

    try {
      const response = await fetch('/api/gpt-oss/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          stream: true
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantResponse += parsed.content;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1].content = assistantResponse;
                  return updated;
                });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1].content = 'Sorry, I encountered an error. Please try again.';
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-200'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              {msg.role === 'assistant' && streaming && idx === messages.length - 1 && (
                <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1"></span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about markets, stocks, or investing..."
            className="flex-1 p-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={streaming}
          />
          <button
            onClick={sendMessage}
            disabled={streaming || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {streaming ? 'Thinking...' : 'Send'}
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          Powered by GPT-OSS-20B on RTX 5060 • ~6.5 tokens/sec
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;