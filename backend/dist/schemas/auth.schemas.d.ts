export declare const RegisterRequestSchema: {
    type: string;
    required: string[];
    properties: {
        email: {
            type: string;
            format: string;
            minLength: number;
            maxLength: number;
        };
        username: {
            type: string;
            minLength: number;
            maxLength: number;
            pattern: string;
        };
        password: {
            type: string;
            minLength: number;
            maxLength: number;
        };
        ln_markets_api_key: {
            type: string;
            minLength: number;
            maxLength: number;
        };
        ln_markets_api_secret: {
            type: string;
            minLength: number;
            maxLength: number;
        };
        ln_markets_passphrase: {
            type: string;
            minLength: number;
            maxLength: number;
        };
        coupon_code: {
            type: string;
            minLength: number;
            maxLength: number;
            pattern: string;
        };
    };
    additionalProperties: boolean;
};
export declare const LoginRequestSchema: {
    type: string;
    required: string[];
    properties: {
        email: {
            type: string;
            format: string;
            minLength: number;
            maxLength: number;
        };
        password: {
            type: string;
            minLength: number;
            maxLength: number;
        };
    };
    additionalProperties: boolean;
};
export declare const AuthResponseSchema: {
    type: string;
    required: string[];
    properties: {
        user_id: {
            type: string;
            format: string;
        };
        token: {
            type: string;
            minLength: number;
        };
        plan_type: {
            type: string;
            enum: string[];
        };
    };
    additionalProperties: boolean;
};
export declare const RefreshTokenResponseSchema: {
    type: string;
    required: string[];
    properties: {
        token: {
            type: string;
            minLength: number;
        };
    };
    additionalProperties: boolean;
};
export declare const ErrorResponseSchema: {
    type: string;
    required: string[];
    properties: {
        error: {
            type: string;
            minLength: number;
        };
        message: {
            type: string;
            minLength: number;
        };
    };
    additionalProperties: boolean;
};
export declare const ValidationErrorResponseSchema: {
    type: string;
    required: string[];
    properties: {
        error: {
            type: string;
            enum: string[];
        };
        message: {
            type: string;
            minLength: number;
        };
        validation_errors: {
            type: string;
            items: {
                type: string;
                required: string[];
                properties: {
                    field: {
                        type: string;
                        minLength: number;
                    };
                    message: {
                        type: string;
                        minLength: number;
                    };
                    value: {
                        oneOf: {
                            type: string;
                        }[];
                    };
                };
                additionalProperties: boolean;
            };
        };
    };
    additionalProperties: boolean;
};
//# sourceMappingURL=auth.schemas.d.ts.map