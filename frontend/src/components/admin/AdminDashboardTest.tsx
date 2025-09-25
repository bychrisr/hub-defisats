import React from 'react';

export function AdminDashboardTest() {
  console.log('🧪 ADMIN DASHBOARD TEST - Rendering...');
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard Test</h1>
      <div className="bg-green-100 p-4 rounded-lg">
        <p className="text-green-800">
          ✅ Se você está vendo esta mensagem, o componente está renderizando corretamente!
        </p>
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-600">
          Timestamp: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}
