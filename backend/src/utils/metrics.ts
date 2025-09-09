/**
 * Prometheus Metrics Collection
 */

interface MetricValue {
  value: number;
  labels?: Record<string, string>;
}

interface MetricData {
  name: string;
  help: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  values: MetricValue[];
}

class MetricsCollector {
  private metrics: Map<string, MetricData> = new Map();

  // HTTP Request Metrics
  private httpRequestTotal = 0;
  private httpRequestDuration: number[] = [];
  private httpRequestErrors = 0;

  // Business Metrics
  private userRegistrations = 0;
  private userLogins = 0;
  private automationExecutions = 0;
  private marginChecks = 0;

  // System Metrics
  private memoryUsage = 0;
  private cpuUsage = 0;
  private activeConnections = 0;

  constructor() {
    this.initializeMetrics();
    this.startSystemMetricsCollection();
  }

  private initializeMetrics() {
    // HTTP Metrics
    this.metrics.set('http_requests_total', {
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      type: 'counter',
      values: [{ value: this.httpRequestTotal }]
    });

    this.metrics.set('http_request_duration_seconds', {
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      type: 'histogram',
      values: this.httpRequestDuration.map(duration => ({ value: duration }))
    });

    this.metrics.set('http_requests_errors_total', {
      name: 'http_requests_errors_total',
      help: 'Total number of HTTP request errors',
      type: 'counter',
      values: [{ value: this.httpRequestErrors }]
    });

    // Business Metrics
    this.metrics.set('user_registrations_total', {
      name: 'user_registrations_total',
      help: 'Total number of user registrations',
      type: 'counter',
      values: [{ value: this.userRegistrations }]
    });

    this.metrics.set('user_logins_total', {
      name: 'user_logins_total',
      help: 'Total number of user logins',
      type: 'counter',
      values: [{ value: this.userLogins }]
    });

    this.metrics.set('automation_executions_total', {
      name: 'automation_executions_total',
      help: 'Total number of automation executions',
      type: 'counter',
      values: [{ value: this.automationExecutions }]
    });

    this.metrics.set('margin_checks_total', {
      name: 'margin_checks_total',
      help: 'Total number of margin checks performed',
      type: 'counter',
      values: [{ value: this.marginChecks }]
    });

    // System Metrics
    this.metrics.set('memory_usage_bytes', {
      name: 'memory_usage_bytes',
      help: 'Memory usage in bytes',
      type: 'gauge',
      values: [{ value: this.memoryUsage }]
    });

    this.metrics.set('cpu_usage_percent', {
      name: 'cpu_usage_percent',
      help: 'CPU usage percentage',
      type: 'gauge',
      values: [{ value: this.cpuUsage }]
    });

    this.metrics.set('active_connections', {
      name: 'active_connections',
      help: 'Number of active connections',
      type: 'gauge',
      values: [{ value: this.activeConnections }]
    });
  }

  private startSystemMetricsCollection() {
    setInterval(() => {
      this.updateSystemMetrics();
    }, 5000); // Update every 5 seconds
  }

  private updateSystemMetrics() {
    // Update memory usage
    const memUsage = process.memoryUsage();
    this.memoryUsage = memUsage.heapUsed;

    // Update CPU usage (simplified)
    this.cpuUsage = Math.random() * 100; // Mock CPU usage

    // Update active connections (simplified)
    this.activeConnections = Math.floor(Math.random() * 100);

    // Update metrics
    this.metrics.get('memory_usage_bytes')!.values = [{ value: this.memoryUsage }];
    this.metrics.get('cpu_usage_percent')!.values = [{ value: this.cpuUsage }];
    this.metrics.get('active_connections')!.values = [{ value: this.activeConnections }];
  }

  // HTTP Metrics
  recordHttpRequest(method: string, path: string, statusCode: number, duration: number) {
    this.httpRequestTotal++;
    
    if (statusCode >= 400) {
      this.httpRequestErrors++;
    }

    this.httpRequestDuration.push(duration);

    // Keep only last 1000 durations
    if (this.httpRequestDuration.length > 1000) {
      this.httpRequestDuration = this.httpRequestDuration.slice(-1000);
    }

    // Update metrics
    this.metrics.get('http_requests_total')!.values = [{ value: this.httpRequestTotal }];
    this.metrics.get('http_request_duration_seconds')!.values = this.httpRequestDuration.map(d => ({ value: d }));
    this.metrics.get('http_requests_errors_total')!.values = [{ value: this.httpRequestErrors }];
  }

  // Business Metrics
  recordUserRegistration() {
    this.userRegistrations++;
    this.metrics.get('user_registrations_total')!.values = [{ value: this.userRegistrations }];
  }

  recordUserLogin() {
    this.userLogins++;
    this.metrics.get('user_logins_total')!.values = [{ value: this.userLogins }];
  }

  recordAutomationExecution() {
    this.automationExecutions++;
    this.metrics.get('automation_executions_total')!.values = [{ value: this.automationExecutions }];
  }

  recordMarginCheck() {
    this.marginChecks++;
    this.metrics.get('margin_checks_total')!.values = [{ value: this.marginChecks }];
  }

  // Get metrics in Prometheus format
  getMetricsAsPrometheus(): string {
    let output = '';

    for (const metric of this.metrics.values()) {
      output += `# HELP ${metric.name} ${metric.help}\n`;
      output += `# TYPE ${metric.name} ${metric.type}\n`;

      for (const value of metric.values) {
        const labels = value.labels ? 
          `{${Object.entries(value.labels).map(([k, v]) => `${k}="${v}"`).join(',')}}` : 
          '';
        output += `${metric.name}${labels} ${value.value}\n`;
      }
      output += '\n';
    }

    return output;
  }

  // Get metrics as JSON
  getMetricsAsJSON(): MetricData[] {
    return Array.from(this.metrics.values());
  }

  // Get specific metric
  getMetric(name: string): MetricData | undefined {
    return this.metrics.get(name);
  }
}

// Export singleton instance
export const metrics = new MetricsCollector();
export default metrics;
