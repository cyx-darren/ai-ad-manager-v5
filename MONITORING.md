# Monitoring & Alerting Guide

This guide covers the monitoring and alerting setup for the Google Analytics Dashboard using Prometheus, Grafana, and related tools.

## Architecture Overview

The monitoring stack consists of:
- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Loki**: Log aggregation
- **Promtail**: Log collection
- **Alertmanager**: Alert routing and notifications
- **Node Exporter**: System metrics

## Quick Start

### Starting the Monitoring Stack

```bash
# Start monitoring services
docker-compose -f docker-compose.monitoring.yml up -d

# Verify services are running
docker-compose -f docker-compose.monitoring.yml ps
```

### Accessing Services

- **Grafana**: http://localhost:3001 (admin/secure_password)
- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093
- **Loki**: http://localhost:3100

## Application Metrics

### Available Metrics

The application exposes the following custom metrics at `/api/metrics`:

#### HTTP Metrics
- `http_requests_total`: Total HTTP requests by method, route, and status
- `http_request_duration_seconds`: Request duration histogram

#### Business Metrics
- `active_users`: Current number of active users
- `total_spend_processed`: Total advertising spend processed
- `pdf_uploads_total`: PDF upload count by status
- `google_ads_api_calls_total`: Google Ads API call count
- `google_analytics_api_calls_total`: GA4 API call count

#### Cache Metrics
- `cache_hits_total`: Cache hit count
- `cache_misses_total`: Cache miss count
- `cache_hit_rate`: Current cache hit rate percentage

#### System Metrics
- `nodejs_memory_usage_bytes`: Memory usage by type
- `database_connections_active`: Active database connections
- `database_query_duration_seconds`: Query duration histogram

### Using Metrics in Code

```javascript
import { 
  recordPdfUpload, 
  recordGoogleAdsApiCall,
  recordCacheHit,
  recordError 
} from '../utils/monitoring.js';

// Record a PDF upload
recordPdfUpload('success');

// Record API call
recordGoogleAdsApiCall('getCampaigns', 'success');

// Record cache hit
recordCacheHit('dashboard_metrics');

// Record error
recordError('api_error', 'warning');
```

## Alerts Configuration

### Critical Alerts
- **APIServerDown**: API server unreachable for 2+ minutes
- **WebServerDown**: Web server unreachable for 2+ minutes
- **SSLCertificateExpiringSoon**: SSL cert expires in <7 days

### Warning Alerts
- **HighAPIResponseTime**: 95th percentile >1 second
- **HighAPIErrorRate**: Error rate >5%
- **HighCPUUsage**: CPU usage >80% for 10 minutes
- **HighMemoryUsage**: Memory usage >90% for 5 minutes
- **DiskSpaceLow**: Disk space <10%

### Business Alerts
- **NoDataFromGoogleAnalytics**: No GA4 data for 1+ hour
- **LowCacheHitRate**: Cache hit rate <50%

## Grafana Dashboards

### Importing Dashboards

1. Log into Grafana (http://localhost:3001)
2. Navigate to Dashboards → Import
3. Upload JSON files from `monitoring/grafana/dashboards/`

### Available Dashboards

- **Application Overview**: Key metrics and health status
- **API Performance**: Request rates, latencies, error rates
- **Business Metrics**: User activity, spend tracking, conversions
- **System Resources**: CPU, memory, disk, network
- **Logs Explorer**: Application and system logs

## Log Management

### Log Sources

Promtail collects logs from:
- Application logs (`/logs/*.log`)
- Docker container logs
- System logs

### Querying Logs in Grafana

1. Navigate to Explore
2. Select Loki datasource
3. Use LogQL queries:

```logql
# Application errors
{job="analytics-dashboard"} |= "error"

# API requests
{container="api"} |= "GET /api"

# Slow queries
{job="analytics-dashboard"} |= "slow" |> 1000
```

## Alertmanager Configuration

### Email Notifications

Update `monitoring/alertmanager.yml`:

```yaml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@your-domain.com'
  smtp_auth_username: 'your-email@gmail.com'
  smtp_auth_password: 'your-app-password'
```

### Webhook Integration

Add webhook receivers for Slack, PagerDuty, etc.:

```yaml
receivers:
  - name: 'slack-notifications'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#alerts'
```

## Performance Optimization

### Metric Cardinality

Keep cardinality low by:
- Limiting label values
- Using consistent label names
- Avoiding high-cardinality labels (user IDs, session IDs)

### Retention Configuration

Configure Prometheus retention in `docker-compose.monitoring.yml`:

```yaml
command:
  - '--storage.tsdb.retention.time=30d'
  - '--storage.tsdb.retention.size=10GB'
```

## Troubleshooting

### Common Issues

1. **Metrics not appearing**
   - Check API server is running: `curl http://localhost:5050/api/metrics`
   - Verify Prometheus scrape config
   - Check Prometheus targets: http://localhost:9090/targets

2. **Alerts not firing**
   - Check alert rules: http://localhost:9090/alerts
   - Verify Alertmanager config
   - Test alert: `curl -X POST http://localhost:9093/api/v1/alerts`

3. **High memory usage**
   - Reduce metric retention period
   - Optimize cardinality
   - Increase container memory limits

4. **Grafana datasource issues**
   - Verify network connectivity between containers
   - Check datasource configuration
   - Test connection in Grafana UI

## Maintenance

### Backup

Important files to backup:
- Grafana dashboards (export as JSON)
- Alert rules (`monitoring/alerts.yml`)
- Prometheus data (`prometheus_data` volume)

### Updates

```bash
# Pull latest images
docker-compose -f docker-compose.monitoring.yml pull

# Restart with updates
docker-compose -f docker-compose.monitoring.yml up -d
```

### Monitoring the Monitors

Set up monitoring for the monitoring stack:
- Prometheus self-monitoring: http://localhost:9090/metrics
- Grafana metrics: http://localhost:3001/metrics
- Container health checks in docker-compose

## Security Considerations

- Change default Grafana password immediately
- Use TLS for metric endpoints in production
- Implement authentication for Prometheus/Alertmanager
- Restrict network access to monitoring services
- Regularly update monitoring stack components

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)
- [Alertmanager Documentation](https://prometheus.io/docs/alerting/)