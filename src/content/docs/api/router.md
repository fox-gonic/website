---
title: Router
description: Fox Router API Reference
head: []
---

# Router API

The Router is the core component of Fox, handling request routing and middleware.

## Creating a Router

### fox.New()

Create a new router without any middleware:

```go
r := fox.New()
```

### fox.Default()

Create a router with default middleware (Logger and Recovery):

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

## Domain Routing

Route based on domain names:

```go
// Exact domain
r.Domain("api.example.com").GET("/users", handler)

// Wildcard
r.Domain("*.example.com").GET("/info", handler)

// Regex
r.DomainRegex(`^([a-z]+)\.example\.com$`).GET("/", handler)
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
import "github.com/fox-gonic/fox/middleware"

// Logger middleware
r.Use(middleware.Logger())

// Recovery middleware
r.Use(middleware.Recovery())

// CORS middleware
r.Use(middleware.CORS())
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

## Configuration Options

### Create Router with Options

```go
r := fox.New(
    fox.WithLoggerConfig(loggerConfig),
    fox.WithMaxMemory(32 << 20), // 32 MB
    fox.WithTrustedProxies([]string{"127.0.0.1"}),
)
```

## Next Steps

- [Context API](/api/context/) - Working with request context
- [Middleware Guide](/features/middleware/) - Creating custom middleware
