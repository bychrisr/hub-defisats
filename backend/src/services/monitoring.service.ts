import * as Sentry from '@sentry/node';
import { config } from '@/config/env';

export class MonitoringService {
  private static instance: MonitoringService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Inicializar Sentry
   */
  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    if (config.monitoring.sentry.enabled && config.monitoring.sentry.dsn) {
      Sentry.init({
        dsn: config.monitoring.sentry.dsn,
        environment: config.env.NODE_ENV,
        tracesSampleRate: config.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        profilesSampleRate: config.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        integrations: [
          new (Sentry as any).Integrations.Http({ tracing: true }),
          new (Sentry as any).Integrations.Express({ app: undefined }),
          new (Sentry as any).Integrations.OnUncaughtException({
            exitEvenIfOtherHandlersAreRegistered: false,
          }),
          new (Sentry as any).Integrations.OnUnhandledRejection({ mode: 'warn' }),
        ],
        beforeSend(event, _hint) {
          // Filtrar eventos sensíveis
          if (event.exception) {
            event.exception.values?.forEach(exception => {
              if (
                exception.value?.includes('password') ||
                exception.value?.includes('secret') ||
                exception.value?.includes('key')
              ) {
                exception.value = '[REDACTED]';
              }
            });
          }

          // Filtrar breadcrumbs sensíveis
          if (event.breadcrumbs) {
            event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
              if (breadcrumb.data) {
                Object.keys(breadcrumb.data).forEach(key => {
                  if (
                    key.toLowerCase().includes('password') ||
                    key.toLowerCase().includes('secret') ||
                    key.toLowerCase().includes('key')
                  ) {
                    breadcrumb.data![key] = '[REDACTED]';
                  }
                });
              }
              return breadcrumb;
            });
          }

          return event;
        },
      });

      this.isInitialized = true;
      console.log('✅ Sentry initialized successfully');
    } else {
      console.log('⚠️ Sentry not configured or disabled');
    }
  }

  /**
   * Capturar erro
   */
  captureError(error: Error, context?: Record<string, any>): void {
    if (!this.isInitialized) {
      console.error('Sentry not initialized:', error);
      return;
    }

    Sentry.withScope(scope => {
      if (context) {
        Object.keys(context).forEach(key => {
          scope.setContext(key, context[key]);
        });
      }
      Sentry.captureException(error);
    });
  }

  /**
   * Capturar mensagem
   */
  captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context?: Record<string, any>
  ): void {
    if (!this.isInitialized) {
      console.log(`[${level.toUpperCase()}] ${message}`);
      return;
    }

    Sentry.withScope(scope => {
      scope.setLevel(level);
      if (context) {
        Object.keys(context).forEach(key => {
          scope.setContext(key, context[key]);
        });
      }
      Sentry.captureMessage(message);
    });
  }

  /**
   * Capturar transação
   */
  captureTransaction<T>(name: string, operation: () => T): T {
    if (!this.isInitialized) {
      return operation();
    }

    return (Sentry as any).startTransaction(
      {
        name,
        op: 'function',
      },
      () => {
        return operation();
      }
    );
  }

  /**
   * Adicionar breadcrumb
   */
  addBreadcrumb(
    message: string,
    category: string,
    level: 'info' | 'warning' | 'error' = 'info',
    data?: Record<string, any>
  ): void {
    if (!this.isInitialized) {
      return;
    }

    (Sentry as any).addBreadcrumb({
      message,
      category,
      level,
      data: data || {},
      timestamp: Date.now() / 1000,
    });
  }

  /**
   * Definir usuário no contexto
   */
  setUser(user: { id: string; email?: string; username?: string }): void {
    if (!this.isInitialized) {
      return;
    }

    (Sentry as any).setUser({
      id: user.id,
      email: user.email || '',
      username: user.username || '',
    });
  }

  /**
   * Limpar contexto do usuário
   */
  clearUser(): void {
    if (!this.isInitialized) {
      return;
    }

    Sentry.setUser(null);
  }

  /**
   * Adicionar tag
   */
  setTag(key: string, value: string): void {
    if (!this.isInitialized) {
      return;
    }

    Sentry.setTag(key, value);
  }

  /**
   * Adicionar contexto extra
   */
  setContext(key: string, context: Record<string, any>): void {
    if (!this.isInitialized) {
      return;
    }

    Sentry.setContext(key, context);
  }

  /**
   * Capturar métrica customizada
   */
  captureMetric(
    name: string,
    value: number,
    unit: string = 'none',
    tags?: Record<string, string>
  ): void {
    if (!this.isInitialized) {
      return;
    }

    (Sentry as any).metrics?.increment(name, value, {
      unit,
      tags,
    });
  }

  /**
   * Fechar Sentry
   */
  async close(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    await Sentry.close(2000);
    this.isInitialized = false;
    console.log('✅ Sentry closed');
  }
}

// Instância singleton
export const monitoring = MonitoringService.getInstance();
