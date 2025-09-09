export declare class Sanitizer {
    static sanitizeString(input: string): string;
    static sanitizeEmail(email: string): string;
    static sanitizeHtml(html: string): string;
    static sanitizeJson(input: any): any;
    static sanitizeSql(input: string): string;
    static escapeHtml(input: string): string;
    static sanitizeUrl(url: string): string;
    static sanitizePhone(phone: string): string;
    static sanitizeNumber(input: string | number): number;
    static sanitizeInteger(input: string | number): number;
}
//# sourceMappingURL=sanitizer.d.ts.map