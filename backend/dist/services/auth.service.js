"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("@/config/env");
const lnmarkets_service_1 = require("./lnmarkets.service");
const optimized_queries_service_1 = require("./optimized-queries.service");
class AuthService {
    prisma;
    fastify;
    optimizedQueries;
    constructor(prisma, fastify) {
        this.prisma = prisma;
        this.fastify = fastify;
        this.optimizedQueries = new optimized_queries_service_1.OptimizedQueriesService(prisma);
    }
    async register(data) {
        console.log('🔐 Starting user registration process...');
        console.log('📋 Registration data received:', {
            email: data.email,
            username: data.username,
            hasPassword: !!data.password,
            hasApiKey: !!data.ln_markets_api_key,
            hasApiSecret: !!data.ln_markets_api_secret,
            hasPassphrase: !!data.ln_markets_passphrase,
            couponCode: data.coupon_code,
        });
        const { email, username, password, ln_markets_api_key, ln_markets_api_secret, coupon_code, } = data;
        console.log('🔍 Checking if user already exists...');
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            console.log('❌ User already exists with email:', email);
            throw new Error('User already exists with this email');
        }
        console.log('✅ User does not exist, proceeding with registration');
        try {
            console.log('🔍 Starting LN Markets credentials validation...');
            const lnMarketsCredentials = {
                apiKey: ln_markets_api_key,
                apiSecret: ln_markets_api_secret,
                passphrase: data.ln_markets_passphrase || '',
            };
            console.log('📡 Creating LN Markets service...');
            const lnMarketsService = (0, lnmarkets_service_1.createLNMarketsService)(lnMarketsCredentials);
            console.log('✅ Validating credentials with LN Markets API...');
            const isValidCredentials = await lnMarketsService.validateCredentials();
            if (!isValidCredentials) {
                console.log('❌ LN Markets credentials validation failed');
                throw new Error('Invalid LN Markets API credentials. Please check your API Key, Secret, and Passphrase.');
            }
            console.log('✅ LN Markets credentials validation successful');
        }
        catch (error) {
            console.error('❌ LN Markets validation error:', error);
            console.error('❌ Error details:', {
                message: error.message,
                stack: error.stack,
            });
            throw error;
        }
        console.log('🎫 Validating coupon if provided...');
        let planType = 'free';
        if (coupon_code) {
            console.log('🎫 Coupon code provided:', coupon_code);
            const coupon = await this.validateCoupon(coupon_code);
            planType = coupon.plan_type;
            console.log('✅ Coupon validated, plan type:', planType);
        }
        else {
            console.log('ℹ️ No coupon code provided, using default plan: free');
        }
        console.log('🔐 Hashing password...');
        const passwordHash = await bcrypt_1.default.hash(password, 12);
        console.log('✅ Password hashed successfully');
        console.log('🔐 Encrypting LN Markets credentials...');
        const encryptedApiKey = this.encryptData(ln_markets_api_key);
        const encryptedApiSecret = this.encryptData(ln_markets_api_secret);
        console.log('✅ LN Markets credentials encrypted successfully');
        console.log('👤 Creating user in database...');
        const user = await this.prisma.user.create({
            data: {
                email,
                username,
                password_hash: passwordHash,
                ln_markets_api_key: encryptedApiKey,
                ln_markets_api_secret: encryptedApiSecret,
                plan_type: planType,
            },
        });
        console.log('✅ User created successfully with ID:', user.id);
        if (coupon_code) {
            console.log('🎫 Updating coupon usage...');
            const coupon = await this.prisma.coupon.findUnique({
                where: { code: coupon_code },
            });
            if (coupon) {
                await this.prisma.userCoupon.create({
                    data: {
                        user_id: user.id,
                        coupon_id: coupon.id,
                    },
                });
                await this.updateCouponUsage(coupon_code);
            }
            console.log('✅ Coupon usage updated');
        }
        console.log('🎫 Generating JWT tokens...');
        const token = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);
        console.log('✅ JWT tokens generated successfully');
        console.log('💾 Storing refresh token in database...');
        await this.storeRefreshToken(user.id, refreshToken);
        console.log('✅ Refresh token stored successfully');
        console.log('🎉 User registration completed successfully!');
        await this.optimizedQueries.invalidateSystemCache();
        return {
            user_id: user.id,
            token,
            plan_type: user.plan_type,
        };
    }
    async login(data) {
        const { email, password } = data;
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new Error('Invalid email or password');
        }
        if (!user.password_hash) {
            throw new Error('User registered with social login, please use social login');
        }
        const isValidPassword = await bcrypt_1.default.compare(password, user.password_hash);
        if (!isValidPassword) {
            throw new Error('Invalid email or password');
        }
        if (!user.is_active) {
            throw new Error('Account is deactivated');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { last_activity_at: new Date() },
        });
        const token = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);
        await this.storeRefreshToken(user.id, refreshToken);
        return {
            user_id: user.id,
            token,
            plan_type: user.plan_type,
        };
    }
    async checkUsernameAvailability(username) {
        const available = await this.optimizedQueries.checkUsernameAvailability(username);
        return { available };
    }
    async refreshToken(refreshToken) {
        try {
            const decoded = this.fastify.jwt.verify(refreshToken);
            const tokenRecord = await this.prisma.user.findFirst({
                where: {
                    id: decoded.userId,
                    session_expires_at: {
                        gt: new Date(),
                    },
                },
            });
            if (!tokenRecord) {
                throw new Error('Invalid refresh token');
            }
            const newToken = this.generateAccessToken(tokenRecord);
            return {
                token: newToken,
            };
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
    async logout(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { session_expires_at: null },
        });
    }
    async validateSession(token) {
        try {
            const decoded = this.fastify.jwt.verify(token);
            const user = await this.prisma.user.findUnique({
                where: { id: decoded.userId },
            });
            if (!user || !user.is_active) {
                throw new Error('Invalid session');
            }
            if (user.session_expires_at && user.session_expires_at < new Date()) {
                throw new Error('Session expired');
            }
            return user;
        }
        catch (error) {
            throw new Error('Invalid session');
        }
    }
    async socialLogin(provider, socialId, email, _name) {
        let user = await this.prisma.user.findFirst({
            where: {
                social_provider: provider,
                social_id: socialId,
            },
        });
        if (!user) {
            const existingUser = await this.prisma.user.findUnique({
                where: { email },
            });
            if (existingUser) {
                user = await this.prisma.user.update({
                    where: { id: existingUser.id },
                    data: {
                        social_provider: provider,
                        social_id: socialId,
                    },
                });
            }
            else {
                user = await this.prisma.user.create({
                    data: {
                        email,
                        social_provider: provider,
                        social_id: socialId,
                        ln_markets_api_key: '',
                        ln_markets_api_secret: '',
                        plan_type: 'free',
                    },
                });
            }
        }
        if (!user.is_active) {
            throw new Error('Account is deactivated');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { last_activity_at: new Date() },
        });
        const token = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);
        await this.storeRefreshToken(user.id, refreshToken);
        return {
            user_id: user.id,
            token,
            plan_type: user.plan_type,
        };
    }
    generateAccessToken(user) {
        return this.fastify.jwt.sign({
            userId: user.id,
            email: user.email,
            planType: user.plan_type,
        }, {
            expiresIn: env_1.config.jwt.expiresIn,
        });
    }
    generateRefreshToken(user) {
        return this.fastify.jwt.sign({
            userId: user.id,
            type: 'refresh',
        }, {
            expiresIn: env_1.config.jwt.refreshExpiresIn,
        });
    }
    async storeRefreshToken(userId, _refreshToken) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await this.prisma.user.update({
            where: { id: userId },
            data: { session_expires_at: expiresAt },
        });
    }
    async validateCoupon(code) {
        const coupon = await this.prisma.coupon.findUnique({
            where: { code },
        });
        if (!coupon) {
            throw new Error('Invalid coupon code');
        }
        if (coupon.expires_at && coupon.expires_at < new Date()) {
            throw new Error('Coupon has expired');
        }
        if (coupon.used_count >= coupon.usage_limit) {
            throw new Error('Coupon usage limit exceeded');
        }
        return coupon;
    }
    async updateCouponUsage(code) {
        await this.prisma.coupon.update({
            where: { code },
            data: {
                used_count: {
                    increment: 1,
                },
            },
        });
    }
    encryptData(data) {
        const algorithm = 'aes-256-cbc';
        const key = crypto_1.default.scryptSync(env_1.config.security.encryption.key, 'salt', 32);
        const iv = crypto_1.default.randomBytes(16);
        const cipher = crypto_1.default.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }
    decryptData(encryptedData) {
        const algorithm = 'aes-256-cbc';
        const key = crypto_1.default.scryptSync(env_1.config.security.encryption.key, 'salt', 32);
        const parts = encryptedData.split(':');
        if (parts.length !== 2 || !parts[0] || !parts[1]) {
            throw new Error('Invalid encrypted data format');
        }
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const decipher = crypto_1.default.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map