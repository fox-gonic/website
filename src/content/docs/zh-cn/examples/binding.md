---
title: 参数绑定
description: 从不同来源自动绑定参数
head: []
---

# 参数绑定

本示例演示如何从不同来源(包括 JSON 请求体、URI 参数和查询参数)自动绑定参数。

## 功能特性

- 带验证的 JSON 请求体绑定
- URI 参数绑定
- 查询参数绑定
- URI 和 JSON 组合绑定
- 使用结构体标签进行自定义验证

## 完整示例

```go
package main

import (
	"errors"
	"net/http"

	"github.com/fox-gonic/fox"
	"github.com/fox-gonic/fox/httperrors"
)

// User 表示用户模型
type User struct {
	ID       int64  `json:"id"`
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Age      int    `json:"age" binding:"gte=0,lte=150"`
}

// CreateUserRequest 表示创建用户的请求
type CreateUserRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Age      int    `json:"age" binding:"gte=18,lte=150"`
}

// UpdateUserRequest 表示更新用户的请求
type UpdateUserRequest struct {
	ID       int64  `uri:"id" binding:"required,gt=0"`
	Username string `json:"username" binding:"omitempty,min=3,max=50"`
	Email    string `json:"email" binding:"omitempty,email"`
}

// QueryUsersRequest 表示查询参数
// 可以使用 'query' 或 'form' 标签来绑定 URL 查询参数
type QueryUsersRequest struct {
	Page     int    `query:"page" binding:"omitempty,gte=1"`
	PageSize int    `query:"page_size" binding:"omitempty,gte=1,lte=100"`
	Keyword  string `query:"keyword"`
}

func main() {
	router := fox.New()

	// POST: 使用 JSON 请求体绑定创建用户
	router.POST("/users", func(_ *fox.Context, req *CreateUserRequest) (*User, error) {
		// 在实际应用中,保存到数据库
		user := &User{
			ID:       1,
			Username: req.Username,
			Email:    req.Email,
			Age:      req.Age,
		}
		return user, nil
	})

	// PUT: 使用 URI 和 JSON 绑定更新用户
	router.PUT("/users/:id", func(_ *fox.Context, req *UpdateUserRequest) (*User, error) {
		// 在实际应用中,更新数据库
		user := &User{
			ID:       req.ID,
			Username: req.Username,
			Email:    req.Email,
		}
		return user, nil
	})

	// GET: 使用查询参数查询用户
	router.GET("/users", func(_ *fox.Context, req *QueryUsersRequest) (map[string]any, error) {
		// 设置默认值
		if req.Page == 0 {
			req.Page = 1
		}
		if req.PageSize == 0 {
			req.PageSize = 10
		}

		// 在实际应用中,从数据库查询
		return map[string]any{
			"page":      req.Page,
			"page_size": req.PageSize,
			"keyword":   req.Keyword,
			"total":     100,
			"users": []User{
				{ID: 1, Username: "alice", Email: "alice@example.com", Age: 25},
				{ID: 2, Username: "bob", Email: "bob@example.com", Age: 30},
			},
		}, nil
	})

	// GET: 根据 ID 获取用户
	router.GET("/users/:id", func(ctx *fox.Context) (*User, error) {
		_ = ctx.Param("id")

		// 在实际应用中,从数据库获取
		return &User{
			ID:       1,
			Username: "alice",
			Email:    "alice@example.com",
			Age:      25,
		}, nil
	})

	// 自定义验证示例
	router.POST("/validate", func(_ *fox.Context, req *CreateUserRequest) (string, error) {
		// 额外的自定义验证
		if req.Username == "admin" {
			return "", &httperrors.Error{
				HTTPCode: http.StatusBadRequest,
				Code:     "INVALID_USERNAME",
				Err:      errors.New("username 'admin' is reserved"),
			}
		}

		return "Validation passed", nil
	})

	if err := router.Run(":8080"); err != nil {
		panic(err)
	}
}
```

## 运行示例

```bash
go run main.go
```

## 测试

### 创建用户 (JSON 绑定)

```bash
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "email": "alice@example.com",
    "password": "secret123",
    "age": 25
  }'
```

### 更新用户 (URI + JSON)

```bash
curl -X PUT http://localhost:8080/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice_updated",
    "email": "alice.new@example.com"
  }'
```

### 查询用户

```bash
curl "http://localhost:8080/users?page=1&page_size=10&keyword=alice"
```

### 根据 ID 获取用户

```bash
curl http://localhost:8080/users/1
```

## 验证标签

Fox 使用 `github.com/go-playground/validator/v10` 进行验证。常用标签:

- `required` - 字段必须存在
- `email` - 必须是有效的电子邮件格式
- `min=n` - 最小值/长度
- `max=n` - 最大值/长度
- `gte=n` - 大于或等于
- `lte=n` - 小于或等于
- `gt=n` - 大于
- `lt=n` - 小于
- `omitempty` - 如果为空则跳过验证

## 下一步

- [自定义验证器](/zh-cn/examples/custom-validator/) - 实现自定义验证逻辑
- [错误处理](/zh-cn/examples/error-handling/) - 处理验证错误
- [绑定文档](/zh-cn/features/binding/) - 了解更多关于参数绑定的信息
