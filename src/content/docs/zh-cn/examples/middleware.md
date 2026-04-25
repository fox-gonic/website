---
title: 中间件
description: 使用中间件处理请求
head: []
---

本示例演示如何在 Fox 中使用中间件来处理跨切面关注点,如身份验证、日志记录、速率限制和请求跟踪。

## 功能特性

- 内置中间件(Logger、ResponseTime、Recovery)
- 自定义身份验证中间件
- 自定义速率限制中间件
- 请求 ID 中间件
- 路由特定中间件
- 中间件组

## 完整示例

```go
package main

import (
	"strconv"
	"time"

	"github.com/fox-gonic/fox"
)

// AuthMiddleware 模拟身份验证
func AuthMiddleware() func(*fox.Context) {
	return func(c *fox.Context) {
		token := c.GetHeader("Authorization")

		if token == "" {
			c.AbortWithStatusJSON(401, map[string]string{
				"error": "unauthorized",
				"code":  "MISSING_TOKEN",
			})
			return
		}

		if token != "Bearer valid-token" {
			c.AbortWithStatusJSON(401, map[string]string{
				"error": "unauthorized",
				"code":  "INVALID_TOKEN",
			})
			return
		}

		// 在上下文中设置用户信息
		c.Set("user_id", 123)
		c.Set("username", "alice")

		c.Next()
	}
}

// RateLimitMiddleware 模拟速率限制
func RateLimitMiddleware() func(*fox.Context) {
	// 在生产环境中,使用真正的速率限制器
	lastRequest := make(map[string]time.Time)

	return func(c *fox.Context) {
		clientIP := c.ClientIP()

		if last, exists := lastRequest[clientIP]; exists {
			if time.Since(last) < time.Second {
				c.AbortWithStatusJSON(429, map[string]string{
					"error": "rate limit exceeded",
					"code":  "RATE_LIMIT",
				})
				return
			}
		}

		lastRequest[clientIP] = time.Now()
		c.Next()
	}
}

// RequestIDMiddleware 向上下文添加请求 ID
func RequestIDMiddleware() func(*fox.Context) {
	return func(c *fox.Context) {
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = strconv.FormatInt(time.Now().UnixNano(), 10)
		}

		c.Set("request_id", requestID)
		c.Header("X-Request-ID", requestID)

		c.Next()
	}
}

func main() {
	router := fox.New()

	// 全局中间件
	router.Use(fox.Logger())            // 请求日志
	router.Use(fox.NewXResponseTimer()) // 响应时间跟踪
	router.Use(RequestIDMiddleware())   // 请求 ID
	router.Use(fox.Recovery())          // Panic 恢复

	// 公共路由(无需身份验证)
	router.GET("/", func() string {
		return "Welcome to Fox API"
	})

	router.GET("/health", func() map[string]string {
		return map[string]string{
			"status": "healthy",
		}
	})

	// 受保护的路由(需要身份验证)
	protected := router.Group("/api")
	protected.Use(AuthMiddleware())
	{
		protected.GET("/profile", func(ctx *fox.Context) map[string]any {
			userID, _ := ctx.Get("user_id")
			username, _ := ctx.Get("username")

			return map[string]any{
				"user_id":  userID,
				"username": username,
			}
		})

		protected.GET("/data", func(ctx *fox.Context) map[string]any {
			requestID, _ := ctx.Get("request_id")

			return map[string]any{
				"request_id": requestID,
				"data":       []string{"item1", "item2", "item3"},
			}
		})
	}

	// 速率限制路由
	limited := router.Group("/limited")
	limited.Use(RateLimitMiddleware())
	{
		limited.GET("/resource", func() string {
			return "Rate limited resource"
		})
	}

	// 特定路由的自定义中间件
	router.GET("/special", func(c *fox.Context) {
		c.Set("special", true)
		c.Next()
	}, func(ctx *fox.Context) map[string]any {
		special, _ := ctx.Get("special")
		return map[string]any{
			"special": special,
			"message": "This route has custom middleware",
		}
	})

	// 日志配置示例
	router.GET("/with-logger", fox.Logger(fox.LoggerConfig{
		SkipPaths: []string{"/health"},
	}), func(ctx *fox.Context) string {
		// 从上下文获取日志记录器
		ctx.Logger.Info("Processing request with custom logger config")
		return "Logged"
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

## 测试

### 公共路由

```bash
curl http://localhost:8080/
```

### 受保护的路由(无令牌)

```bash
curl http://localhost:8080/api/profile
# 返回 401 Unauthorized
```

### 受保护的路由(有令牌)

```bash
curl http://localhost:8080/api/profile \
  -H "Authorization: Bearer valid-token"
```

### 速率限制路由

```bash
# 第一个请求成功
curl http://localhost:8080/limited/resource

# 立即发送第二个请求失败
curl http://localhost:8080/limited/resource
# 返回 429 Rate Limit Exceeded
```

### 带自定义中间件的路由

```bash
curl http://localhost:8080/special
```

## 中间件执行顺序

中间件按注册顺序执行:

1. **全局中间件** 首先执行(按 `Use()` 的顺序)
2. **组中间件** 其次执行
3. **路由特定中间件** 最后执行

示例流程:
```
Logger → ResponseTimer → RequestID → Recovery → AuthMiddleware → Handler
```

## 创建自定义中间件

```go
func MyMiddleware() func(*fox.Context) {
    return func(c *fox.Context) {
        // 请求前
        start := time.Now()

        // 处理请求
        c.Next()

        // 请求后
        latency := time.Since(start)
        c.Header("X-Response-Time", latency.String())
    }
}
```

## 中止请求

使用 `c.AbortWithStatusJSON()` 停止中间件链:

```go
if !authorized {
    c.AbortWithStatusJSON(401, map[string]string{
        "error": "unauthorized",
    })
    return
}
```

## 内置中间件

Fox 提供了几个内置中间件:

- `fox.Logger()` - 请求日志
- `fox.NewXResponseTimer()` - 响应时间跟踪
- `fox.Recovery()` - Panic 恢复
- `fox.Logger(config)` - 带配置的日志记录器

## 下一步

- [错误处理](/zh-cn/examples/error-handling/) - 在中间件中处理错误
- [日志配置](/zh-cn/examples/logger-config/) - 高级日志配置
- [中间件文档](/zh-cn/features/middleware/) - 了解更多关于中间件的信息
