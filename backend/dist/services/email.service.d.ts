export declare class EmailService {
    private transporter;
    constructor();
    sendEmailVerification(email: string, token: string): Promise<void>;
    sendPasswordReset(email: string, token: string): Promise<void>;
    generateEmailToken(): string;
    generatePasswordResetToken(): string;
}
//# sourceMappingURL=email.service.d.ts.map