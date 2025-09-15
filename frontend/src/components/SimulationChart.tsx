import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ReferenceLine,
} from 'recharts';

interface PriceData {
  timestamp: string;
  price: number;
}

interface PnLData {
  timestamp: string;
  pnl: number;
  accountBalance: number;
}

interface ActionData {
  timestamp: string;
  action: string;
  price: number;
  details: any;
}

interface SimulationChartProps {
  priceData: PriceData[];
  pnlData: PnLData[];
  actions: ActionData[];
  simulationName: string;
}

const SimulationChart: React.FC<SimulationChartProps> = ({
  priceData,
  pnlData,
  actions,
  simulationName,
}) => {
  // Format data for charts
  const chartData = priceData.map((pricePoint, index) => {
    const pnlPoint = pnlData[index];
    const actionPoint = actions.find(action =>
      new Date(action.timestamp).getTime() === new Date(pricePoint.timestamp).getTime()
    );

    return {
      time: new Date(pricePoint.timestamp).toLocaleTimeString(),
      price: pricePoint.price,
      pnl: pnlPoint?.pnl || 0,
      balance: pnlPoint?.accountBalance || 0,
      action: actionPoint?.action || null,
      actionPrice: actionPoint?.price || null,
    };
  });

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium">{`Tempo: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value?.toLocaleString() || entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Action markers for scatter plot
  const actionMarkers = actions.map((action, index) => ({
    x: index,
    y: action.price,
    action: action.action,
    time: new Date(action.timestamp).toLocaleTimeString(),
  }));

  return (
    <div className="space-y-6">
      {/* Price Chart */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Evolução do Preço - {simulationName}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              domain={['dataMin - 100', 'dataMax + 100']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#2563eb"
              strokeWidth={2}
              name="Preço (USD)"
              dot={false}
            />
            {/* Action markers */}
            {actionMarkers.map((marker, index) => (
              <ReferenceLine
                key={index}
                x={marker.x}
                stroke="#ef4444"
                strokeDasharray="5 5"
                label={{
                  value: marker.action,
                  position: 'top',
                  fontSize: 10,
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* P&L Chart */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Performance (P&L) - {simulationName}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="pnl"
              stroke="#10b981"
              strokeWidth={2}
              name="P&L (USD)"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#f59e0b"
              strokeWidth={2}
              name="Saldo da Conta"
              dot={false}
            />
            <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Actions Scatter Plot */}
      {actions.length > 0 && (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Pontos de Ação - {simulationName}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                dataKey="price"
                tick={{ fontSize: 12 }}
                domain={['dataMin - 50', 'dataMax + 50']}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload;
                    if (data.action) {
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="text-sm font-medium">{`Ação: ${data.action}`}</p>
                          <p className="text-sm">{`Preço: $${data.actionPrice?.toLocaleString()}`}</p>
                          <p className="text-sm">{`Tempo: ${data.time}`}</p>
                        </div>
                      );
                    }
                  }
                  return null;
                }}
              />
              <Scatter
                dataKey="price"
                fill="#ef4444"
                name="Pontos de Ação"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Actions Summary */}
      {actions.length > 0 && (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Resumo das Ações - {simulationName}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {actions.filter(a => a.action === 'close_position').length}
              </div>
              <div className="text-sm text-blue-800">Posições Fechadas</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {actions.filter(a => a.action === 'take_profit').length}
              </div>
              <div className="text-sm text-green-800">Take Profits</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {actions.filter(a => a.action === 'adjust_stop').length}
              </div>
              <div className="text-sm text-orange-800">Stops Ajustados</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {actions.filter(a => a.action === 'enter_position').length}
              </div>
              <div className="text-sm text-purple-800">Entradas</div>
            </div>
          </div>

          {/* Detailed Actions Table */}
          <div className="mt-6">
            <h4 className="text-md font-medium mb-3">Histórico Detalhado</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tempo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preço
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detalhes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {actions.slice(0, 10).map((action, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(action.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {action.action.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${action.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {action.details ? JSON.stringify(action.details, null, 2).substring(0, 50) + '...' : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {actions.length > 10 && (
              <div className="text-center mt-4">
                <span className="text-sm text-gray-500">
                  Mostrando 10 de {actions.length} ações
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationChart;
