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

创建一个带有默认中间件的路由器：响应时间头、请求日志和 Recovery。

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

## 处理器签名

Fox 路由处理器支持这些签名：

```go
func()
func(ctx *fox.Context) T
func(ctx *fox.Context) (T, error)
func(ctx *fox.Context, req Request) T
func(ctx *fox.Context, req *Request) (T, error)
```

如果有入参，第一个参数必须是 `*fox.Context`。第二个参数可以是结构体、结构体指针、map 或 interface，Fox 会从请求中自动绑定。

## 域名路由

基于域名的路由：

```go
de := fox.NewDomainEngine()

// 精确域名
de.Domain("api.example.com", func(api *fox.Engine) {
    api.GET("/users", handler)
})

// 正则域名
de.DomainRegexp(`^([a-z]+)\.example\.com$`, func(app *fox.Engine) {
    app.GET("/", handler)
})

// 回退路由注册在 DomainEngine 自身
de.GET("/health", func() string {
    return "OK"
})
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
// 日志中间件
r.Use(fox.Logger())

// 响应时间头中间件
r.Use(fox.NewXResponseTimer())

// Recovery 中间件
r.Use(fox.Recovery())
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

## Engine 配置

`fox.New()` 不接收 option 参数。请直接配置嵌入的 Gin engine 和 Fox 字段：

```go
r := fox.New()
r.MaxMultipartMemory = 32 << 20
r.SetTrustedProxies([]string{"127.0.0.1"})
r.DefaultRenderErrorStatusCode = http.StatusUnprocessableEntity
```

## 下一步

- [Context API](/zh-cn/api/context/) - 使用请求上下文
- [中间件指南](/zh-cn/features/middleware/) - 创建自定义中间件
