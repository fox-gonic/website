---
title: 日志配置
description: 为开发和生产配置日志
head: []
---

# 日志配置

本示例演示 Fox 中的各种日志配置,从开发友好的控制台日志到生产就绪的文件日志及轮转。

## 功能特性

- 控制台日志
- 带轮转的文件日志
- 控制台和文件组合日志
- JSON 格式日志
- 不同的日志级别(Debug、Info、Warn、Error、Fatal、Panic)
- 结构化日志
- 跳过路径配置
- 生产就绪配置

## 完整示例

```go
package main

import (
	"os"

	"github.com/fox-gonic/fox"
	"github.com/fox-gonic/fox/logger"
)

func main() {
	// 示例 1: 仅控制台日志(默认)
	example1ConsoleOnly()

	// 示例 2: 带轮转的文件日志
	example2FileLogging()

	// 示例 3: 控制台和文件日志
	example3BothOutputs()

	// 示例 4: JSON 格式日志
	example4JSONLogs()

	// 示例 5: 不同的日志级别
	example5LogLevels()
}

// 示例 1: 仅控制台日志(开发模式)
func example1ConsoleOnly() {
	logger.SetConfig(&logger.Config{
		LogLevel:              logger.InfoLevel,
		ConsoleLoggingEnabled: true,
		EncodeLogsAsJSON:      false, // 人类可读格式
	})

	router := fox.New()
	router.Use(fox.Logger())

	router.GET("/console", func(ctx *fox.Context) string {
		log := logger.NewWithContext(ctx.Context)
		log.Info("Processing console logging request")
		log.Debug("This is a debug message (won't show at Info level)")
		return "Check console for logs"
	})

	// 取消注释以运行
	// router.Run(":8080")
}

// 示例 2: 带轮转的文件日志
func example2FileLogging() {
	logger.SetConfig(&logger.Config{
		LogLevel:              logger.InfoLevel,
		ConsoleLoggingEnabled: false,
		FileLoggingEnabled:    true,
		Filename:              "./logs/app.log",
		MaxSize:               10, // 兆字节
		MaxBackups:            3,  // 备份数量
		MaxAge:                7,  // 天数
		EncodeLogsAsJSON:      false,
	})

	router := fox.New()
	router.Use(fox.Logger())

	router.GET("/file", func(ctx *fox.Context) string {
		log := logger.NewWithContext(ctx.Context)
		log.Info("This will be written to file")
		return "Check ./logs/app.log for logs"
	})

	// 取消注释以运行
	// router.Run(":8081")
}

// 示例 3: 控制台和文件日志(生产模式)
func example3BothOutputs() {
	logger.SetConfig(&logger.Config{
		LogLevel:              logger.InfoLevel,
		ConsoleLoggingEnabled: true,
		FileLoggingEnabled:    true,
		Filename:              "./logs/production.log",
		MaxSize:               50,   // 轮转前 50MB
		MaxBackups:            10,   // 保留 10 个备份文件
		MaxAge:                30,   // 保留日志 30 天
		EncodeLogsAsJSON:      true, // JSON 格式用于解析
	})

	router := fox.New()
	router.Use(fox.Logger())

	router.GET("/both", func(ctx *fox.Context) string {
		log := logger.NewWithContext(ctx.Context)
		log.Info("Logged to both console and file")
		return "Check both console and file"
	})

	// 取消注释以运行
	// router.Run(":8082")
}

// 示例 4: JSON 格式日志(用于日志聚合)
func example4JSONLogs() {
	logger.SetConfig(&logger.Config{
		LogLevel:              logger.DebugLevel,
		ConsoleLoggingEnabled: true,
		EncodeLogsAsJSON:      true, // JSON 格式
	})

	router := fox.New()
	router.Use(fox.Logger())

	router.GET("/json", func(ctx *fox.Context) map[string]any {
		log := logger.NewWithContext(ctx.Context)

		log.Info("User action logged")
		log.WithFields(map[string]any{
			"user_id": 123,
			"action":  "view_profile",
		}).Info("Structured logging example")

		return map[string]any{
			"message": "Check console for JSON logs",
		}
	})

	// 取消注释以运行
	// router.Run(":8083")
}

// 示例 5: 不同的日志级别
func example5LogLevels() {
	// 设置为 Debug 以查看所有消息
	logger.SetConfig(&logger.Config{
		LogLevel:              logger.DebugLevel,
		ConsoleLoggingEnabled: true,
		EncodeLogsAsJSON:      false,
	})

	router := fox.New()

	// 跳过健康检查端点的日志
	router.Use(fox.Logger(fox.LoggerConfig{
		SkipPaths: []string{"/health"},
	}))

	router.GET("/levels", func(ctx *fox.Context) string {
		log := logger.NewWithContext(ctx.Context)

		log.Debug("Debug level - debugging info")
		log.Info("Info level - general info")
		log.Warn("Warn level - warning message")
		log.Error("Error level - error occurred")

		return "Check console for different log levels"
	})

	router.GET("/health", func() string {
		return "OK" // 此端点不会被记录
	})

	// 取消注释以运行
	// router.Run(":8084")
}

// 完整的生产示例
func productionExample() {
	// 生产配置
	logger.SetConfig(&logger.Config{
		LogLevel:              logger.InfoLevel, // 生产环境不记录 Debug
		ConsoleLoggingEnabled: true,
		FileLoggingEnabled:    true,
		Filename:              "/var/log/myapp/app.log",
		MaxSize:               100,  // 100MB
		MaxBackups:            30,   // 保留 30 个备份
		MaxAge:                90,   // 90 天保留期
		EncodeLogsAsJSON:      true, // JSON 用于日志聚合(ELK、Splunk 等)
	})

	router := fox.New()

	// 全局中间件
	router.Use(fox.Logger(fox.LoggerConfig{
		SkipPaths: []string{
			"/health",
			"/readiness",
			"/metrics",
		},
	}))
	router.Use(fox.NewXResponseTimer())

	// 业务路由
	router.POST("/api/users", func(ctx *fox.Context) (map[string]any, error) {
		log := logger.NewWithContext(ctx.Context)

		log.Info("Creating new user")

		// 带字段的结构化日志
		log.WithFields(map[string]any{
			"user_id":   123,
			"user_type": "premium",
		}).Info("User created successfully")

		return map[string]any{
			"id":      123,
			"message": "User created",
		}, nil
	})

	// 错误日志示例
	router.GET("/api/error", func(ctx *fox.Context) (string, error) {
		log := logger.NewWithContext(ctx.Context)

		err := os.ErrNotExist
		log.WithError(err).Error("File not found")

		return "", err
	})

	if err := router.Run(":8080"); err != nil {
		panic(err)
	}
}
```

## 运行示例

```bash
go run main.go
```

## 配置选项

### 开发模式

仅控制台日志,人类可读格式:

```go
logger.SetConfig(&logger.Config{
    LogLevel:              logger.DebugLevel,
    ConsoleLoggingEnabled: true,
    EncodeLogsAsJSON:      false,
})
```

### 生产模式(仅控制台)

Info 级别,JSON 编码用于日志聚合:

```go
logger.SetConfig(&logger.Config{
    LogLevel:              logger.InfoLevel,
    ConsoleLoggingEnabled: true,
    EncodeLogsAsJSON:      true,
})
```

### 生产模式(文件 + 控制台)

轮转文件日志和控制台输出:

```go
logger.SetConfig(&logger.Config{
    LogLevel:              logger.InfoLevel,
    ConsoleLoggingEnabled: true,
    FileLoggingEnabled:    true,
    Filename:              "./logs/app.log",
    MaxSize:               100,  // 100MB
    MaxBackups:            30,   // 保留 30 个备份
    MaxAge:                90,   // 90 天
    EncodeLogsAsJSON:      true,
})
```

### 高性能模式

高流量应用的最小日志:

```go
logger.SetConfig(&logger.Config{
    LogLevel:              logger.WarnLevel, // 仅警告和错误
    ConsoleLoggingEnabled: false,
    FileLoggingEnabled:    true,
    Filename:              "./logs/app.log",
    EncodeLogsAsJSON:      true,
})
```

## 日志级别

Fox 支持这些日志级别(从低到高):

- `logger.DebugLevel` - 详细的调试信息
- `logger.InfoLevel` - 一般信息性消息
- `logger.WarnLevel` - 警告消息
- `logger.ErrorLevel` - 错误消息
- `logger.FatalLevel` - 致命错误(调用 os.Exit(1))
- `logger.PanicLevel` - Panic 消息(调用 panic())

## 结构化日志

向日志消息添加上下文字段:

```go
log := logger.NewWithContext(ctx.Context)

log.WithFields(map[string]any{
    "user_id": 123,
    "action":  "login",
    "ip":      "192.168.1.1",
}).Info("User logged in")
```

## 跳过路径

从日志中排除某些端点:

```go
router.Use(fox.Logger(fox.LoggerConfig{
    SkipPaths: []string{
        "/health",
        "/readiness",
        "/metrics",
    },
}))
```

## 请求上下文

Fox 自动为每个请求添加 TraceID 以便关联:

```go
log := logger.NewWithContext(ctx.Context)
// TraceID 自动包含在所有日志消息中
log.Info("Processing request")
```

## 文件轮转

日志使用 lumberjack 自动轮转:

- `MaxSize` - 轮转前的最大大小(兆字节)
- `MaxBackups` - 保留的旧日志文件最大数量
- `MaxAge` - 保留旧日志文件的最大天数

## 日志聚合

对于生产环境,使用 JSON 格式配合日志聚合系统:

### ELK Stack

```go
logger.SetConfig(&logger.Config{
    EncodeLogsAsJSON: true,
    FileLoggingEnabled: true,
    Filename: "/var/log/myapp/app.log",
})
```

配置 Filebeat 将日志发送到 Elasticsearch。

### Splunk

```go
logger.SetConfig(&logger.Config{
    EncodeLogsAsJSON: true,
    ConsoleLoggingEnabled: true,
})
```

配置 Splunk Universal Forwarder 收集日志。

### AWS CloudWatch

```go
logger.SetConfig(&logger.Config{
    EncodeLogsAsJSON: true,
    ConsoleLoggingEnabled: true, // CloudWatch 从 stdout 收集
})
```

使用 CloudWatch Logs 代理或 ECS 日志驱动。

## 最佳实践

1. **使用结构化日志**: 添加上下文字段以提高可搜索性
2. **选择适当的日志级别**: 开发使用 Debug,生产使用 Info/Warn
3. **轮转日志**: 配置轮转以防止磁盘空间问题
4. **生产使用 JSON**: 为日志聚合系统使用 JSON 格式
5. **跳过健康检查**: 排除健康检查端点以减少噪音
6. **包含上下文**: 始终使用 `logger.NewWithContext(ctx.Context)` 获取 TraceID
7. **避免敏感数据**: 永远不要记录密码、令牌或个人数据
8. **性能**: 更高的日志级别(Warn/Error)减少开销

## 下一步

- [中间件](/zh-cn/examples/middleware/) - 在中间件中使用日志记录器
- [错误处理](/zh-cn/examples/error-handling/) - 有效记录错误
- [日志文档](/zh-cn/features/logging/) - 了解更多关于日志的信息
