const axios = require('axios');

async function testEndpoint() {
  try {
    const response = await axios.post('http://localhost:13010/api/registration/select-plan', {
      planId: 'free',
      billingPeriod: 'monthly'
    }, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4MTk3MjEzOC1lMTAyLTQ0ZmEtYTE5Ni00YmY3MzEwYzVjOWUiLCJlbWFpbCI6InRlc3RlZmluYWw0NTZAZXhhbXBsZS5jb20iLCJwbGFuVHlwZSI6ImZyZWUiLCJpYXQiOjE3NTkyNzY2ODYsImV4cCI6MTc1OTI4Mzg4Nn0.fjiKgYrJ1BOgnLknaFeIrNUJEeKXuk2uvN6TzgtEOTU',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testEndpoint();
