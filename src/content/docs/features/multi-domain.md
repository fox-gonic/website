---
title: Multi-Domain Routing
description: Route traffic based on domain names
head: []
---

Fox routes by domain with `DomainEngine`. A `DomainEngine` owns a fallback `*fox.Engine` and a list of domain-specific sub-engines. Requests are matched against registered domains in registration order; if no domain matches, the fallback engine handles the request.

## Basic Usage

```go
de := fox.NewDomainEngine()

de.Domain("api.example.com", func(api *fox.Engine) {
    api.GET("/users", func() ([]User, error) {
        return getUsers()
    })
})

de.Domain("admin.example.com", func(admin *fox.Engine) {
    admin.GET("/dashboard", func() (Dashboard, error) {
        return getDashboard()
    })
})

de.GET("/health", func() string {
    return "OK"
})

de.Run(":8080")
```

## Regex Domains

Fox does not implement wildcard syntax such as `"*.example.com"`. Use `DomainRegexp` for subdomain patterns:

```go
de.DomainRegexp(`^[^.]+\.example\.com$`, func(app *fox.Engine) {
    app.GET("/info", func(ctx *fox.Context) map[string]string {
        return map[string]string{
            "host": ctx.Request.Host,
        }
    })
})
```

The regular expression is matched against the host after Fox strips the port. Captured groups are not stored on the context, so parse `ctx.Request.Host` yourself if you need the tenant or subdomain value.

## Multi-Tenant Applications

```go
de := fox.NewDomainEngine()

de.DomainRegexp(`^[a-z0-9-]+\.app\.example\.com$`, func(tenant *fox.Engine) {
    tenant.Use(func(c *gin.Context) {
        host := c.Request.Host
        if i := strings.Index(host, ":"); i >= 0 {
            host = host[:i]
        }

        tenantID := strings.TrimSuffix(host, ".app.example.com")
        c.Set("tenant_id", tenantID)
        c.Next()
    })

    tenant.GET("/api/data", func(ctx *fox.Context) map[string]any {
        tenantID, _ := ctx.Get("tenant_id")
        return map[string]any{
            "tenant_id": tenantID,
        }
    })
})
```

## API Versioning by Domain

```go
de := fox.NewDomainEngine()

de.Domain("v1.api.example.com", func(v1 *fox.Engine) {
    v1.GET("/users", getUsersV1)
    v1.POST("/users", createUserV1)
})

de.Domain("v2.api.example.com", func(v2 *fox.Engine) {
    v2.GET("/users", getUsersV2)
    v2.POST("/users", createUserV2)
})
```

## Environment-Based Routing

```go
de := fox.NewDomainEngine()

if os.Getenv("ENV") == "production" {
    de.Domain("api.example.com", func(api *fox.Engine) {
        api.GET("/", prodHandler)
    })
} else {
    de.Domain("api-staging.example.com", func(api *fox.Engine) {
        api.GET("/", stagingHandler)
    })
    de.Domain("localhost", func(local *fox.Engine) {
        local.GET("/", devHandler)
    })
}
```

## Testing Multi-Domain Routes

```go
func TestDomainRouting(t *testing.T) {
    de := fox.NewDomainEngine()

    de.Domain("api.example.com", func(api *fox.Engine) {
        api.GET("/test", func() string {
            return "API"
        })
    })

    de.Domain("admin.example.com", func(admin *fox.Engine) {
        admin.GET("/test", func() string {
            return "Admin"
        })
    })

    w := httptest.NewRecorder()
    req, _ := http.NewRequest("GET", "/test", nil)
    req.Host = "api.example.com"
    de.ServeHTTP(w, req)

    assert.Equal(t, 200, w.Code)
    assert.Equal(t, "API", w.Body.String())

    w = httptest.NewRecorder()
    req, _ = http.NewRequest("GET", "/test", nil)
    req.Host = "admin.example.com"
    de.ServeHTTP(w, req)

    assert.Equal(t, 200, w.Code)
    assert.Equal(t, "Admin", w.Body.String())
}
```

## Matching Rules

1. Exact domains and regex domains are checked in the order they were registered.
2. Host ports are stripped before matching.
3. Exact matching is case-sensitive because Fox compares strings directly.
4. `DomainRegexp` panics during registration if the pattern cannot compile.
5. Fallback routes on the `DomainEngine` handle requests that do not match any registered domain.

## Configuration Example

```go
type DomainConfig struct {
    API   string
    Admin string
    Web   string
}

func setupRoutes(de *fox.DomainEngine, cfg DomainConfig) {
    de.Domain(cfg.API, func(api *fox.Engine) {
        api.GET("/v1/users", apiHandler)
    })

    de.Domain(cfg.Admin, func(admin *fox.Engine) {
        admin.GET("/dashboard", adminHandler)
    })

    de.Domain(cfg.Web, func(web *fox.Engine) {
        web.GET("/", webHandler)
    })
}
```

## Next Steps

- [Domain Routing Example](/examples/domain-routing/) - Complete runnable example
- [Middleware](/examples/middleware/) - Apply middleware to domain engines
