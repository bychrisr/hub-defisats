---
title: GitHub Actions CI/CD
category: deployment
subcategory: ci-cd
tags: [github-actions, cicd, automation, deployment, testing]
priority: high
status: active
last_updated: 2025-01-06
version: "2.0"
authors: ["Axisor Team"]
reviewers: ["DevOps Team"]
---

# GitHub Actions CI/CD

## Summary

Comprehensive guide for implementing CI/CD with GitHub Actions for the Axisor platform. This document covers automated testing, building, deployment, and release management workflows.

## CI/CD Architecture

```mermaid
graph TB
    A[Code Push] --> B[GitHub Actions]
    B --> C[Test Stage]
    B --> D[Build Stage]
    B --> E[Deploy Stage]
    
    C --> F[Unit Tests]
    C --> G[Integration Tests]
    C --> H[E2E Tests]
    
    D --> I[Docker Build]
    D --> J[Security Scan]
    D --> K[Push to Registry]
    
    E --> L[Staging Deploy]
    E --> M[Production Deploy]
    E --> N[Release Creation]
```

## Main CI/CD Workflow

### .github/workflows/main.yml

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: axisor

jobs:
  test:
    name: Test Suite
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: axisor_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        cache-dependency-path: |
          backend/package-lock.json
          frontend/package-lock.json

    - name: Install backend dependencies
      run: |
        cd backend
        npm ci

    - name: Install frontend dependencies
      run: |
        cd frontend
        npm ci

    - name: Run backend tests
      run: |
        cd backend
        npm test
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/axisor_test
        REDIS_URL: redis://localhost:6379
        NODE_ENV: test

    - name: Run frontend tests
      run: |
        cd frontend
        npm test -- --coverage

    - name: Run E2E tests
      run: |
        cd frontend
        npm run test:e2e

    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        files: ./backend/coverage/lcov.info,./frontend/coverage/lcov.info

  build:
    name: Build Images
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push'

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ github.repository }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
          type=raw,value=latest,enable={{is_default_branch}}

    - name: Build and push backend image
      uses: docker/build-push-action@v5
      with:
        context: ./backend
        file: ./backend/Dockerfile
        push: true
        tags: ${{ steps.meta.outputs.tags }}-backend
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

    - name: Build and push frontend image
      uses: docker/build-push-action@v5
      with:
        context: ./frontend
        file: ./frontend/Dockerfile
        push: true
        tags: ${{ steps.meta.outputs.tags }}-frontend
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  security:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'push'

    steps:
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: ${{ env.REGISTRY }}/${{ github.repository }}/${{ env.IMAGE_NAME }}-backend:${{ github.sha }}
        format: 'sarif'
        output: 'trivy-results.sarif'

    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [build, security]
    if: github.ref == 'refs/heads/develop'
    environment: staging

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Configure kubectl
      uses: azure/k8s-set-context@v3
      with:
        method: kubeconfig
        kubeconfig: ${{ secrets.KUBE_CONFIG_STAGING }}

    - name: Deploy to staging
      run: |
        # Update image tags in deployment files
        sed -i "s|image: .*|image: ${{ env.REGISTRY }}/${{ github.repository }}/${{ env.IMAGE_NAME }}-backend:${{ github.sha }}|g" k8s/backend-deployment.yaml
        sed -i "s|image: .*|image: ${{ env.REGISTRY }}/${{ github.repository }}/${{ env.IMAGE_NAME }}-frontend:${{ github.sha }}|g" k8s/frontend-deployment.yaml
        
        # Apply Kubernetes manifests
        kubectl apply -f k8s/ -n axisor-staging

    - name: Wait for deployment
      run: |
        kubectl rollout status deployment/axisor-backend -n axisor-staging --timeout=300s
        kubectl rollout status deployment/axisor-frontend -n axisor-staging --timeout=300s

    - name: Run smoke tests
      run: |
        # Wait for services to be ready
        kubectl wait --for=condition=available deployment/axisor-backend -n axisor-staging --timeout=300s
        
        # Run basic health checks
        kubectl port-forward svc/axisor-backend 3010:80 -n axisor-staging &
        sleep 10
        curl -f http://localhost:3010/health || exit 1

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [build, security]
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Configure kubectl
      uses: azure/k8s-set-context@v3
      with:
        method: kubeconfig
        kubeconfig: ${{ secrets.KUBE_CONFIG_PRODUCTION }}

    - name: Deploy to production
      run: |
        # Update image tags in deployment files
        sed -i "s|image: .*|image: ${{ env.REGISTRY }}/${{ github.repository }}/${{ env.IMAGE_NAME }}-backend:${{ github.sha }}|g" k8s/backend-deployment.yaml
        sed -i "s|image: .*|image: ${{ env.REGISTRY }}/${{ github.repository }}/${{ env.IMAGE_NAME }}-frontend:${{ github.sha }}|g" k8s/frontend-deployment.yaml
        
        # Apply Kubernetes manifests
        kubectl apply -f k8s/ -n axisor

    - name: Wait for deployment
      run: |
        kubectl rollout status deployment/axisor-backend -n axisor --timeout=600s
        kubectl rollout status deployment/axisor-frontend -n axisor --timeout=600s

    - name: Run production health checks
      run: |
        # Wait for services to be ready
        kubectl wait --for=condition=available deployment/axisor-backend -n axisor --timeout=600s
        
        # Run comprehensive health checks
        kubectl port-forward svc/axisor-backend 3010:80 -n axisor &
        sleep 15
        curl -f http://localhost:3010/health || exit 1
        curl -f http://localhost:3010/ready || exit 1

  release:
    name: Create Release
    runs-on: ubuntu-latest
    needs: deploy-production
    if: github.ref == 'refs/heads/main'

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Generate changelog
      id: changelog
      run: |
        # Generate changelog from git commits
        git log --pretty=format:"- %s" $(git describe --tags --abbrev=0)..HEAD > CHANGELOG.md
        echo "changelog<<EOF" >> $GITHUB_OUTPUT
        cat CHANGELOG.md >> $GITHUB_OUTPUT
        echo "EOF" >> $GITHUB_OUTPUT

    - name: Create Release
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: v${{ github.run_number }}
        release_name: Release v${{ github.run_number }}
        body: |
          ## Changes in this Release
          ${{ steps.changelog.outputs.changelog }}
          
          ## Docker Images
          - Backend: `${{ env.REGISTRY }}/${{ github.repository }}/${{ env.IMAGE_NAME }}-backend:${{ github.sha }}`
          - Frontend: `${{ env.REGISTRY }}/${{ github.repository }}/${{ env.IMAGE_NAME }}-frontend:${{ github.sha }}`
        draft: false
        prerelease: false
```

## Pull Request Workflow

### .github/workflows/pr.yml

```yaml
name: Pull Request Checks

on:
  pull_request:
    branches: [main, develop]

jobs:
  pr-checks:
    name: PR Validation
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: |
        cd backend && npm ci
        cd ../frontend && npm ci

    - name: Lint backend
      run: |
        cd backend
        npm run lint

    - name: Lint frontend
      run: |
        cd frontend
        npm run lint

    - name: Type check backend
      run: |
        cd backend
        npm run type-check

    - name: Type check frontend
      run: |
        cd frontend
        npm run type-check

    - name: Test backend
      run: |
        cd backend
        npm test -- --coverage

    - name: Test frontend
      run: |
        cd frontend
        npm test -- --coverage

    - name: Build check
      run: |
        cd backend && npm run build
        cd ../frontend && npm run build

    - name: Comment PR
      uses: actions/github-script@v7
      with:
        script: |
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: '✅ All PR checks passed successfully!'
          })
```

## Documentation Workflow

### .github/workflows/docs.yml

```yaml
name: Documentation

on:
  push:
    branches: [main]
    paths: ['docs/**']
  pull_request:
    branches: [main]
    paths: ['docs/**']

jobs:
  docs:
    name: Build and Deploy Docs
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install dependencies
      run: |
        npm install -g markdownlint-cli
        npm install -g @vuepress/cli

    - name: Lint documentation
      run: |
        markdownlint docs/**/*.md

    - name: Build documentation
      run: |
        npm run docs:build

    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      if: github.ref == 'refs/heads/main'
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./docs/.vuepress/dist
```

## Security Workflow

### .github/workflows/security.yml

```yaml
name: Security

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * 1' # Weekly

jobs:
  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'

    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'

    - name: Run CodeQL Analysis
      uses: github/codeql-action/analyze@v2
      with:
        languages: javascript, typescript

    - name: Run npm audit
      run: |
        cd backend && npm audit --audit-level=moderate
        cd ../frontend && npm audit --audit-level=moderate
```

## Rollback Workflow

### .github/workflows/rollback.yml

```yaml
name: Rollback

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to rollback'
        required: true
        default: 'staging'
        type: choice
        options:
        - staging
        - production
      deployment:
        description: 'Deployment to rollback'
        required: true
        default: 'backend'
        type: choice
        options:
        - backend
        - frontend
        - all

jobs:
  rollback:
    name: Rollback Deployment
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Configure kubectl
      uses: azure/k8s-set-context@v3
      with:
        method: kubeconfig
        kubeconfig: ${{ secrets[format('KUBE_CONFIG_{0}', upper(github.event.inputs.environment))] }}

    - name: Rollback deployment
      run: |
        if [ "${{ github.event.inputs.deployment }}" = "backend" ] || [ "${{ github.event.inputs.deployment }}" = "all" ]; then
          kubectl rollout undo deployment/axisor-backend -n axisor-${{ github.event.inputs.environment }}
          kubectl rollout status deployment/axisor-backend -n axisor-${{ github.event.inputs.environment }} --timeout=300s
        fi
        
        if [ "${{ github.event.inputs.deployment }}" = "frontend" ] || [ "${{ github.event.inputs.deployment }}" = "all" ]; then
          kubectl rollout undo deployment/axisor-frontend -n axisor-${{ github.event.inputs.environment }}
          kubectl rollout status deployment/axisor-frontend -n axisor-${{ github.event.inputs.environment }} --timeout=300s
        fi

    - name: Verify rollback
      run: |
        kubectl get pods -n axisor-${{ github.event.inputs.environment }}
        kubectl get deployments -n axisor-${{ github.event.inputs.environment }}
```

## How to Use This Document

- **For Setup**: Use the main CI/CD workflow for automated deployment
- **For PRs**: Use the PR workflow for code quality checks
- **For Docs**: Use the documentation workflow for automated docs deployment
- **For Security**: Use the security workflow for vulnerability scanning
- **For Rollback**: Use the rollback workflow for emergency deployments
