---
title: Router
description: Fox Router API Reference
head: []
---

The Router is the core component of Fox, handling request routing and middleware.

## Creating a Router

### fox.New()

Create a new router without any middleware:

```go
r := fox.New()
```

### fox.Default()

Create a router with default middleware: response time header, request logger, and recovery.

```go
r := fox.Default()
```

## HTTP Methods

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

## Route Groups

Create route groups with shared prefix and middleware:

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

## Handler Signatures

Fox route handlers can use these signatures:

```go
func()
func(ctx *fox.Context) T
func(ctx *fox.Context) (T, error)
func(ctx *fox.Context, req Request) T
func(ctx *fox.Context, req *Request) (T, error)
```

The first argument, when present, must be `*fox.Context`. The second argument may be a struct, pointer to struct, map, or interface and is automatically bound from the request.

## Domain Routing

Route based on domain names:

```go
de := fox.NewDomainEngine()

// Exact domain
de.Domain("api.example.com", func(api *fox.Engine) {
    api.GET("/users", handler)
})

// Regex domain
de.DomainRegexp(`^([a-z]+)\.example\.com$`, func(app *fox.Engine) {
    app.GET("/", handler)
})

// Fallback routes live on the DomainEngine itself.
de.GET("/health", func() string {
    return "OK"
})
```

## Middleware

### Use Middleware

```go
// Global middleware
r.Use(middleware1(), middleware2())

// Group middleware
api := r.Group("/api")
api.Use(authMiddleware())
```

### Built-in Middleware

```go
// Logger middleware
r.Use(fox.Logger())

// Response time header middleware
r.Use(fox.NewXResponseTimer())

// Recovery middleware
r.Use(fox.Recovery())
```

## Running the Server

### Run on Port

```go
r.Run(":8080")
```

### Run with TLS

```go
r.RunTLS(":8443", "cert.pem", "key.pem")
```

### Run with Custom Server

```go
server := &http.Server{
    Addr:         ":8080",
    Handler:      r,
    ReadTimeout:  10 * time.Second,
    WriteTimeout: 10 * time.Second,
}
server.ListenAndServe()
```

## Engine Configuration

`fox.New()` does not accept option arguments. Configure the embedded Gin engine and Fox fields directly:

```go
r := fox.New()
r.MaxMultipartMemory = 32 << 20
r.SetTrustedProxies([]string{"127.0.0.1"})
r.DefaultRenderErrorStatusCode = http.StatusUnprocessableEntity
```

## Next Steps

- [Context API](/api/context/) - Working with request context
- [Middleware Guide](/features/middleware/) - Creating custom middleware
