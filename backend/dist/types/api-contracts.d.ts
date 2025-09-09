import { z } from 'zod';
export declare const RegisterRequestSchema: z.ZodObject<{
    email: z.ZodString;
    username: z.ZodString;
    password: z.ZodString;
    ln_markets_api_key: z.ZodString;
    ln_markets_api_secret: z.ZodString;
    ln_markets_passphrase: z.ZodString;
    coupon_code: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    username: string;
    password: string;
    ln_markets_api_key: string;
    ln_markets_api_secret: string;
    ln_markets_passphrase: string;
    coupon_code?: string | undefined;
}, {
    email: string;
    username: string;
    password: string;
    ln_markets_api_key: string;
    ln_markets_api_secret: string;
    ln_markets_passphrase: string;
    coupon_code?: string | undefined;
}>;
export declare const LoginRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const RefreshTokenRequestSchema: z.ZodObject<{
    refresh_token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refresh_token: string;
}, {
    refresh_token: string;
}>;
export declare const AuthResponseSchema: z.ZodObject<{
    user_id: z.ZodString;
    token: z.ZodString;
    plan_type: z.ZodNativeEnum<{
        free: "free";
        basic: "basic";
        advanced: "advanced";
        pro: "pro";
    }>;
}, "strip", z.ZodTypeAny, {
    user_id: string;
    token: string;
    plan_type: "free" | "basic" | "advanced" | "pro";
}, {
    user_id: string;
    token: string;
    plan_type: "free" | "basic" | "advanced" | "pro";
}>;
export declare const RefreshTokenResponseSchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
export declare const UserResponseSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    plan_type: z.ZodNativeEnum<{
        free: "free";
        basic: "basic";
        advanced: "advanced";
        pro: "pro";
    }>;
    notifications: z.ZodArray<z.ZodObject<{
        type: z.ZodNativeEnum<{
            telegram: "telegram";
            email: "email";
            whatsapp: "whatsapp";
        }>;
        is_enabled: z.ZodBoolean;
        channel_config: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        type: "email" | "telegram" | "whatsapp";
        is_enabled: boolean;
        channel_config: Record<string, any>;
    }, {
        type: "email" | "telegram" | "whatsapp";
        is_enabled: boolean;
        channel_config: Record<string, any>;
    }>, "many">;
    automations: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodNativeEnum<{
            margin_guard: "margin_guard";
            tp_sl: "tp_sl";
            auto_entry: "auto_entry";
        }>;
        is_active: z.ZodBoolean;
        config: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        type: "margin_guard" | "tp_sl" | "auto_entry";
        id: string;
        is_active: boolean;
        config: Record<string, any>;
    }, {
        type: "margin_guard" | "tp_sl" | "auto_entry";
        id: string;
        is_active: boolean;
        config: Record<string, any>;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    email: string;
    plan_type: "free" | "basic" | "advanced" | "pro";
    id: string;
    notifications: {
        type: "email" | "telegram" | "whatsapp";
        is_enabled: boolean;
        channel_config: Record<string, any>;
    }[];
    automations: {
        type: "margin_guard" | "tp_sl" | "auto_entry";
        id: string;
        is_active: boolean;
        config: Record<string, any>;
    }[];
}, {
    email: string;
    plan_type: "free" | "basic" | "advanced" | "pro";
    id: string;
    notifications: {
        type: "email" | "telegram" | "whatsapp";
        is_enabled: boolean;
        channel_config: Record<string, any>;
    }[];
    automations: {
        type: "margin_guard" | "tp_sl" | "auto_entry";
        id: string;
        is_active: boolean;
        config: Record<string, any>;
    }[];
}>;
export declare const UpdateUserRequestSchema: z.ZodObject<{
    ln_markets_api_key: z.ZodOptional<z.ZodString>;
    ln_markets_api_secret: z.ZodOptional<z.ZodString>;
    session_timeout: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    ln_markets_api_key?: string | undefined;
    ln_markets_api_secret?: string | undefined;
    session_timeout?: number | undefined;
}, {
    ln_markets_api_key?: string | undefined;
    ln_markets_api_secret?: string | undefined;
    session_timeout?: number | undefined;
}>;
export declare const AutomationConfigSchema: z.ZodObject<{
    margin_threshold: z.ZodOptional<z.ZodNumber>;
    take_profit: z.ZodOptional<z.ZodNumber>;
    stop_loss: z.ZodOptional<z.ZodNumber>;
    entry_conditions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    margin_threshold?: number | undefined;
    take_profit?: number | undefined;
    stop_loss?: number | undefined;
    entry_conditions?: Record<string, any> | undefined;
}, {
    margin_threshold?: number | undefined;
    take_profit?: number | undefined;
    stop_loss?: number | undefined;
    entry_conditions?: Record<string, any> | undefined;
}>;
export declare const CreateAutomationRequestSchema: z.ZodObject<{
    type: z.ZodNativeEnum<{
        margin_guard: "margin_guard";
        tp_sl: "tp_sl";
        auto_entry: "auto_entry";
    }>;
    config: z.ZodObject<{
        margin_threshold: z.ZodOptional<z.ZodNumber>;
        take_profit: z.ZodOptional<z.ZodNumber>;
        stop_loss: z.ZodOptional<z.ZodNumber>;
        entry_conditions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        margin_threshold?: number | undefined;
        take_profit?: number | undefined;
        stop_loss?: number | undefined;
        entry_conditions?: Record<string, any> | undefined;
    }, {
        margin_threshold?: number | undefined;
        take_profit?: number | undefined;
        stop_loss?: number | undefined;
        entry_conditions?: Record<string, any> | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "margin_guard" | "tp_sl" | "auto_entry";
    config: {
        margin_threshold?: number | undefined;
        take_profit?: number | undefined;
        stop_loss?: number | undefined;
        entry_conditions?: Record<string, any> | undefined;
    };
}, {
    type: "margin_guard" | "tp_sl" | "auto_entry";
    config: {
        margin_threshold?: number | undefined;
        take_profit?: number | undefined;
        stop_loss?: number | undefined;
        entry_conditions?: Record<string, any> | undefined;
    };
}>;
export declare const UpdateAutomationRequestSchema: z.ZodObject<{
    config: z.ZodOptional<z.ZodObject<{
        margin_threshold: z.ZodOptional<z.ZodNumber>;
        take_profit: z.ZodOptional<z.ZodNumber>;
        stop_loss: z.ZodOptional<z.ZodNumber>;
        entry_conditions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        margin_threshold?: number | undefined;
        take_profit?: number | undefined;
        stop_loss?: number | undefined;
        entry_conditions?: Record<string, any> | undefined;
    }, {
        margin_threshold?: number | undefined;
        take_profit?: number | undefined;
        stop_loss?: number | undefined;
        entry_conditions?: Record<string, any> | undefined;
    }>>;
    is_active: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    is_active?: boolean | undefined;
    config?: {
        margin_threshold?: number | undefined;
        take_profit?: number | undefined;
        stop_loss?: number | undefined;
        entry_conditions?: Record<string, any> | undefined;
    } | undefined;
}, {
    is_active?: boolean | undefined;
    config?: {
        margin_threshold?: number | undefined;
        take_profit?: number | undefined;
        stop_loss?: number | undefined;
        entry_conditions?: Record<string, any> | undefined;
    } | undefined;
}>;
export declare const AutomationResponseSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodNativeEnum<{
        margin_guard: "margin_guard";
        tp_sl: "tp_sl";
        auto_entry: "auto_entry";
    }>;
    config: z.ZodRecord<z.ZodString, z.ZodAny>;
    is_active: z.ZodBoolean;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "margin_guard" | "tp_sl" | "auto_entry";
    id: string;
    is_active: boolean;
    config: Record<string, any>;
    created_at: string;
    updated_at: string;
}, {
    type: "margin_guard" | "tp_sl" | "auto_entry";
    id: string;
    is_active: boolean;
    config: Record<string, any>;
    created_at: string;
    updated_at: string;
}>;
export declare const AutomationListResponseSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    type: z.ZodNativeEnum<{
        margin_guard: "margin_guard";
        tp_sl: "tp_sl";
        auto_entry: "auto_entry";
    }>;
    config: z.ZodRecord<z.ZodString, z.ZodAny>;
    is_active: z.ZodBoolean;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "margin_guard" | "tp_sl" | "auto_entry";
    id: string;
    is_active: boolean;
    config: Record<string, any>;
    created_at: string;
    updated_at: string;
}, {
    type: "margin_guard" | "tp_sl" | "auto_entry";
    id: string;
    is_active: boolean;
    config: Record<string, any>;
    created_at: string;
    updated_at: string;
}>, "many">;
export declare const TradeLogResponseSchema: z.ZodObject<{
    id: z.ZodString;
    trade_id: z.ZodString;
    automation_id: z.ZodOptional<z.ZodString>;
    status: z.ZodNativeEnum<{
        success: "success";
        app_error: "app_error";
        exchange_error: "exchange_error";
    }>;
    error_message: z.ZodOptional<z.ZodString>;
    executed_at: z.ZodString;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "success" | "app_error" | "exchange_error";
    id: string;
    created_at: string;
    trade_id: string;
    executed_at: string;
    automation_id?: string | undefined;
    error_message?: string | undefined;
}, {
    status: "success" | "app_error" | "exchange_error";
    id: string;
    created_at: string;
    trade_id: string;
    executed_at: string;
    automation_id?: string | undefined;
    error_message?: string | undefined;
}>;
export declare const TradeLogDetailResponseSchema: z.ZodObject<{
    id: z.ZodString;
    trade_id: z.ZodString;
    automation_id: z.ZodOptional<z.ZodString>;
    status: z.ZodNativeEnum<{
        success: "success";
        app_error: "app_error";
        exchange_error: "exchange_error";
    }>;
    error_message: z.ZodOptional<z.ZodString>;
    executed_at: z.ZodString;
    created_at: z.ZodString;
} & {
    raw_response: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    status: "success" | "app_error" | "exchange_error";
    id: string;
    created_at: string;
    trade_id: string;
    executed_at: string;
    automation_id?: string | undefined;
    error_message?: string | undefined;
    raw_response?: Record<string, any> | undefined;
}, {
    status: "success" | "app_error" | "exchange_error";
    id: string;
    created_at: string;
    trade_id: string;
    executed_at: string;
    automation_id?: string | undefined;
    error_message?: string | undefined;
    raw_response?: Record<string, any> | undefined;
}>;
export declare const TradeLogListResponseSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    trade_id: z.ZodString;
    automation_id: z.ZodOptional<z.ZodString>;
    status: z.ZodNativeEnum<{
        success: "success";
        app_error: "app_error";
        exchange_error: "exchange_error";
    }>;
    error_message: z.ZodOptional<z.ZodString>;
    executed_at: z.ZodString;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "success" | "app_error" | "exchange_error";
    id: string;
    created_at: string;
    trade_id: string;
    executed_at: string;
    automation_id?: string | undefined;
    error_message?: string | undefined;
}, {
    status: "success" | "app_error" | "exchange_error";
    id: string;
    created_at: string;
    trade_id: string;
    executed_at: string;
    automation_id?: string | undefined;
    error_message?: string | undefined;
}>, "many">;
export declare const TradeLogQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodNativeEnum<{
        success: "success";
        app_error: "app_error";
        exchange_error: "exchange_error";
    }>>;
    automation_id: z.ZodOptional<z.ZodString>;
    from: z.ZodOptional<z.ZodString>;
    to: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
    status?: "success" | "app_error" | "exchange_error" | undefined;
    automation_id?: string | undefined;
    from?: string | undefined;
    to?: string | undefined;
}, {
    status?: "success" | "app_error" | "exchange_error" | undefined;
    automation_id?: string | undefined;
    from?: string | undefined;
    to?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export declare const BacktestConfigSchema: z.ZodObject<{
    automation_type: z.ZodNativeEnum<{
        margin_guard: "margin_guard";
        tp_sl: "tp_sl";
        auto_entry: "auto_entry";
    }>;
    automation_config: z.ZodObject<{
        margin_threshold: z.ZodOptional<z.ZodNumber>;
        take_profit: z.ZodOptional<z.ZodNumber>;
        stop_loss: z.ZodOptional<z.ZodNumber>;
        entry_conditions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        margin_threshold?: number | undefined;
        take_profit?: number | undefined;
        stop_loss?: number | undefined;
        entry_conditions?: Record<string, any> | undefined;
    }, {
        margin_threshold?: number | undefined;
        take_profit?: number | undefined;
        stop_loss?: number | undefined;
        entry_conditions?: Record<string, any> | undefined;
    }>;
    period: z.ZodObject<{
        from: z.ZodString;
        to: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        from: string;
        to: string;
    }, {
        from: string;
        to: string;
    }>;
}, "strip", z.ZodTypeAny, {
    automation_type: "margin_guard" | "tp_sl" | "auto_entry";
    automation_config: {
        margin_threshold?: number | undefined;
        take_profit?: number | undefined;
        stop_loss?: number | undefined;
        entry_conditions?: Record<string, any> | undefined;
    };
    period: {
        from: string;
        to: string;
    };
}, {
    automation_type: "margin_guard" | "tp_sl" | "auto_entry";
    automation_config: {
        margin_threshold?: number | undefined;
        take_profit?: number | undefined;
        stop_loss?: number | undefined;
        entry_conditions?: Record<string, any> | undefined;
    };
    period: {
        from: string;
        to: string;
    };
}>;
export declare const CreateBacktestRequestSchema: z.ZodObject<{
    config: z.ZodObject<{
        automation_type: z.ZodNativeEnum<{
            margin_guard: "margin_guard";
            tp_sl: "tp_sl";
            auto_entry: "auto_entry";
        }>;
        automation_config: z.ZodObject<{
            margin_threshold: z.ZodOptional<z.ZodNumber>;
            take_profit: z.ZodOptional<z.ZodNumber>;
            stop_loss: z.ZodOptional<z.ZodNumber>;
            entry_conditions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            margin_threshold?: number | undefined;
            take_profit?: number | undefined;
            stop_loss?: number | undefined;
            entry_conditions?: Record<string, any> | undefined;
        }, {
            margin_threshold?: number | undefined;
            take_profit?: number | undefined;
            stop_loss?: number | undefined;
            entry_conditions?: Record<string, any> | undefined;
        }>;
        period: z.ZodObject<{
            from: z.ZodString;
            to: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            from: string;
            to: string;
        }, {
            from: string;
            to: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        automation_type: "margin_guard" | "tp_sl" | "auto_entry";
        automation_config: {
            margin_threshold?: number | undefined;
            take_profit?: number | undefined;
            stop_loss?: number | undefined;
            entry_conditions?: Record<string, any> | undefined;
        };
        period: {
            from: string;
            to: string;
        };
    }, {
        automation_type: "margin_guard" | "tp_sl" | "auto_entry";
        automation_config: {
            margin_threshold?: number | undefined;
            take_profit?: number | undefined;
            stop_loss?: number | undefined;
            entry_conditions?: Record<string, any> | undefined;
        };
        period: {
            from: string;
            to: string;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    config: {
        automation_type: "margin_guard" | "tp_sl" | "auto_entry";
        automation_config: {
            margin_threshold?: number | undefined;
            take_profit?: number | undefined;
            stop_loss?: number | undefined;
            entry_conditions?: Record<string, any> | undefined;
        };
        period: {
            from: string;
            to: string;
        };
    };
}, {
    config: {
        automation_type: "margin_guard" | "tp_sl" | "auto_entry";
        automation_config: {
            margin_threshold?: number | undefined;
            take_profit?: number | undefined;
            stop_loss?: number | undefined;
            entry_conditions?: Record<string, any> | undefined;
        };
        period: {
            from: string;
            to: string;
        };
    };
}>;
export declare const BacktestResultSchema: z.ZodObject<{
    total_trades: z.ZodNumber;
    successful_trades: z.ZodNumber;
    failed_trades: z.ZodNumber;
    total_pnl: z.ZodNumber;
    max_drawdown: z.ZodNumber;
    win_rate: z.ZodNumber;
    trades: z.ZodArray<z.ZodObject<{
        date: z.ZodString;
        type: z.ZodEnum<["buy", "sell"]>;
        amount: z.ZodNumber;
        price: z.ZodNumber;
        pnl: z.ZodNumber;
        automation_triggered: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        type: "buy" | "sell";
        date: string;
        amount: number;
        price: number;
        pnl: number;
        automation_triggered: boolean;
    }, {
        type: "buy" | "sell";
        date: string;
        amount: number;
        price: number;
        pnl: number;
        automation_triggered: boolean;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    total_trades: number;
    successful_trades: number;
    failed_trades: number;
    total_pnl: number;
    max_drawdown: number;
    win_rate: number;
    trades: {
        type: "buy" | "sell";
        date: string;
        amount: number;
        price: number;
        pnl: number;
        automation_triggered: boolean;
    }[];
}, {
    total_trades: number;
    successful_trades: number;
    failed_trades: number;
    total_pnl: number;
    max_drawdown: number;
    win_rate: number;
    trades: {
        type: "buy" | "sell";
        date: string;
        amount: number;
        price: number;
        pnl: number;
        automation_triggered: boolean;
    }[];
}>;
export declare const BacktestResponseSchema: z.ZodObject<{
    id: z.ZodString;
    status: z.ZodEnum<["pending", "processing", "completed", "failed"]>;
    config: z.ZodRecord<z.ZodString, z.ZodAny>;
    result: z.ZodOptional<z.ZodObject<{
        total_trades: z.ZodNumber;
        successful_trades: z.ZodNumber;
        failed_trades: z.ZodNumber;
        total_pnl: z.ZodNumber;
        max_drawdown: z.ZodNumber;
        win_rate: z.ZodNumber;
        trades: z.ZodArray<z.ZodObject<{
            date: z.ZodString;
            type: z.ZodEnum<["buy", "sell"]>;
            amount: z.ZodNumber;
            price: z.ZodNumber;
            pnl: z.ZodNumber;
            automation_triggered: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            type: "buy" | "sell";
            date: string;
            amount: number;
            price: number;
            pnl: number;
            automation_triggered: boolean;
        }, {
            type: "buy" | "sell";
            date: string;
            amount: number;
            price: number;
            pnl: number;
            automation_triggered: boolean;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        total_trades: number;
        successful_trades: number;
        failed_trades: number;
        total_pnl: number;
        max_drawdown: number;
        win_rate: number;
        trades: {
            type: "buy" | "sell";
            date: string;
            amount: number;
            price: number;
            pnl: number;
            automation_triggered: boolean;
        }[];
    }, {
        total_trades: number;
        successful_trades: number;
        failed_trades: number;
        total_pnl: number;
        max_drawdown: number;
        win_rate: number;
        trades: {
            type: "buy" | "sell";
            date: string;
            amount: number;
            price: number;
            pnl: number;
            automation_triggered: boolean;
        }[];
    }>>;
    created_at: z.ZodString;
    completed_at: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "processing" | "completed" | "failed";
    id: string;
    config: Record<string, any>;
    created_at: string;
    result?: {
        total_trades: number;
        successful_trades: number;
        failed_trades: number;
        total_pnl: number;
        max_drawdown: number;
        win_rate: number;
        trades: {
            type: "buy" | "sell";
            date: string;
            amount: number;
            price: number;
            pnl: number;
            automation_triggered: boolean;
        }[];
    } | undefined;
    completed_at?: string | undefined;
}, {
    status: "pending" | "processing" | "completed" | "failed";
    id: string;
    config: Record<string, any>;
    created_at: string;
    result?: {
        total_trades: number;
        successful_trades: number;
        failed_trades: number;
        total_pnl: number;
        max_drawdown: number;
        win_rate: number;
        trades: {
            type: "buy" | "sell";
            date: string;
            amount: number;
            price: number;
            pnl: number;
            automation_triggered: boolean;
        }[];
    } | undefined;
    completed_at?: string | undefined;
}>;
export declare const NotificationChannelConfigSchema: z.ZodObject<{
    telegram_chat_id: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    whatsapp_number: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    telegram_chat_id?: string | undefined;
    whatsapp_number?: string | undefined;
}, {
    email?: string | undefined;
    telegram_chat_id?: string | undefined;
    whatsapp_number?: string | undefined;
}>;
export declare const CreateNotificationRequestSchema: z.ZodObject<{
    type: z.ZodNativeEnum<{
        telegram: "telegram";
        email: "email";
        whatsapp: "whatsapp";
    }>;
    channel_config: z.ZodObject<{
        telegram_chat_id: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        whatsapp_number: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email?: string | undefined;
        telegram_chat_id?: string | undefined;
        whatsapp_number?: string | undefined;
    }, {
        email?: string | undefined;
        telegram_chat_id?: string | undefined;
        whatsapp_number?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "email" | "telegram" | "whatsapp";
    channel_config: {
        email?: string | undefined;
        telegram_chat_id?: string | undefined;
        whatsapp_number?: string | undefined;
    };
}, {
    type: "email" | "telegram" | "whatsapp";
    channel_config: {
        email?: string | undefined;
        telegram_chat_id?: string | undefined;
        whatsapp_number?: string | undefined;
    };
}>;
export declare const UpdateNotificationRequestSchema: z.ZodObject<{
    is_enabled: z.ZodOptional<z.ZodBoolean>;
    channel_config: z.ZodOptional<z.ZodObject<{
        telegram_chat_id: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        whatsapp_number: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email?: string | undefined;
        telegram_chat_id?: string | undefined;
        whatsapp_number?: string | undefined;
    }, {
        email?: string | undefined;
        telegram_chat_id?: string | undefined;
        whatsapp_number?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    is_enabled?: boolean | undefined;
    channel_config?: {
        email?: string | undefined;
        telegram_chat_id?: string | undefined;
        whatsapp_number?: string | undefined;
    } | undefined;
}, {
    is_enabled?: boolean | undefined;
    channel_config?: {
        email?: string | undefined;
        telegram_chat_id?: string | undefined;
        whatsapp_number?: string | undefined;
    } | undefined;
}>;
export declare const NotificationResponseSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodNativeEnum<{
        telegram: "telegram";
        email: "email";
        whatsapp: "whatsapp";
    }>;
    is_enabled: z.ZodBoolean;
    channel_config: z.ZodRecord<z.ZodString, z.ZodAny>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "email" | "telegram" | "whatsapp";
    id: string;
    is_enabled: boolean;
    channel_config: Record<string, any>;
    created_at: string;
    updated_at: string;
}, {
    type: "email" | "telegram" | "whatsapp";
    id: string;
    is_enabled: boolean;
    channel_config: Record<string, any>;
    created_at: string;
    updated_at: string;
}>;
export declare const NotificationListResponseSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    type: z.ZodNativeEnum<{
        telegram: "telegram";
        email: "email";
        whatsapp: "whatsapp";
    }>;
    is_enabled: z.ZodBoolean;
    channel_config: z.ZodRecord<z.ZodString, z.ZodAny>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "email" | "telegram" | "whatsapp";
    id: string;
    is_enabled: boolean;
    channel_config: Record<string, any>;
    created_at: string;
    updated_at: string;
}, {
    type: "email" | "telegram" | "whatsapp";
    id: string;
    is_enabled: boolean;
    channel_config: Record<string, any>;
    created_at: string;
    updated_at: string;
}>, "many">;
export declare const CreatePaymentRequestSchema: z.ZodObject<{
    plan_type: z.ZodEffects<z.ZodNativeEnum<{
        free: "free";
        basic: "basic";
        advanced: "advanced";
        pro: "pro";
    }>, "basic" | "advanced" | "pro", "free" | "basic" | "advanced" | "pro">;
}, "strip", z.ZodTypeAny, {
    plan_type: "basic" | "advanced" | "pro";
}, {
    plan_type: "free" | "basic" | "advanced" | "pro";
}>;
export declare const PaymentResponseSchema: z.ZodObject<{
    payment_id: z.ZodString;
    invoice: z.ZodString;
    amount_sats: z.ZodNumber;
    expires_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    payment_id: string;
    invoice: string;
    amount_sats: number;
    expires_at: string;
}, {
    payment_id: string;
    invoice: string;
    amount_sats: number;
    expires_at: string;
}>;
export declare const PaymentStatusResponseSchema: z.ZodObject<{
    id: z.ZodString;
    status: z.ZodNativeEnum<{
        pending: "pending";
        paid: "paid";
        expired: "expired";
        failed: "failed";
    }>;
    amount_sats: z.ZodNumber;
    plan_type: z.ZodNativeEnum<{
        free: "free";
        basic: "basic";
        advanced: "advanced";
        pro: "pro";
    }>;
    paid_at: z.ZodOptional<z.ZodString>;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "failed" | "paid" | "expired";
    plan_type: "free" | "basic" | "advanced" | "pro";
    id: string;
    created_at: string;
    amount_sats: number;
    paid_at?: string | undefined;
}, {
    status: "pending" | "failed" | "paid" | "expired";
    plan_type: "free" | "basic" | "advanced" | "pro";
    id: string;
    created_at: string;
    amount_sats: number;
    paid_at?: string | undefined;
}>;
export declare const AdminKPISchema: z.ZodObject<{
    total_users: z.ZodNumber;
    active_users: z.ZodNumber;
    total_trades: z.ZodNumber;
    successful_trades: z.ZodNumber;
    failed_trades: z.ZodNumber;
    total_revenue_sats: z.ZodNumber;
    active_automations: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    total_trades: number;
    successful_trades: number;
    failed_trades: number;
    total_users: number;
    active_users: number;
    total_revenue_sats: number;
    active_automations: number;
}, {
    total_trades: number;
    successful_trades: number;
    failed_trades: number;
    total_users: number;
    active_users: number;
    total_revenue_sats: number;
    active_automations: number;
}>;
export declare const AdminUserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    plan_type: z.ZodNativeEnum<{
        free: "free";
        basic: "basic";
        advanced: "advanced";
        pro: "pro";
    }>;
    is_active: z.ZodBoolean;
    created_at: z.ZodString;
    last_activity: z.ZodOptional<z.ZodString>;
    automations_count: z.ZodNumber;
    trades_count: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    email: string;
    plan_type: "free" | "basic" | "advanced" | "pro";
    id: string;
    is_active: boolean;
    created_at: string;
    automations_count: number;
    trades_count: number;
    last_activity?: string | undefined;
}, {
    email: string;
    plan_type: "free" | "basic" | "advanced" | "pro";
    id: string;
    is_active: boolean;
    created_at: string;
    automations_count: number;
    trades_count: number;
    last_activity?: string | undefined;
}>;
export declare const AdminPaymentSchema: z.ZodObject<{
    id: z.ZodString;
    user_id: z.ZodString;
    plan_type: z.ZodNativeEnum<{
        free: "free";
        basic: "basic";
        advanced: "advanced";
        pro: "pro";
    }>;
    amount_sats: z.ZodNumber;
    status: z.ZodNativeEnum<{
        pending: "pending";
        paid: "paid";
        expired: "expired";
        failed: "failed";
    }>;
    paid_at: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "failed" | "paid" | "expired";
    user_id: string;
    plan_type: "free" | "basic" | "advanced" | "pro";
    id: string;
    amount_sats: number;
    paid_at?: string | undefined;
}, {
    status: "pending" | "failed" | "paid" | "expired";
    user_id: string;
    plan_type: "free" | "basic" | "advanced" | "pro";
    id: string;
    amount_sats: number;
    paid_at?: string | undefined;
}>;
export declare const AdminDashboardResponseSchema: z.ZodObject<{
    kpis: z.ZodObject<{
        total_users: z.ZodNumber;
        active_users: z.ZodNumber;
        total_trades: z.ZodNumber;
        successful_trades: z.ZodNumber;
        failed_trades: z.ZodNumber;
        total_revenue_sats: z.ZodNumber;
        active_automations: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total_trades: number;
        successful_trades: number;
        failed_trades: number;
        total_users: number;
        active_users: number;
        total_revenue_sats: number;
        active_automations: number;
    }, {
        total_trades: number;
        successful_trades: number;
        failed_trades: number;
        total_users: number;
        active_users: number;
        total_revenue_sats: number;
        active_automations: number;
    }>;
    recent_users: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        plan_type: z.ZodNativeEnum<{
            free: "free";
            basic: "basic";
            advanced: "advanced";
            pro: "pro";
        }>;
        is_active: z.ZodBoolean;
        created_at: z.ZodString;
        last_activity: z.ZodOptional<z.ZodString>;
        automations_count: z.ZodNumber;
        trades_count: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        email: string;
        plan_type: "free" | "basic" | "advanced" | "pro";
        id: string;
        is_active: boolean;
        created_at: string;
        automations_count: number;
        trades_count: number;
        last_activity?: string | undefined;
    }, {
        email: string;
        plan_type: "free" | "basic" | "advanced" | "pro";
        id: string;
        is_active: boolean;
        created_at: string;
        automations_count: number;
        trades_count: number;
        last_activity?: string | undefined;
    }>, "many">;
    recent_payments: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        user_id: z.ZodString;
        plan_type: z.ZodNativeEnum<{
            free: "free";
            basic: "basic";
            advanced: "advanced";
            pro: "pro";
        }>;
        amount_sats: z.ZodNumber;
        status: z.ZodNativeEnum<{
            pending: "pending";
            paid: "paid";
            expired: "expired";
            failed: "failed";
        }>;
        paid_at: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "pending" | "failed" | "paid" | "expired";
        user_id: string;
        plan_type: "free" | "basic" | "advanced" | "pro";
        id: string;
        amount_sats: number;
        paid_at?: string | undefined;
    }, {
        status: "pending" | "failed" | "paid" | "expired";
        user_id: string;
        plan_type: "free" | "basic" | "advanced" | "pro";
        id: string;
        amount_sats: number;
        paid_at?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    kpis: {
        total_trades: number;
        successful_trades: number;
        failed_trades: number;
        total_users: number;
        active_users: number;
        total_revenue_sats: number;
        active_automations: number;
    };
    recent_users: {
        email: string;
        plan_type: "free" | "basic" | "advanced" | "pro";
        id: string;
        is_active: boolean;
        created_at: string;
        automations_count: number;
        trades_count: number;
        last_activity?: string | undefined;
    }[];
    recent_payments: {
        status: "pending" | "failed" | "paid" | "expired";
        user_id: string;
        plan_type: "free" | "basic" | "advanced" | "pro";
        id: string;
        amount_sats: number;
        paid_at?: string | undefined;
    }[];
}, {
    kpis: {
        total_trades: number;
        successful_trades: number;
        failed_trades: number;
        total_users: number;
        active_users: number;
        total_revenue_sats: number;
        active_automations: number;
    };
    recent_users: {
        email: string;
        plan_type: "free" | "basic" | "advanced" | "pro";
        id: string;
        is_active: boolean;
        created_at: string;
        automations_count: number;
        trades_count: number;
        last_activity?: string | undefined;
    }[];
    recent_payments: {
        status: "pending" | "failed" | "paid" | "expired";
        user_id: string;
        plan_type: "free" | "basic" | "advanced" | "pro";
        id: string;
        amount_sats: number;
        paid_at?: string | undefined;
    }[];
}>;
export declare const AdminUsersQuerySchema: z.ZodObject<{
    plan_type: z.ZodOptional<z.ZodNativeEnum<{
        free: "free";
        basic: "basic";
        advanced: "advanced";
        pro: "pro";
    }>>;
    is_active: z.ZodOptional<z.ZodBoolean>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
    plan_type?: "free" | "basic" | "advanced" | "pro" | undefined;
    is_active?: boolean | undefined;
}, {
    plan_type?: "free" | "basic" | "advanced" | "pro" | undefined;
    is_active?: boolean | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export declare const AdminUsersResponseSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    plan_type: z.ZodNativeEnum<{
        free: "free";
        basic: "basic";
        advanced: "advanced";
        pro: "pro";
    }>;
    is_active: z.ZodBoolean;
    created_at: z.ZodString;
    last_activity: z.ZodOptional<z.ZodString>;
    automations_count: z.ZodNumber;
    trades_count: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    email: string;
    plan_type: "free" | "basic" | "advanced" | "pro";
    id: string;
    is_active: boolean;
    created_at: string;
    automations_count: number;
    trades_count: number;
    last_activity?: string | undefined;
}, {
    email: string;
    plan_type: "free" | "basic" | "advanced" | "pro";
    id: string;
    is_active: boolean;
    created_at: string;
    automations_count: number;
    trades_count: number;
    last_activity?: string | undefined;
}>, "many">;
export declare const CreateCouponRequestSchema: z.ZodObject<{
    code: z.ZodString;
    plan_type: z.ZodNativeEnum<{
        free: "free";
        basic: "basic";
        advanced: "advanced";
        pro: "pro";
    }>;
    usage_limit: z.ZodDefault<z.ZodNumber>;
    expires_at: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    plan_type: "free" | "basic" | "advanced" | "pro";
    usage_limit: number;
    expires_at?: string | undefined;
}, {
    code: string;
    plan_type: "free" | "basic" | "advanced" | "pro";
    expires_at?: string | undefined;
    usage_limit?: number | undefined;
}>;
export declare const CouponResponseSchema: z.ZodObject<{
    id: z.ZodString;
    code: z.ZodString;
    plan_type: z.ZodNativeEnum<{
        free: "free";
        basic: "basic";
        advanced: "advanced";
        pro: "pro";
    }>;
    usage_limit: z.ZodNumber;
    used_count: z.ZodNumber;
    expires_at: z.ZodOptional<z.ZodString>;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    plan_type: "free" | "basic" | "advanced" | "pro";
    id: string;
    created_at: string;
    usage_limit: number;
    used_count: number;
    expires_at?: string | undefined;
}, {
    code: string;
    plan_type: "free" | "basic" | "advanced" | "pro";
    id: string;
    created_at: string;
    usage_limit: number;
    used_count: number;
    expires_at?: string | undefined;
}>;
export declare const CouponListResponseSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    code: z.ZodString;
    plan_type: z.ZodNativeEnum<{
        free: "free";
        basic: "basic";
        advanced: "advanced";
        pro: "pro";
    }>;
    usage_limit: z.ZodNumber;
    used_count: z.ZodNumber;
    expires_at: z.ZodOptional<z.ZodString>;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    plan_type: "free" | "basic" | "advanced" | "pro";
    id: string;
    created_at: string;
    usage_limit: number;
    used_count: number;
    expires_at?: string | undefined;
}, {
    code: string;
    plan_type: "free" | "basic" | "advanced" | "pro";
    id: string;
    created_at: string;
    usage_limit: number;
    used_count: number;
    expires_at?: string | undefined;
}>, "many">;
export declare const WebSocketAuthSchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
export declare const MarginUpdateEventSchema: z.ZodObject<{
    user_id: z.ZodString;
    margin_ratio: z.ZodNumber;
    margin_level: z.ZodEnum<["safe", "warning", "critical"]>;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    user_id: string;
    margin_ratio: number;
    margin_level: "safe" | "warning" | "critical";
    timestamp: string;
}, {
    user_id: string;
    margin_ratio: number;
    margin_level: "safe" | "warning" | "critical";
    timestamp: string;
}>;
export declare const AutomationExecutedEventSchema: z.ZodObject<{
    automation_id: z.ZodString;
    trade_id: z.ZodString;
    status: z.ZodNativeEnum<{
        success: "success";
        app_error: "app_error";
        exchange_error: "exchange_error";
    }>;
    message: z.ZodString;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "success" | "app_error" | "exchange_error";
    message: string;
    trade_id: string;
    automation_id: string;
    timestamp: string;
}, {
    status: "success" | "app_error" | "exchange_error";
    message: string;
    trade_id: string;
    automation_id: string;
    timestamp: string;
}>;
export declare const NotificationSentEventSchema: z.ZodObject<{
    type: z.ZodNativeEnum<{
        telegram: "telegram";
        email: "email";
        whatsapp: "whatsapp";
    }>;
    status: z.ZodEnum<["sent", "failed"]>;
    message: z.ZodString;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "failed" | "sent";
    message: string;
    type: "email" | "telegram" | "whatsapp";
    timestamp: string;
}, {
    status: "failed" | "sent";
    message: string;
    type: "email" | "telegram" | "whatsapp";
    timestamp: string;
}>;
export declare const ErrorResponseSchema: z.ZodObject<{
    error: z.ZodString;
    message: z.ZodString;
    code: z.ZodOptional<z.ZodString>;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    error: string;
    code?: string | undefined;
    details?: Record<string, any> | undefined;
}, {
    message: string;
    error: string;
    code?: string | undefined;
    details?: Record<string, any> | undefined;
}>;
export declare const ValidationErrorSchema: z.ZodObject<{
    field: z.ZodString;
    message: z.ZodString;
    value: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    field: string;
    value?: string | number | boolean | null | undefined;
}, {
    message: string;
    field: string;
    value?: string | number | boolean | null | undefined;
}>;
export declare const ValidationErrorResponseSchema: z.ZodObject<{
    error: z.ZodString;
    message: z.ZodString;
    code: z.ZodOptional<z.ZodString>;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
} & {
    validation_errors: z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        message: z.ZodString;
        value: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        field: string;
        value?: string | number | boolean | null | undefined;
    }, {
        message: string;
        field: string;
        value?: string | number | boolean | null | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    message: string;
    error: string;
    validation_errors: {
        message: string;
        field: string;
        value?: string | number | boolean | null | undefined;
    }[];
    code?: string | undefined;
    details?: Record<string, any> | undefined;
}, {
    message: string;
    error: string;
    validation_errors: {
        message: string;
        field: string;
        value?: string | number | boolean | null | undefined;
    }[];
    code?: string | undefined;
    details?: Record<string, any> | undefined;
}>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;
export type AutomationConfig = z.infer<typeof AutomationConfigSchema>;
export type CreateAutomationRequest = z.infer<typeof CreateAutomationRequestSchema>;
export type UpdateAutomationRequest = z.infer<typeof UpdateAutomationRequestSchema>;
export type AutomationResponse = z.infer<typeof AutomationResponseSchema>;
export type AutomationListResponse = z.infer<typeof AutomationListResponseSchema>;
export type TradeLogResponse = z.infer<typeof TradeLogResponseSchema>;
export type TradeLogDetailResponse = z.infer<typeof TradeLogDetailResponseSchema>;
export type TradeLogListResponse = z.infer<typeof TradeLogListResponseSchema>;
export type TradeLogQuery = z.infer<typeof TradeLogQuerySchema>;
export type BacktestConfig = z.infer<typeof BacktestConfigSchema>;
export type CreateBacktestRequest = z.infer<typeof CreateBacktestRequestSchema>;
export type BacktestResult = z.infer<typeof BacktestResultSchema>;
export type BacktestResponse = z.infer<typeof BacktestResponseSchema>;
export type NotificationChannelConfig = z.infer<typeof NotificationChannelConfigSchema>;
export type CreateNotificationRequest = z.infer<typeof CreateNotificationRequestSchema>;
export type UpdateNotificationRequest = z.infer<typeof UpdateNotificationRequestSchema>;
export type NotificationResponse = z.infer<typeof NotificationResponseSchema>;
export type NotificationListResponse = z.infer<typeof NotificationListResponseSchema>;
export type CreatePaymentRequest = z.infer<typeof CreatePaymentRequestSchema>;
export type PaymentResponse = z.infer<typeof PaymentResponseSchema>;
export type PaymentStatusResponse = z.infer<typeof PaymentStatusResponseSchema>;
export type AdminKPI = z.infer<typeof AdminKPISchema>;
export type AdminUser = z.infer<typeof AdminUserSchema>;
export type AdminPayment = z.infer<typeof AdminPaymentSchema>;
export type AdminDashboardResponse = z.infer<typeof AdminDashboardResponseSchema>;
export type AdminUsersQuery = z.infer<typeof AdminUsersQuerySchema>;
export type AdminUsersResponse = z.infer<typeof AdminUsersResponseSchema>;
export type CreateCouponRequest = z.infer<typeof CreateCouponRequestSchema>;
export type CouponResponse = z.infer<typeof CouponResponseSchema>;
export type CouponListResponse = z.infer<typeof CouponListResponseSchema>;
export type WebSocketAuth = z.infer<typeof WebSocketAuthSchema>;
export type MarginUpdateEvent = z.infer<typeof MarginUpdateEventSchema>;
export type AutomationExecutedEvent = z.infer<typeof AutomationExecutedEventSchema>;
export type NotificationSentEvent = z.infer<typeof NotificationSentEventSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type ValidationErrorResponse = z.infer<typeof ValidationErrorResponseSchema>;
//# sourceMappingURL=api-contracts.d.ts.map