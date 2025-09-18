const axios = require('axios');

async function testAdminAccess() {
  try {
    console.log('🔐 Testing admin access...');
    
    // 1. Login to get token
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:13010/api/auth/login', {
      email: 'admin@hub-defisats.com',
      password: 'AdminPass123!'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token:', token.substring(0, 20) + '...');
    
    // 2. Test admin dashboard
    console.log('2. Testing admin dashboard...');
    try {
      const adminResponse = await axios.get('http://localhost:13010/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Admin dashboard access successful!');
      console.log('Response:', JSON.stringify(adminResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Admin dashboard access failed:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data);
    }
    
    // 3. Test other admin endpoints
    console.log('3. Testing other admin endpoints...');
    const adminEndpoints = [
      '/api/admin/users',
      '/api/admin/analytics',
      '/api/admin/coupons',
      '/api/admin/system'
    ];
    
    for (const endpoint of adminEndpoints) {
      try {
        const response = await axios.get(`http://localhost:13010${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log(`✅ ${endpoint}: ${response.status}`);
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAdminAccess();

