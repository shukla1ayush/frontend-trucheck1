
import React, { useState } from 'react';
import { Calendar, Search, Filter, Trash2, Eye, ShieldCheck, ShieldX, AlertTriangle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

interface AnalysisHistoryProps {
  history: AnalysisRecord[];
  onClearHistory: () => void;
}

const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({ history, onClearHistory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'review' | 'product'>('all');
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord | null>(null);

  const filteredHistory = history.filter(record => {
    const matchesSearch = !searchTerm || 
      record.productInfo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.reviewText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.productUrl?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || record.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getRiskColor = (level?: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (record: AnalysisRecord) => {
    if (record.type === 'review') {
      return record.result.isFake ? 'text-red-600' : 'text-green-600';
    } else {
      return record.result.isAuthentic ? 'text-green-600' : 'text-red-600';
    }
  };

  const getStatusText = (record: AnalysisRecord) => {
    if (record.type === 'review') {
      return record.result.isFake ? 'Potentially Fake' : 'Likely Authentic';
    } else {
      return record.result.isAuthentic ? 'Likely Authentic' : 'Potentially Counterfeit';
    }
  };

  const getStatusIcon = (record: AnalysisRecord) => {
    if (record.type === 'review') {
      return record.result.isFake ? <ShieldX className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />;
    } else {
      return record.result.isAuthentic ? <ShieldCheck className="w-4 h-4" /> : <ShieldX className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Analysis History
        </h2>
        <p className="text-white/80">
          Track and review all your analysis results
        </p>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
                <Input
                  placeholder="Search analyses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/20 border-white/30 text-white placeholder-white/60 focus:border-purple-400"
                />
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2">
                <Filter className="text-white/60 w-4 h-4" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'review' | 'product')}
                  className="bg-white/20 border border-white/30 text-white rounded-md px-3 py-2 focus:border-purple-400 focus:outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="review">Reviews</option>
                  <option value="product">Products</option>
                </select>
              </div>
            </div>

            {/* Clear History Button */}
            {history.length > 0 && (
              <Button
                onClick={onClearHistory}
                variant="outline"
                size="sm"
                className="bg-red-500/20 border-red-400/30 text-red-300 hover:bg-red-500/30"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear History
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {history.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/5 backdrop-blur-sm border-white/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{history.length}</div>
              <div className="text-white/70 text-sm">Total Analyses</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 backdrop-blur-sm border-white/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {history.filter(h => h.type === 'review').length}
              </div>
              <div className="text-white/70 text-sm">Review Checks</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 backdrop-blur-sm border-white/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {history.filter(h => h.type === 'product').length}
              </div>
              <div className="text-white/70 text-sm">Product Checks</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 backdrop-blur-sm border-white/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {Math.round(history.reduce((acc, h) => acc + h.result.confidence, 0) / history.length)}%
              </div>
              <div className="text-white/70 text-sm">Avg Confidence</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-white/50 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">
              {history.length === 0 ? 'No Analysis History Yet' : 'No Results Found'}
            </h3>
            <p className="text-white/70">
              {history.length === 0 
                ? 'Start analyzing reviews or products to see your history here.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((record) => (
            <Card key={record.id} className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`flex items-center gap-2 ${getStatusColor(record)}`}>
                        {getStatusIcon(record)}
                        <span className="font-medium">{getStatusText(record)}</span>
                      </div>
                      
                      <div className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                        {record.type === 'review' ? 'Review Analysis' : 'Product Check'}
                      </div>

                      {record.result.riskLevel && (
                        <div className={`px-2 py-1 text-xs rounded-full border ${getRiskColor(record.result.riskLevel)}`}>
                          {record.result.riskLevel.toUpperCase()} RISK
                        </div>
                      )}
                      
                      <div className="text-white/50 text-sm">
                        {record.result.confidence}% confidence
                      </div>
                    </div>

                    <div className="space-y-2">
                      {record.productInfo && (
                        <div className="text-white">
                          <span className="text-white/70">Product: </span>
                          {record.productInfo}
                        </div>
                      )}
                      
                      {record.reviewText && (
                        <div className="text-white">
                          <span className="text-white/70">Review: </span>
                          <span className="text-sm">
                            {record.reviewText.length > 100 
                              ? `${record.reviewText.substring(0, 100)}...` 
                              : record.reviewText}
                          </span>
                        </div>
                      )}

                      {record.productUrl && (
                        <div className="flex items-center gap-2 text-white">
                          <span className="text-white/70">URL: </span>
                          <a 
                            href={record.productUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                          >
                            {record.productUrl.length > 50 
                              ? `${record.productUrl.substring(0, 50)}...` 
                              : record.productUrl}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-white/50 text-sm mt-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(record.timestamp)}
                    </div>
                  </div>

                  <Button
                    onClick={() => setSelectedRecord(record)}
                    variant="outline"
                    size="sm"
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detailed View Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-white/95 backdrop-blur-md border-white/20 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedRecord)}
                  <span>Analysis Details</span>
                </div>
                <Button
                  onClick={() => setSelectedRecord(null)}
                  variant="outline"
                  size="sm"
                >
                  Close
                </Button>
              </CardTitle>
              <CardDescription>
                {formatDate(selectedRecord.timestamp)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div className={`p-4 rounded-lg border ${
                selectedRecord.type === 'review' 
                  ? (selectedRecord.result.isFake ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200')
                  : (selectedRecord.result.isAuthentic ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{getStatusText(selectedRecord)}</h3>
                    <p className="text-sm opacity-80">
                      Confidence: {selectedRecord.result.confidence}%
                    </p>
                  </div>
                  {selectedRecord.result.riskLevel && (
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(selectedRecord.result.riskLevel)}`}>
                      {selectedRecord.result.riskLevel.toUpperCase()} RISK
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              {selectedRecord.productInfo && (
                <div>
                  <h4 className="font-medium mb-2">Product Information</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedRecord.productInfo}</p>
                </div>
              )}

              {selectedRecord.reviewText && (
                <div>
                  <h4 className="font-medium mb-2">Review Text</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedRecord.reviewText}</p>
                </div>
              )}

              {selectedRecord.productUrl && (
                <div>
                  <h4 className="font-medium mb-2">Product URL</h4>
                  <a 
                    href={selectedRecord.productUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-2 bg-gray-50 p-3 rounded break-all"
                  >
                    {selectedRecord.productUrl}
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  </a>
                </div>
              )}

              {/* Analysis Results */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Analysis Findings
                </h4>
                <div className="space-y-2">
                  {selectedRecord.result.reasons.map((reason, index) => (
                    <div key={index} className="flex items-start space-x-2 text-gray-700">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AnalysisHistory;
