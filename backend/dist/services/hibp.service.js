"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HIBPService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
class HIBPService {
    apiUrl = 'https://api.pwnedpasswords.com/range';
    async isPasswordCompromised(password) {
        try {
            const sha1Hash = crypto_1.default
                .createHash('sha1')
                .update(password)
                .digest('hex')
                .toUpperCase();
            const prefix = sha1Hash.substring(0, 5);
            const suffix = sha1Hash.substring(5);
            const response = await axios_1.default.get(`${this.apiUrl}/${prefix}`, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Hub-defisats-Security-Check',
                },
            });
            const hashList = response.data;
            const lines = hashList.split('\n');
            for (const line of lines) {
                const [hashSuffix] = line.split(':');
                if (hashSuffix === suffix) {
                    return true;
                }
            }
            return false;
        }
        catch (error) {
            console.error('HIBP service error:', error);
            return false;
        }
    }
    async getPasswordBreachCount(password) {
        try {
            const sha1Hash = crypto_1.default
                .createHash('sha1')
                .update(password)
                .digest('hex')
                .toUpperCase();
            const prefix = sha1Hash.substring(0, 5);
            const suffix = sha1Hash.substring(5);
            const response = await axios_1.default.get(`${this.apiUrl}/${prefix}`, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Hub-defisats-Security-Check',
                },
            });
            const hashList = response.data;
            const lines = hashList.split('\n');
            for (const line of lines) {
                const [hashSuffix, count] = line.split(':');
                if (hashSuffix === suffix) {
                    return parseInt(count, 10);
                }
            }
            return 0;
        }
        catch (error) {
            console.error('HIBP service error:', error);
            return 0;
        }
    }
}
exports.HIBPService = HIBPService;
//# sourceMappingURL=hibp.service.js.map