---
title: Domain Routing
description: Multi-domain routing with exact and pattern matching
head: []
---

# Domain Routing

This example demonstrates how to route requests based on the domain name, enabling multi-tenant applications, API gateways, and environment-specific routing.

## Features

- Exact domain matching
- Regex domain pattern matching
- Wildcard subdomain routing
- Default/fallback routing
- Multi-tenant applications support

## Complete Example

```go
package main

import (
	"github.com/fox-gonic/fox"
)

func main() {
	// Create domain engine
	de := fox.NewDomainEngine()

	// API domain: api.example.com
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

	// Admin domain: admin.example.com
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

	// Regex domain pattern: *.staging.example.com
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

	// Regex domain pattern: subdomain pattern
	de.DomainRegexp(`^[a-z0-9]+\.app\.example\.com$`, func(appRouter *fox.Engine) {
		appRouter.GET("/", func(ctx *fox.Context) map[string]any {
			return map[string]any{
				"type":   "tenant app",
				"tenant": ctx.Request.Host,
			}
		})

		appRouter.GET("/tenant-info", func(ctx *fox.Context) map[string]any {
			// Extract tenant from subdomain
			host := ctx.Request.Host
			return map[string]any{
				"tenant": host,
				"status": "active",
			}
		})
	})

	// Default domain (fallback) - www.example.com or example.com
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

	// Start server
	if err := de.Run(":8080"); err != nil {
		panic(err)
	}
}
```

## Running the Example

```bash
go run main.go
```

## Testing

### Option 1: Modify /etc/hosts

Add these entries to your `/etc/hosts` file:

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

Then test with:

```bash
curl http://api.example.com:8080/
curl http://admin.example.com:8080/dashboard
curl http://app1.staging.example.com:8080/
curl http://tenant1.app.example.com:8080/tenant-info
```

### Option 2: Use curl with Host header

```bash
# API domain
curl http://localhost:8080/ -H "Host: api.example.com"
curl http://localhost:8080/users -H "Host: api.example.com"

# Admin domain
curl http://localhost:8080/ -H "Host: admin.example.com"
curl http://localhost:8080/dashboard -H "Host: admin.example.com"

# Staging pattern (any subdomain)
curl http://localhost:8080/ -H "Host: app1.staging.example.com"
curl http://localhost:8080/info -H "Host: app2.staging.example.com"

# Tenant pattern
curl http://localhost:8080/ -H "Host: tenant1.app.example.com"
curl http://localhost:8080/tenant-info -H "Host: tenant2.app.example.com"

# Default domain
curl http://localhost:8080/
curl http://localhost:8080/about -H "Host: www.example.com"
```

## Domain Matching Priority

When multiple domain patterns could match, Fox uses this priority:

1. **Exact domain match** (first registered wins)
2. **Regex domain match** (first registered that matches)
3. **Default/fallback routes**

Example:
```go
de.Domain("api.example.com", ...)           // Priority 1
de.DomainRegexp(`^.*\.example\.com$`, ...) // Priority 2
de.GET("/", ...)                            // Priority 3 (fallback)
```

## Use Cases

### API Gateway

Route different services by domain:
```go
de.Domain("api.example.com", apiService)
de.Domain("auth.example.com", authService)
de.Domain("payment.example.com", paymentService)
```

### Multi-tenant SaaS

Route tenants by subdomain:
```go
de.DomainRegexp(`^[a-z0-9]+\.myapp\.com$`, tenantHandler)
```

### Environment Separation

Separate staging/production by domain:
```go
de.DomainRegexp(`^.*\.staging\.example\.com$`, stagingEnv)
de.DomainRegexp(`^.*\.prod\.example\.com$`, prodEnv)
```

### Microservices Routing

Route different microservices:
```go
de.Domain("users.service.local", usersService)
de.Domain("orders.service.local", ordersService)
de.Domain("inventory.service.local", inventoryService)
```

## Tips

- Domain matching is **case-insensitive**
- Port numbers are automatically stripped from the Host header
- Use `^` and `$` in regex patterns to match the entire domain
- Regex patterns are compiled once at startup for performance
- Exact domain matches are faster than regex patterns

## Next Steps

- [Middleware](/examples/middleware/) - Apply middleware per domain
- [Error Handling](/examples/error-handling/) - Handle domain-specific errors
- [Routing Documentation](/features/routing/) - Learn more about routing
