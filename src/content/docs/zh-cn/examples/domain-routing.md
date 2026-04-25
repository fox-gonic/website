---
title: 域名路由
description: 支持精确和模式匹配的多域名路由
head: []
---

本示例演示如何基于域名路由请求,支持多租户应用、API 网关和特定环境路由。

## 功能特性

- 精确域名匹配
- 正则表达式域名模式匹配
- 正则子域名路由
- 默认/回退路由
- 多租户应用支持

## 完整示例

```go
package main

import (
	"github.com/fox-gonic/fox"
)

func main() {
	// 创建域名引擎
	de := fox.NewDomainEngine()

	// API 域名: api.example.com
	de.Domain("api.example.com", func(apiRouter *fox.Engine) {
		apiRouter.GET("/", func() map[string]string {
			return map[string]string{
				"domain":  "api.example.com",
				"service": "API",
			}
		})

		apiRouter.GET("/users", func() map[string]any {
			return map[string]any{
				"users": []map[string]any{
					{"id": 1, "name": "Alice"},
					{"id": 2, "name": "Bob"},
				},
			}
		})

		apiRouter.GET("/status", func() map[string]string {
			return map[string]string{
				"status": "API service running",
			}
		})
	})

	// 管理域名: admin.example.com
	de.Domain("admin.example.com", func(adminRouter *fox.Engine) {
		adminRouter.GET("/", func() map[string]string {
			return map[string]string{
				"domain":  "admin.example.com",
				"service": "Admin Panel",
			}
		})

		adminRouter.GET("/dashboard", func() map[string]any {
			return map[string]any{
				"title": "Admin Dashboard",
				"stats": map[string]int{
					"users":  1500,
					"orders": 3200,
				},
			}
		})

		adminRouter.GET("/settings", func() map[string]string {
			return map[string]string{
				"page": "settings",
			}
		})
	})

	// 正则域名模式: *.staging.example.com
	de.DomainRegexp(`^.*\.staging\.example\.com$`, func(stagingRouter *fox.Engine) {
		stagingRouter.GET("/", func(ctx *fox.Context) map[string]any {
			return map[string]any{
				"environment": "staging",
				"host":        ctx.Request.Host,
			}
		})

		stagingRouter.GET("/info", func(ctx *fox.Context) map[string]any {
			return map[string]any{
				"environment": "staging",
				"message":     "This is a staging environment",
				"subdomain":   ctx.Request.Host,
			}
		})
	})

	// 正则域名模式: 子域名模式
	de.DomainRegexp(`^[a-z0-9]+\.app\.example\.com$`, func(appRouter *fox.Engine) {
		appRouter.GET("/", func(ctx *fox.Context) map[string]any {
			return map[string]any{
				"type":   "tenant app",
				"tenant": ctx.Request.Host,
			}
		})

		appRouter.GET("/tenant-info", func(ctx *fox.Context) map[string]any {
			// 从子域名提取租户
			host := ctx.Request.Host
			return map[string]any{
				"tenant": host,
				"status": "active",
			}
		})
	})

	// 默认域名(回退) - www.example.com 或 example.com
	de.GET("/", func() map[string]string {
		return map[string]string{
			"domain":  "default",
			"service": "Main Website",
		}
	})

	de.GET("/about", func() map[string]string {
		return map[string]string{
			"page": "about",
			"info": "Main website about page",
		}
	})

	de.GET("/contact", func() map[string]string {
		return map[string]string{
			"page":  "contact",
			"email": "contact@example.com",
		}
	})

	// 启动服务器
	if err := de.Run(":8080"); err != nil {
		panic(err)
	}
}
```

## 运行示例

```bash
go run main.go
```

## 测试

### 方法 1: 修改 /etc/hosts

在 `/etc/hosts` 文件中添加这些条目:

```
127.0.0.1 api.example.com
127.0.0.1 admin.example.com
127.0.0.1 app1.staging.example.com
127.0.0.1 app2.staging.example.com
127.0.0.1 tenant1.app.example.com
127.0.0.1 tenant2.app.example.com
127.0.0.1 www.example.com
127.0.0.1 example.com
```

然后进行测试:

```bash
curl http://api.example.com:8080/
curl http://admin.example.com:8080/dashboard
curl http://app1.staging.example.com:8080/
curl http://tenant1.app.example.com:8080/tenant-info
```

### 方法 2: 使用 curl 的 Host 头

```bash
# API 域名
curl http://localhost:8080/ -H "Host: api.example.com"
curl http://localhost:8080/users -H "Host: api.example.com"

# 管理域名
curl http://localhost:8080/ -H "Host: admin.example.com"
curl http://localhost:8080/dashboard -H "Host: admin.example.com"

# 预发布模式(任意子域名)
curl http://localhost:8080/ -H "Host: app1.staging.example.com"
curl http://localhost:8080/info -H "Host: app2.staging.example.com"

# 租户模式
curl http://localhost:8080/ -H "Host: tenant1.app.example.com"
curl http://localhost:8080/tenant-info -H "Host: tenant2.app.example.com"

# 默认域名
curl http://localhost:8080/
curl http://localhost:8080/about -H "Host: www.example.com"
```

## 域名匹配优先级

当多个域名模式可以匹配时,Fox 使用以下优先级:

1. **精确域名匹配**(首先注册的获胜)
2. **正则域名匹配**(首先注册且匹配的)
3. **默认/回退路由**

示例:
```go
de.Domain("api.example.com", ...)           // 优先级 1
de.DomainRegexp(`^.*\.example\.com$`, ...) // 优先级 2
de.GET("/", ...)                            // 优先级 3(回退)
```

## 使用场景

### API 网关

按域名路由不同的服务:
```go
de.Domain("api.example.com", apiService)
de.Domain("auth.example.com", authService)
de.Domain("payment.example.com", paymentService)
```

### 多租户 SaaS

按子域名路由租户:
```go
de.DomainRegexp(`^[a-z0-9]+\.myapp\.com$`, tenantHandler)
```

### 环境分离

按域名分离预发布/生产环境:
```go
de.DomainRegexp(`^.*\.staging\.example\.com$`, stagingEnv)
de.DomainRegexp(`^.*\.prod\.example\.com$`, prodEnv)
```

### 微服务路由

路由不同的微服务:
```go
de.Domain("users.service.local", usersService)
de.Domain("orders.service.local", ordersService)
de.Domain("inventory.service.local", inventoryService)
```

## 提示

- 精确域名匹配**区分大小写**
- 端口号会自动从 Host 头中剥离
- 在正则模式中使用 `^` 和 `$` 来匹配整个域名
- 正则模式在启动时编译一次以提高性能
- 精确域名匹配比正则模式更快

## 下一步

- [中间件](/zh-cn/examples/middleware/) - 为每个域名应用中间件
- [错误处理](/zh-cn/examples/error-handling/) - 处理特定域名的错误
- [路由文档](/zh-cn/features/routing/) - 了解更多关于路由的信息
