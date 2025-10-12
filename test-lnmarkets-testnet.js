#!/usr/bin/env node

const crypto = require('crypto');

// Credenciais da conta
const API_KEY = 'q4dbbRpWE2ZpfPV3GBqAFNLfQhXrcab2quz8FsxGZ7U=';
const API_SECRET = 'bq9WimSkASMQo0eJ4IzVv6P7hC+OEY4GLnB+ztVrcfkA3XbL7826/fkUgHe8+2TZL6+J8NM2/RnTn3D/6gyE4A==';
const PASSPHRASE = '#PassCursor';

// URLs
const MAINNET_URL = 'https://api.lnmarkets.com/v2';
const TESTNET_URL = 'https://api.testnet4.lnmarkets.com/v2';

function createSignature(timestamp, method, path, params, secret) {
  const prehash = timestamp + method + path + params;
  const signature = crypto.createHmac('sha256', secret).update(prehash).digest('base64');
  return signature;
}

async function testAPI(baseURL, networkName) {
  console.log(`\n🧪 Testing ${networkName}: ${baseURL}`);
  console.log('=' .repeat(50));
  
  const timestamp = Date.now().toString();
  const method = 'GET';
  const path = '/user';  // Path sem /v2 pois baseURL já inclui
  const params = '';
  
  const signature = createSignature(timestamp, method, path, params, API_SECRET);
  
  const headers = {
    'LNM-ACCESS-KEY': API_KEY,
    'LNM-ACCESS-SIGNATURE': signature,
    'LNM-ACCESS-PASSPHRASE': PASSPHRASE,
    'LNM-ACCESS-TIMESTAMP': timestamp,
    'Content-Type': 'application/json'
  };
  
  try {
    const response = await fetch(`${baseURL}${path}`, {
      method: 'GET',
      headers: headers
    });
    
    const data = await response.json();
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response:`, JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log(`✅ ${networkName} API working!`);
      if (data.balance !== undefined) {
        console.log(`💰 Balance: ${data.balance} sats`);
      }
    } else {
      console.log(`❌ ${networkName} API failed: ${data.message || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.log(`❌ ${networkName} API error:`, error.message);
  }
}

async function main() {
  console.log('🚀 LN Markets API Test - Mainnet vs Testnet');
  console.log('============================================');
  
  // Test mainnet first
  await testAPI(MAINNET_URL, 'MAINNET');
  
  // Test testnet
  await testAPI(TESTNET_URL, 'TESTNET');
  
  console.log('\n🏁 Test completed!');
}

main().catch(console.error);
