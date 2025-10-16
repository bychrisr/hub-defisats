/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  // Main documentation sidebar
  tutorialSidebar: [
    'index',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started',
        'quick-start',
        'installation',
        'configuration',
      ],
    },
    {
      type: 'category',
      label: 'Architecture & Design',
      items: [
        'architecture/system-overview',
        'architecture/microservices',
        'architecture/data-architecture',
        'architecture/design-system',
      ],
    },
    {
      type: 'category',
      label: 'Integrations & APIs',
      items: [
        'integrations/external-apis',
        'integrations/internal-apis',
        'integrations/websocket',
        'integrations/authentication',
      ],
    },
    {
      type: 'category',
      label: 'Automations & Workers',
      items: [
        'automations/margin-guard',
        'automations/automation-engine',
        'automations/workers',
        'automations/simulations',
      ],
    },
    {
      type: 'category',
      label: 'Deployment & Infrastructure',
      items: [
        'deployment/environments',
        'deployment/docker',
        'deployment/kubernetes',
        'deployment/ci-cd',
        'deployment/monitoring',
      ],
    },
    {
      type: 'category',
      label: 'Security & Compliance',
      items: [
        'security/authentication',
        'security/authorization',
        'security/data-protection',
        'security/api-security',
        'security/compliance',
      ],
    },
    {
      type: 'category',
      label: 'User Management & Accounts',
      items: [
        'user-management/multi-account',
        'user-management/authentication',
        'user-management/authorization',
        'user-management/profiles',
      ],
    },
    {
      type: 'category',
      label: 'Charts & Visualization',
      items: [
        'charts/tradingview-integration',
        'charts/dashboard-components',
        'charts/data-processing',
        'charts/performance',
      ],
    },
    {
      type: 'category',
      label: 'Administration & Management',
      items: [
        'administration/admin-panel',
        'administration/plan-management',
        'administration/coupon-system',
        'administration/maintenance',
      ],
    },
    {
      type: 'category',
      label: 'Testing & Validation',
      items: [
        'testing/unit-testing',
        'testing/integration-testing',
        'testing/e2e-testing',
        'testing/performance-testing',
      ],
    },
    {
      type: 'category',
      label: 'Monitoring & Observability',
      items: [
        'monitoring/application-monitoring',
        'monitoring/infrastructure-monitoring',
        'monitoring/business-monitoring',
        'monitoring/alerting',
      ],
    },
    {
      type: 'category',
      label: 'Troubleshooting & Support',
      items: [
        'troubleshooting/common-issues',
        'troubleshooting/debugging',
        'troubleshooting/error-codes',
        'troubleshooting/support-procedures',
      ],
    },
    {
      type: 'category',
      label: 'Migrations & Refactoring',
      items: [
        'migrations/database-migrations',
        'migrations/code-migrations',
        'migrations/feature-migrations',
        'migrations/deployment-migrations',
      ],
    },
    {
      type: 'category',
      label: 'Project Documentation',
      items: [
        'project/project-overview',
        'project/requirements',
        'project/planning',
        'project/decisions',
        'project/standards',
      ],
    },
    {
      type: 'category',
      label: 'Knowledge Base',
      items: [
        'knowledge/getting-started',
        'knowledge/trading-concepts',
        'knowledge/strategy-building',
        'knowledge/risk-management',
        'knowledge/performance-analysis',
        'knowledge/faq',
        'knowledge/glossary',
      ],
    },
    {
      type: 'category',
      label: 'Development Workflow',
      items: [
        'workflow/development-setup',
        'workflow/git-workflow',
        'workflow/code-review',
        'workflow/testing-strategy',
        'workflow/ci-cd-pipeline',
        'workflow/quality-assurance',
        'workflow/performance-optimization',
        'workflow/security-practices',
        'workflow/team-collaboration',
        'workflow/documentation-standards',
        'workflow/version-control',
        'workflow/development-environment',
      ],
    },
  ],

  // API reference sidebar
  apiSidebar: [
    'api/overview',
    {
      type: 'category',
      label: 'Authentication',
      items: [
        'api/auth/login',
        'api/auth/logout',
        'api/auth/refresh',
        'api/auth/register',
      ],
    },
    {
      type: 'category',
      label: 'User Management',
      items: [
        'api/users/profile',
        'api/users/accounts',
        'api/users/settings',
        'api/users/preferences',
      ],
    },
    {
      type: 'category',
      label: 'Trading',
      items: [
        'api/trading/positions',
        'api/trading/orders',
        'api/trading/automations',
        'api/trading/simulations',
      ],
    },
    {
      type: 'category',
      label: 'Margin Guard',
      items: [
        'api/margin-guard/configuration',
        'api/margin-guard/execution',
        'api/margin-guard/monitoring',
        'api/margin-guard/analytics',
      ],
    },
    {
      type: 'category',
      label: 'Administration',
      items: [
        'api/admin/users',
        'api/admin/plans',
        'api/admin/coupons',
        'api/admin/analytics',
      ],
    },
  ],

  // Guides sidebar
  guidesSidebar: [
    'guides/overview',
    {
      type: 'category',
      label: 'Quick Start',
      items: [
        'guides/quick-start/setup',
        'guides/quick-start/first-automation',
        'guides/quick-start/margin-guard',
        'guides/quick-start/dashboard',
      ],
    },
    {
      type: 'category',
      label: 'Trading Guides',
      items: [
        'guides/trading/position-management',
        'guides/trading/automation-strategies',
        'guides/trading/risk-management',
        'guides/trading/performance-analysis',
      ],
    },
    {
      type: 'category',
      label: 'Advanced Topics',
      items: [
        'guides/advanced/custom-automations',
        'guides/advanced/api-integration',
        'guides/advanced/performance-optimization',
        'guides/advanced/security-best-practices',
      ],
    },
    {
      type: 'category',
      label: 'Troubleshooting',
      items: [
        'guides/troubleshooting/common-issues',
        'guides/troubleshooting/debugging',
        'guides/troubleshooting/performance',
        'guides/troubleshooting/security',
      ],
    },
  ],
};

module.exports = sidebars;
