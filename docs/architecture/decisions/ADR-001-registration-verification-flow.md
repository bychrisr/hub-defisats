---
title: "ADR-001: New Registration and Verification Flow"
status: "approved"
date: "2025-01-22"
decision-makers: ["Axisor Team"]
reviewers: ["Security Team", "Product Team"]
tags: ["authentication", "security", "user-experience", "verification"]
version: "1.0"
---

# ADR-001: New Registration and Verification Flow

## Context and Problem Statement

The current registration flow allows users to access sensitive features before email verification, which creates security vulnerabilities and potential for abuse. This violates industry best practices followed by GitHub, Stripe, and GitLab, where no sensitive actions are permitted before email verification.

### Current Issues:
- Users can access dashboard and create bots before email verification
- No demo mode for unverified users
- Missing anti-fraud protections
- Poor user experience with unclear verification requirements
- No feature gating based on user entitlements

### Business Impact:
- Security vulnerabilities
- Potential for spam/abuse accounts
- Poor conversion rates due to unclear value proposition
- Compliance issues with data protection regulations

## Decision Drivers

1. **Security**: Prevent access to sensitive features before verification
2. **Compliance**: Meet industry standards for user verification
3. **User Experience**: Provide clear value proposition through demo mode
4. **Conversion**: Increase paid plan conversions through contextual gating
5. **Anti-fraud**: Implement rate limiting and abuse prevention
6. **Scalability**: Support feature gating and entitlements system

## Considered Options

### Option 1: Keep Current Flow (Rejected)
**Pros**: No development effort
**Cons**: Security vulnerabilities, poor UX, compliance issues

### Option 2: Simple Email Verification (Rejected)
**Pros**: Basic security improvement
**Cons**: Still allows access to sensitive features, no demo mode, poor conversion

### Option 3: Complete Flow Redesign (Selected)
**Pros**: Industry-standard security, great UX, conversion optimization, anti-fraud
**Cons**: Significant development effort, requires careful migration

## Decision Outcome

Implement a comprehensive registration and verification flow with the following components:

### Core Flow
1. **Registration**: Personal data → Email verification required
2. **Verification**: Magic link + OTP with auto-login
3. **Demo Mode**: Static demo data for unverified users
4. **Feature Gating**: Contextual plan gates and protected buttons
5. **Anti-fraud**: Rate limiting, IP tracking, blacklisting

### Technical Implementation
- **Backend**: UserEntitlements schema, OTP system, rate limiting
- **Frontend**: VerifyEmailRequired page, demo service, entitlements hook
- **Security**: HttpOnly cookies, SHA256 magic link hashing, bcrypt OTP hashing, single-use tokens
- **Analytics**: Conversion tracking, abuse detection

## Consequences

### Positive
- ✅ Industry-standard security practices
- ✅ Improved user experience with demo mode
- ✅ Better conversion rates through contextual gating
- ✅ Anti-fraud protection
- ✅ Compliance with data protection regulations
- ✅ Scalable entitlements system
- ✅ SHA256 token hashing (GitHub style) for enhanced security
- ✅ Dual verification methods (Magic Link + OTP) for user choice

### Negative
- ❌ Significant development effort (12 phases)
- ❌ Complex migration for existing users
- ❌ Additional infrastructure requirements (email service)
- ❌ Potential user friction during verification

### Risks
- **Migration Risk**: Existing users need entitlements backfill
- **Email Deliverability**: Risk of emails going to spam
- **User Drop-off**: Some users may abandon during verification
- **Technical Complexity**: Multiple systems need coordination
- **Token Truncation**: URL length limits can truncate magic link tokens (resolved with SHA256 hashing)

## Implementation Timeline

### Phase 1: Foundation (Weeks 1-2)
- Email service configuration
- UserEntitlements schema
- Feature flags setup

### Phase 2: Core Flow (Weeks 3-4)
- VerifyEmailRequired page
- OTP system implementation
- Auto-login magic links

### Phase 3: Demo & Gating (Weeks 5-6)
- Demo data and service
- Plan gate system
- Protected buttons

### Phase 4: Polish (Weeks 7-8)
- Analytics integration
- Anti-fraud measures
- Testing and optimization

## Success Metrics

### Security Metrics
- **Email Verification Rate**: >95% of users verify within 24h
- **Abuse Prevention**: <1% of accounts flagged as spam
- **Rate Limit Effectiveness**: <0.1% false positives

### User Experience Metrics
- **Demo Engagement**: >60% of users interact with demo features
- **Tour Completion**: >40% complete product tour
- **Gate Conversion**: >15% convert to paid plans within 7 days

### Technical Metrics
- **Email Deliverability**: >98% delivery rate
- **Page Load Time**: <2s for verification pages
- **Error Rate**: <0.5% for verification endpoints

## Monitoring and Rollback

### Monitoring
- Real-time dashboards for verification rates
- Email deliverability monitoring
- Conversion funnel analytics
- Error rate tracking

### Rollback Plan
1. **Immediate**: Disable feature flags to revert to old flow
2. **Database**: Rollback schema migration if needed
3. **Frontend**: Deploy previous version
4. **Communication**: Notify users of temporary issues

## Related Decisions

- [ADR-002: Entitlements System Architecture](./ADR-002-entitlements-system.md)
- [ADR-003: Demo Mode Implementation](./ADR-003-demo-mode.md)
- [ADR-004: Anti-fraud System Design](./ADR-004-anti-fraud-system.md)

## Lessons Learned

### Implementation Challenges
1. **Token Truncation Issue**: Initial implementation suffered from URL length limits truncating magic link tokens
2. **Solution**: Implemented SHA256 hashing for token storage, allowing hash comparison instead of plaintext matching
3. **Storage Separation**: OTP and Magic Link tokens require separate storage to prevent conflicts
4. **Redirect Strategy**: Login page redirect provides better UX than direct dashboard access

### Security Improvements
- Magic Link tokens use SHA256 hashing (GitHub style) for secure storage
- Token verification compares hashes to prevent plaintext exposure
- Separate storage for OTP and Magic Link tokens prevents conflicts
- Redirect to login page after verification for better UX and security

## References

- [GitHub Email Verification Flow](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/verifying-your-email-address)
- [Stripe Account Verification](https://stripe.com/docs/connect/identity-verification)
- [GitLab Email Verification](https://docs.gitlab.com/ee/user/profile/account/verify_email.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

## Approval

**Approved by**: Axisor Team  
**Date**: 2025-01-22  
**Next Review**: 2025-04-22 (3 months)

---

## How to Use This Document

• **For Developers**: Use as reference for implementing the verification flow components and understanding the technical requirements.

• **For Product Managers**: Use to understand the business rationale, success metrics, and user experience improvements.

• **For Security Team**: Use to validate security measures and compliance with industry standards.

• **For DevOps**: Use to understand infrastructure requirements, monitoring needs, and rollback procedures.
