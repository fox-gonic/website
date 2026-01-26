---
title: 多域名路由
description: 基于域名的流量路由
head: []
---

# 多域名路由

Fox 支持基于域名的路由，允许您在不同域名上使用单个应用实例托管多个服务或 API。

## 基本用法

### 精确域名匹配

```go
r := fox.Default()

// api.example.com 的路由
r.Domain("api.example.com").GET("/users", func() ([]User, error) {
    return getUsers()
})

// admin.example.com 的路由
r.Domain("admin.example.com").GET("/dashboard", func() (Dashboard, error) {
    return getDashboard()
})

// 默认路由（任何域名）
r.GET("/health", func() string {
    return "OK"
})
```

### 通配符域名

使用通配符匹配子域名：

```go
// 匹配 example.com 的任何子域名
r.Domain("*.example.com").GET("/info", func(c *gin.Context) (any, error) {
    host := c.Request.Host
    return map[string]string{
        "message": "子域名: " + host,
    }, nil
})
```

## 模式匹配

### 正则表达式

使用正则表达式进行复杂的域名匹配：

```go
// 匹配像 tenant1.app.com、tenant2.app.com 这样的域名
r.DomainRegex(`^([a-z0-9]+)\.app\.com$`).GET("/", func(c *gin.Context) (any, error) {
    matches := r.GetDomainMatches(c)
    tenantID := matches[1] // 从域名中提取租户 ID

    return map[string]string{
        "tenant": tenantID,
    }, nil
})
```

### 多个域名

将同一处理器路由到多个域名：

```go
domains := []string{"api.example.com", "api.example.net", "api.example.org"}

for _, domain := range domains {
    r.Domain(domain).GET("/status", statusHandler)
}
```

## 多租户应用

构建具有租户隔离的 SaaS 应用：

```go
type TenantMiddleware struct {
    tenantRepo TenantRepository
}

func (m *TenantMiddleware) Handler() gin.HandlerFunc {
    return func(c *gin.Context) {
        host := c.Request.Host
        tenant, err := m.tenantRepo.GetByDomain(host)
        if err != nil {
            c.JSON(404, gin.H{"error": "租户未找到"})
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

    // 对所有租户域应用中间件
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

## 基于域名的 API 版本控制

在不同子域名上托管不同的 API 版本：

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

## 基于环境的路由

基于环境进行路由：

```go
r := fox.Default()

if os.Getenv("ENV") == "production" {
    r.Domain("api.example.com").GET("/", prodHandler)
} else {
    r.Domain("api-staging.example.com").GET("/", stagingHandler)
    r.Domain("localhost").GET("/", devHandler)
}
```

## 域名分组

按域名分组路由，共享中间件：

```go
r := fox.Default()

// 带认证中间件的管理域名
admin := r.Domain("admin.example.com")
admin.Use(authMiddleware())
{
    admin.GET("/dashboard", dashboardHandler)
    admin.GET("/users", listUsersHandler)
    admin.POST("/users", createUserHandler)
}

// 公共 API 域名
api := r.Domain("api.example.com")
api.Use(rateLimitMiddleware())
{
    api.GET("/public/data", publicDataHandler)
}
```

## 测试多域名路由

```go
func TestDomainRouting(t *testing.T) {
    r := fox.Default()

    r.Domain("api.example.com").GET("/test", func() string {
        return "API"
    })

    r.Domain("admin.example.com").GET("/test", func() string {
        return "Admin"
    })

    // 测试 API 域名
    w := httptest.NewRecorder()
    req, _ := http.NewRequest("GET", "/test", nil)
    req.Host = "api.example.com"
    r.ServeHTTP(w, req)

    assert.Equal(t, 200, w.Code)
    assert.Equal(t, "API", w.Body.String())

    // 测试 Admin 域名
    w = httptest.NewRecorder()
    req, _ = http.NewRequest("GET", "/test", nil)
    req.Host = "admin.example.com"
    r.ServeHTTP(w, req)

    assert.Equal(t, 200, w.Code)
    assert.Equal(t, "Admin", w.Body.String())
}
```

## 最佳实践

1. **尽可能使用精确匹配** - 比正则表达式性能更好
2. **验证域名输入** - 防止域名注入的安全问题
3. **考虑 DNS 配置** - 确保 DNS 记录指向您的服务器
4. **处理默认情况** - 为未知域名提供回退路由
5. **记录域名结构** - 维护清晰的域名路由文档

## 配置示例

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

## 下一步

- [中间件](/zh-cn/features/middleware/) - 对域名组应用中间件
- [结构化日志](/zh-cn/features/logging/) - 记录域名信息
