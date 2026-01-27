---
title: Structured Logging
description: Built-in structured logging with TraceID and contextual fields
head: []
---

# Structured Logging

Fox includes a production-ready structured logging system with automatic TraceID generation, contextual fields, and log rotation.

## Basic Usage

### Getting Logger from Context

```go
r := fox.Default()

r.GET("/user/:id", func(c *gin.Context, id int) (*User, error) {
    logger := fox.GetLogger(c)

    logger.Info("Fetching user", "user_id", id)

    user, err := getUserByID(id)
    if err != nil {
        logger.Error("Failed to fetch user", "user_id", id, "error", err)
        return nil, err
    }

    logger.Info("User fetched successfully", "user_id", id)
    return user, nil
})
```

### Automatic TraceID

Each request automatically gets a unique TraceID for request tracking:

```go
r.GET("/process", func(c *gin.Context) error {
    logger := fox.GetLogger(c)

    // TraceID is automatically included in logs
    logger.Info("Processing started")

    // Call another service
    result, err := processData()

    logger.Info("Processing completed", "result", result)
    return err
})
```

Output:
```
{"level":"info","trace_id":"abc123","msg":"Processing started","time":"2024-01-01T10:00:00Z"}
{"level":"info","trace_id":"abc123","result":"success","msg":"Processing completed","time":"2024-01-01T10:00:01Z"}
```

## Configuration

### Basic Configuration

```go
config := fox.LoggerConfig{
    Level:      "info",           // Log level: debug, info, warn, error
    Output:     "stdout",         // Output: stdout, stderr, or file path
    Format:     "json",           // Format: json or text
    TimeFormat: time.RFC3339,     // Timestamp format
}

r := fox.New(fox.WithLoggerConfig(config))
```

### File Rotation

```go
config := fox.LoggerConfig{
    Level:      "info",
    Output:     "/var/log/app.log",
    MaxSize:    100,   // Max size in MB before rotation
    MaxBackups: 7,     // Number of old log files to keep
    MaxAge:     30,    // Max days to keep old log files
    Compress:   true,  // Compress rotated files
}

r := fox.New(fox.WithLoggerConfig(config))
```

## Structured Fields

### Adding Context Fields

```go
r.POST("/order", func(c *gin.Context, req *CreateOrderRequest) (*Order, error) {
    logger := fox.GetLogger(c)

    logger.Info("Creating order",
        "user_id", req.UserID,
        "items_count", len(req.Items),
        "total_amount", req.TotalAmount,
    )

    order, err := createOrder(req)

    if err != nil {
        logger.Error("Order creation failed",
            "user_id", req.UserID,
            "error", err,
            "reason", "database_error",
        )
        return nil, err
    }

    logger.Info("Order created successfully",
        "order_id", order.ID,
        "user_id", req.UserID,
    )

    return order, nil
})
```

### Nested Structures

```go
logger.Info("User action",
    "user", map[string]any{
        "id":       user.ID,
        "email":    user.Email,
        "role":     user.Role,
    },
    "action", "purchase",
    "metadata", map[string]any{
        "ip":         c.ClientIP(),
        "user_agent": c.Request.UserAgent(),
    },
)
```

## Log Levels

```go
logger := fox.GetLogger(c)

logger.Debug("Detailed debugging information", "key", "value")
logger.Info("General information", "status", "ok")
logger.Warn("Warning message", "issue", "deprecated_api")
logger.Error("Error occurred", "error", err)
```

## Middleware Integration

### Custom Context Fields

Add fields to all logs in a request:

```go
func TenantMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        tenantID := extractTenantID(c)

        // Add tenant_id to logger context
        logger := fox.GetLogger(c)
        logger = logger.With("tenant_id", tenantID)
        fox.SetLogger(c, logger)

        c.Next()
    }
}

r := fox.Default()
r.Use(TenantMiddleware())
```

### Request Logging Middleware

```go
func RequestLoggerMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        path := c.Request.URL.Path

        logger := fox.GetLogger(c)
        logger.Info("Request started",
            "method", c.Request.Method,
            "path", path,
        )

        c.Next()

        latency := time.Since(start)
        logger.Info("Request completed",
            "method", c.Request.Method,
            "path", path,
            "status", c.Writer.Status(),
            "latency_ms", latency.Milliseconds(),
        )
    }
}
```

## Error Tracking

### Logging with Stack Traces

```go
func handler(c *gin.Context) error {
    logger := fox.GetLogger(c)

    err := someOperation()
    if err != nil {
        // Log with stack trace
        logger.Error("Operation failed",
            "error", err,
            "stack", string(debug.Stack()),
        )
        return err
    }

    return nil
}
```

## Best Practices

1. **Use structured fields** - Don't concatenate strings into messages
   ```go
   // ❌ Bad
   logger.Info("User " + userID + " created order " + orderID)

   // ✅ Good
   logger.Info("Order created", "user_id", userID, "order_id", orderID)
   ```

2. **Log at appropriate levels**
   - `Debug`: Detailed information for debugging
   - `Info`: General operational information
   - `Warn`: Warning messages for potential issues
   - `Error`: Error conditions that need attention

3. **Include relevant context**
   ```go
   logger.Error("Database query failed",
       "query", sqlQuery,
       "params", params,
       "error", err,
       "duration_ms", duration.Milliseconds(),
   )
   ```

4. **Don't log sensitive data** - Avoid logging passwords, tokens, PII
   ```go
   // ❌ Bad
   logger.Info("Login", "password", password)

   // ✅ Good
   logger.Info("Login attempt", "username", username)
   ```

5. **Use TraceID for distributed tracing** - Pass TraceID to external services

## Integration with External Services

### Send Logs to External Service

```go
type ExternalLoggerHook struct {
    client *http.Client
    url    string
}

func (h *ExternalLoggerHook) Levels() []logrus.Level {
    return logrus.AllLevels
}

func (h *ExternalLoggerHook) Fire(entry *logrus.Entry) error {
    // Send log to external service (Elasticsearch, Splunk, etc.)
    return h.sendLog(entry)
}
```

### Correlation with Metrics

```go
r.GET("/api/data", func(c *gin.Context) (any, error) {
    logger := fox.GetLogger(c)
    traceID := fox.GetTraceID(c)

    // Use TraceID in metrics tags
    metrics.Increment("api.requests", map[string]string{
        "trace_id": traceID,
        "endpoint": "/api/data",
    })

    logger.Info("API called", "endpoint", "/api/data")

    return getData()
})
```

## Next Steps

- [Parameter Binding](/features/binding/) - Automatic request binding
- [Validation](/features/validation/) - Custom validation with logging
