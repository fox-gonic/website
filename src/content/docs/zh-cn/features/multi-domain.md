---
title: 多域名路由
description: 根据域名路由流量
head: []
---

Fox 通过 `DomainEngine` 实现域名路由。`DomainEngine` 包含一个回退用的 `*fox.Engine`，以及一组域名专用的子 engine。请求会按注册顺序匹配域名；如果没有匹配项，就交给回退 engine 处理。

## 基本用法

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

## 正则域名

Fox 不支持 `"*.example.com"` 这种通配符语法。子域名模式请使用 `DomainRegexp`：

```go
de.DomainRegexp(`^[^.]+\.example\.com$`, func(app *fox.Engine) {
    app.GET("/info", func(ctx *fox.Context) map[string]string {
        return map[string]string{
            "host": ctx.Request.Host,
        }
    })
})
```

正则表达式会匹配去掉端口后的 host。捕获组不会保存到 context 中；如果需要租户或子域名值，请自行解析 `ctx.Request.Host`。

## 多租户应用

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

## 按域名做 API 版本

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

## 按环境路由

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

## 测试多域名路由

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

## 匹配规则

1. 精确域名和正则域名都按注册顺序检查。
2. 匹配前会去掉 Host 中的端口号。
3. 精确域名匹配区分大小写，因为 Fox 直接比较字符串。
4. `DomainRegexp` 如果无法编译正则表达式，会在注册时 panic。
5. 没有匹配任何域名时，请求由 `DomainEngine` 上的回退路由处理。

## 配置示例

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

## 下一步

- [域名路由示例](/zh-cn/examples/domain-routing/) - 完整可运行示例
- [中间件](/zh-cn/examples/middleware/) - 在域名 engine 中使用中间件
