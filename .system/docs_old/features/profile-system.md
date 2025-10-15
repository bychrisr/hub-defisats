# Profile Management System Documentation

## 📋 Overview

This document describes the comprehensive profile management system implemented for the Axisor platform, including plan-based avatar indicators, notification preferences, and billing management.

## 🎯 Features Implemented

### 1. Profile Page Redesign
- **Sidebar Navigation**: Modern sidebar with glow effects
- **4 Main Sections**: Profile, Security, Notifications, Billing
- **Responsive Design**: Works on all screen sizes
- **Modern UI**: Card-based layouts with proper spacing

### 2. Plan-Based Avatar System
- **Visual Indicators**: Colored circles around avatars based on user plan
- **Plan Colors**:
  - Free: Green with Check icon ✓
  - Basic: Blue with CreditCard icon 💳
  - Advanced: Purple with Zap icon ⚡
  - Pro: Yellow with Crown icon 👑
  - Lifetime: Yellow with Star icon ⭐
- **Multiple Sizes**: sm (6x6), md (8x8), lg (20x20)
- **Context Aware**: Different layouts for menu vs profile page

### 3. Notification Preferences
- **Multi-Channel Support**: Email, Telegram, WhatsApp, Push, Webhook
- **Notification Types**: Margin alerts, Trade alerts, System notifications
- **Status Indicators**: Visual status for each channel and type
- **Future Ready**: Placeholder for advanced settings

### 4. Billing & Plans Management
- **Current Plan Display**: Shows user's current subscription
- **Plan Comparison**: Side-by-side comparison of all available plans
- **Pricing**: Based on documentation (Basic: 10k sats, Advanced: 25k sats, Pro: 50k sats, Lifetime: 500k sats)
- **Payment History**: Placeholder for transaction history
- **Coupon System**: Input field for discount codes

### 5. LN Markets API Credentials
- **Secure Management**: Encrypted storage and decrypted display
- **Show/Hide Functionality**: Toggle visibility for sensitive data
- **Test Connection**: Placeholder for future implementation
- **Modern Design**: Card-based layout with proper styling

## 🏗️ Technical Architecture

### Frontend Components

#### PlanAvatar Component
```typescript
interface PlanAvatarProps {
  email?: string;
  planType?: string;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  className?: string;
}
```

**Features:**
- Responsive sizing
- Plan-based color theming
- Icon badges for plan identification
- Z-index management for proper layering

#### Profile Page Sections
1. **Profile Section**: About me, social accounts, community settings
2. **Security Section**: LN Markets API credentials management
3. **Notifications Section**: Multi-channel notification preferences
4. **Billing Section**: Plan management and payment options

### Backend Changes

#### Database Schema Updates
```sql
-- Added bio field
ALTER TABLE users ADD COLUMN bio TEXT;

-- Removed unused fields
ALTER TABLE users DROP COLUMN birthday;
ALTER TABLE users DROP COLUMN website;
```

#### API Endpoints
- **GET /api/profile**: Returns user profile with bio field
- **PUT /api/profile**: Updates profile including bio
- **GET /api/auth/me**: Returns decrypted LN Markets credentials

#### Security Implementation
- **Credential Decryption**: LN Markets credentials are decrypted for display
- **Form Validation**: Zod schema validation for all profile forms
- **Error Handling**: Comprehensive error handling and user feedback

## 🎨 Design System

### Color Scheme
- **Free Plan**: Green (#10B981)
- **Basic Plan**: Blue (#3B82F6)
- **Advanced Plan**: Purple (#8B5CF6)
- **Pro/Lifetime Plan**: Yellow (#F59E0B)

### Component Styling
- **Cards**: Rounded corners with subtle borders
- **Glow Effects**: Subtle glow on sidebar navigation
- **Transitions**: Smooth transitions for all interactive elements
- **Responsive**: Mobile-first design approach

## 📱 User Experience

### Navigation Flow
1. **Profile Access**: Click on avatar in menu
2. **Section Selection**: Use sidebar to navigate between sections
3. **Form Interaction**: Edit and save profile information
4. **Plan Management**: View and upgrade subscription plans

### Visual Feedback
- **Success Alerts**: Auto-dismissing success messages
- **Error Handling**: Clear error messages with validation
- **Loading States**: Loading indicators for async operations
- **Status Indicators**: Visual status for all features

## 🔧 Implementation Details

### File Structure
```
frontend/src/
├── components/
│   ├── ui/
│   │   └── PlanAvatar.tsx          # Reusable avatar component
│   └── layout/
│       ├── DesktopNavigation.tsx   # Updated with plan avatars
│       └── Header.tsx              # Updated with plan avatars
├── pages/
│   └── Profile.tsx                 # Complete profile page
└── index.css                       # Additional CSS classes

backend/src/
├── controllers/
│   ├── auth.controller.ts          # Credential decryption
│   └── profile.controller.ts       # Profile management
├── routes/
│   └── profile.routes.ts           # Profile API routes
└── prisma/
    └── schema.prisma               # Database schema updates
```

### Key Functions

#### Plan Color Management
```typescript
const getPlanColors = (planType: string) => {
  switch (planType) {
    case 'lifetime':
    case 'pro':
      return { border: 'border-yellow-500', bg: 'bg-yellow-500/20', ... };
    case 'advanced':
      return { border: 'border-purple-500', bg: 'bg-purple-500/20', ... };
    case 'basic':
      return { border: 'border-blue-500', bg: 'bg-blue-500/20', ... };
    case 'free':
    default:
      return { border: 'border-green-500', bg: 'bg-green-500/20', ... };
  }
};
```

#### Avatar Rendering Logic
```typescript
// Small/Medium sizes: Only badge
if (size === 'sm' || size === 'md') {
  return <Avatar> + <Badge>;
}

// Large size: Full circle + badge
return <Circle> + <Avatar> + <Badge>;
```

## 🚀 Future Enhancements

### Planned Features
1. **Payment Integration**: Lightning Network payment processing
2. **Advanced Notifications**: Custom rules and quiet hours
3. **Plan Upgrades**: Seamless plan change functionality
4. **Analytics**: Usage tracking and insights
5. **API Testing**: LN Markets connection testing

### Technical Improvements
1. **Type Safety**: Full TypeScript coverage
2. **Testing**: Unit and integration tests
3. **Performance**: Optimized rendering and data fetching
4. **Accessibility**: WCAG compliance improvements

## 📊 Metrics and Monitoring

### User Engagement
- Profile completion rates
- Plan upgrade conversions
- Feature usage analytics
- User satisfaction metrics

### Technical Performance
- Page load times
- API response times
- Error rates
- User session duration

## 🔐 Security Considerations

### Data Protection
- All sensitive data encrypted at rest
- Secure credential transmission
- Proper authentication checks
- Input validation and sanitization

### Privacy
- User data minimization
- Clear privacy policies
- Consent management
- Data retention policies

## 📝 Maintenance

### Regular Tasks
1. **Database Maintenance**: Regular cleanup and optimization
2. **Security Updates**: Keep dependencies updated
3. **Performance Monitoring**: Track and optimize performance
4. **User Feedback**: Collect and implement user suggestions

### Troubleshooting
1. **Avatar Display Issues**: Check plan type and z-index
2. **Form Validation**: Verify Zod schema configuration
3. **API Errors**: Check authentication and data format
4. **Styling Issues**: Verify CSS class application

## 🎉 Conclusion

The profile management system provides a comprehensive, modern interface for users to manage their accounts, subscriptions, and preferences. The plan-based avatar system offers immediate visual feedback about user status, while the modular design ensures easy maintenance and future enhancements.

The implementation follows best practices for security, performance, and user experience, providing a solid foundation for the platform's growth and evolution.
