// src/components/charts/TradingChartTest.tsx
import React, { useEffect, useState } from 'react';
import { useChartStore } from '@/store/chartStore';
import { marketDataService } from '@/services/marketData.service';
import TradingChart from './TradingChart';

interface TestResult {
  endpoint: string;
  status: 'success' | 'error' | 'loading';
  message: string;
  data?: any;
}

export default function TradingChartTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const setRawBars = useChartStore(s => s.setRawBars);

  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);

    const tests = [
      {
        name: 'TradingView Proxy - Historical Data',
        test: async () => {
          const data = await marketDataService.getHistoricalData('BTCUSDT', '1h', 50);
          return { count: data.length, sample: data[0] };
        }
      },
      {
        name: 'TradingView Proxy - Market Data',
        test: async () => {
          const data = await marketDataService.getMarketData('BTCUSDT');
          return data;
        }
      }
    ];

    for (const test of tests) {
      setTestResults(prev => [...prev, {
        endpoint: test.name,
        status: 'loading',
        message: 'Testing...'
      }]);

      try {
        const result = await test.test();
        setTestResults(prev => prev.map(t => 
          t.endpoint === test.name 
            ? { ...t, status: 'success', message: 'Success', data: result }
            : t
        ));
      } catch (error: any) {
        setTestResults(prev => prev.map(t => 
          t.endpoint === test.name 
            ? { ...t, status: 'error', message: error.message }
            : t
        ));
      }
    }

    setIsLoading(false);
  };

  const loadSampleData = async () => {
    try {
      const data = await marketDataService.getHistoricalData('BTCUSDT', '1h', 200);
      setRawBars(data);
      console.log('✅ Sample data loaded:', data.length, 'candles');
    } catch (error) {
      console.error('❌ Failed to load sample data:', error);
    }
  };

  useEffect(() => {
    loadSampleData();
  }, []);

  return (
    <div className="w-full h-full bg-gray-900 p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-4">Trading Chart - Proxy Test</h2>
        
        <div className="flex gap-4 mb-4">
          <button
            onClick={runTests}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test TradingView Proxy'}
          </button>
          
          <button
            onClick={loadSampleData}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Load Sample Data
          </button>
        </div>

        {/* Test Results */}
        <div className="space-y-2 mb-6">
          {testResults.map((result, index) => (
            <div key={index} className="p-3 rounded border">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  result.status === 'success' ? 'bg-green-500' :
                  result.status === 'error' ? 'bg-red-500' :
                  'bg-yellow-500'
                }`} />
                <span className="font-medium text-white">{result.endpoint}</span>
                <span className={`text-sm ${
                  result.status === 'success' ? 'text-green-400' :
                  result.status === 'error' ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  {result.message}
                </span>
              </div>
              {result.data && (
                <div className="mt-2 text-xs text-gray-400">
                  <pre>{JSON.stringify(result.data, null, 2)}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <TradingChart />
      
      <div className="mt-4 text-sm text-gray-500">
        <p>Proxy Endpoints:</p>
        <ul className="list-disc list-inside ml-4">
          <li><code>/api/tradingview/scanner</code> - Historical data</li>
          <li><code>/api/tradingview/market/:symbol</code> - Market data</li>
        </ul>
      </div>
    </div>
  );
}
