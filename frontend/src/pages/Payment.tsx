import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Copy, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Zap,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';

interface PaymentData {
  planId: string;
  planName: string;
  planDescription: string;
  price: number;
  billingPeriod: string;
  savings?: string;
}

type PaymentMethod = 'lightning' | 'lnmarkets';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('lightning');
  const [lightningAddress, setLightningAddress] = useState('');
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [invoiceGenerated, setInvoiceGenerated] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'confirmed' | 'expired'>('pending');
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const [lightningInvoice, setLightningInvoice] = useState('');
  const [qrCodeData, setQrCodeData] = useState('');

  // Mock data for development
  const mockPaymentData: PaymentData = {
    planId: 'advanced',
    planName: 'Advanced',
    planDescription: 'For serious traders who need professional automation.',
    price: 49,
    billingPeriod: 'month',
    savings: 'Save 20%'
  };

  useEffect(() => {
    // Get payment data from location state or use mock data
    const data = location.state?.paymentData || mockPaymentData;
    setPaymentData(data);
  }, [location.state]);

  useEffect(() => {
    // Timer countdown
    if (invoiceGenerated && paymentStatus === 'pending') {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setPaymentStatus('expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [invoiceGenerated, paymentStatus]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPriceInSatoshis = (priceUSD: number) => {
    // Mock BTC price: $50,000
    const btcPrice = 50000;
    const btcAmount = priceUSD / btcPrice;
    return Math.round(btcAmount * 100000000); // Convert to satoshis
  };

  const handleGenerateInvoice = async () => {
    setIsGeneratingInvoice(true);
    
    try {
      // Simulate API call to generate Lightning invoice
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock invoice data
      const mockInvoice = 'lnbc' + Math.random().toString(36).substring(2, 15) + '...';
      const mockQrCode = `lightning:${mockInvoice}`;
      
      setLightningInvoice(mockInvoice);
      setQrCodeData(mockQrCode);
      setInvoiceGenerated(true);
      setTimeRemaining(600); // Reset timer
      
    } catch (error) {
      console.error('Error generating invoice:', error);
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handleCopyInvoice = async () => {
    try {
      await navigator.clipboard.writeText(lightningInvoice);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy invoice:', error);
    }
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(lightningAddress);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const handleBackToPlans = () => {
    navigate('/register/plan');
  };

  const handleCancel = () => {
    navigate('/register/plan');
  };

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading payment data...</p>
        </div>
      </div>
    );
  }

  const satoshis = getPriceInSatoshis(paymentData.price);
  const btcPrice = 50000; // Mock BTC price
  const satoshiPrice = paymentData.price / btcPrice;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-6 shadow-lg shadow-blue-500/25">
            <span className="text-white text-2xl">🤖</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Payment</h1>
          <p className="text-slate-400">Complete your Axisor Bot subscription</p>
        </div>

        {/* Warning Banner */}
        <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4 mb-8 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-orange-400 flex-shrink-0" />
            <p className="text-orange-200 font-medium">
              Please <strong>DO NOT LEAVE THIS SCREEN</strong> during the payment process.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Plan Details */}
          <div className="space-y-6">
            {/* Plan Details */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Plan Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{paymentData.planName}</h3>
                    <p className="text-slate-400 text-sm">{paymentData.planDescription}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                  <div>
                    <p className="text-2xl font-bold text-white">${paymentData.price}</p>
                    <p className="text-slate-400 text-sm">/{paymentData.billingPeriod}</p>
                  </div>
                  {paymentData.savings && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      {paymentData.savings}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Selection */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Choose Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div 
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      paymentMethod === 'lightning' 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                    onClick={() => setPaymentMethod('lightning')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        paymentMethod === 'lightning' ? 'border-blue-500 bg-blue-500' : 'border-slate-600'
                      }`}>
                        {paymentMethod === 'lightning' && (
                          <div className="w-full h-full rounded-full bg-blue-500 scale-50"></div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-white font-medium">Generate Lightning Invoice</h4>
                        <p className="text-slate-400 text-sm">
                          Payment via Bitcoin Lightning Network from any wallet
                        </p>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      paymentMethod === 'lnmarkets' 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                    onClick={() => setPaymentMethod('lnmarkets')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        paymentMethod === 'lnmarkets' ? 'border-blue-500 bg-blue-500' : 'border-slate-600'
                      }`}>
                        {paymentMethod === 'lnmarkets' && (
                          <div className="w-full h-full rounded-full bg-blue-500 scale-50"></div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-white font-medium">Transfer from LNMarkets</h4>
                        <p className="text-slate-400 text-sm">
                          Fast internal transfer with no fees from your LNMarkets account
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Dynamic Payment Interface */}
          <div className="space-y-6">
            {paymentMethod === 'lightning' ? (
              /* Lightning Payment Interface */
              <>
                {!invoiceGenerated ? (
                  /* Generate Lightning Invoice */
                  <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white">Generate Lightning Invoice</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-center">
                        <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                          <Zap className="h-12 w-12 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Lightning Payment</h3>
                        <p className="text-slate-400 mb-4">
                          Generate a Lightning invoice to complete your payment
                        </p>
                      </div>

                      <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">Amount:</span>
                          <span className="text-white font-bold">${paymentData.price}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">Satoshis:</span>
                          <span className="text-white font-bold">{satoshis.toLocaleString()} sats</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">Rate:</span>
                          <span className="text-slate-400">${btcPrice.toLocaleString()}/BTC</span>
                        </div>
                      </div>

                      <Button
                        onClick={handleGenerateInvoice}
                        disabled={isGeneratingInvoice}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 transition-all duration-200 shadow-lg shadow-blue-500/25"
                      >
                        {isGeneratingInvoice ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Generating Invoice...
                          </>
                        ) : (
                          'Generate Invoice'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  /* Lightning Payment Interface */
                  <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center space-x-2">
                        <span>Lightning Payment Invoice</span>
                        {paymentStatus === 'confirmed' && (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        )}
                        {paymentStatus === 'expired' && (
                          <Clock className="h-5 w-5 text-red-400" />
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* QR Code Placeholder */}
                      <div className="text-center">
                        <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center mx-auto mb-4 border-2 border-slate-600">
                          <div className="text-center">
                            <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center mb-2">
                              <span className="text-gray-500 text-xs">QR Code</span>
                            </div>
                            <p className="text-xs text-gray-500">Scan with Lightning wallet</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-slate-300">
                            {paymentStatus === 'pending' && 'Waiting for payment confirmation...'}
                            {paymentStatus === 'confirmed' && 'Payment confirmed! Redirecting...'}
                            {paymentStatus === 'expired' && 'Payment expired. Please generate a new invoice.'}
                          </p>
                          
                          {paymentStatus === 'pending' && (
                            <div className="flex items-center justify-center space-x-2 text-orange-400">
                              <Clock className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                This invoice expires in {formatTime(timeRemaining)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Invoice Details */}
                      <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">Amount:</span>
                          <span className="text-white font-bold">{satoshis.toLocaleString()} sats</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">USD Value:</span>
                          <span className="text-white font-bold">${paymentData.price}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">Rate:</span>
                          <span className="text-slate-400">${satoshiPrice.toFixed(8)}/sat</span>
                        </div>
                      </div>

                      {/* Copy Invoice */}
                      <div className="space-y-2">
                        <Label className="text-slate-300">Lightning Invoice:</Label>
                        <div className="flex space-x-2">
                          <Input
                            value={lightningInvoice}
                            readOnly
                            className="bg-slate-700 border-slate-600 text-white text-xs font-mono"
                          />
                          <Button
                            onClick={handleCopyInvoice}
                            variant="outline"
                            size="sm"
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-slate-400 text-xs">
                          (Copy the exact value for the transfer)
                        </p>
                      </div>

                      {/* Payment Instructions */}
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <p className="text-blue-200 text-sm">
                          To pay, scan the QR code above with your Lightning wallet or copy the invoice and paste it into your Bitcoin Lightning wallet. The payment will be processed automatically after confirmation on the network.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              /* LNMarkets Transfer Interface */
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">LNMarkets Internal Transfer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <ExternalLink className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Internal Transfer</h3>
                    <p className="text-slate-400 mb-4">
                      Transfer funds directly from your LNMarkets account
                    </p>
                  </div>

                  <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Amount:</span>
                      <span className="text-white font-bold">${paymentData.price}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Satoshis:</span>
                      <span className="text-white font-bold">{satoshis.toLocaleString()} sats</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Fees:</span>
                      <span className="text-green-400 font-bold">No fees</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="lightning-address" className="text-slate-300">
                        Your LNMarkets Lightning Address:
                      </Label>
                      <div className="flex space-x-2">
                        <Input
                          id="lightning-address"
                          placeholder="Enter your username (e.g.: myusername) or full address (e.g.: user@lnmarkets.com)"
                          value={lightningAddress}
                          onChange={(e) => setLightningAddress(e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        <Button
                          onClick={handleCopyAddress}
                          variant="outline"
                          size="sm"
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Button
                      onClick={handleGenerateInvoice}
                      disabled={!lightningAddress.trim() || isGeneratingInvoice}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3 transition-all duration-200 shadow-lg shadow-green-500/25"
                    >
                      {isGeneratingInvoice ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating Transfer...
                        </>
                      ) : (
                        'Generate Transfer Request'
                      )}
                    </Button>
                  </div>

                  {/* LNMarkets Instructions */}
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <h4 className="text-green-200 font-medium mb-2">Transfer Instructions:</h4>
                    <ol className="text-green-200 text-sm space-y-1">
                      <li>1. Access your LNMarkets account dashboard</li>
                      <li>2. Go to the Lightning section</li>
                      <li>3. Use the generated invoice to make the transfer</li>
                      <li>4. Payment will be processed automatically</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <Button
            onClick={handleBackToPlans}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Plans
          </Button>
          
          <Button
            onClick={handleCancel}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
