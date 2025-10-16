---
title: Deployment Issues and Solutions
category: troubleshooting
subcategory: deployment-issues
tags: [deployment, docker, kubernetes, nginx, infrastructure, troubleshooting]
priority: high
status: active
last_updated: 2025-01-06
version: "2.0"
authors: ["Axisor Team"]
reviewers: ["DevOps Team", "Backend Team"]
---

# Deployment Issues and Solutions

## Summary

Comprehensive guide to troubleshooting deployment issues in the Axisor platform. This document covers Docker, Kubernetes, Nginx, and infrastructure-related problems, providing step-by-step solutions and best practices for maintaining reliable deployments.

## Docker Deployment Issues

### 1. Container Startup Failures

**Symptoms:**
- Containers fail to start
- "Container exited with code 1" errors
- Port binding failures
- Volume mount issues

**Common Causes:**
- Missing environment variables
- Port conflicts
- Insufficient resources
- Invalid Dockerfile configuration
- Network connectivity issues

**Solutions:**

```bash
# 1. Check container status
docker ps -a

# 2. View container logs
docker logs axisor-backend
docker logs axisor-frontend
docker logs axisor-postgres

# 3. Check resource usage
docker stats

# 4. Verify environment variables
docker exec axisor-backend env | grep -E "(DATABASE_URL|REDIS_URL|NODE_ENV)"

# 5. Test container connectivity
docker exec axisor-backend ping axisor-postgres
docker exec axisor-backend ping axisor-redis

# 6. Check port binding
netstat -tulpn | grep -E "(3000|5432|6379|80|443)"

# 7. Restart containers
docker restart axisor-backend axisor-frontend
```

**Docker Compose Troubleshooting**
```bash
# 1. Check service status
docker compose -f docker-compose.prod.yml ps

# 2. View service logs
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend

# 3. Check service health
docker compose -f docker-compose.prod.yml exec backend curl http://localhost:3000/health

# 4. Restart specific service
docker compose -f docker-compose.prod.yml restart backend

# 5. Rebuild and restart
docker compose -f docker-compose.prod.yml up --build -d

# 6. Check network connectivity
docker network ls
docker network inspect axisor-network

# 7. Clean up unused resources
docker compose -f docker-compose.prod.yml down
docker system prune -f
```

### 2. Database Connection Issues

**Symptoms:**
- "Database connection failed" errors
- Prisma client initialization failures
- Connection timeout errors
- Database service unavailable

**Root Causes:**
- PostgreSQL service not running
- Incorrect connection string
- Network connectivity issues
- Database server overload
- Authentication failures

**Solutions:**

```bash
# 1. Check PostgreSQL status
docker ps | grep postgres
docker logs axisor-postgres

# 2. Test database connection
docker exec axisor-postgres psql -U axisor -d axisor -c "SELECT 1;"

# 3. Check database logs
docker logs axisor-postgres | tail -50

# 4. Verify connection string
echo $DATABASE_URL

# 5. Test connection from backend container
docker exec axisor-backend node -e "
const { Client } = require('pg');
const client = new Client(process.env.DATABASE_URL);
client.connect()
  .then(() => console.log('Database connected'))
  .catch(err => console.error('Connection failed:', err))
  .finally(() => client.end());
"

# 6. Check database permissions
docker exec axisor-postgres psql -U axisor -d axisor -c "
SELECT usename, datname, client_addr, state 
FROM pg_stat_activity 
WHERE datname = 'axisor';
"

# 7. Restart database service
docker restart axisor-postgres
```

**Database Configuration Issues**
```bash
# 1. Check PostgreSQL configuration
docker exec axisor-postgres cat /var/lib/postgresql/data/postgresql.conf | grep -E "(max_connections|shared_buffers|work_mem)"

# 2. Check connection limits
docker exec axisor-postgres psql -U axisor -d axisor -c "
SELECT setting, unit, context 
FROM pg_settings 
WHERE name IN ('max_connections', 'shared_buffers', 'work_mem');
"

# 3. Check active connections
docker exec axisor-postgres psql -U axisor -d axisor -c "
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';
"

# 4. Check database size
docker exec axisor-postgres psql -U axisor -d axisor -c "
SELECT pg_size_pretty(pg_database_size('axisor')) as database_size;
"
```

### 3. Redis Connection Issues

**Symptoms:**
- Redis connection refused errors
- Cache operations failing
- BullMQ worker failures
- Session storage issues

**Root Causes:**
- Redis service not running
- Incorrect Redis URL
- Memory issues
- Authentication failures
- Network connectivity problems

**Solutions:**

```bash
# 1. Check Redis status
docker ps | grep redis
docker logs axisor-redis

# 2. Test Redis connection
docker exec axisor-redis redis-cli ping

# 3. Check Redis memory usage
docker exec axisor-redis redis-cli info memory

# 4. Check Redis configuration
docker exec axisor-redis redis-cli config get "*"

# 5. Test connection from backend
docker exec axisor-backend node -e "
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);
client.on('connect', () => console.log('Redis connected'));
client.on('error', err => console.error('Redis error:', err));
client.ping((err, result) => {
  console.log('Ping result:', result);
  client.quit();
});
"

# 6. Check Redis keys
docker exec axisor-redis redis-cli keys "*"

# 7. Restart Redis service
docker restart axisor-redis
```

## Kubernetes Deployment Issues

### 1. Pod Startup Failures

**Symptoms:**
- Pods stuck in Pending state
- Pods failing to start
- Image pull failures
- Resource constraints

**Common Causes:**
- Insufficient resources
- Image pull secrets
- Node affinity issues
- Persistent volume claims
- ConfigMap/Secret issues

**Solutions:**

```bash
# 1. Check pod status
kubectl get pods -n axisor

# 2. Describe pod for details
kubectl describe pod <pod-name> -n axisor

# 3. Check pod logs
kubectl logs <pod-name> -n axisor

# 4. Check node resources
kubectl top nodes
kubectl describe nodes

# 5. Check events
kubectl get events -n axisor --sort-by='.lastTimestamp'

# 6. Check persistent volumes
kubectl get pv
kubectl get pvc -n axisor

# 7. Check ConfigMaps and Secrets
kubectl get configmaps -n axisor
kubectl get secrets -n axisor
```

**Resource Constraint Issues**
```bash
# 1. Check resource quotas
kubectl get resourcequotas -n axisor

# 2. Check limit ranges
kubectl get limitranges -n axisor

# 3. Check pod resource requests
kubectl describe pod <pod-name> -n axisor | grep -A 10 "Requests:"

# 4. Check node capacity
kubectl describe nodes | grep -A 5 "Capacity:"

# 5. Scale down if needed
kubectl scale deployment axisor-backend --replicas=1 -n axisor

# 6. Check horizontal pod autoscaler
kubectl get hpa -n axisor
kubectl describe hpa axisor-backend -n axisor
```

### 2. Service Connectivity Issues

**Symptoms:**
- Services not accessible
- DNS resolution failures
- Load balancer issues
- Ingress problems

**Root Causes:**
- Service configuration errors
- Network policy restrictions
- DNS issues
- Load balancer misconfiguration
- Ingress controller problems

**Solutions:**

```bash
# 1. Check service status
kubectl get services -n axisor

# 2. Check service endpoints
kubectl get endpoints -n axisor

# 3. Test service connectivity
kubectl run test-pod --image=busybox --rm -it -- nslookup axisor-backend.axisor.svc.cluster.local

# 4. Check ingress
kubectl get ingress -n axisor
kubectl describe ingress axisor-ingress -n axisor

# 5. Check ingress controller
kubectl get pods -n ingress-nginx
kubectl logs -n ingress-nginx <ingress-controller-pod>

# 6. Test from within cluster
kubectl run test-pod --image=curlimages/curl --rm -it -- curl http://axisor-backend.axisor.svc.cluster.local:3000/health

# 7. Check network policies
kubectl get networkpolicies -n axisor
```

### 3. Persistent Volume Issues

**Symptoms:**
- PVC stuck in Pending state
- Volume mount failures
- Data persistence issues
- Storage class problems

**Root Causes:**
- Insufficient storage
- Storage class misconfiguration
- Node affinity issues
- Volume provisioning failures

**Solutions:**

```bash
# 1. Check PVC status
kubectl get pvc -n axisor

# 2. Describe PVC for details
kubectl describe pvc postgres-pvc -n axisor

# 3. Check storage classes
kubectl get storageclasses

# 4. Check persistent volumes
kubectl get pv

# 5. Check volume events
kubectl get events -n axisor --field-selector involvedObject.kind=PersistentVolumeClaim

# 6. Check node storage
kubectl describe nodes | grep -A 10 "Allocatable:"

# 7. Check volume provisioner logs
kubectl logs -n kube-system <volume-provisioner-pod>
```

## Nginx Configuration Issues

### 1. Reverse Proxy Problems

**Symptoms:**
- 502 Bad Gateway errors
- 504 Gateway Timeout errors
- SSL certificate issues
- Load balancing failures

**Root Causes:**
- Backend service unavailable
- Nginx configuration errors
- SSL certificate problems
- Upstream server issues

**Solutions:**

```bash
# 1. Check Nginx status
docker ps | grep nginx
docker logs axisor-nginx

# 2. Test Nginx configuration
docker exec axisor-nginx nginx -t

# 3. Check Nginx error logs
docker exec axisor-nginx tail -f /var/log/nginx/error.log

# 4. Check upstream connectivity
docker exec axisor-nginx curl http://axisor-backend:3000/health

# 5. Check SSL certificates
docker exec axisor-nginx openssl x509 -in /etc/nginx/certs/axisor.crt -text -noout

# 6. Test SSL connection
openssl s_client -connect axisor.com:443 -servername axisor.com

# 7. Check Nginx configuration
docker exec axisor-nginx cat /etc/nginx/nginx.conf
```

**Nginx Configuration Debugging**
```bash
# 1. Check Nginx processes
docker exec axisor-nginx ps aux | grep nginx

# 2. Check Nginx modules
docker exec axisor-nginx nginx -V

# 3. Check access logs
docker exec axisor-nginx tail -f /var/log/nginx/access.log

# 4. Test specific upstream
docker exec axisor-nginx curl -H "Host: axisor.com" http://localhost/health

# 5. Check rate limiting
docker exec axisor-nginx curl -H "Host: axisor.com" http://localhost/api/test

# 6. Check proxy headers
docker exec axisor-nginx curl -H "Host: axisor.com" -v http://localhost/api/test

# 7. Reload Nginx configuration
docker exec axisor-nginx nginx -s reload
```

### 2. SSL/TLS Issues

**Symptoms:**
- SSL certificate errors
- HTTPS connection failures
- Certificate expiration warnings
- Mixed content issues

**Root Causes:**
- Expired certificates
- Incorrect certificate configuration
- Certificate chain issues
- SSL protocol mismatches

**Solutions:**

```bash
# 1. Check certificate expiration
docker exec axisor-nginx openssl x509 -in /etc/nginx/certs/axisor.crt -dates -noout

# 2. Check certificate chain
docker exec axisor-nginx openssl x509 -in /etc/nginx/certs/axisor.crt -text -noout | grep -A 10 "Subject Alternative Name"

# 3. Test SSL connection
openssl s_client -connect axisor.com:443 -servername axisor.com -showcerts

# 4. Check SSL configuration
docker exec axisor-nginx nginx -T | grep -A 10 "ssl_"

# 5. Verify certificate installation
curl -I https://axisor.com

# 6. Check certificate transparency
curl -s "https://crt.sh/?q=axisor.com&output=json" | jq '.[0]'

# 7. Test SSL labs
# Visit https://www.ssllabs.com/ssltest/analyze.html?d=axisor.com
```

## Infrastructure Issues

### 1. Load Balancer Problems

**Symptoms:**
- Uneven traffic distribution
- Health check failures
- Connection timeouts
- SSL termination issues

**Root Causes:**
- Health check misconfiguration
- Backend server issues
- Load balancer configuration errors
- Network connectivity problems

**Solutions:**

```bash
# 1. Check load balancer status
kubectl get ingress -n axisor
kubectl describe ingress axisor-ingress -n axisor

# 2. Check backend health
kubectl get pods -n axisor -l app=axisor-backend
kubectl describe pod <backend-pod> -n axisor

# 3. Test health endpoints
kubectl run test-pod --image=curlimages/curl --rm -it -- curl http://axisor-backend.axisor.svc.cluster.local:3000/health

# 4. Check load balancer logs
kubectl logs -n ingress-nginx <ingress-controller-pod>

# 5. Check service endpoints
kubectl get endpoints axisor-backend -n axisor

# 6. Test from external IP
curl -H "Host: axisor.com" http://<load-balancer-ip>/health

# 7. Check SSL termination
curl -I https://axisor.com
```

### 2. DNS Resolution Issues

**Symptoms:**
- Domain not resolving
- DNS lookup failures
- Inconsistent DNS responses
- CDN issues

**Root Causes:**
- DNS configuration errors
- DNS propagation delays
- CDN misconfiguration
- Nameserver issues

**Solutions:**

```bash
# 1. Check DNS resolution
nslookup axisor.com
dig axisor.com
dig axisor.com @8.8.8.8

# 2. Check DNS propagation
dig axisor.com @1.1.1.1
dig axisor.com @8.8.8.8

# 3. Check DNS records
dig axisor.com ANY
dig www.axisor.com
dig api.axisor.com

# 4. Check TTL values
dig axisor.com | grep TTL

# 5. Test from different locations
# Use online DNS checker tools

# 6. Check CDN configuration
curl -I https://axisor.com
curl -H "Host: axisor.com" -I http://<cdn-endpoint>

# 7. Check nameserver configuration
dig NS axisor.com
```

### 3. Monitoring and Logging Issues

**Symptoms:**
- Missing logs
- Monitoring alerts not firing
- Metrics collection failures
- Dashboard display issues

**Root Causes:**
- Log aggregation failures
- Monitoring service issues
- Metric collection problems
- Dashboard configuration errors

**Solutions:**

```bash
# 1. Check log aggregation
kubectl logs -n monitoring <log-aggregator-pod>
docker logs axisor-backend | tail -100

# 2. Check monitoring services
kubectl get pods -n monitoring
kubectl describe pod <prometheus-pod> -n monitoring

# 3. Check metric collection
kubectl exec -n monitoring <prometheus-pod> -- curl http://localhost:9090/api/v1/targets

# 4. Check alerting rules
kubectl exec -n monitoring <prometheus-pod> -- cat /etc/prometheus/rules/*.yml

# 5. Check Grafana connectivity
kubectl port-forward -n monitoring svc/grafana 3000:80
# Visit http://localhost:3000

# 6. Check log storage
kubectl get pvc -n monitoring
kubectl describe pvc <log-storage-pvc> -n monitoring

# 7. Test log shipping
kubectl run test-pod --image=busybox --rm -it -- echo "test log message"
```

## Deployment Best Practices

### 1. Pre-Deployment Checklist

**Environment Preparation**
- [ ] Verify all environment variables
- [ ] Check resource availability
- [ ] Validate configuration files
- [ ] Test database migrations
- [ ] Verify external service connectivity
- [ ] Check SSL certificates
- [ ] Validate backup procedures

**Application Preparation**
- [ ] Run all tests
- [ ] Build and test Docker images
- [ ] Validate configuration
- [ ] Check dependency versions
- [ ] Verify security patches
- [ ] Test rollback procedures
- [ ] Prepare monitoring alerts

### 2. Deployment Strategies

**Blue-Green Deployment**
```bash
# 1. Deploy to green environment
kubectl apply -f k8s/green/

# 2. Test green environment
kubectl port-forward -n axisor-green svc/axisor-backend 3001:3000
curl http://localhost:3001/health

# 3. Switch traffic to green
kubectl patch ingress axisor-ingress -n axisor --type='merge' -p='{"spec":{"rules":[{"host":"axisor.com","http":{"paths":[{"path":"/","backend":{"service":{"name":"axisor-backend-green","port":{"number":3000}}}}]}}]}}'

# 4. Monitor green environment
kubectl get pods -n axisor-green
kubectl logs -n axisor-green <backend-pod>

# 5. Clean up blue environment
kubectl delete namespace axisor-blue
```

**Rolling Update Deployment**
```bash
# 1. Update deployment
kubectl set image deployment/axisor-backend axisor-backend=axisor/backend:v2.0.0 -n axisor

# 2. Monitor rollout
kubectl rollout status deployment/axisor-backend -n axisor

# 3. Check pod status
kubectl get pods -n axisor -l app=axisor-backend

# 4. Test new version
kubectl port-forward -n axisor svc/axisor-backend 3000:3000
curl http://localhost:3000/health

# 5. Rollback if needed
kubectl rollout undo deployment/axisor-backend -n axisor
```

### 3. Post-Deployment Monitoring

**Health Checks**
```bash
# 1. Check application health
curl https://axisor.com/health
curl https://api.axisor.com/health

# 2. Check database connectivity
kubectl exec -n axisor <backend-pod> -- curl http://localhost:3000/health

# 3. Check Redis connectivity
kubectl exec -n axisor <backend-pod> -- redis-cli ping

# 4. Check external APIs
kubectl exec -n axisor <backend-pod> -- curl https://api.lnmarkets.com/v2/health

# 5. Monitor logs
kubectl logs -n axisor <backend-pod> --tail=100 -f

# 6. Check metrics
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Visit http://localhost:9090

# 7. Check alerts
kubectl port-forward -n monitoring svc/alertmanager 9093:9093
# Visit http://localhost:9093
```

## Checklist

### Pre-Deployment
- [ ] Verify environment configuration
- [ ] Test Docker images
- [ ] Validate database migrations
- [ ] Check external service connectivity
- [ ] Verify SSL certificates
- [ ] Prepare rollback procedures
- [ ] Set up monitoring alerts

### During Deployment
- [ ] Monitor deployment progress
- [ ] Check service health
- [ ] Verify traffic routing
- [ ] Test critical functionality
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Validate security configurations

### Post-Deployment
- [ ] Verify application functionality
- [ ] Check monitoring dashboards
- [ ] Validate alerting systems
- [ ] Test backup procedures
- [ ] Monitor performance metrics
- [ ] Check security logs
- [ ] Update documentation
- [ ] Conduct post-deployment review
