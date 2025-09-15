import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Mic, X, TrendingUp, TrendingDown, Minimize2, ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import NewsTicker from './NewsTicker';
import UserProfileMenu from './auth/UserProfileMenu';

const EnhancedHeader = () => {
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Hello! I\'m your AI financial assistant. I can analyze market data, help with portfolio decisions, and navigate the dashboard for you. What would you like to explore?',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Get current page context for AI
  const getCurrentPageContext = () => {
    const path = location.pathname;
    if (path === '/') return 'Daily Market Brief page';
    if (path === '/research') return 'Research Hub page';
    if (path === '/portfolio') return 'Portfolio Management page';
    return 'main dashboard';
  };

  const executeNavigation = (targetPath, pageName) => {
    navigate(targetPath);
    setIsCommandCenterOpen(false);
    
    // Add confirmation message
    setTimeout(() => {
      const confirmationMessage = {
        id: Date.now(),
        type: 'ai',
        content: `✅ Successfully navigated to ${pageName}! I can now help you analyze the data and tools available on this page. What would you like to explore?`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, confirmationMessage]);
    }, 500);
  };

  const handleNavigation = (targetPath, pageName) => {
    const confirmationMessage = {
      id: Date.now(),
      type: 'ai',
      content: `I can take you to the ${pageName} section. Would you like me to navigate there now?`,
      timestamp: new Date(),
      hasNavigationActions: true,
      targetPath,
      pageName
    };
    setMessages(prev => [...prev, confirmationMessage]);
    setPendingNavigation({ targetPath, pageName });
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const query = chatInput;
    setChatInput('');
    setIsTyping(true);

    try {
      console.log('🤖 Sending message to AI Chat API:', query);
      
      const response = await fetch('/api/ai-chat/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          context: getCurrentPageContext()
        })
      });

      if (!response.ok) {
        throw new Error(`AI service responded with status ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'AI service returned an error');
      }

      console.log('✅ Received AI response:', data.response.substring(0, 100) + '...');

      // Check if this is a navigation request based on AI response
      const isNavigationSuggestion = data.hasNavigationSuggestion || 
        data.response.toLowerCase().includes('would you like') && 
        (data.response.toLowerCase().includes('navigate') || 
         data.response.toLowerCase().includes('go to'));

      const aiResponseObj = {
        id: Date.now() + 1,
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        hasNavigationSuggestion: isNavigationSuggestion,
        marketDataIncluded: data.marketDataIncluded
      };

      setMessages(prev => [...prev, aiResponseObj]);

      // If AI suggests navigation, detect the target
      if (isNavigationSuggestion) {
        const lowerResponse = data.response.toLowerCase();
        let targetPath = '';
        let pageName = '';

        if (lowerResponse.includes('portfolio')) {
          targetPath = '/portfolio';
          pageName = 'Portfolio Management';
        } else if (lowerResponse.includes('research')) {
          targetPath = '/research';
          pageName = 'Research Hub';
        } else if (lowerResponse.includes('market') || lowerResponse.includes('brief')) {
          targetPath = '/';
          pageName = 'Daily Market Brief';
        }

        if (targetPath && location.pathname !== targetPath) {
          // Add navigation action buttons
          setTimeout(() => {
            const navMessage = {
              id: Date.now() + 2,
              type: 'ai',
              content: `Would you like me to navigate to ${pageName} now?`,
              timestamp: new Date(),
              hasNavigationActions: true,
              targetPath,
              pageName
            };
            setMessages(prev => [...prev, navMessage]);
          }, 500);
        }
      }

    } catch (error) {
      console.error('❌ AI Chat error:', error.message);
      
      // Show user-friendly error message
      let errorMessage = 'I\'m having trouble connecting to my AI service right now. ';
      
      if (error.message.includes('timeout')) {
        errorMessage += 'The response is taking longer than expected. Please try again.';
      } else if (error.message.includes('504') || error.message.includes('timeout')) {
        errorMessage += 'My AI processing timed out. Please try a shorter question.';
      } else if (error.message.includes('429')) {
        errorMessage += 'I\'m getting too many requests right now. Please wait a moment and try again.';
      } else {
        errorMessage += 'Please try again in a moment.';
      }

      const errorResponseObj = {
        id: Date.now() + 1,
        type: 'ai',
        content: errorMessage,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorResponseObj]);
      
    } finally {
      setIsTyping(false);
    }
  };

  const handlePromptBarClick = () => {
    setIsCommandCenterOpen(true);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (isCommandCenterOpen) {
        handleSendMessage();
      } else {
        handlePromptBarClick();
      }
    }
  };

  return (
    <>
      <div className="bg-white shadow-lg relative z-10">
        {/* Real-time Market News Ticker */}
        <NewsTicker />

        {/* Main Header with Prompt Bar */}
        <div className="px-4 py-4">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            {/* Title */}
            <div className="flex-shrink-0">
              <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Google Sans', 'Roboto', sans-serif" }}>
                Investor's Daily Brief
              </h1>
              <p className="text-sm text-gray-600 mt-1">Your AI-Powered Financial Command Center</p>
            </div>

            {/* AI Prompt Bar - Takes up remaining horizontal space */}
            <div className="flex-1 max-w-4xl">
              <div 
                onClick={handlePromptBarClick}
                className="relative bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-full px-6 py-3 cursor-text transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 select-none">
                    AI Financial Assistant
                  </span>
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5 text-gray-400" />
                    <span className="text-xs text-gray-400">Click to start</span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Profile Menu - Top Right */}
            <div className="flex-shrink-0">
              <UserProfileMenu />
            </div>
          </div>
        </div>
      </div>

      {/* Command Center Mode - Slides down when activated */}
      {isCommandCenterOpen && (
        <div className="fixed inset-0 z-50 flex flex-col">
          {/* Backdrop with blur */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsCommandCenterOpen(false)}
          />
          
          {/* Command Center Interface */}
          <div className="relative bg-white shadow-2xl border-b border-gray-200 h-[70vh] overflow-hidden animate-slide-down">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">AI Financial Command Center</h2>
                    <p className="text-blue-100 text-sm">
                      Currently: {getCurrentPageContext()} • Real-time analysis • Market intelligence • Navigation
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCommandCenterOpen(false)}
                  className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 h-[calc(70vh-180px)]">
              <div className="max-w-4xl mx-auto space-y-4">
                {messages.map((message) => (
                  <div key={message.id}>
                    <div
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-2xl px-6 py-4 rounded-2xl ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : message.isError 
                              ? 'bg-red-50 text-red-800 border border-red-200'
                              : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className={`text-xs ${
                            message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {message.marketDataIncluded && (
                            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                              Live Data
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Navigation Action Buttons */}
                    {message.hasNavigationActions && (
                      <div className="flex justify-start mt-3">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => executeNavigation(message.targetPath, message.pageName)}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <ArrowRight className="w-4 h-4" />
                            <span>Yes, navigate to {message.pageName}</span>
                          </button>
                          <button
                            onClick={() => {
                              const declineMessage = {
                                id: Date.now(),
                                type: 'ai',
                                content: `No problem! I'll stay on the ${getCurrentPageContext()}. How else can I help you analyze the data here?`,
                                timestamp: new Date()
                              };
                              setMessages(prev => [...prev, declineMessage]);
                              setPendingNavigation(null);
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            Stay here
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-800 border border-gray-200 px-6 py-4 rounded-2xl shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-sm text-gray-600">Analyzing with real market data...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about market analysis, portfolio optimization, stock research, or request dashboard navigation..."
                      className="w-full px-6 py-4 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-gray-50"
                      autoFocus
                      disabled={isTyping}
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isTyping}
                    className="bg-blue-600 text-white p-4 rounded-full hover:bg-blue-700 disabled:bg-gray-400 transition-colors shadow-lg hover:shadow-xl"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                  <button className="text-gray-400 hover:text-gray-600 p-4 rounded-full transition-colors hover:bg-gray-100">
                    <Mic className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Quick Action Suggestions */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <button 
                    onClick={() => setChatInput('Analyze current market conditions')}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                    disabled={isTyping}
                  >
                    📊 Market Analysis
                  </button>
                  <button 
                    onClick={() => setChatInput('Show me portfolio performance')}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition-colors"
                    disabled={isTyping}
                  >
                    💼 Portfolio Review
                  </button>
                  <button 
                    onClick={() => setChatInput('Research trending stocks')}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition-colors"
                    disabled={isTyping}
                  >
                    🔍 Stock Research
                  </button>
                  <button 
                    onClick={() => setChatInput('Navigate to research tools')}
                    className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm hover:bg-orange-200 transition-colors"
                    disabled={isTyping}
                  >
                    🚀 Dashboard Navigation
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Powered by real Mistral AI with live FMP market data • Your conversations stay private
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom animations */}
      <style>{`
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default EnhancedHeader;