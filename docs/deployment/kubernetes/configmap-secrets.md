---
title: Kubernetes ConfigMap and Secrets
category: deployment
subcategory: kubernetes
tags: [kubernetes, configmap, secrets, configuration, security]
priority: high
status: active
last_updated: 2025-01-06
version: "2.0"
authors: ["Axisor Team"]
reviewers: ["DevOps Team"]
---

# Kubernetes ConfigMap and Secrets

## Summary

Comprehensive guide for managing configuration and secrets in Kubernetes for the Axisor platform. This document covers ConfigMap creation, secret management, environment variables, and security best practices.

## Configuration Architecture

```mermaid
graph TB
    A[Kubernetes Cluster] --> B[ConfigMap]
    A --> C[Secrets]
    
    B --> D[Backend Pod]
    B --> E[Frontend Pod]
    C --> D
    C --> E
    
    F[Environment Variables] --> D
    F --> E
    
    G[Volume Mounts] --> D
    G --> E
```

## ConfigMap Configuration

### Basic ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: axisor-config
  namespace: axisor
data:
  NODE_ENV: "production"
  PORT: "3010"
  LOG_LEVEL: "info"
  RATE_LIMIT_MAX: "100"
  CORS_ORIGIN: "https://app.axisor.com"
  PROMETHEUS_PORT: "9090"
  JWT_EXPIRES_IN: "24h"
  LN_MARKETS_API_URL: "https://api.lnmarkets.com"
  LN_MARKETS_TESTNET_API_URL: "https://api.testnet.lnmarkets.com"
```

### ConfigMap with Files

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: axisor-config-files
  namespace: axisor
data:
  nginx.conf: |
    server {
        listen 80;
        server_name localhost;
        location / {
            proxy_pass http://backend:3010;
        }
    }
  app-config.json: |
    {
      "database": {
        "host": "postgres",
        "port": 5432,
        "database": "axisor"
      },
      "redis": {
        "host": "redis",
        "port": 6379
      }
    }
```

## Secrets Configuration

### Basic Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: axisor-secrets
  namespace: axisor
type: Opaque
data:
  DATABASE_URL: cG9zdGdyZXM6Ly9wb3N0Z3JlczoxMjM0NTZAYXhpc29yLWRiOjU0MzIvYXhpc29y
  REDIS_URL: cmVkaXM6Ly9yZWRpczoxMjM0NTZAYXhpc29yLXJlZGlzOjYzNzk=
  JWT_SECRET: eW91ci1qd3Qtc2VjcmV0LWhlcmU=
  LN_MARKETS_API_KEY: eW91ci1hcGkta2V5LWhlcmU=
  LN_MARKETS_API_SECRET: eW91ci1hcGktc2VjcmV0LWhlcmU=
```

### Secret with StringData

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: axisor-secrets-string
  namespace: axisor
type: Opaque
stringData:
  DATABASE_URL: "postgres://postgres:123456@axisor-db:5432/axisor"
  REDIS_URL: "redis://redis:123456@axisor-redis:6379"
  JWT_SECRET: "your-jwt-secret-here"
  LN_MARKETS_API_KEY: "your-api-key-here"
  LN_MARKETS_API_SECRET: "your-api-secret-here"
```

## Environment Variables

### ConfigMap as Environment Variables

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: axisor-backend
  namespace: axisor
spec:
  template:
    spec:
      containers:
      - name: backend
        image: axisor/backend:latest
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: axisor-config
              key: NODE_ENV
        - name: PORT
          valueFrom:
            configMapKeyRef:
              name: axisor-config
              key: PORT
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: axisor-config
              key: LOG_LEVEL
```

### Secrets as Environment Variables

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: axisor-backend
  namespace: axisor
spec:
  template:
    spec:
      containers:
      - name: backend
        image: axisor/backend:latest
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: axisor-secrets
              key: DATABASE_URL
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: axisor-secrets
              key: JWT_SECRET
        - name: LN_MARKETS_API_KEY
          valueFrom:
            secretKeyRef:
              name: axisor-secrets
              key: LN_MARKETS_API_KEY
```

### All ConfigMap/Secret as Environment Variables

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: axisor-backend
  namespace: axisor
spec:
  template:
    spec:
      containers:
      - name: backend
        image: axisor/backend:latest
        envFrom:
        - configMapRef:
            name: axisor-config
        - secretRef:
            name: axisor-secrets
```

## Volume Mounts

### ConfigMap as Volume

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: axisor-backend
  namespace: axisor
spec:
  template:
    spec:
      containers:
      - name: backend
        image: axisor/backend:latest
        volumeMounts:
        - name: config-volume
          mountPath: /etc/config
          readOnly: true
      volumes:
      - name: config-volume
        configMap:
          name: axisor-config-files
```

### Secret as Volume

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: axisor-backend
  namespace: axisor
spec:
  template:
    spec:
      containers:
      - name: backend
        image: axisor/backend:latest
        volumeMounts:
        - name: secret-volume
          mountPath: /etc/secrets
          readOnly: true
      volumes:
      - name: secret-volume
        secret:
          secretName: axisor-secrets
```

## Security Best Practices

### Secret Encryption

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: axisor-secrets-encrypted
  namespace: axisor
  annotations:
    kubernetes.io/encryption-provider-config: "encryption-provider-config.yaml"
type: Opaque
data:
  DATABASE_URL: cG9zdGdyZXM6Ly9wb3N0Z3JlczoxMjM0NTZAYXhpc29yLWRiOjU0MzIvYXhpc29y
```

### RBAC for Secrets

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: axisor-secret-reader
  namespace: axisor
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: axisor-secret-reader-binding
  namespace: axisor
subjects:
- kind: ServiceAccount
  name: axisor-backend
  namespace: axisor
roleRef:
  kind: Role
  name: axisor-secret-reader
  apiGroup: rbac.authorization.k8s.io
```

## How to Use This Document

- **For Configuration**: Use the ConfigMap examples for non-sensitive configuration
- **For Secrets**: Use the secret examples for sensitive data management
- **For Environment**: Use the environment variable examples for container configuration
- **For Security**: Use the security best practices for production deployments
