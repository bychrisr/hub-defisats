const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 13000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mock positions endpoint
app.get('/api/lnmarkets/v2/trading/positions', (req, res) => {
  console.log('📊 POSITIONS - Request received:', {
    headers: req.headers,
    timestamp: new Date().toISOString()
  });

  // Mock positions data
  const mockPositions = [
    {
      id: 'pos-1',
      symbol: 'BTCUSD',
      side: 'long',
      size: 0.001,
      entryPrice: 65000,
      currentPrice: 66000,
      pnl: 1.0,
      margin: 65.0,
      maintenanceMargin: 32.5,
      leverage: 100,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'pos-2',
      symbol: 'BTCUSD',
      side: 'short',
      size: 0.002,
      entryPrice: 64000,
      currentPrice: 63000,
      pnl: 2.0,
      margin: 128.0,
      maintenanceMargin: 64.0,
      leverage: 50,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  res.json({
    success: true,
    message: 'Positions retrieved successfully',
    data: mockPositions,
    timestamp: new Date().toISOString()
  });
});

// Mock dashboard endpoint
app.get('/api/lnmarkets/v2/user/dashboard', (req, res) => {
  console.log('📊 DASHBOARD - Request received:', {
    headers: req.headers,
    timestamp: new Date().toISOString()
  });

  const mockDashboard = {
    user: {
      id: 'test-user-123',
      email: 'test@example.com',
      username: 'testuser',
      isTestnet: true
    },
    balance: {
      balance: 1000.0,
      currency: 'USD',
      available: 800.0,
      locked: 200.0,
      timestamp: Date.now()
    },
    positions: [
      {
        id: 'pos-1',
        symbol: 'BTCUSD',
        side: 'long',
        size: 0.001,
        price: 65000,
        margin: 65.0,
        pnl: 1.0,
        pnlPercentage: 1.54,
        marginRatio: 0.5,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    ticker: {
      symbol: 'BTCUSD',
      price: 66000,
      change24h: 1000,
      changePercent24h: 1.54,
      volume24h: 1000000,
      high24h: 67000,
      low24h: 65000,
      timestamp: Date.now()
    },
    lastUpdate: Date.now(),
    cacheHit: false
  };

  res.json({
    success: true,
    data: mockDashboard,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Positions: http://localhost:${PORT}/api/lnmarkets/v2/trading/positions`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/lnmarkets/v2/user/dashboard`);
});
