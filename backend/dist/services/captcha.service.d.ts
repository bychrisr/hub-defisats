export declare class CaptchaService {
    private readonly recaptchaSecretKey;
    private readonly recaptchaUrl;
    constructor();
    verifyRecaptcha(token: string, remoteip?: string): Promise<{
        success: boolean;
        score?: number;
        error?: string;
    }>;
    verifyHcaptcha(token: string, remoteip?: string): Promise<{
        success: boolean;
        error?: string;
    }>;
}
//# sourceMappingURL=captcha.service.d.ts.map