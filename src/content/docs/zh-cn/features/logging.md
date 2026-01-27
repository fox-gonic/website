---
title: 结构化日志
description: 内置结构化日志，支持 TraceID 和上下文字段
head: []
---

# 结构化日志

Fox 包含一个生产就绪的结构化日志系统，具有自动 TraceID 生成、上下文字段和日志轮转功能。

## 基本用法

### 从上下文获取日志记录器

```go
r := fox.Default()

r.GET("/user/:id", func(c *gin.Context, id int) (*User, error) {
    logger := fox.GetLogger(c)

    logger.Info("获取用户", "user_id", id)

    user, err := getUserByID(id)
    if err != nil {
        logger.Error("获取用户失败", "user_id", id, "error", err)
        return nil, err
    }

    logger.Info("用户获取成功", "user_id", id)
    return user, nil
})
```

### 自动 TraceID

每个请求自动获得用于请求跟踪的唯一 TraceID：

```go
r.GET("/process", func(c *gin.Context) error {
    logger := fox.GetLogger(c)

    // TraceID 自动包含在日志中
    logger.Info("处理开始")

    // 调用另一个服务
    result, err := processData()

    logger.Info("处理完成", "result", result)
    return err
})
```

输出：
```
{"level":"info","trace_id":"abc123","msg":"处理开始","time":"2024-01-01T10:00:00Z"}
{"level":"info","trace_id":"abc123","result":"success","msg":"处理完成","time":"2024-01-01T10:00:01Z"}
```

## 配置

### 基本配置

```go
config := fox.LoggerConfig{
    Level:      "info",           // 日志级别: debug, info, warn, error
    Output:     "stdout",         // 输出: stdout, stderr, 或文件路径
    Format:     "json",           // 格式: json 或 text
    TimeFormat: time.RFC3339,     // 时间戳格式
}

r := fox.New(fox.WithLoggerConfig(config))
```

### 文件轮转

```go
config := fox.LoggerConfig{
    Level:      "info",
    Output:     "/var/log/app.log",
    MaxSize:    100,   // 轮转前的最大大小（MB）
    MaxBackups: 7,     // 保留的旧日志文件数量
    MaxAge:     30,    // 保留旧日志文件的最大天数
    Compress:   true,  // 压缩轮转的文件
}

r := fox.New(fox.WithLoggerConfig(config))
```

## 结构化字段

### 添加上下文字段

```go
r.POST("/order", func(c *gin.Context, req *CreateOrderRequest) (*Order, error) {
    logger := fox.GetLogger(c)

    logger.Info("创建订单",
        "user_id", req.UserID,
        "items_count", len(req.Items),
        "total_amount", req.TotalAmount,
    )

    order, err := createOrder(req)

    if err != nil {
        logger.Error("订单创建失败",
            "user_id", req.UserID,
            "error", err,
            "reason", "database_error",
        )
        return nil, err
    }

    logger.Info("订单创建成功",
        "order_id", order.ID,
        "user_id", req.UserID,
    )

    return order, nil
})
```

### 嵌套结构

```go
logger.Info("用户操作",
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

## 日志级别

```go
logger := fox.GetLogger(c)

logger.Debug("详细调试信息", "key", "value")
logger.Info("一般信息", "status", "ok")
logger.Warn("警告消息", "issue", "deprecated_api")
logger.Error("发生错误", "error", err)
```

## 中间件集成

### 自定义上下文字段

向请求中的所有日志添加字段：

```go
func TenantMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        tenantID := extractTenantID(c)

        // 向日志上下文添加 tenant_id
        logger := fox.GetLogger(c)
        logger = logger.With("tenant_id", tenantID)
        fox.SetLogger(c, logger)

        c.Next()
    }
}

r := fox.Default()
r.Use(TenantMiddleware())
```

### 请求日志中间件

```go
func RequestLoggerMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        path := c.Request.URL.Path

        logger := fox.GetLogger(c)
        logger.Info("请求开始",
            "method", c.Request.Method,
            "path", path,
        )

        c.Next()

        latency := time.Since(start)
        logger.Info("请求完成",
            "method", c.Request.Method,
            "path", path,
            "status", c.Writer.Status(),
            "latency_ms", latency.Milliseconds(),
        )
    }
}
```

## 错误跟踪

### 带堆栈跟踪的日志

```go
func handler(c *gin.Context) error {
    logger := fox.GetLogger(c)

    err := someOperation()
    if err != nil {
        // 记录堆栈跟踪
        logger.Error("操作失败",
            "error", err,
            "stack", string(debug.Stack()),
        )
        return err
    }

    return nil
}
```

## 最佳实践

1. **使用结构化字段** - 不要将字符串连接到消息中
   ```go
   // ❌ 不好
   logger.Info("用户 " + userID + " 创建了订单 " + orderID)

   // ✅ 好
   logger.Info("订单创建", "user_id", userID, "order_id", orderID)
   ```

2. **在适当级别记录日志**
   - `Debug`：用于调试的详细信息
   - `Info`：一般操作信息
   - `Warn`：潜在问题的警告消息
   - `Error`：需要注意的错误条件

3. **包含相关上下文**
   ```go
   logger.Error("数据库查询失败",
       "query", sqlQuery,
       "params", params,
       "error", err,
       "duration_ms", duration.Milliseconds(),
   )
   ```

4. **不要记录敏感数据** - 避免记录密码、令牌、PII
   ```go
   // ❌ 不好
   logger.Info("登录", "password", password)

   // ✅ 好
   logger.Info("登录尝试", "username", username)
   ```

5. **使用 TraceID 进行分布式跟踪** - 将 TraceID 传递给外部服务

## 与外部服务集成

### 发送日志到外部服务

```go
type ExternalLoggerHook struct {
    client *http.Client
    url    string
}

func (h *ExternalLoggerHook) Levels() []logrus.Level {
    return logrus.AllLevels
}

func (h *ExternalLoggerHook) Fire(entry *logrus.Entry) error {
    // 发送日志到外部服务（Elasticsearch、Splunk 等）
    return h.sendLog(entry)
}
```

### 与指标关联

```go
r.GET("/api/data", func(c *gin.Context) (any, error) {
    logger := fox.GetLogger(c)
    traceID := fox.GetTraceID(c)

    // 在指标标签中使用 TraceID
    metrics.Increment("api.requests", map[string]string{
        "trace_id": traceID,
        "endpoint": "/api/data",
    })

    logger.Info("API 调用", "endpoint", "/api/data")

    return getData()
})
```

## 下一步

- [参数绑定](/zh-cn/features/binding/) - 自动请求绑定
- [验证](/zh-cn/features/validation/) - 带日志的自定义验证
