
import React, { useState } from 'react';
import { Search, ShieldCheck, ShieldX, AlertTriangle, CheckCircle, Upload, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface ProductAnalysis {
  isAuthentic: boolean;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  flags: string[];
  recommendations: string[];
}

interface CounterfeitDetectionProps {
  onAnalysisComplete?: (record: {
    type: 'review' | 'product';
    productUrl?: string;
    result: {
      isAuthentic?: boolean;
      confidence: number;
      riskLevel?: 'low' | 'medium' | 'high';
      reasons: string[];
    };
  }) => void;
}

const CounterfeitDetection: React.FC<CounterfeitDetectionProps> = ({ onAnalysisComplete }) => {
  const [productUrl, setProductUrl] = useState('');
  const [productImage, setProductImage] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);

  const analyzeProduct = async () => {
    if (!productUrl && !productImage) {
      toast({
        title: "Input Required",
        description: "Please provide a product URL or upload an image.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate API call for product analysis
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const mockAnalysis: ProductAnalysis = {
      isAuthentic: Math.random() > 0.4,
      confidence: Math.floor(Math.random() * 30) + 70,
      riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
      flags: [
        "Price significantly below market average",
        "Seller has limited transaction history",
        "Product images show quality inconsistencies",
        "Brand authentication markers unclear"
      ].slice(0, Math.floor(Math.random() * 4) + 1),
      recommendations: [
        "Verify seller credentials through official channels",
        "Request additional product authentication photos",
        "Check for official brand certifications",
        "Compare with authorized retailer listings"
      ]
    };

    setAnalysis(mockAnalysis);
    setIsAnalyzing(false);

    // Add to history if callback provided
    if (onAnalysisComplete) {
      onAnalysisComplete({
        type: 'product',
        productUrl: productUrl || undefined,
        result: {
          isAuthentic: mockAnalysis.isAuthentic,
          confidence: mockAnalysis.confidence,
          riskLevel: mockAnalysis.riskLevel,
          reasons: [...mockAnalysis.flags, ...mockAnalysis.recommendations]
        }
      });
    }

    toast({
      title: "Analysis Complete",
      description: `Product ${mockAnalysis.isAuthentic ? 'appears authentic' : 'may be counterfeit'}`,
      variant: mockAnalysis.isAuthentic ? "default" : "destructive",
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProductImage(file);
      toast({
        title: "Image Uploaded",
        description: `${file.name} ready for analysis`,
      });
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Counterfeit Product Detection
        </h2>
        <p className="text-white/80">
          Verify product authenticity using AI-powered analysis
        </p>
      </div>

      {/* Input Section */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Search className="w-5 h-5" />
            Product Analysis
          </CardTitle>
          <CardDescription className="text-white/70">
            Enter a product URL or upload an image for counterfeit detection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL Input */}
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">Product URL</label>
            <div className="flex space-x-2">
              <Input
                type="url"
                placeholder="https://example.com/product..."
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder-white/60 focus:border-purple-400"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">Or Upload Product Image</label>
            <div className="flex items-center space-x-2">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="flex items-center justify-center space-x-2 bg-white/20 border border-white/30 rounded-md px-4 py-2 text-white hover:bg-white/30 transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>{productImage ? productImage.name : 'Choose image'}</span>
                </div>
              </label>
              <Button
                variant="outline"
                size="icon"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Analysis Button */}
          <Button
            onClick={analyzeProduct}
            disabled={isAnalyzing || (!productUrl && !productImage)}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isAnalyzing ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Analyzing Product...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Analyze for Counterfeits</span>
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <Card className="bg-white/10 backdrop-blur-md border-white/20 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              {analysis.isAuthentic ? (
                <ShieldCheck className="w-5 h-5 text-green-400" />
              ) : (
                <ShieldX className="w-5 h-5 text-red-400" />
              )}
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Authenticity Status */}
            <div className={`p-4 rounded-lg border ${
              analysis.isAuthentic 
                ? 'bg-green-50/20 border-green-400/30 text-green-100' 
                : 'bg-red-50/20 border-red-400/30 text-red-100'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    {analysis.isAuthentic ? '✅ Likely Authentic' : '⚠️ Potentially Counterfeit'}
                  </h3>
                  <p className="text-sm opacity-80">
                    Confidence: {analysis.confidence}%
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(analysis.riskLevel)}`}>
                  {analysis.riskLevel.toUpperCase()} RISK
                </div>
              </div>
            </div>

            {/* Risk Flags */}
            {analysis.flags.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-white font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  Risk Indicators
                </h4>
                <div className="space-y-2">
                  {analysis.flags.map((flag, index) => (
                    <div key={index} className="flex items-start space-x-2 text-white/80 text-sm">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="space-y-2">
              <h4 className="text-white font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                Recommendations
              </h4>
              <div className="space-y-2">
                {analysis.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-2 text-white/80 text-sm">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-white/5 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <h3 className="text-white font-medium mb-2">How It Works</h3>
            <ul className="text-white/70 text-sm space-y-1">
              <li>• AI analyzes product images and details</li>
              <li>• Cross-references with authentic product databases</li>
              <li>• Checks seller credibility and market patterns</li>
              <li>• Provides risk assessment and recommendations</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className="bg-white/5 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <h3 className="text-white font-medium mb-2">Detection Features</h3>
            <ul className="text-white/70 text-sm space-y-1">
              <li>• Visual quality analysis</li>
              <li>• Price comparison alerts</li>
              <li>• Seller verification</li>
              <li>• Brand authentication checks</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CounterfeitDetection;
