---
title: 基本用法
description: 使用 Fox 的基本示例
head: []
---

# 基本用法示例

## Hello World

```go
package main

import "github.com/fox-gonic/fox"

func main() {
    r := fox.Default()

    r.GET("/", func() string {
        return "Hello, World!"
    })

    r.Run(":8080")
}
```

## REST API 示例

```go
package main

import (
    "github.com/fox-gonic/fox"
)

type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

type CreateUserRequest struct {
    Name  string `json:"name" binding:"required"`
    Email string `json:"email" binding:"required,email"`
}

type UpdateUserRequest struct {
    ID    int    `uri:"id" binding:"required"`
    Name  string `json:"name" binding:"required"`
    Email string `json:"email" binding:"required,email"`
}

var users = []User{
    {ID: 1, Name: "张三", Email: "zhangsan@example.com"},
    {ID: 2, Name: "李四", Email: "lisi@example.com"},
}

func main() {
    r := fox.Default()

    // 列出用户
    r.GET("/users", func() []User {
        return users
    })

    // 根据 ID 获取用户
    r.GET("/users/:id", func(id int) (*User, error) {
        for _, u := range users {
            if u.ID == id {
                return &u, nil
            }
        }
        return nil, fox.ErrNotFound
    })

    // 创建用户
    r.POST("/users", func(req *CreateUserRequest) (*User, error) {
        user := User{
            ID:    len(users) + 1,
            Name:  req.Name,
            Email: req.Email,
        }
        users = append(users, user)
        return &user, nil
    })

    // 更新用户
    r.PUT("/users/:id", func(req *UpdateUserRequest) (*User, error) {
        for i, u := range users {
            if u.ID == req.ID {
                users[i].Name = req.Name
                users[i].Email = req.Email
                return &users[i], nil
            }
        }
        return nil, fox.ErrNotFound
    })

    // 删除用户
    r.DELETE("/users/:id", func(id int) error {
        for i, u := range users {
            if u.ID == id {
                users = append(users[:i], users[i+1:]...)
                return nil
            }
        }
        return fox.ErrNotFound
    })

    r.Run(":8080")
}
```

## 使用中间件

```go
package main

import (
    "time"
    "github.com/fox-gonic/fox"
    "github.com/gin-gonic/gin"
)

func TimingMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()

        c.Next()

        latency := time.Since(start)
        logger := fox.GetLogger(c)
        logger.Info("请求完成",
            "latency_ms", latency.Milliseconds(),
        )
    }
}

func main() {
    r := fox.Default()
    r.Use(TimingMiddleware())

    r.GET("/api/data", func() map[string]string {
        time.Sleep(100 * time.Millisecond) // 模拟工作
        return map[string]string{
            "message": "数据已检索",
        }
    })

    r.Run(":8080")
}
```

## 下一步

- [快速开始](/zh-cn/guides/quickstart/) - 综合指南
- [特性](/zh-cn/features/binding/) - 探索 Fox 特性
