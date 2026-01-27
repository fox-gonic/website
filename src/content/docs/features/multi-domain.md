---
title: Multi-Domain Routing
description: Route traffic based on domain names
head: []
---

# Multi-Domain Routing

Fox supports routing based on domain names, allowing you to host multiple services or APIs on different domains using a single application instance.

## Basic Usage

### Exact Domain Matching

```go
r := fox.Default()

// Route for api.example.com
r.Domain("api.example.com").GET("/users", func() ([]User, error) {
    return getUsers()
})

// Route for admin.example.com
r.Domain("admin.example.com").GET("/dashboard", func() (Dashboard, error) {
    return getDashboard()
})

// Default route (any domain)
r.GET("/health", func() string {
    return "OK"
})
```

### Wildcard Domains

Use wildcards to match subdomains:

```go
// Match any subdomain of example.com
r.Domain("*.example.com").GET("/info", func(c *gin.Context) (any, error) {
    host := c.Request.Host
    return map[string]string{
        "message": "Subdomain: " + host,
    }, nil
})
```

## Pattern Matching

### Regex Patterns

Use regex for complex domain matching:

```go
// Match domains like tenant1.app.com, tenant2.app.com
r.DomainRegex(`^([a-z0-9]+)\.app\.com$`).GET("/", func(c *gin.Context) (any, error) {
    matches := r.GetDomainMatches(c)
    tenantID := matches[1] // Extract tenant ID from domain

    return map[string]string{
        "tenant": tenantID,
    }, nil
})
```

### Multiple Domains

Route the same handler to multiple domains:

```go
domains := []string{"api.example.com", "api.example.net", "api.example.org"}

for _, domain := range domains {
    r.Domain(domain).GET("/status", statusHandler)
}
```

## Multi-Tenant Applications

Build SaaS applications with tenant isolation:

```go
type TenantMiddleware struct {
    tenantRepo TenantRepository
}

func (m *TenantMiddleware) Handler() gin.HandlerFunc {
    return func(c *gin.Context) {
        host := c.Request.Host
        tenant, err := m.tenantRepo.GetByDomain(host)
        if err != nil {
            c.JSON(404, gin.H{"error": "Tenant not found"})
            c.Abort()
            return
        }

        c.Set("tenant", tenant)
        c.Next()
    }
}

func main() {
    r := fox.Default()

    tenantMW := &TenantMiddleware{tenantRepo: repo}

    // Apply middleware to all tenant domains
    tenants := r.Group("")
    tenants.Use(tenantMW.Handler())
    {
        tenants.GET("/api/data", func(c *gin.Context) (any, error) {
            tenant := c.MustGet("tenant").(*Tenant)
            return getTenantData(tenant.ID)
        })
    }

    r.Run(":8080")
}
```

## API Versioning by Domain

Host different API versions on different subdomains:

```go
r := fox.Default()

// v1.api.example.com
v1 := r.Domain("v1.api.example.com")
v1.GET("/users", getUsersV1)
v1.POST("/users", createUserV1)

// v2.api.example.com
v2 := r.Domain("v2.api.example.com")
v2.GET("/users", getUsersV2)
v2.POST("/users", createUserV2)
```

## Environment-Based Routing

Route based on environment:

```go
r := fox.Default()

if os.Getenv("ENV") == "production" {
    r.Domain("api.example.com").GET("/", prodHandler)
} else {
    r.Domain("api-staging.example.com").GET("/", stagingHandler)
    r.Domain("localhost").GET("/", devHandler)
}
```

## Domain Groups

Group routes by domain with shared middleware:

```go
r := fox.Default()

// Admin domain with auth middleware
admin := r.Domain("admin.example.com")
admin.Use(authMiddleware())
{
    admin.GET("/dashboard", dashboardHandler)
    admin.GET("/users", listUsersHandler)
    admin.POST("/users", createUserHandler)
}

// Public API domain
api := r.Domain("api.example.com")
api.Use(rateLimitMiddleware())
{
    api.GET("/public/data", publicDataHandler)
}
```

## Testing Multi-Domain Routes

```go
func TestDomainRouting(t *testing.T) {
    r := fox.Default()

    r.Domain("api.example.com").GET("/test", func() string {
        return "API"
    })

    r.Domain("admin.example.com").GET("/test", func() string {
        return "Admin"
    })

    // Test API domain
    w := httptest.NewRecorder()
    req, _ := http.NewRequest("GET", "/test", nil)
    req.Host = "api.example.com"
    r.ServeHTTP(w, req)

    assert.Equal(t, 200, w.Code)
    assert.Equal(t, "API", w.Body.String())

    // Test Admin domain
    w = httptest.NewRecorder()
    req, _ = http.NewRequest("GET", "/test", nil)
    req.Host = "admin.example.com"
    r.ServeHTTP(w, req)

    assert.Equal(t, 200, w.Code)
    assert.Equal(t, "Admin", w.Body.String())
}
```

## Best Practices

1. **Use exact matching when possible** - More performant than regex
2. **Validate domain input** - Prevent security issues with domain injection
3. **Consider DNS configuration** - Ensure DNS records point to your server
4. **Handle default case** - Provide fallback routes for unknown domains
5. **Document domain structure** - Maintain clear documentation of domain routing

## Configuration Example

```go
type DomainConfig struct {
    API   string `env:"API_DOMAIN" default:"api.example.com"`
    Admin string `env:"ADMIN_DOMAIN" default:"admin.example.com"`
    Web   string `env:"WEB_DOMAIN" default:"www.example.com"`
}

func setupRoutes(r *fox.Router, cfg DomainConfig) {
    r.Domain(cfg.API).GET("/v1/users", apiHandler)
    r.Domain(cfg.Admin).GET("/dashboard", adminHandler)
    r.Domain(cfg.Web).GET("/", webHandler)
}
```

## Next Steps

- [Middleware](/features/middleware/) - Apply middleware to domain groups
- [Structured Logging](/features/logging/) - Log domain information
