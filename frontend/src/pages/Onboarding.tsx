import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductTour } from '@/components/ProductTour';
import { TOURS, tourProgress } from '@/services/tourService';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Rocket, Zap, Shield, TrendingUp, Plus, CheckCircle } from 'lucide-react';

export default function Onboarding() {
  const location = useLocation();
  const navigate = useNavigate();
  const [runTour, setRunTour] = useState(false);
  const [currentStep, setCurrentStep] = useState<'welcome' | 'accounts' | 'tour'>('welcome');
  const fromRegistration = location.state?.fromRegistration;
  
  const { 
    isLoading, 
    error, 
    checkOnboardingStatus, 
    getUserAccounts, 
    addExchangeAccount, 
    skipOnboarding, 
    completeOnboarding,
    clearError 
  } = useOnboarding();
  
  const [onboardingStatus, setOnboardingStatus] = useState<any>(null);
  const [userAccounts, setUserAccounts] = useState<any[]>([]);

  useEffect(() => {
    loadOnboardingData();
  }, []);

  const loadOnboardingData = async () => {
    try {
      const status = await checkOnboardingStatus();
      setOnboardingStatus(status);
      setUserAccounts(status.userAccounts);
    } catch (error) {
      console.error('Error loading onboarding data:', error);
    }
  };

  const handleStartTour = () => {
    setRunTour(true);
  };

  const handleTourComplete = async () => {
    console.log('✅ Tour completed!');
    setRunTour(false);
    await completeOnboarding();
    navigate('/dashboard');
  };

  const handleSkipTour = async () => {
    console.log('⏭️ Tour skipped');
    setRunTour(false);
    await skipOnboarding();
    navigate('/dashboard');
  };

  const handleSkipOnboarding = async () => {
    await skipOnboarding();
    navigate('/dashboard');
  };

  const handleContinueToTour = () => {
    setCurrentStep('tour');
  };

  const handleAddAccount = () => {
    setCurrentStep('accounts');
  };

  return (
    <>
      <ProductTour
        tour={TOURS.ONBOARDING}
        run={runTour}
        onComplete={handleTourComplete}
        onSkip={handleSkipTour}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          {currentStep === 'welcome' && (
            <CardHeader className="text-center">
              <div className="mx-auto h-20 w-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-blue-500/25">
                <Rocket className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold text-white mb-2">
                Welcome to Axisor! 🎉
              </CardTitle>
              <p className="text-slate-400">
                {fromRegistration 
                  ? 'Your account is ready! Let us show you around.'
                  : 'Ready to explore the platform?'}
              </p>
            </CardHeader>
          )}

          {currentStep === 'accounts' && (
            <CardHeader className="text-center">
              <div className="mx-auto h-20 w-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/25">
                <Plus className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold text-white mb-2">
                Connect Your Trading Accounts
              </CardTitle>
              <p className="text-slate-400">
                Add your exchange credentials to start automated trading.
              </p>
            </CardHeader>
          )}

          {currentStep === 'tour' && (
            <CardHeader className="text-center">
              <div className="mx-auto h-20 w-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-purple-500/25">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold text-white mb-2">
                Ready for Your Tour?
              </CardTitle>
              <p className="text-slate-400">
                Let us show you around the platform in just 2 minutes.
              </p>
            </CardHeader>
          )}

          <CardContent className="space-y-6">
            {currentStep === 'welcome' && (
              <>
                {/* Features Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                    <Zap className="h-6 w-6 text-blue-400 mb-2" />
                    <h3 className="text-white font-semibold mb-1">Trading Automation</h3>
                    <p className="text-slate-400 text-sm">
                      Set up automated trading strategies with LN Markets integration.
                    </p>
                  </div>

                  <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                    <Shield className="h-6 w-6 text-purple-400 mb-2" />
                    <h3 className="text-white font-semibold mb-1">Margin Guard</h3>
                    <p className="text-slate-400 text-sm">
                      Protect your positions with intelligent risk management.
                    </p>
                  </div>

                  <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                    <TrendingUp className="h-6 w-6 text-green-400 mb-2" />
                    <h3 className="text-white font-semibold mb-1">Real-time Analytics</h3>
                    <p className="text-slate-400 text-sm">
                      Monitor your performance with advanced dashboards.
                    </p>
                  </div>

                  <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                    <Rocket className="h-6 w-6 text-yellow-400 mb-2" />
                    <h3 className="text-white font-semibold mb-1">Backtesting</h3>
                    <p className="text-slate-400 text-sm">
                      Test your strategies before deploying them live.
                    </p>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3 pt-4">
                  <Button
                    onClick={handleAddAccount}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white text-lg py-6"
                  >
                    Add Trading Account
                  </Button>

                  <Button
                    onClick={handleContinueToTour}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg py-6"
                  >
                    Start Quick Tour (2 minutes)
                  </Button>

                  <Button
                    onClick={handleSkipOnboarding}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Skip onboarding, go to dashboard
                  </Button>
                </div>
              </>
            )}

            {currentStep === 'accounts' && (
              <>
                <div className="text-center">
                  <p className="text-slate-400 mb-6">
                    You can add your trading accounts now or later from your profile.
                  </p>
                  
                  <div className="space-y-3">
                    <Button
                      onClick={handleContinueToTour}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg py-6"
                    >
                      Continue to Tour
                    </Button>

                    <Button
                      onClick={handleSkipOnboarding}
                      variant="outline"
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Skip for now
                    </Button>
                  </div>
                </div>
              </>
            )}

            {currentStep === 'tour' && (
              <>
                <div className="text-center">
                  <p className="text-slate-400 mb-6">
                    Let us show you around the platform in just 2 minutes.
                  </p>
                  
                  <div className="space-y-3">
                    <Button
                      onClick={handleStartTour}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg py-6"
                    >
                      Start Quick Tour (2 minutes)
                    </Button>

                    <Button
                      onClick={handleSkipTour}
                      variant="outline"
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Skip tour, go to dashboard
                    </Button>
                  </div>
                </div>
              </>
            )}

            <p className="text-center text-slate-500 text-sm">
              You can restart the tour anytime from Settings
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
