import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, CheckCircle, History } from 'lucide-react';
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
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    text: "Hello! I'm TruCheck, your AI assistant for detecting fake reviews and counterfeit products. I can help you analyze reviews, verify product authenticity, and protect you from scams. How can I assist you today?",
    isUser: false,
    timestamp: new Date(),
  }]);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('trucheck-analysis-history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setAnalysisHistory(parsed.map((item: any) => ({ ...item, timestamp: new Date(item.timestamp) })));
      } catch (error) {
        console.error('Failed to load analysis history:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('trucheck-analysis-history', JSON.stringify(analysisHistory));
  }, [analysisHistory]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addMessage = (text: string, isUser: boolean, isAnalysis = false) => {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: reviewText })
      });

      if (!response.ok) throw new Error("Failed to analyze the review");

      const data = await response.json();

      const reasons: string[] = [];
      if ('explanation' in data) reasons.push(data.explanation);
      if (data.generic_phrases > 0) reasons.push(`Generic promotional phrases detected (${data.generic_phrases}x)`);
      if (Object.keys(data.repetition || {}).length > 0) {
        reasons.push(`Repeated words: ${Object.entries(data.repetition).map(([word, count]) => `${word} (${count}x)`).join(', ')}`);
      }

      const confidence = Math.floor(data.score * 100);
      const result = { isFake: data.is_fake, confidence, reasons };

      addToHistory({ type: "review", productInfo, reviewText, result });

      return `Analysis Complete!\n\nReview Status: ${result.isFake ? '🚨 Potentially Fake' : '✅ Likely Authentic'}\nConfidence Level: ${confidence}%\n\nKey Findings:\n${result.reasons.map(r => `• ${r}`).join('\n')}\n${productInfo ? `\nProduct Context: ${productInfo}` : ''}\n\n💡 Tip: Check the Counterfeit Detection section for product authenticity verification.`;
    } catch (error) {
      console.error("Error during review analysis:", error);
      throw error;
    }
  };

  const processMessage = async (message: string) => {
    const lowercaseMessage = message.toLowerCase();

    if (chatState.waitingForReview) {
      setChatState({ waitingForReview: false, waitingForProduct: false, currentContext: '' });
      try {
        const analysis = await analyzeReview(message, chatState.currentContext);
        addMessage(analysis, false, true);
        toast({ title: "Analysis Complete!", description: "Check the History tab to view all your analysis results.", duration: 5000 });
      } catch {
        addMessage("I encountered an error while analyzing the review. Please try again or contact support.", false);
      }
      return;
    }

    if (chatState.waitingForProduct) {
      setChatState({ waitingForReview: true, waitingForProduct: false, currentContext: message });
      addMessage("Great! Now please paste the review text you'd like me to analyze.", false);
      return;
    }

    if (["check review", "analyze review", "verify", "fake review"].some(kw => lowercaseMessage.includes(kw))) {
      setChatState({ ...chatState, waitingForProduct: true });
      addMessage("I'd be happy to help you analyze a review! First, could you tell me about the product? (Product name, category, or any relevant details)", false);
      return;
    }

    if (["counterfeit", "fake product", "authentic"].some(kw => lowercaseMessage.includes(kw))) {
      addMessage("For counterfeit product detection, please use the 'Counterfeit Detection' tab above.", false);
      return;
    }

    if (["history", "previous"].some(kw => lowercaseMessage.includes(kw))) {
      addMessage("You can view all your previous analysis results in the 'History' tab above.", false);
      return;
    }

    if (["hello", "hi"].some(kw => lowercaseMessage.includes(kw))) {
      addMessage("Hello! Ready to help you detect fake reviews and counterfeit products. Use 'check review' for review analysis or switch to the Counterfeit Detection tab for product verification!", false);
    } else if (lowercaseMessage.includes('help')) {
      addMessage("Here's what I can help you with:\n\n🔍 Review Analysis - Say 'check review'\n🛡️ Counterfeit Detection - Use the tab above\n📊 Product Verification - Upload images or URLs\n🎯 Fake Detection - Identify suspicious patterns\n📈 History - View all your results", false);
    } else {
      addMessage("I can help you check if reviews are authentic or verify if products are genuine. Say 'check review' or use the other tabs!", false);
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
    } catch {
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

  const formatTimestamp = (timestamp: Date) => timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const clearHistory = () => {
    setAnalysisHistory([]);
    toast({ title: "History Cleared", description: "All analysis history has been cleared." });
  };

  return <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">{/* UI code continues */}</div>;
};

export default Index;
