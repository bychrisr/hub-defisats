# Git Workflow

## Overview

This document outlines the Git workflow and branching strategy for the Axisor project. It covers branch management, commit conventions, code review processes, and release procedures to ensure consistent and efficient development practices.

## Branching Strategy

### Branch Types

#### Main Branches
```typescript
// Main Branch Structure
interface BranchStructure {
  main: {
    description: "Production-ready code";
    protection: "Protected branch with required reviews";
    deployment: "Automatically deployed to production";
    stability: "Always stable and deployable";
  };
  develop: {
    description: "Integration branch for features";
    protection: "Protected branch with required reviews";
    deployment: "Automatically deployed to staging";
    stability: "Integration testing branch";
  };
}
```

#### Feature Branches
```typescript
// Feature Branch Naming
interface FeatureBranches {
  naming: {
    pattern: "feature/description-of-feature";
    examples: [
      "feature/user-authentication",
      "feature/margin-guard-system",
      "feature/trading-automation",
      "feature/performance-optimization"
    ];
  };
  lifecycle: {
    creation: "Created from develop branch";
    development: "Developed independently";
    integration: "Merged into develop";
    cleanup: "Deleted after merge";
  };
}
```

#### Release Branches
```typescript
// Release Branch Structure
interface ReleaseBranches {
  naming: {
    pattern: "release/version-number";
    examples: [
      "release/v1.0.0",
      "release/v1.1.0",
      "release/v2.0.0"
    ];
  };
  purpose: {
    preparation: "Prepare for release";
    bugfixes: "Bug fixes for release";
    documentation: "Update release documentation";
    testing: "Final testing before release";
  };
}
```

#### Hotfix Branches
```typescript
// Hotfix Branch Structure
interface HotfixBranches {
  naming: {
    pattern: "hotfix/description-of-fix";
    examples: [
      "hotfix/critical-security-patch",
      "hotfix/database-connection-fix",
      "hotfix/authentication-bug"
    ];
  };
  purpose: {
    urgency: "Critical fixes for production";
    source: "Created from main branch";
    target: "Merged into both main and develop";
  };
}
```

### Branch Protection Rules

#### Main Branch Protection
```yaml
# GitHub Branch Protection Rules
main:
  required_status_checks:
    strict: true
    contexts:
      - "ci/backend-tests"
      - "ci/frontend-tests"
      - "ci/security-scan"
      - "ci/performance-tests"
  enforce_admins: true
  required_pull_request_reviews:
    required_approving_review_count: 2
    dismiss_stale_reviews: true
    require_code_owner_reviews: true
  restrictions:
    users: []
    teams: ["core-developers"]
```

#### Develop Branch Protection
```yaml
# Develop Branch Protection
develop:
  required_status_checks:
    strict: true
    contexts:
      - "ci/backend-tests"
      - "ci/frontend-tests"
  enforce_admins: false
  required_pull_request_reviews:
    required_approving_review_count: 1
    dismiss_stale_reviews: true
  restrictions:
    users: []
    teams: ["developers"]
```

## Commit Conventions

### Conventional Commits

#### Commit Message Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Commit Types
```typescript
// Commit Types
interface CommitTypes {
  feat: {
    description: "A new feature";
    example: "feat(auth): add two-factor authentication";
    breaking: "May include BREAKING CHANGE:";
  };
  fix: {
    description: "A bug fix";
    example: "fix(api): resolve authentication timeout";
    breaking: "May include BREAKING CHANGE:";
  };
  docs: {
    description: "Documentation only changes";
    example: "docs(readme): update installation guide";
    breaking: "Never includes breaking changes";
  };
  style: {
    description: "Changes that do not affect code meaning";
    example: "style(components): format code with prettier";
    breaking: "Never includes breaking changes";
  };
  refactor: {
    description: "Code change that neither fixes bug nor adds feature";
    example: "refactor(services): extract common validation logic";
    breaking: "May include BREAKING CHANGE:";
  };
  perf: {
    description: "Performance improvement";
    example: "perf(database): optimize query performance";
    breaking: "May include BREAKING CHANGE:";
  };
  test: {
    description: "Adding missing tests or correcting existing tests";
    example: "test(api): add integration tests for user endpoints";
    breaking: "Never includes breaking changes";
  };
  build: {
    description: "Changes that affect build system or dependencies";
    example: "build(deps): update axios to v1.0.0";
    breaking: "May include BREAKING CHANGE:";
  };
  ci: {
    description: "Changes to CI configuration files and scripts";
    example: "ci(github): add automated security scanning";
    breaking: "Never includes breaking changes";
  };
  chore: {
    description: "Other changes that don't modify src or test files";
    example: "chore(release): bump version to 1.0.0";
    breaking: "May include BREAKING CHANGE:";
  };
}
```

#### Scope Guidelines
```typescript
// Scope Guidelines
interface ScopeGuidelines {
  backend: {
    controllers: "API controllers";
    services: "Business logic services";
    middleware: "Express middleware";
    routes: "API routes";
    models: "Database models";
    utils: "Utility functions";
  };
  frontend: {
    components: "React components";
    pages: "Application pages";
    hooks: "Custom React hooks";
    services: "API client services";
    utils: "Utility functions";
  };
  infrastructure: {
    docker: "Docker configuration";
    k8s: "Kubernetes manifests";
    nginx: "Nginx configuration";
    monitoring: "Monitoring setup";
  };
}
```

### Commit Examples

#### Good Commits
```bash
# Feature commits
feat(auth): add JWT token refresh mechanism
feat(trading): implement margin guard automation
feat(api): add rate limiting middleware

# Bug fix commits
fix(api): resolve database connection timeout
fix(frontend): handle null values in chart data
fix(security): patch XSS vulnerability in user input

# Documentation commits
docs(api): add authentication endpoint documentation
docs(deployment): update Docker setup instructions
docs(readme): add development setup guide

# Refactoring commits
refactor(services): extract common error handling
refactor(components): simplify chart rendering logic
refactor(database): optimize query performance

# Performance commits
perf(api): optimize database queries
perf(frontend): implement lazy loading for charts
perf(cache): improve Redis cache strategy
```

#### Bad Commits
```bash
# Avoid these patterns
"fix stuff"                    # Too vague
"update"                       # No context
"WIP"                          # Work in progress
"asdf"                         # Meaningless
"commit"                       # No description
"test"                         # Too generic
```

## Pull Request Process

### Pull Request Template

#### PR Template
```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or breaking changes documented)
- [ ] Tests added/updated
- [ ] All CI checks pass

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Related Issues
Closes #(issue number)
```

### Review Process

#### Review Guidelines
```typescript
// Code Review Guidelines
interface ReviewGuidelines {
  functionality: {
    correctness: "Does the code work as intended?";
    edge_cases: "Are edge cases handled properly?";
    error_handling: "Is error handling appropriate?";
    performance: "Are there any performance concerns?";
  };
  code_quality: {
    readability: "Is the code easy to read and understand?";
    maintainability: "Is the code easy to maintain?";
    reusability: "Can the code be reused?";
    consistency: "Is the code consistent with project standards?";
  };
  security: {
    vulnerabilities: "Are there any security vulnerabilities?";
    data_protection: "Is sensitive data protected?";
    authentication: "Is authentication handled correctly?";
    authorization: "Is authorization implemented properly?";
  };
}
```

#### Review Checklist
- [ ] **Functionality**: Code works as intended
- [ ] **Testing**: Adequate test coverage
- [ ] **Documentation**: Code is well documented
- [ ] **Performance**: No performance regressions
- [ ] **Security**: No security vulnerabilities
- [ ] **Style**: Follows coding standards
- [ ] **Dependencies**: No unnecessary dependencies
- [ ] **Breaking Changes**: Documented if applicable

### Merge Strategies

#### Merge Types
```typescript
// Merge Strategies
interface MergeStrategies {
  merge_commit: {
    description: "Creates a merge commit";
    use_case: "Feature branches";
    advantages: "Preserves branch history";
    disadvantages: "Creates merge commits";
  };
  squash_merge: {
    description: "Squashes all commits into one";
    use_case: "Feature branches";
    advantages: "Clean history";
    disadvantages: "Loses individual commit history";
  };
  rebase_merge: {
    description: "Rebases commits onto target branch";
    use_case: "Hotfix branches";
    advantages: "Linear history";
    disadvantages: "Rewrites commit history";
  };
}
```

## Release Process

### Release Workflow

#### Release Preparation
```bash
# Create release branch
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0

# Update version numbers
npm version patch  # or minor, major
git push origin release/v1.0.0
```

#### Release Checklist
- [ ] **Version Bump**: Update version in package.json
- [ ] **Changelog**: Update CHANGELOG.md
- [ ] **Documentation**: Update documentation
- [ ] **Testing**: Run full test suite
- [ ] **Security**: Run security scans
- [ ] **Performance**: Run performance tests
- [ ] **Dependencies**: Update dependencies
- [ ] **Migration**: Create database migrations if needed

#### Release Process
```bash
# 1. Create release branch
git checkout -b release/v1.0.0

# 2. Update version and changelog
npm version patch
# Edit CHANGELOG.md

# 3. Create pull request
git push origin release/v1.0.0
# Create PR: release/v1.0.0 -> main

# 4. After approval, merge to main
git checkout main
git merge release/v1.0.0
git tag v1.0.0
git push origin main --tags

# 5. Merge back to develop
git checkout develop
git merge main
git push origin develop

# 6. Clean up
git branch -d release/v1.0.0
git push origin --delete release/v1.0.0
```

### Hotfix Process

#### Hotfix Workflow
```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-patch

# 2. Make necessary changes
# Fix the critical issue

# 3. Update version and changelog
npm version patch
# Edit CHANGELOG.md

# 4. Create pull request
git push origin hotfix/critical-security-patch
# Create PR: hotfix/critical-security-patch -> main

# 5. After approval, merge to main
git checkout main
git merge hotfix/critical-security-patch
git tag v1.0.1
git push origin main --tags

# 6. Merge back to develop
git checkout develop
git merge main
git push origin develop

# 7. Clean up
git branch -d hotfix/critical-security-patch
git push origin --delete hotfix/critical-security-patch
```

## Git Hooks

### Pre-commit Hooks

#### Husky Configuration
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS",
      "pre-push": "npm run test"
    }
  }
}
```

#### Lint-staged Configuration
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ],
    "*.{json,md}": [
      "prettier --write",
      "git add"
    ]
  }
}
```

#### Commitlint Configuration
```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert'
      ]
    ],
    'scope-case': [2, 'always', 'kebab-case'],
    'subject-case': [2, 'always', 'sentence-case'],
    'subject-max-length': [2, 'always', 50],
    'body-max-line-length': [2, 'always', 72]
  }
};
```

## Best Practices

### Development Best Practices

#### Branch Management
- **Short-lived Branches**: Keep feature branches short-lived
- **Regular Updates**: Regularly update from main/develop
- **Clean History**: Keep commit history clean and meaningful
- **Descriptive Names**: Use descriptive branch names

#### Commit Best Practices
- **Atomic Commits**: Make small, focused commits
- **Descriptive Messages**: Write clear commit messages
- **Conventional Format**: Follow conventional commit format
- **No WIP Commits**: Avoid work-in-progress commits

#### Code Review Best Practices
- **Timely Reviews**: Review code promptly
- **Constructive Feedback**: Provide constructive feedback
- **Test Coverage**: Ensure adequate test coverage
- **Security Review**: Always consider security implications

### Team Collaboration

#### Communication
- **Clear PR Descriptions**: Write clear pull request descriptions
- **Link Issues**: Link related issues in PRs
- **Ask Questions**: Don't hesitate to ask questions
- **Share Knowledge**: Share knowledge and best practices

#### Conflict Resolution
- **Rebase Strategy**: Use rebase to resolve conflicts
- **Communication**: Communicate about conflicts
- **Test After Resolution**: Test after resolving conflicts
- **Document Changes**: Document conflict resolution

## Conclusion

This Git workflow provides a structured approach to development that ensures code quality, collaboration, and project stability. By following these guidelines, the team can maintain a clean, organized codebase while enabling efficient collaboration.

Key principles:
- **Consistent Branching**: Use consistent branching strategy
- **Quality Commits**: Write meaningful commit messages
- **Thorough Reviews**: Conduct thorough code reviews
- **Safe Releases**: Follow safe release procedures
- **Continuous Improvement**: Continuously improve the workflow

Remember that Git workflow is a living process that should evolve with the team's needs and project requirements.
