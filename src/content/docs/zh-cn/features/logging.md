---
title: 结构化日志
description: 内置 TraceID 和结构化字段日志
head: []
---

Fox 提供请求日志中间件，以及基于 zerolog 的 `logger` 包。日志中间件会创建或复用 `x-request-id`，把请求日志器保存到 `*fox.Context`，并在处理器结束后输出一条请求日志。

## 基本用法

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

`fox.Default()` 会安装 `fox.Logger()`、`fox.NewXResponseTimer()` 和 `fox.Recovery()`。如果使用 `fox.New()`，需要显式添加中间件：

```go
r := fox.New()
r.Use(fox.Logger())
```

## TraceID

Fox 使用 `x-request-id` 请求头作为 TraceID。如果请求没有携带该请求头，日志中间件会生成一个，并写回响应头。

```go
r.GET("/trace", func(ctx *fox.Context) map[string]string {
    return map[string]string{
        "trace_id": ctx.TraceID(),
    }
})
```

也可以从带有 TraceID 的 context 创建日志器：

```go
log := logger.NewWithContext(ctx.Context)
```

## 日志配置

在创建请求日志器之前，先配置全局 logger：

```go
import "github.com/fox-gonic/fox/logger"

logger.SetConfig(&logger.Config{
    LogLevel:              logger.InfoLevel,
    ConsoleLoggingEnabled: true,
    EncodeLogsAsJSON:      true,
})
```

### 文件日志

Fox 可以通过 lumberjack 写入轮转日志文件：

```go
logger.SetConfig(&logger.Config{
    LogLevel:              logger.InfoLevel,
    ConsoleLoggingEnabled: false,
    FileLoggingEnabled:    true,
    Filename:              "./logs/app.log",
    MaxSize:               100, // MB
    MaxBackups:            7,
    MaxAge:                30,  // 天
    EncodeLogsAsJSON:      true,
})
```

如果开启文件日志但没有设置 `Filename`，Fox 会在临时目录中创建一个以进程名命名的日志文件。

## 结构化字段

使用 `WithField`、`WithFields` 和 `WithError` 添加上下文字段：

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

日志器也支持格式化消息：

```go
ctx.Logger.Infof("created user %d", user.ID)
```

## 请求日志中间件

`fox.Logger()` 接收带 `SkipPaths` 的 `fox.LoggerConfig`：

```go
r.Use(fox.Logger(fox.LoggerConfig{
    SkipPaths: []string{"/health", "/metrics"},
}))
```

该中间件会记录 method、path、client IP、响应状态码、耗时，以及固定值为 `ENGINE` 的 `type` 字段。

## 日志级别

`github.com/fox-gonic/fox/logger` 暴露这些级别：

- `logger.DebugLevel`
- `logger.InfoLevel`
- `logger.WarnLevel`
- `logger.ErrorLevel`
- `logger.FatalLevel`
- `logger.PanicLevel`

## 最佳实践

1. 在 Fox 处理器中使用 `ctx.Logger`，让业务日志共享请求 TraceID。
2. 用 `WithField` 或 `WithFields` 添加结构化字段，避免把值拼接到消息字符串中。
3. 不要记录密码、令牌、密钥或敏感个人信息。
4. 在应用启动时调用 `logger.SetConfig`，不要等到请求处理中再配置。
5. 对健康检查、指标等高频端点使用 `SkipPaths`。

## 下一步

- [日志配置](/zh-cn/examples/logger-config/) - 完整配置示例
- [错误处理](/zh-cn/examples/error-handling/) - 记录并返回错误
