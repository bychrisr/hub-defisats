/**
 * Testnet Faucet Page
 * 
 * Page for requesting testnet sats via Lightning Network faucet.
 * Includes faucet component, history, and statistics.
 */

import React from 'react';
import { TestnetFaucet } from '../components/TestnetFaucet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { 
  Zap, 
  History, 
  BarChart3, 
  Info,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useTestnetFaucet } from '../hooks/useTestnetFaucet';

export const TestnetFaucetPage: React.FC = () => {
  const {
    faucetHistory,
    faucetStats,
    pendingRequests,
    successfulRequests,
    totalReceived,
    canRequestMore,
    timeUntilNextRequest,
  } = useTestnetFaucet();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'expired':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">Pending</Badge>;
      case 'expired':
        return <Badge variant="default" className="bg-red-100 text-red-800">Expired</Badge>;
      case 'cancelled':
        return <Badge variant="default" className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Zap className="h-8 w-8 text-yellow-500" />
          Testnet Faucet
        </h1>
        <p className="text-muted-foreground mt-2">
          Request testnet sats for development and testing purposes via Lightning Network
        </p>
      </div>

      {/* Info Banner */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            Important Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              • This faucet provides <strong>testnet sats only</strong> - these have no real value
            </p>
            <p>
              • Use testnet sats for development, testing, and learning purposes
            </p>
            <p>
              • Rate limits apply to prevent abuse and ensure fair distribution
            </p>
            <p>
              • Payments are processed automatically via Lightning Network
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Faucet Component */}
        <div className="lg:col-span-1">
          <TestnetFaucet />
        </div>

        {/* Statistics and History */}
        <div className="lg:col-span-1 space-y-6">
          {/* User Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Your Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {totalReceived.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Received</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {successfulRequests.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Successful Requests</div>
                </div>
              </div>
              
              {!canRequestMore && timeUntilNextRequest && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-800">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Rate limit exceeded. Next request allowed in: {timeUntilNextRequest.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-purple-500" />
                Recent Requests
              </CardTitle>
              <CardDescription>
                Your last 10 faucet requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!faucetHistory || faucetHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No requests yet</p>
                  <p className="text-sm">Make your first request using the faucet above</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {faucetHistory.slice(0, 10).map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(request.status)}
                        <div>
                          <div className="font-medium">
                            {request.amount_sats.toLocaleString()} sats
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatTimeAgo(request.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(request.status)}
                        {request.status === 'paid' && request.paid_at && (
                          <div className="text-xs text-muted-foreground">
                            {formatTimeAgo(request.paid_at)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Global Statistics */}
          {faucetStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-500" />
                  Global Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">
                      {faucetStats.totalDistributed.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Distributed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">
                      {faucetStats.totalUsers}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600">
                      {Math.round(faucetStats.successRate * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-orange-600">
                      {faucetStats.last24Hours.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Last 24h</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
