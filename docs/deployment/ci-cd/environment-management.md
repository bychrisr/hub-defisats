---
title: Environment Management
category: deployment
subcategory: ci-cd
tags: [environments, staging, production, configuration, secrets]
priority: medium
status: active
last_updated: 2025-01-06
version: "2.0"
authors: ["Axisor Team"]
reviewers: ["DevOps Team"]
---

# Environment Management

## Summary

Comprehensive guide for managing multiple environments in the Axisor platform. This document covers environment configuration, secrets management, promotion workflows, and environment-specific settings.

## Environment Architecture

```mermaid
graph TB
    A[Development] --> B[Testing]
    B --> C[Staging]
    C --> D[Production]
    
    E[Feature Branch] --> A
    F[Pull Request] --> B
    G[Release Branch] --> C
    H[Main Branch] --> D
    
    I[Environment Config] --> A
    I --> B
    I --> C
    I --> D
    
    J[Secrets] --> A
    J --> B
    J --> C
    J --> D
```

## Environment Configuration

### Development Environment

```yaml
# k8s/development/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: axisor-config
  namespace: axisor-dev
data:
  NODE_ENV: "development"
  PORT: "3010"
  LOG_LEVEL: "debug"
  RATE_LIMIT_MAX: "1000"
  CORS_ORIGIN: "http://localhost:3000"
  PROMETHEUS_PORT: "9090"
  JWT_EXPIRES_IN: "24h"
  LN_MARKETS_API_URL: "https://api.testnet.lnmarkets.com"
  LN_MARKETS_TESTNET_API_URL: "https://api.testnet.lnmarkets.com"
  DATABASE_URL: "postgresql://postgres:postgres@axisor-db-dev:5432/axisor_dev"
  REDIS_URL: "redis://axisor-redis-dev:6379"
```

### Staging Environment

```yaml
# k8s/staging/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: axisor-config
  namespace: axisor-staging
data:
  NODE_ENV: "staging"
  PORT: "3010"
  LOG_LEVEL: "info"
  RATE_LIMIT_MAX: "500"
  CORS_ORIGIN: "https://staging.axisor.com"
  PROMETHEUS_PORT: "9090"
  JWT_EXPIRES_IN: "12h"
  LN_MARKETS_API_URL: "https://api.testnet.lnmarkets.com"
  LN_MARKETS_TESTNET_API_URL: "https://api.testnet.lnmarkets.com"
  DATABASE_URL: "postgresql://postgres:staging_password@axisor-db-staging:5432/axisor_staging"
  REDIS_URL: "redis://axisor-redis-staging:6379"
```

### Production Environment

```yaml
# k8s/production/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: axisor-config
  namespace: axisor
data:
  NODE_ENV: "production"
  PORT: "3010"
  LOG_LEVEL: "warn"
  RATE_LIMIT_MAX: "100"
  CORS_ORIGIN: "https://app.axisor.com"
  PROMETHEUS_PORT: "9090"
  JWT_EXPIRES_IN: "8h"
  LN_MARKETS_API_URL: "https://api.lnmarkets.com"
  LN_MARKETS_TESTNET_API_URL: "https://api.testnet.lnmarkets.com"
```

## Secrets Management

### Development Secrets

```yaml
# k8s/development/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: axisor-secrets
  namespace: axisor-dev
type: Opaque
data:
  DATABASE_PASSWORD: cG9zdGdyZXM=
  JWT_SECRET: ZGV2LWp3dC1zZWNyZXQ=
  LN_MARKETS_API_KEY: ZGV2LWFwaS1rZXk=
  LN_MARKETS_API_SECRET: ZGV2LWFwaS1zZWNyZXQ=
  REDIS_PASSWORD: ZGV2LXJlZGlzLXBhc3N3b3Jk
```

### Staging Secrets

```yaml
# k8s/staging/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: axisor-secrets
  namespace: axisor-staging
type: Opaque
data:
  DATABASE_PASSWORD: c3RhZ2luZy1wYXNzd29yZA==
  JWT_SECRET: c3RhZ2luZy1qd3Qtc2VjcmV0
  LN_MARKETS_API_KEY: c3RhZ2luZy1hcGkta2V5
  LN_MARKETS_API_SECRET: c3RhZ2luZy1hcGktc2VjcmV0
  REDIS_PASSWORD: c3RhZ2luZy1yZWRpcy1wYXNzd29yZA==
```

### Production Secrets

```yaml
# k8s/production/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: axisor-secrets
  namespace: axisor
type: Opaque
data:
  DATABASE_PASSWORD: cHJvZC1wYXNzd29yZA==
  JWT_SECRET: cHJvZC1qd3Qtc2VjcmV0
  LN_MARKETS_API_KEY: cHJvZC1hcGkta2V5
  LN_MARKETS_API_SECRET: cHJvZC1hcGktc2VjcmV0
  REDIS_PASSWORD: cHJvZC1yZWRpcy1wYXNzd29yZA==
```

## Environment Promotion Workflow

### Promotion Pipeline

```yaml
# .github/workflows/promote.yml
name: Environment Promotion

on:
  workflow_dispatch:
    inputs:
      from_environment:
        description: 'Source environment'
        required: true
        type: choice
        options:
        - development
        - staging
      to_environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
        - staging
        - production
      version:
        description: 'Version to promote'
        required: true
        type: string

jobs:
  promote:
    name: Promote Environment
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.to_environment }}

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Validate promotion
      run: |
        # Check if promotion is valid
        if [ "${{ github.event.inputs.from_environment }}" = "production" ] && [ "${{ github.event.inputs.to_environment }}" = "staging" ]; then
          echo "Cannot promote from production to staging"
          exit 1
        fi

    - name: Configure kubectl
      uses: azure/k8s-set-context@v3
      with:
        method: kubeconfig
        kubeconfig: ${{ secrets[format('KUBE_CONFIG_{0}', upper(github.event.inputs.to_environment))] }}

    - name: Update image tags
      run: |
        # Update deployment images
        kubectl set image deployment/axisor-backend backend=axisor/backend:${{ github.event.inputs.version }} -n axisor-${{ github.event.inputs.to_environment }}
        kubectl set image deployment/axisor-frontend frontend=axisor/frontend:${{ github.event.inputs.version }} -n axisor-${{ github.event.inputs.to_environment }}

    - name: Wait for rollout
      run: |
        kubectl rollout status deployment/axisor-backend -n axisor-${{ github.event.inputs.to_environment }} --timeout=600s
        kubectl rollout status deployment/axisor-frontend -n axisor-${{ github.event.inputs.to_environment }} --timeout=600s

    - name: Run health checks
      run: |
        kubectl wait --for=condition=available deployment/axisor-backend -n axisor-${{ github.event.inputs.to_environment }} --timeout=300s
        kubectl wait --for=condition=available deployment/axisor-frontend -n axisor-${{ github.event.inputs.to_environment }} --timeout=300s

    - name: Notify team
      uses: 8398a7/action-slack@v3
      with:
        status: success
        text: "Successfully promoted version ${{ github.event.inputs.version }} from ${{ github.event.inputs.from_environment }} to ${{ github.event.inputs.to_environment }}"
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Environment-Specific Resources

### Development Resources

```yaml
# k8s/development/resources.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: axisor-dev-quota
  namespace: axisor-dev
spec:
  hard:
    requests.cpu: "2"
    requests.memory: "4Gi"
    limits.cpu: "4"
    limits.memory: "8Gi"
    persistentvolumeclaims: "4"
    pods: "10"
    services: "5"
---
apiVersion: v1
kind: LimitRange
metadata:
  name: axisor-dev-limits
  namespace: axisor-dev
spec:
  limits:
  - default:
      cpu: "500m"
      memory: "512Mi"
    defaultRequest:
      cpu: "100m"
      memory: "128Mi"
    type: Container
```

### Staging Resources

```yaml
# k8s/staging/resources.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: axisor-staging-quota
  namespace: axisor-staging
spec:
  hard:
    requests.cpu: "4"
    requests.memory: "8Gi"
    limits.cpu: "8"
    limits.memory: "16Gi"
    persistentvolumeclaims: "8"
    pods: "20"
    services: "10"
---
apiVersion: v1
kind: LimitRange
metadata:
  name: axisor-staging-limits
  namespace: axisor-staging
spec:
  limits:
  - default:
      cpu: "1"
      memory: "1Gi"
    defaultRequest:
      cpu: "250m"
      memory: "256Mi"
    type: Container
```

### Production Resources

```yaml
# k8s/production/resources.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: axisor-prod-quota
  namespace: axisor
spec:
  hard:
    requests.cpu: "16"
    requests.memory: "32Gi"
    limits.cpu: "32"
    limits.memory: "64Gi"
    persistentvolumeclaims: "20"
    pods: "50"
    services: "25"
---
apiVersion: v1
kind: LimitRange
metadata:
  name: axisor-prod-limits
  namespace: axisor
spec:
  limits:
  - default:
      cpu: "2"
      memory: "2Gi"
    defaultRequest:
      cpu: "500m"
      memory: "512Mi"
    type: Container
```

## Environment Monitoring

### Environment-Specific Monitoring

```yaml
# k8s/development/monitoring.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: axisor-dev-monitor
  namespace: monitoring
  labels:
    environment: development
spec:
  selector:
    matchLabels:
      app: axisor-backend
  endpoints:
  - port: metrics
    path: /metrics
    interval: 30s
---
# k8s/staging/monitoring.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: axisor-staging-monitor
  namespace: monitoring
  labels:
    environment: staging
spec:
  selector:
    matchLabels:
      app: axisor-backend
  endpoints:
  - port: metrics
    path: /metrics
    interval: 15s
---
# k8s/production/monitoring.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: axisor-prod-monitor
  namespace: monitoring
  labels:
    environment: production
spec:
  selector:
    matchLabels:
      app: axisor-backend
  endpoints:
  - port: metrics
    path: /metrics
    interval: 10s
```

## Environment Backup

### Environment-Specific Backup

```yaml
# k8s/development/backup.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: dev-backup
  namespace: axisor-dev
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15
            command:
            - /bin/bash
            - -c
            - |
              pg_dump -h axisor-db-dev -U postgres axisor_dev | gzip > /backup/dev-$(date +%Y%m%d-%H%M%S).sql.gz
              aws s3 cp /backup/dev-$(date +%Y%m%d-%H%M%S).sql.gz s3://axisor-backups/development/
---
# k8s/staging/backup.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: staging-backup
  namespace: axisor-staging
spec:
  schedule: "0 3 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15
            command:
            - /bin/bash
            - -c
            - |
              pg_dump -h axisor-db-staging -U postgres axisor_staging | gzip > /backup/staging-$(date +%Y%m%d-%H%M%S).sql.gz
              aws s3 cp /backup/staging-$(date +%Y%m%d-%H%M%S).sql.gz s3://axisor-backups/staging/
---
# k8s/production/backup.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: prod-backup
  namespace: axisor
spec:
  schedule: "0 1 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15
            command:
            - /bin/bash
            - -c
            - |
              pg_dump -h axisor-db -U postgres axisor | gzip > /backup/prod-$(date +%Y%m%d-%H%M%S).sql.gz
              aws s3 cp /backup/prod-$(date +%Y%m%d-%H%M%S).sql.gz s3://axisor-backups/production/
```

## Environment Management Scripts

### Environment Setup Script

```bash
#!/bin/bash
# Environment setup script

ENVIRONMENT=${1:-"development"}
ACTION=${2:-"create"}

echo "Managing environment: $ENVIRONMENT"

case $ACTION in
  "create")
    echo "Creating environment: $ENVIRONMENT"
    
    # Create namespace
    kubectl create namespace axisor-$ENVIRONMENT
    
    # Apply environment-specific resources
    kubectl apply -f k8s/$ENVIRONMENT/ -n axisor-$ENVIRONMENT
    
    # Wait for deployments
    kubectl wait --for=condition=available deployment/axisor-backend -n axisor-$ENVIRONMENT --timeout=300s
    kubectl wait --for=condition=available deployment/axisor-frontend -n axisor-$ENVIRONMENT --timeout=300s
    
    echo "Environment $ENVIRONMENT created successfully"
    ;;
  "delete")
    echo "Deleting environment: $ENVIRONMENT"
    
    # Delete all resources
    kubectl delete namespace axisor-$ENVIRONMENT
    
    echo "Environment $ENVIRONMENT deleted successfully"
    ;;
  "status")
    echo "Environment status: $ENVIRONMENT"
    
    # Show environment status
    kubectl get all -n axisor-$ENVIRONMENT
    kubectl get secrets,configmaps -n axisor-$ENVIRONMENT
    ;;
  *)
    echo "Unknown action: $ACTION"
    echo "Usage: $0 <environment> <action>"
    echo "Actions: create, delete, status"
    exit 1
    ;;
esac
```

### Environment Validation Script

```bash
#!/bin/bash
# Environment validation script

ENVIRONMENT=${1:-"development"}

echo "Validating environment: $ENVIRONMENT"

# Check namespace exists
if ! kubectl get namespace axisor-$ENVIRONMENT > /dev/null 2>&1; then
  echo "❌ Namespace axisor-$ENVIRONMENT does not exist"
  exit 1
fi

# Check deployments
if ! kubectl get deployment axisor-backend -n axisor-$ENVIRONMENT > /dev/null 2>&1; then
  echo "❌ Backend deployment not found"
  exit 1
fi

if ! kubectl get deployment axisor-frontend -n axisor-$ENVIRONMENT > /dev/null 2>&1; then
  echo "❌ Frontend deployment not found"
  exit 1
fi

# Check services
if ! kubectl get service axisor-backend -n axisor-$ENVIRONMENT > /dev/null 2>&1; then
  echo "❌ Backend service not found"
  exit 1
fi

# Check secrets
if ! kubectl get secret axisor-secrets -n axisor-$ENVIRONMENT > /dev/null 2>&1; then
  echo "❌ Secrets not found"
  exit 1
fi

# Check configmaps
if ! kubectl get configmap axisor-config -n axisor-$ENVIRONMENT > /dev/null 2>&1; then
  echo "❌ ConfigMap not found"
  exit 1
fi

# Check pod health
kubectl get pods -n axisor-$ENVIRONMENT -o wide

echo "✅ Environment $ENVIRONMENT validation completed successfully"
```

## How to Use This Document

- **For Setup**: Use the environment configuration files for initial setup
- **For Secrets**: Use the secrets management for secure configuration
- **For Promotion**: Use the promotion workflow for environment upgrades
- **For Monitoring**: Use the monitoring configurations for environment-specific observability
- **For Backup**: Use the backup configurations for data protection
