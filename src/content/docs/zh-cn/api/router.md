---
title: 路由器
description: Fox 路由器 API 参考
head: []
---

# 路由器 API

路由器是 Fox 的核心组件，处理请求路由和中间件。

## 创建路由器

### fox.New()

创建一个没有任何中间件的新路由器：

```go
r := fox.New()
```

### fox.Default()

创建一个带有默认中间件（Logger 和 Recovery）的路由器：

```go
r := fox.Default()
```

## HTTP 方法

### GET

```go
r.GET("/path", handler)
```

### POST

```go
r.POST("/path", handler)
```

### PUT

```go
r.PUT("/path", handler)
```

### DELETE

```go
r.DELETE("/path", handler)
```

### PATCH

```go
r.PATCH("/path", handler)
```

### HEAD

```go
r.HEAD("/path", handler)
```

### OPTIONS

```go
r.OPTIONS("/path", handler)
```

## 路由分组

创建具有共享前缀和中间件的路由组：

```go
api := r.Group("/api")
api.Use(authMiddleware())
{
    api.GET("/users", listUsers)
    api.POST("/users", createUser)
}

v1 := api.Group("/v1")
{
    v1.GET("/products", listProducts)
}
```

## 域名路由

基于域名的路由：

```go
// 精确域名
r.Domain("api.example.com").GET("/users", handler)

// 通配符
r.Domain("*.example.com").GET("/info", handler)

// 正则表达式
r.DomainRegex(`^([a-z]+)\.example\.com$`).GET("/", handler)
```

## 中间件

### 使用中间件

```go
// 全局中间件
r.Use(middleware1(), middleware2())

// 组中间件
api := r.Group("/api")
api.Use(authMiddleware())
```

### 内置中间件

```go
import "github.com/fox-gonic/fox/middleware"

// 日志中间件
r.Use(middleware.Logger())

// 恢复中间件
r.Use(middleware.Recovery())

// CORS 中间件
r.Use(middleware.CORS())
```

## 运行服务器

### 在端口上运行

```go
r.Run(":8080")
```

### 使用 TLS 运行

```go
r.RunTLS(":8443", "cert.pem", "key.pem")
```

### 使用自定义服务器运行

```go
server := &http.Server{
    Addr:         ":8080",
    Handler:      r,
    ReadTimeout:  10 * time.Second,
    WriteTimeout: 10 * time.Second,
}
server.ListenAndServe()
```

## 配置选项

### 使用选项创建路由器

```go
r := fox.New(
    fox.WithLoggerConfig(loggerConfig),
    fox.WithMaxMemory(32 << 20), // 32 MB
    fox.WithTrustedProxies([]string{"127.0.0.1"}),
)
```

## 下一步

- [Context API](/zh-cn/api/context/) - 使用请求上下文
- [中间件指南](/zh-cn/features/middleware/) - 创建自定义中间件
