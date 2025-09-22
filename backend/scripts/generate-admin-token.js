const jwt = require('jsonwebtoken');

// Chave secreta do JWT (deve ser a mesma do .env)
const JWT_SECRET = 'development-jwt-secret-key-32-chars-minimum';

// Payload do token admin
const payload = {
  id: 'admin-test-user-id',
  userId: 'admin-test-user-id',
  email: 'admin@hub-defisats.com',
  planType: 'lifetime',
  username: 'admin'
};

// Gerar token com expiração de 24 horas
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

console.log('Admin JWT Token:');
console.log(token);
console.log('\nUse this token in the Authorization header:');
console.log(`Bearer ${token}`);
