---
title: Context
description: Fox Context API Reference
head: []
---

# Context API

The Context provides access to request and response data.

## Getting Context

Fox handlers can optionally accept a `*gin.Context` parameter:

```go
r.GET("/path", func(c *gin.Context) (any, error) {
    // Access context
    return response, nil
})
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
logger := fox.GetLogger(c)
logger.Info("Processing request")
```

### Get TraceID

```go
traceID := fox.GetTraceID(c)
```

## Next Steps

- [Router API](/api/router/) - Router configuration
- [Middleware](/features/middleware/) - Custom middleware
