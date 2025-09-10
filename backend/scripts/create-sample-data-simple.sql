-- Create sample trade data with current database structure
-- First, let's create the user if it doesn't exist
INSERT INTO "User" (
  id, 
  email, 
  username, 
  password_hash, 
  ln_markets_api_key, 
  ln_markets_api_secret, 
  plan_type, 
  last_activity_at, 
  created_at, 
  updated_at, 
  is_active, 
  email_verified
) VALUES (
  'fd5dc745-fa1d-40eb-848f-f1b4a6470c07',
  'brainoschris@gmail.com',
  'brainoschris',
  '$2b$10$example_hash',
  'hC8B4VoDm1X6i2L3qLrdUopNggl3yaJh6S3Zz1tPCoE=',
  'r6tDhZmafgGH/ay2lLmSHnEKoBzwOPN+1O0mDSaX8yq4UKnuz2UnexvONrO1Ph87+AKoEIn39ZpeEBhPT9r7dA==',
  'free',
  NOW(),
  NOW(),
  NOW(),
  true,
  true
) ON CONFLICT (email) DO NOTHING;

-- Create automations (using string values for enum)
INSERT INTO "Automation" (
  id,
  user_id,
  type,
  config,
  is_active,
  created_at,
  updated_at
) VALUES 
(
  'auto_001',
  'fd5dc745-fa1d-40eb-848f-f1b4a6470c07',
  'margin_guard',
  '{"margin_threshold": 80, "action": "close_position", "enabled": true}',
  true,
  NOW(),
  NOW()
),
(
  'auto_002',
  'fd5dc745-fa1d-40eb-848f-f1b4a6470c07',
  'tp_sl',
  '{"take_profit_percentage": 5, "stop_loss_percentage": 3, "trailing_stop": false, "enabled": true}',
  true,
  NOW(),
  NOW()
),
(
  'auto_003',
  'fd5dc745-fa1d-40eb-848f-f1b4a6470c07',
  'auto_entry',
  '{"entry_condition": "rsi_oversold", "rsi_period": 14, "rsi_threshold": 30, "position_size": 0.1, "enabled": true}',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create sample trade logs
INSERT INTO "TradeLog" (
  id,
  user_id,
  automation_id,
  trade_id,
  status,
  error_message,
  executed_at,
  created_at
) VALUES 
-- Recent successful trades
('trade_001', 'fd5dc745-fa1d-40eb-848f-f1b4a6470c07', 'auto_001', 'trade_001_recent', 'success', NULL, NOW() - INTERVAL '2 hours', NOW()),
('trade_002', 'fd5dc745-fa1d-40eb-848f-f1b4a6470c07', 'auto_002', 'trade_002_recent', 'success', NULL, NOW() - INTERVAL '4 hours', NOW()),
('trade_003', 'fd5dc745-fa1d-40eb-848f-f1b4a6470c07', 'auto_003', 'trade_003_recent', 'success', NULL, NOW() - INTERVAL '6 hours', NOW()),
-- Error trades
('trade_004', 'fd5dc745-fa1d-40eb-848f-f1b4a6470c07', 'auto_001', 'trade_004_error', 'app_error', 'Insufficient margin for position closure', NOW() - INTERVAL '8 hours', NOW()),
('trade_005', 'fd5dc745-fa1d-40eb-848f-f1b4a6470c07', 'auto_002', 'trade_005_error', 'exchange_error', 'LN Markets API rate limit exceeded', NOW() - INTERVAL '12 hours', NOW()),
-- Older trades
('trade_006', 'fd5dc745-fa1d-40eb-848f-f1b4a6470c07', 'auto_003', 'trade_006_old', 'success', NULL, NOW() - INTERVAL '1 day', NOW()),
('trade_007', 'fd5dc745-fa1d-40eb-848f-f1b4a6470c07', 'auto_001', 'trade_007_old', 'success', NULL, NOW() - INTERVAL '2 days', NOW()),
('trade_008', 'fd5dc745-fa1d-40eb-848f-f1b4a6470c07', 'auto_002', 'trade_008_old', 'app_error', 'Position not found', NOW() - INTERVAL '3 days', NOW()),
('trade_009', 'fd5dc745-fa1d-40eb-848f-f1b4a6470c07', 'auto_003', 'trade_009_old', 'success', NULL, NOW() - INTERVAL '4 days', NOW()),
('trade_010', 'fd5dc745-fa1d-40eb-848f-f1b4a6470c07', 'auto_001', 'trade_010_old', 'success', NULL, NOW() - INTERVAL '5 days', NOW())
ON CONFLICT (id) DO NOTHING;

