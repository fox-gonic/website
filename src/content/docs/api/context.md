---
title: Context
description: Fox Context API Reference
head: []
---

# Context API

Fox handlers use `*fox.Context`, a thin wrapper around Gin's `*gin.Context`. It embeds Gin's context, so Gin methods such as `Query`, `Param`, `JSON`, `Abort`, and `GetHeader` are available directly, while Fox adds request body caching, TraceID helpers, logger access, and `context.Context` compatibility.

## Getting Context

Fox handlers can optionally accept a `*fox.Context` parameter:

```go
r.GET("/path", func(c *fox.Context) (any, error) {
    // Access context
    return response, nil
})
```

Gin middleware still uses `*gin.Context`:

```go
func MyMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Set("user_id", 123)
        c.Next()
    }
}
```

## Request Data

### Query Parameters

```go
name := c.Query("name")              // Get query param
page := c.DefaultQuery("page", "1")  // With default value
```

### Path Parameters

```go
r.GET("/user/:id", func(c *gin.Context) {
    id := c.Param("id")
})
```

### Headers

```go
token := c.GetHeader("Authorization")
userAgent := c.Request.UserAgent()
```

### Request Body

```go
var data map[string]any
c.ShouldBindJSON(&data)
```

Fox also provides `RequestBody()` for reading and caching the raw request body. It restores the body so later binding can read it again:

```go
body, err := c.RequestBody()
```

### Client IP

```go
ip := c.ClientIP()
```

## Response

### JSON Response

```go
c.JSON(200, gin.H{
    "message": "success",
})
```

### String Response

```go
c.String(200, "Hello, World!")
```

### HTML Response

```go
c.HTML(200, "index.html", gin.H{
    "title": "Home",
})
```

### Redirect

```go
c.Redirect(302, "/new-path")
```

### Status Code

```go
c.Status(204) // No Content
```

## Context Data

### Set Value

```go
c.Set("user_id", 123)
```

### Get Value

```go
userID := c.GetInt("user_id")
value, exists := c.Get("key")
```

### Must Get

```go
userID := c.MustGet("user_id").(int)
```

## File Handling

### Single File Upload

```go
file, _ := c.FormFile("file")
c.SaveUploadedFile(file, "./uploads/"+file.Filename)
```

### Multiple Files

```go
form, _ := c.MultipartForm()
files := form.File["files"]

for _, file := range files {
    c.SaveUploadedFile(file, "./uploads/"+file.Filename)
}
```

### Serve File

```go
c.File("./assets/image.png")
```

## Cookies

### Set Cookie

```go
c.SetCookie(
    "session_id",           // name
    "abc123",               // value
    3600,                   // maxAge (seconds)
    "/",                    // path
    "example.com",          // domain
    false,                  // secure
    true,                   // httpOnly
)
```

### Get Cookie

```go
value, err := c.Cookie("session_id")
```

## Abort

Stop processing and return:

```go
if !isAuthenticated(c) {
    c.JSON(401, gin.H{"error": "Unauthorized"})
    c.Abort()
    return
}
```

## Fox-Specific Methods

### Get Logger

```go
c.Logger.Info("Processing request")
```

### Get TraceID

```go
traceID := c.TraceID()
```

### Context Interface

`*fox.Context` implements the standard context methods by delegating to `c.Request.Context()`:

```go
select {
case <-c.Done():
    return nil, c.Err()
default:
}

value := c.Value(myKey)
```

## Next Steps

- [Router API](/api/router/) - Router configuration
- [Middleware](/features/middleware/) - Custom middleware
