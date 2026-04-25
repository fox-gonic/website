---
title: Structured Logging
description: Built-in structured logging with TraceID and contextual fields
head: []
---

# Structured Logging

Fox includes request logging middleware and a small logger package built on top of zerolog. The middleware creates or reuses an `x-request-id`, stores a request logger on `*fox.Context`, and writes one request log after the handler finishes.

## Basic Usage

```go
r := fox.Default()

r.GET("/user/:id", func(ctx *fox.Context) (*User, error) {
    log := ctx.Logger
    id := ctx.Param("id")

    log.WithField("user_id", id).Info("fetching user")

    user, err := getUserByID(id)
    if err != nil {
        log.WithError(err).Error("failed to fetch user")
        return nil, err
    }

    return user, nil
})
```

`fox.Default()` installs `fox.Logger()`, `fox.NewXResponseTimer()`, and `fox.Recovery()`. If you use `fox.New()`, add the middleware explicitly:

```go
r := fox.New()
r.Use(fox.Logger())
```

## TraceID

Fox uses the `x-request-id` header as the TraceID. If the request does not include one, the logger middleware generates it and writes it back to the response header.

```go
r.GET("/trace", func(ctx *fox.Context) map[string]string {
    return map[string]string{
        "trace_id": ctx.TraceID(),
    }
})
```

You can also create a logger from any context carrying a TraceID:

```go
log := logger.NewWithContext(ctx.Context)
```

## Logger Configuration

Configure the global logger package before creating request loggers:

```go
import "github.com/fox-gonic/fox/logger"

logger.SetConfig(&logger.Config{
    LogLevel:              logger.InfoLevel,
    ConsoleLoggingEnabled: true,
    EncodeLogsAsJSON:      true,
})
```

### File Logging

Fox can write to a rotating log file through lumberjack:

```go
logger.SetConfig(&logger.Config{
    LogLevel:              logger.InfoLevel,
    ConsoleLoggingEnabled: false,
    FileLoggingEnabled:    true,
    Filename:              "./logs/app.log",
    MaxSize:               100, // MB
    MaxBackups:            7,
    MaxAge:                30,  // days
    EncodeLogsAsJSON:      true,
})
```

If file logging is enabled and `Filename` is empty, Fox writes to a temporary file named after the process.

## Structured Fields

Use `WithField`, `WithFields`, and `WithError` to add context:

```go
log := ctx.Logger.WithFields(map[string]any{
    "user_id": req.UserID,
    "action":  "create_order",
})

order, err := createOrder(req)
if err != nil {
    log.WithError(err).Error("order creation failed")
    return nil, err
}

log.WithField("order_id", order.ID).Info("order created")
```

The logger interface also supports formatted messages:

```go
ctx.Logger.Infof("created user %d", user.ID)
```

## Request Logger Middleware

`fox.Logger()` accepts `fox.LoggerConfig` with `SkipPaths`:

```go
r.Use(fox.Logger(fox.LoggerConfig{
    SkipPaths: []string{"/health", "/metrics"},
}))
```

The middleware logs method, path, client IP, response status, latency, and a fixed `type` field of `ENGINE`.

## Log Levels

Fox exposes these levels in `github.com/fox-gonic/fox/logger`:

- `logger.DebugLevel`
- `logger.InfoLevel`
- `logger.WarnLevel`
- `logger.ErrorLevel`
- `logger.FatalLevel`
- `logger.PanicLevel`

## Best Practices

1. Use `ctx.Logger` inside Fox handlers so request logs share the request TraceID.
2. Add structured fields with `WithField` or `WithFields`; avoid concatenating values into messages.
3. Do not log passwords, tokens, secrets, or sensitive personal data.
4. Use `logger.SetConfig` at application startup before requests are handled.
5. Use `SkipPaths` for noisy endpoints such as health checks.

## Next Steps

- [Logger Configuration](/examples/logger-config/) - Complete configuration examples
- [Error Handling](/examples/error-handling/) - Logging and returning errors
