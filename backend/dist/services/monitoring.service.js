"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitoring = exports.MonitoringService = void 0;
const Sentry = __importStar(require("@sentry/node"));
const env_1 = require("@/config/env");
class MonitoringService {
    static instance;
    isInitialized = false;
    constructor() { }
    static getInstance() {
        if (!MonitoringService.instance) {
            MonitoringService.instance = new MonitoringService();
        }
        return MonitoringService.instance;
    }
    initialize() {
        if (this.isInitialized) {
            return;
        }
        if (env_1.config.monitoring.sentry.enabled && env_1.config.monitoring.sentry.dsn) {
            Sentry.init({
                dsn: env_1.config.monitoring.sentry.dsn,
                environment: env_1.config.env.NODE_ENV,
                tracesSampleRate: env_1.config.env.NODE_ENV === 'production' ? 0.1 : 1.0,
                profilesSampleRate: env_1.config.env.NODE_ENV === 'production' ? 0.1 : 1.0,
                integrations: [
                    new Sentry.Integrations.Http({ tracing: true }),
                    new Sentry.Integrations.Express({ app: undefined }),
                    new Sentry.Integrations.OnUncaughtException({
                        exitEvenIfOtherHandlersAreRegistered: false,
                    }),
                    new Sentry.Integrations.OnUnhandledRejection({ mode: 'warn' }),
                ],
                beforeSend(event, _hint) {
                    if (event.exception) {
                        event.exception.values?.forEach(exception => {
                            if (exception.value?.includes('password') ||
                                exception.value?.includes('secret') ||
                                exception.value?.includes('key')) {
                                exception.value = '[REDACTED]';
                            }
                        });
                    }
                    if (event.breadcrumbs) {
                        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
                            if (breadcrumb.data) {
                                Object.keys(breadcrumb.data).forEach(key => {
                                    if (key.toLowerCase().includes('password') ||
                                        key.toLowerCase().includes('secret') ||
                                        key.toLowerCase().includes('key')) {
                                        breadcrumb.data[key] = '[REDACTED]';
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
        }
        else {
            console.log('⚠️ Sentry not configured or disabled');
        }
    }
    captureError(error, context) {
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
    captureMessage(message, level = 'info', context) {
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
    captureTransaction(name, operation) {
        if (!this.isInitialized) {
            return operation();
        }
        return Sentry.startTransaction({
            name,
            op: 'function',
        }, () => {
            return operation();
        });
    }
    addBreadcrumb(message, category, level = 'info', data) {
        if (!this.isInitialized) {
            return;
        }
        Sentry.addBreadcrumb({
            message,
            category,
            level,
            data,
            timestamp: Date.now() / 1000,
        });
    }
    setUser(user) {
        if (!this.isInitialized) {
            return;
        }
        Sentry.setUser({
            id: user.id,
            email: user.email,
            username: user.username,
        });
    }
    clearUser() {
        if (!this.isInitialized) {
            return;
        }
        Sentry.setUser(null);
    }
    setTag(key, value) {
        if (!this.isInitialized) {
            return;
        }
        Sentry.setTag(key, value);
    }
    setContext(key, context) {
        if (!this.isInitialized) {
            return;
        }
        Sentry.setContext(key, context);
    }
    captureMetric(name, value, unit = 'none', tags) {
        if (!this.isInitialized) {
            return;
        }
        Sentry.metrics.increment(name, value, {
            unit,
            tags,
        });
    }
    async close() {
        if (!this.isInitialized) {
            return;
        }
        await Sentry.close(2000);
        this.isInitialized = false;
        console.log('✅ Sentry closed');
    }
}
exports.MonitoringService = MonitoringService;
exports.monitoring = MonitoringService.getInstance();
//# sourceMappingURL=monitoring.service.js.map