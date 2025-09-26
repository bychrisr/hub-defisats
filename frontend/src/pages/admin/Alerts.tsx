/**
 * Admin Alerts Page
 * 
 * Gerenciamento de alertas do sistema de health checks
 */

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Filter,
  Search,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react';

interface HealthAlert {
  id: string;
  component: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
}

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showResolved, setShowResolved] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/health/alerts');
      
      if (response.data.success) {
        setAlerts(response.data.data);
        setLastUpdate(new Date());
        setError(null);
      } else {
        setError('Failed to fetch alerts');
      }
    } catch (err: any) {
      console.error('Error fetching alerts:', err);
      setError(err.response?.data?.message || 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await api.post(`/api/admin/health/alerts/${alertId}/resolve`);
      
      if (response.data.success) {
        // Update local state
        setAlerts(prev => 
          prev.map(alert => 
            alert.id === alertId 
              ? { ...alert, resolved: true, resolvedAt: Date.now() }
              : alert
          )
        );
      }
    } catch (err: any) {
      console.error('Error resolving alert:', err);
      setError(err.response?.data?.message || 'Failed to resolve alert');
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'low':
        return <AlertTriangle className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const filteredAlerts = alerts.filter(alert => {
    // Filter by status
    if (filter === 'active' && alert.resolved) return false;
    if (filter === 'resolved' && !alert.resolved) return false;
    
    // Filter by severity
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    
    // Filter by search term
    if (searchTerm && !alert.message.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !alert.component.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    return true;
  });

  const activeAlerts = alerts.filter(alert => !alert.resolved);
  const resolvedAlerts = alerts.filter(alert => alert.resolved);

  if (loading && alerts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading alerts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <XCircle className="w-6 h-6 text-red-500 mr-2" />
          <h3 className="text-lg font-medium text-red-800">Error Loading Alerts</h3>
        </div>
        <p className="mt-2 text-red-600">{error}</p>
        <button
          onClick={fetchAlerts}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Alerts</h1>
          <p className="text-gray-600">Monitor and manage system health alerts</p>
        </div>
        <button
          onClick={fetchAlerts}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-orange-500 mr-3" />
            <div>
              <div className="text-2xl font-bold">{alerts.length}</div>
              <div className="text-sm text-gray-600">Total Alerts</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-red-500 mr-3" />
            <div>
              <div className="text-2xl font-bold">{activeAlerts.length}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <div className="text-2xl font-bold">{resolvedAlerts.length}</div>
              <div className="text-sm text-gray-600">Resolved</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <div className="text-2xl font-bold">
                {alerts.filter(a => a.severity === 'critical').length}
              </div>
              <div className="text-sm text-gray-600">Critical</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Alerts</option>
            <option value="active">Active Only</option>
            <option value="resolved">Resolved Only</option>
          </select>
          
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm w-48"
            />
          </div>
          
          <button
            onClick={() => setShowResolved(!showResolved)}
            className={`flex items-center px-3 py-1 rounded-md text-sm transition-colors ${
              showResolved 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            {showResolved ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
            {showResolved ? 'Hide' : 'Show'} Resolved
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">
            Alerts ({filteredAlerts.length})
            {lastUpdate && (
              <span className="text-sm text-gray-500 ml-2">
                • Last updated: {formatTimestamp(lastUpdate.getTime())}
              </span>
            )}
          </h3>
        </div>
        
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Alerts Found</h3>
            <p className="text-gray-600">
              {filter === 'active' 
                ? 'No active alerts at the moment.' 
                : 'No alerts match your current filters.'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">{alert.message}</h4>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </div>
                        {alert.resolved && (
                          <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            RESOLVED
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          <strong>Component:</strong> {alert.component}
                        </div>
                        <div>
                          <strong>Created:</strong> {formatTimestamp(alert.timestamp)} ({formatTimeAgo(alert.timestamp)})
                        </div>
                        {alert.resolved && alert.resolvedAt && (
                          <div>
                            <strong>Resolved:</strong> {formatTimestamp(alert.resolvedAt)} ({formatTimeAgo(alert.resolvedAt)})
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!alert.resolved && (
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alert Details Modal could be added here for more detailed view */}
    </div>
  );
};

export default Alerts;