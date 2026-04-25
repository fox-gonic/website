---
title: Introduction
description: Learn about Fox web framework and its core concepts
head: []
---

Fox is a powerful web framework built on top of [Gin](https://gin-gonic.com/), providing automatic parameter binding, flexible response rendering, and enhanced features while maintaining full Gin compatibility.

## What is Fox?

Fox extends Gin with modern conveniences that reduce boilerplate code and improve developer productivity. It automatically handles common tasks like:

- **Parameter binding** from URI paths, query strings, and JSON bodies
- **Response rendering** with automatic serialization
- **Request validation** through struct tags and custom validators
- **Structured logging** with TraceID and contextual fields

## Key Advantages

### Less Boilerplate

With Fox, you can write handlers that focus purely on business logic:

```go
// Traditional Gin handler
func CreateUser(c *gin.Context) {
    var req UserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    // Business logic...
    c.JSON(200, gin.H{"message": "success"})
}

// Fox handler - cleaner and more focused
func CreateUser(req *UserRequest) (any, error) {
    // Business logic only
    return map[string]string{"message": "success"}, nil
}
```

### Full Gin Compatibility

Fox is 100% compatible with Gin. You can:

- Use any existing Gin middleware
- Mix Fox and Gin handlers in the same application
- Gradually migrate from Gin to Fox
- Access the underlying `gin.Context` when needed

### Built for Production

Fox includes production-ready features:

- Multi-domain routing for microservices
- Structured logging with rotation
- Graceful error handling
- High performance with minimal overhead

## When to Use Fox

Fox is ideal for:

- Building REST APIs with many endpoints
- Projects that need automatic parameter validation
- Applications requiring clean, maintainable handler code
- Systems handling JSON request/response bodies

## Next Steps

- [Quick Start](/guides/quickstart/) - Get up and running in minutes
- [Installation](/guides/installation/) - Detailed installation instructions
- [Features](/features/binding/) - Explore Fox's features in depth
