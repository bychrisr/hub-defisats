/**
 * Testnet Faucet Component
 * 
 * Component for requesting testnet sats via Lightning Network.
 * Includes QR code generation and payment status tracking.
 */

import React, { useState, useEffect } from 'react';
import { useTestnetFaucet } from '../hooks/useTestnetFaucet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { SatsIcon } from './SatsIcon';
import { 
  Zap, 
  QrCode, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Copy,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface TestnetFaucetProps {
  className?: string;
}

export const TestnetFaucet: React.FC<TestnetFaucetProps> = ({ className }) => {
  const {
    faucetInfo,
    faucetStats,
    currentInvoice,
    qrCodeData,
    isRequesting,
    isCheckingStatus,
    requestSats,
    canRequestMore,
    timeUntilNextRequest,
    totalReceived,
    pendingRequests,
    successfulRequests,
    requestError,
  } = useTestnetFaucet();

  const [amount, setAmount] = useState<number>(1000);
  const [copied, setCopied] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Update countdown timer
  useEffect(() => {
    if (!timeUntilNextRequest) {
      setTimeLeft('');
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const diff = timeUntilNextRequest.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [timeUntilNextRequest]);

  // Handle amount change
  const handleAmountChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      setAmount(numValue);
    }
  };

  // Handle request sats
  const handleRequestSats = () => {
    if (!faucetInfo?.isEnabled) {
      toast.error('Testnet faucet is not enabled');
      return;
    }

    if (!canRequestMore) {
      toast.error('Rate limit exceeded. Please wait before requesting more sats.');
      return;
    }

    try {
      requestSats(amount);
      toast.success('Testnet sats requested! Check the QR code below.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to request testnet sats');
    }
  };

  // Copy invoice to clipboard
  const copyInvoice = async () => {
    if (!currentInvoice) return;

    try {
      await navigator.clipboard.writeText(currentInvoice);
      setCopied(true);
      toast.success('Invoice copied to clipboard!');
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy invoice');
    }
  };

  // Open invoice in Lightning wallet
  const openInWallet = () => {
    if (!currentInvoice) return;
    
    const lightningUrl = `lightning:${currentInvoice}`;
    window.open(lightningUrl, '_blank');
  };

  if (!faucetInfo) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Testnet Faucet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading faucet info...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!faucetInfo.isEnabled) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Testnet Faucet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The testnet faucet is currently disabled. Please check back later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Testnet Faucet
          </CardTitle>
          <CardDescription>
            Request testnet sats for development and testing purposes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Faucet Stats */}
          {faucetStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {faucetStats.totalDistributed.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Distributed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {faucetStats.totalUsers}
                </div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {faucetStats.averageAmount.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Avg Amount</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(faucetStats.successRate * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>
          )}

          <Separator />

          {/* User Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                {totalReceived.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Received</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">
                {successfulRequests.length}
              </div>
              <div className="text-sm text-muted-foreground">Successful Requests</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-orange-600">
                {pendingRequests.length}
              </div>
              <div className="text-sm text-muted-foreground">Pending Requests</div>
            </div>
          </div>

          <Separator />

          {/* Rate Limit Status */}
          {!canRequestMore && timeUntilNextRequest && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Rate limit exceeded. You can request more sats in: {timeLeft}
              </AlertDescription>
            </Alert>
          )}

          {/* Request Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (sats)</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  min={faucetInfo.minAmount}
                  max={faucetInfo.maxAmount}
                  placeholder="Enter amount"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => setAmount(faucetInfo.minAmount)}
                  disabled={!canRequestMore || isRequesting}
                >
                  Min
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAmount(faucetInfo.maxAmount)}
                  disabled={!canRequestMore || isRequesting}
                >
                  Max
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Range: {faucetInfo.minAmount.toLocaleString()} - {faucetInfo.maxAmount.toLocaleString()} sats
              </div>
            </div>

            <Button
              onClick={handleRequestSats}
              disabled={!canRequestMore || isRequesting || amount < faucetInfo.minAmount || amount > faucetInfo.maxAmount}
              className="w-full"
              size="lg"
            >
              {isRequesting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Requesting...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Request {amount.toLocaleString()} sats
                </>
              )}
            </Button>
          </div>

          {/* Error Display */}
          {requestError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {requestError.message || 'Failed to request testnet sats'}
              </AlertDescription>
            </Alert>
          )}

          {/* QR Code and Invoice */}
          {currentInvoice && (
            <div className="space-y-4">
              <Separator />
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Payment Request</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Scan the QR code with your Lightning wallet or copy the invoice
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                {/* QR Code */}
                <div className="flex-1">
                  <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center min-h-[200px]">
                    <QrCode className="h-32 w-32 text-gray-400" />
                    {/* TODO: Implement actual QR code generation */}
                    <div className="text-center">
                      <p className="text-sm text-gray-500">QR Code</p>
                      <p className="text-xs text-gray-400">Will be generated here</p>
                    </div>
                  </div>
                </div>

                {/* Invoice Actions */}
                <div className="flex-1 space-y-3">
                  <div className="space-y-2">
                    <Label>Lightning Invoice</Label>
                    <div className="flex gap-2">
                      <Input
                        value={currentInvoice}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={copyInvoice}
                        disabled={copied}
                      >
                        {copied ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={openInWallet}
                      className="flex-1"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open in Wallet
                    </Button>
                  </div>

                  <div className="text-center">
                    <Badge variant="outline" className="text-orange-600">
                      <Clock className="mr-1 h-3 w-3" />
                      Pending Payment
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rate Limit Info */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              You can request up to {faucetInfo.userRateLimit} times per {faucetInfo.rateLimitHours} hours
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
