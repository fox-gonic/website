---
title: 快速开始
description: 几分钟内开始使用 Fox
head: []
---

只需几分钟即可启动并运行 Fox。

## 前提条件

- Go 1.21 或更高版本
- 对 Go 和 Web 开发有基本了解

## 安装

```bash
go get -u github.com/fox-gonic/fox
```

## 第一个 Fox 应用

创建一个新文件 `main.go`：

```go
package main

import (
    "github.com/fox-gonic/fox"
)

type HelloRequest struct {
    Name string `form:"name" binding:"required"`
}

func main() {
    // 使用默认中间件创建 Fox 路由器
    r := fox.Default()

    // 定义一个简单的 GET 端点，自动参数绑定
    r.GET("/hello", func(_ *fox.Context, req *HelloRequest) (any, error) {
        return map[string]string{
            "message": "你好，" + req.Name + "！",
        }, nil
    })

    // 定义一个 JSON POST 端点
    type CreateUserRequest struct {
        Name  string `json:"name" binding:"required"`
        Email string `json:"email" binding:"required,email"`
    }

    r.POST("/users", func(_ *fox.Context, req *CreateUserRequest) (any, error) {
        // 在实际应用中，您会在这里保存到数据库
        return map[string]any{
            "id":    1,
            "name":  req.Name,
            "email": req.Email,
        }, nil
    })

    // 启动服务器
    r.Run(":8080")
}
```

## 运行应用

```bash
go run main.go
```

## 测试端点

测试 GET 端点：

```bash
curl "http://localhost:8080/hello?name=世界"
```

响应：
```json
{
  "message": "你好，世界！"
}
```

测试 POST 端点：

```bash
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{"name":"张三","email":"zhangsan@example.com"}'
```

响应：
```json
{
  "id": 1,
  "name": "张三",
  "email": "zhangsan@example.com"
}
```

## 下一步

现在您已经有了一个基本的 Fox 应用在运行，探索更多特性：

- [参数绑定](/zh-cn/features/binding/) - 了解不同的绑定选项
- [多域名路由](/zh-cn/features/multi-domain/) - 按域名路由
- [结构化日志](/zh-cn/features/logging/) - 添加全面的日志记录
- [验证](/zh-cn/features/validation/) - 自定义验证规则

## 常见模式

### 错误处理

```go
type UserParams struct {
    ID int `uri:"id" binding:"required"`
}

r.GET("/user/:id", func(_ *fox.Context, req *UserParams) (*User, error) {
    user, err := db.GetUser(req.ID)
    if err != nil {
        return nil, err // Fox 自动处理错误响应
    }
    return user, nil
})
```

### 使用 Gin Context

当您需要访问底层 Gin 上下文时：

```go
r.GET("/example", func(c *fox.Context, req *Request) (any, error) {
    // 直接访问嵌入的 Gin context 方法
    userAgent := c.GetHeader("User-Agent")

    // 您的逻辑
    return response, nil
})
```

### 自定义验证

```go
type SignupRequest struct {
    Username string `json:"username" binding:"required"`
    Password string `json:"password" binding:"required"`
}

func (r *SignupRequest) IsValid() error {
    if len(r.Password) < 8 {
        return errors.New("密码必须至少 8 个字符")
    }
    return nil
}
```
