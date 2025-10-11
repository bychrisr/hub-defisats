/**
 * Testnet Faucet Component
 * 
 * Componente para interagir com o sistema de funding interno via LND testnet
 */

import React, { useState, useEffect } from 'react';
import { useTestnetFaucet } from '../hooks/useTestnetFaucet';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { SatsIcon } from './SatsIcon';
import { 
  Zap, 
  Wallet, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface TestnetFaucetProps {
  className?: string;
}

export function TestnetFaucet({ className }: TestnetFaucetProps) {
  const {
    loading,
    error,
    faucetInfo,
    fundingHistory,
    stats,
    getFaucetInfo,
    requestFunding,
    requestDefaultFunding,
    requestMaxFunding,
    getFundingHistory,
    getFaucetStats,
    clearError,
    refresh,
    isAvailable,
    currentBalance,
    maxAmount,
    minAmount,
    dailyLimit,
    lndStatus
  } = useTestnetFaucet();

  const [amount, setAmount] = useState<number>(10000);
  const [memo, setMemo] = useState<string>('Testnet faucet funding');
  const [lightningAddress, setLightningAddress] = useState<string>('');

  // Carregar dados iniciais
  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleRequestFunding = async () => {
    try {
      clearError();
      await requestFunding({
        amount,
        memo,
        lightningAddress: lightningAddress || undefined
      });
      
      // Limpar campos após sucesso
      setAmount(10000);
      setMemo('Testnet faucet funding');
      setLightningAddress('');
    } catch (err) {
      console.error('Failed to request funding:', err);
    }
  };

  const handleDefaultFunding = async () => {
    try {
      clearError();
      await requestDefaultFunding();
    } catch (err) {
      console.error('Failed to request default funding:', err);
    }
  };

  const handleMaxFunding = async () => {
    try {
      clearError();
      await requestMaxFunding();
    } catch (err) {
      console.error('Failed to request max funding:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-500">Connected</Badge>;
      case 'syncing':
        return <Badge variant="secondary">Syncing</Badge>;
      case 'disconnected':
        return <Badge variant="destructive">Disconnected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getHistoryStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            Testnet Faucet
          </h2>
          <p className="text-muted-foreground">
            Sistema de funding interno via LND testnet
          </p>
        </div>
        <Button
          onClick={refresh}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Faucet Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Faucet Status
          </CardTitle>
          <CardDescription>
            Informações sobre o sistema de funding testnet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold flex items-center justify-center gap-1">
                <SatsIcon size={20} />
                {currentBalance.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Current Balance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{maxAmount.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Max Amount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{minAmount.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Min Amount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{dailyLimit.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Daily Limit</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">LND Status:</span>
            {getStatusBadge(lndStatus)}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Available:</span>
            <Badge variant={isAvailable ? "default" : "secondary"}>
              {isAvailable ? 'Yes' : 'No'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Funding Request */}
      <Card>
        <CardHeader>
          <CardTitle>Request Funding</CardTitle>
          <CardDescription>
            Solicite sats testnet para desenvolvimento e testes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (sats)</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={minAmount}
                max={maxAmount}
                placeholder="Enter amount in sats"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Memo (optional)</label>
              <Input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Enter memo"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Lightning Address (optional)</label>
            <Input
              type="text"
              value={lightningAddress}
              onChange={(e) => setLightningAddress(e.target.value)}
              placeholder="Enter Lightning address"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleRequestFunding}
              disabled={loading || !isAvailable || amount < minAmount || amount > maxAmount}
              className="flex-1"
            >
              {loading ? 'Processing...' : 'Request Funding'}
            </Button>
            <Button
              onClick={handleDefaultFunding}
              disabled={loading || !isAvailable}
              variant="outline"
            >
              Default (10k)
            </Button>
            <Button
              onClick={handleMaxFunding}
              disabled={loading || !isAvailable}
              variant="outline"
            >
              Max
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
            <CardDescription>
              Estatísticas do sistema de funding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalRequests}</div>
                <div className="text-sm text-muted-foreground">Total Requests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold flex items-center justify-center gap-1">
                  <SatsIcon size={20} />
                  {stats.totalSatsDistributed.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Sats Distributed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.successfulRequests}
                </div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {stats.failedRequests}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {stats.averageAmount.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Average Amount</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {stats.last24Hours.requests}
                </div>
                <div className="text-sm text-muted-foreground">Last 24h Requests</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Funding History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
          <CardDescription>
            Histórico recente de solicitações de funding
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fundingHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No funding requests yet
            </div>
          ) : (
            <div className="space-y-2">
              {fundingHistory.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getHistoryStatusIcon(item.status)}
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        <SatsIcon size={16} />
                        {item.amount.toLocaleString()} sats
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{item.status}</Badge>
                    {item.lightningInvoice && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`lightning:${item.lightningInvoice}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}