import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, CheckCircle, History, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import CounterfeitDetection from '@/components/CounterfeitDetection';
import AnalysisHistory from '@/components/AnalysisHistory';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isAnalysis?: boolean;
}

interface ChatState {
  waitingForReview: boolean;
  waitingForProduct: boolean;
  currentContext: string;
}

interface AnalysisRecord {
  id: string;
  type: 'review' | 'product';
  timestamp: Date;
  productInfo?: string;
  reviewText?: string;
  productUrl?: string;
  result: {
    isAuthentic?: boolean;
    isFake?: boolean;
    confidence: number;
    riskLevel?: 'low' | 'medium' | 'high';
    reasons: string[];
  };
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm TruCheck, your AI assistant for detecting fake reviews and counterfeit products. I can help you analyze reviews, verify product authenticity, and protect you from scams. How can I assist you today?",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'counterfeit' | 'history'>('chat');
  const [chatState, setChatState] = useState<ChatState>({
    waitingForReview: false,
    waitingForProduct: false,
    currentContext: ''
  });
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisRecord[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load analysis history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('trucheck-analysis-history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setAnalysisHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (error) {
        console.error('Failed to load analysis history:', error);
      }
    }
  }, []);

  // Save analysis history to localStorage
  useEffect(() => {
    localStorage.setItem('trucheck-analysis-history', JSON.stringify(analysisHistory));
  }, [analysisHistory]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addMessage = (text: string, isUser: boolean, isAnalysis: boolean = false) => {
    const newMessage: Message = {
      id: generateId(),
      text,
      isUser,
      timestamp: new Date(),
      isAnalysis
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addToHistory = (record: Omit<AnalysisRecord, 'id' | 'timestamp'>) => {
    const newRecord: AnalysisRecord = {
      ...record,
      id: generateId(),
      timestamp: new Date()
    };
    setAnalysisHistory(prev => [newRecord, ...prev]);
  };

  const analyzeReview = async (reviewText: string, productInfo?: string) => {
  try {
    const response = await fetch("https://trucheck-backend.onrender.com/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: reviewText })
    });

    if (!response.ok) {
      throw new Error("Failed to analyze the review");
    }

    const data = await response.json();

    const reasons: string[] = [];

    if ('explanation' in data) {
      reasons.push(data.explanation);
    }

    if (data.generic_phrases > 0) {
      reasons.push(`Generic promotional phrases detected (${data.generic_phrases}x)`);
    }

    if (Object.keys(data.repetition || {}).length > 0) {
      reasons.push(`Repeated words: ${Object.entries(data.repetition).map(([word, count]) => `${word} (${count}x)`).join(', ')}`);
    }

    const confidence = Math.floor(data.score * 100);

    const result = {
      isFake: data.is_fake,
      confidence,
      reasons
    };

    // Add to history
    addToHistory({
      type: "review",
      productInfo,
      reviewText,
      result
    });

    const resultText = `Analysis Complete! 

Review Status: ${result.isFake ? '🚨 Potentially Fake' : '✅ Likely Authentic'}
Confidence Level: ${confidence}%

Key Findings:
${result.reasons.map(r => `• ${r}`).join('\n')}

${productInfo ? `\nProduct Context: ${productInfo}` : ''}

💡 Tip: Check the Counterfeit Detection section for product authenticity verification.`;

    return resultText;
  } catch (error) {
    console.error("Error during review analysis:", error);
    throw error;
  }
};


    const resultText = `Analysis Complete! 

Review Status: ${analysisResult.isFake ? '🚨 Potentially Fake' : '✅ Likely Authentic'}
Confidence Level: ${analysisResult.confidence}%

Key Findings:
${analysisResult.reasons.map(reason => `• ${reason}`).join('\n')}

${productInfo ? `\nProduct Context: ${productInfo}` : ''}

💡 Tip: Check the Counterfeit Detection section for product authenticity verification.`;

    return resultText;
  };

  const processMessage = async (message: string) => {
    const lowercaseMessage = message.toLowerCase();
    
    // Context-aware response logic
    if (chatState.waitingForReview) {
      setChatState(prev => ({ ...prev, waitingForReview: false }));
      
      try {
        const analysis = await analyzeReview(message, chatState.currentContext);
        addMessage(analysis, false, true);
        
        // Show completion notification
        toast({
          title: "Analysis Complete!",
          description: "Check the History tab to view all your analysis results.",
          duration: 5000,
        });
      } catch (error) {
        addMessage("I encountered an error while analyzing the review. Please try again or contact support.", false);
      }
      
      setChatState({ waitingForReview: false, waitingForProduct: false, currentContext: '' });
      return;
    }

    if (chatState.waitingForProduct) {
      setChatState(prev => ({ 
        ...prev, 
        waitingForProduct: false, 
        waitingForReview: true,
        currentContext: message 
      }));
      addMessage("Great! Now please paste the review text you'd like me to analyze.", false);
      return;
    }

    // Keyword detection for new analysis requests
    if (lowercaseMessage.includes('check review') || 
        lowercaseMessage.includes('analyze review') || 
        lowercaseMessage.includes('verify') ||
        lowercaseMessage.includes('fake review')) {
      
      setChatState(prev => ({ ...prev, waitingForProduct: true }));
      addMessage("I'd be happy to help you analyze a review! First, could you tell me about the product? (Product name, category, or any relevant details)", false);
      return;
    }

    if (lowercaseMessage.includes('counterfeit') || 
        lowercaseMessage.includes('fake product') || 
        lowercaseMessage.includes('authentic')) {
      
      addMessage("For counterfeit product detection, please use the 'Counterfeit Detection' tab above. It provides advanced AI-powered tools to verify product authenticity using images and product URLs.", false);
      return;
    }

    if (lowercaseMessage.includes('history') || lowercaseMessage.includes('previous')) {
      addMessage("You can view all your previous analysis results in the 'History' tab above. It keeps track of all your review analyses and product verifications!", false);
      return;
    }

    // General conversation responses
    if (lowercaseMessage.includes('hello') || lowercaseMessage.includes('hi')) {
      addMessage("Hello! Ready to help you detect fake reviews and counterfeit products. Use 'check review' for review analysis or switch to the Counterfeit Detection tab for product verification!", false);
    } else if (lowercaseMessage.includes('help')) {
      addMessage(`Here's what I can help you with:

🔍 **Review Analysis** - Say "check review" or "analyze review"
🛡️ **Counterfeit Detection** - Use the dedicated tab above for product verification
📊 **Product Verification** - Upload images or URLs to check authenticity
🎯 **Fake Detection** - Advanced algorithms to identify suspicious patterns
📈 **Analysis History** - View all your previous analysis results

Choose review analysis here or switch to the other tabs!`, false);
    } else {
      // Default intelligent response
      addMessage("I understand you're interested in review analysis or product verification. I can help you check if reviews are authentic or verify if products are genuine. Say 'check review' for review analysis or use the other tabs for additional features!", false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    addMessage(userMessage, true);
    
    setIsLoading(true);
    
    try {
      await processMessage(userMessage);
    } catch (error) {
      addMessage("I'm sorry, I encountered an error. Please try again.", false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const clearHistory = () => {
    setAnalysisHistory([]);
    toast({
      title: "History Cleared",
      description: "All analysis history has been cleared.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-element absolute top-20 left-20 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="floating-element absolute top-40 right-32 w-24 h-24 bg-blue-500/20 rounded-full blur-lg animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="floating-element absolute bottom-32 left-32 w-40 h-40 bg-pink-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="floating-element absolute bottom-20 right-20 w-28 h-28 bg-indigo-500/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* Main container */}
      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/lovable-uploads/9b251fc8-66d1-4caf-b183-99df3034ed06.png" 
              alt="TruCheck Logo" 
              className="h-16 w-auto mr-4"
            />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              TruCheck AI
            </h1>
          </div>
          <p className="text-white/80 text-lg">Advanced Fake Review & Counterfeit Product Detection</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/20 flex flex-wrap justify-center gap-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              Review Analysis Chat
            </button>
            <button
              onClick={() => setActiveTab('counterfeit')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'counterfeit'
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              Counterfeit Detection
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'history'
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Analysis History</span>
              {analysisHistory.length > 0 && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {analysisHistory.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col">
          {activeTab === 'chat' ? (
            <>
              {/* Chat area */}
              <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-6 mb-6 flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-4 chat-scrollbar">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex items-start space-x-3 max-w-[80%] ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {/* Avatar */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          message.isUser 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                            : 'bg-white/20 backdrop-blur-sm border border-white/30'
                        }`}>
                          {message.isUser ? (
                            <User className="w-5 h-5 text-white" />
                          ) : (
                            <Bot className="w-5 h-5 text-white" />
                          )}
                        </div>
                        
                        {/* Message bubble */}
                        <div className={`rounded-2xl px-4 py-3 shadow-lg ${
                          message.isUser
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                            : message.isAnalysis
                            ? 'bg-green-50/90 backdrop-blur-sm border border-green-200/50 text-gray-800'
                            : 'bg-white/90 backdrop-blur-sm border border-white/50 text-gray-800'
                        }`}>
                          {message.isAnalysis && (
                            <div className="flex items-center space-x-2 mb-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-semibold text-green-600">Analysis Result</span>
                            </div>
                          )}
                          <p className="whitespace-pre-line text-sm leading-relaxed">{message.text}</p>
                          <div className={`text-xs mt-2 ${
                            message.isUser ? 'text-white/70' : 'text-gray-500'
                          }`}>
                            {formatTimestamp(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex items-start space-x-3 max-w-[80%]">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-white animate-pulse" />
                        </div>
                        <div className="bg-white/90 backdrop-blur-sm border border-white/50 rounded-2xl px-4 py-3 shadow-lg">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input area */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-4">
                <div className="flex space-x-4">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all duration-200"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed px-6 py-3 rounded-xl text-white font-medium transition-all duration-200 hover:shadow-lg transform hover:scale-105 disabled:transform-none flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </div>
              </div>
            </>
          ) : activeTab === 'counterfeit' ? (
            <CounterfeitDetection onAnalysisComplete={addToHistory} />
          ) : (
            <AnalysisHistory 
              history={analysisHistory} 
              onClearHistory={clearHistory}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;