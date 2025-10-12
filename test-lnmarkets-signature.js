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
  // Baseado na documentação oficial da LN Markets
  const prehash = timestamp + method + path + params;
  console.log(`🔍 Signature prehash: "${prehash}"`);
  console.log(`🔍 Prehash length: ${prehash.length}`);
  
  const signature = crypto.createHmac('sha256', secret).update(prehash).digest('base64');
  console.log(`🔍 Generated signature: "${signature}"`);
  
  return signature;
}

async function testAPI(baseURL, networkName) {
  console.log(`\n🧪 Testing ${networkName}: ${baseURL}`);
  console.log('=' .repeat(60));
  
  const timestamp = Date.now().toString();
  const method = 'GET';
  const path = '/user';
  const params = ''; // Empty string for GET request
  
  console.log(`📋 Request details:`);
  console.log(`   Timestamp: ${timestamp}`);
  console.log(`   Method: ${method}`);
  console.log(`   Path: ${path}`);
  console.log(`   Params: "${params}"`);
  console.log(`   API Key: ${API_KEY}`);
  console.log(`   Passphrase: ${PASSPHRASE}`);
  
  const signature = createSignature(timestamp, method, path, params, API_SECRET);
  
  const headers = {
    'LNM-ACCESS-KEY': API_KEY,
    'LNM-ACCESS-SIGNATURE': signature,
    'LNM-ACCESS-PASSPHRASE': PASSPHRASE,
    'LNM-ACCESS-TIMESTAMP': timestamp,
    'Content-Type': 'application/json'
  };
  
  console.log(`📋 Headers:`);
  Object.entries(headers).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });
  
  try {
    const response = await fetch(`${baseURL}${path}`, {
      method: 'GET',
      headers: headers
    });
    
    const data = await response.json();
    
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response Body:`, JSON.stringify(data, null, 2));
    
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

async function testPublicEndpoint(baseURL, networkName) {
  console.log(`\n🧪 Testing PUBLIC endpoint ${networkName}: ${baseURL}/futures/ticker`);
  console.log('=' .repeat(60));
  
  try {
    const response = await fetch(`${baseURL}/futures/ticker`);
    const data = await response.json();
    
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response Body:`, JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log(`✅ ${networkName} public API working!`);
      console.log(`💰 Last Price: ${data.lastPrice}`);
    } else {
      console.log(`❌ ${networkName} public API failed: ${data.message || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.log(`❌ ${networkName} public API error:`, error.message);
  }
}

async function main() {
  console.log('🚀 LN Markets API Signature Test');
  console.log('=================================');
  
  // Test public endpoints first
  await testPublicEndpoint(MAINNET_URL, 'MAINNET');
  await testPublicEndpoint(TESTNET_URL, 'TESTNET');
  
  // Test authenticated endpoints
  await testAPI(MAINNET_URL, 'MAINNET');
  await testAPI(TESTNET_URL, 'TESTNET');
  
  console.log('\n🏁 Test completed!');
}

main().catch(console.error);
