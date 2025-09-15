import React, { useState } from 'react';
import { useTestFavicon } from '@/hooks/useDynamicFavicon';

const FaviconTest: React.FC = () => {
  const [plValue, setPlValue] = useState<number>(0);
  const [lastGenerated, setLastGenerated] = useState<string>('');
  const [showTest, setShowTest] = useState<boolean>(false);
  const { testFavicon } = useTestFavicon();

  const handleTest = () => {
    const result = testFavicon(plValue);
    setLastGenerated(result);
    console.log('🎨 FAVICON TEST - Generated:', result);
  };

  const quickTests = [
    { label: 'P&L Zero', value: 0 },
    { label: 'P&L Positivo (+10k sats)', value: 10000 },
    { label: 'P&L Negativo (-5k sats)', value: -5000 },
    { label: 'P&L Muito Positivo (+100k sats)', value: 100000 },
    { label: 'P&L Muito Negativo (-50k sats)', value: -50000 },
  ];

  if (!showTest) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowTest(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-lg"
        >
          🧪 Test Favicon
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white rounded-lg p-6 max-w-md w-full mx-4 relative">
        <button
          onClick={() => setShowTest(false)}
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-4">🧪 Favicon Test</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            P&L Value (sats):
          </label>
          <input
            type="number"
            value={plValue}
            onChange={(e) => setPlValue(Number(e.target.value))}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter P&L value in sats"
          />
        </div>

        <button
          onClick={handleTest}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Test Favicon
        </button>

        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Quick Tests:</h3>
          <div className="space-y-2">
            {quickTests.map((test, index) => (
              <button
                key={index}
                onClick={() => {
                  setPlValue(test.value);
                  setTimeout(() => {
                    const result = testFavicon(test.value);
                    setLastGenerated(result);
                  }, 100);
                }}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors text-left"
              >
                {test.label}
              </button>
            ))}
          </div>
        </div>

        {lastGenerated && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Last Generated:</h3>
            <div className="bg-gray-800 p-2 rounded text-xs font-mono break-all">
              {lastGenerated.substring(0, 100)}...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaviconTest;