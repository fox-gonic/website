---
title: 上下文
description: Fox Context API 参考
head: []
---

Fox 处理器使用 `*fox.Context`。它包装并嵌入了 Gin 的 `*gin.Context`，因此可以直接使用 `Query`、`Param`、`JSON`、`Abort`、`GetHeader` 等 Gin 方法；同时 Fox 增加了请求体缓存、TraceID、日志访问和 `context.Context` 兼容能力。

## 获取 Context

Fox 处理器可以选择性地接受 `*fox.Context` 参数：

```go
r.GET("/path", func(c *fox.Context) (any, error) {
    // 访问 context
    return response, nil
})
```

Gin 中间件仍然使用 `*gin.Context`：

```go
func MyMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Set("user_id", 123)
        c.Next()
    }
}
```

## 请求数据

### 查询参数

```go
name := c.Query("name")              // 获取查询参数
page := c.DefaultQuery("page", "1")  // 带默认值
```

### 路径参数

```go
r.GET("/user/:id", func(c *gin.Context) {
    id := c.Param("id")
})
```

### 请求头

```go
token := c.GetHeader("Authorization")
userAgent := c.Request.UserAgent()
```

### 请求体

```go
var data map[string]any
c.ShouldBindJSON(&data)
```

Fox 还提供 `RequestBody()`，用于读取并缓存原始请求体。它会恢复 body，后续绑定仍然可以再次读取：

```go
body, err := c.RequestBody()
```

### 客户端 IP

```go
ip := c.ClientIP()
```

## 响应

### JSON 响应

```go
c.JSON(200, gin.H{
    "message": "success",
})
```

### 字符串响应

```go
c.String(200, "Hello, World!")
```

### HTML 响应

```go
c.HTML(200, "index.html", gin.H{
    "title": "主页",
})
```

### 重定向

```go
c.Redirect(302, "/new-path")
```

### 状态码

```go
c.Status(204) // No Content
```

## Context 数据

### 设置值

```go
c.Set("user_id", 123)
```

### 获取值

```go
userID := c.GetInt("user_id")
value, exists := c.Get("key")
```

### Must Get

```go
userID := c.MustGet("user_id").(int)
```

## 文件处理

### 单文件上传

```go
file, _ := c.FormFile("file")
c.SaveUploadedFile(file, "./uploads/"+file.Filename)
```

### 多文件上传

```go
form, _ := c.MultipartForm()
files := form.File["files"]

for _, file := range files {
    c.SaveUploadedFile(file, "./uploads/"+file.Filename)
}
```

### 提供文件

```go
c.File("./assets/image.png")
```

## Cookies

### 设置 Cookie

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

### 获取 Cookie

```go
value, err := c.Cookie("session_id")
```

## 中止

停止处理并返回：

```go
if !isAuthenticated(c) {
    c.JSON(401, gin.H{"error": "未授权"})
    c.Abort()
    return
}
```

## Fox 特定方法

### 获取 Logger

```go
c.Logger.Info("处理请求")
```

### 获取 TraceID

```go
traceID := c.TraceID()
```

### Context 接口

`*fox.Context` 通过 `c.Request.Context()` 实现标准 context 方法：

```go
select {
case <-c.Done():
    return nil, c.Err()
default:
}

value := c.Value(myKey)
```

## 下一步

- [路由器 API](/zh-cn/api/router/) - 路由器配置
- [中间件](/zh-cn/features/middleware/) - 自定义中间件
