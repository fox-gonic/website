---
title: 错误处理
description: 处理错误并返回一致的错误响应
head: []
---

# 错误处理

本示例演示 Fox 中的各种错误处理模式,包括简单错误、带状态码的 HTTP 错误和详细的错误响应。

## 功能特性

- 简单错误返回
- 带状态码的 HTTP 错误
- 自定义错误定义
- 条件错误处理
- 带附加详情的错误
- Panic 恢复
- 一致的错误响应

## 完整示例

```go
package main

import (
	"errors"
	"net/http"

	"github.com/fox-gonic/fox"
	"github.com/fox-gonic/fox/httperrors"
)

// 定义自定义错误
var (
	ErrUserNotFound = &httperrors.Error{
		HTTPCode: http.StatusNotFound,
		Code:     "USER_NOT_FOUND",
		Err:      errors.New("user not found"),
	}

	ErrInsufficientBalance = &httperrors.Error{
		HTTPCode: http.StatusPaymentRequired,
		Code:     "INSUFFICIENT_BALANCE",
		Err:      errors.New("insufficient account balance"),
	}

	ErrDuplicateEmail = &httperrors.Error{
		HTTPCode: http.StatusConflict,
		Code:     "DUPLICATE_EMAIL",
		Err:      errors.New("email already exists"),
	}

	ErrInvalidCredentials = &httperrors.Error{
		HTTPCode: http.StatusUnauthorized,
		Code:     "INVALID_CREDENTIALS",
		Err:      errors.New("invalid username or password"),
	}
)

type User struct {
	ID      int     `json:"id"`
	Name    string  `json:"name"`
	Email   string  `json:"email"`
	Balance float64 `json:"balance"`
}

func main() {
	router := fox.Default()

	// 1. 简单错误
	router.GET("/error/simple", func() (string, error) {
		return "", errors.New("something went wrong")
	})

	// 2. 带状态码的 HTTP 错误
	router.GET("/error/http", func() (string, error) {
		return "", &httperrors.Error{
			HTTPCode: http.StatusBadRequest,
			Code:     "INVALID_REQUEST",
			Err:      errors.New("invalid request parameters"),
		}
	})

	// 3. 条件错误(用户未找到)
	router.GET("/user/:id", func(ctx *fox.Context) (*User, error) {
		id := ctx.Param("id")

		// 模拟数据库查找
		if id != "1" {
			return nil, ErrUserNotFound
		}

		return &User{
			ID:      1,
			Name:    "Alice",
			Email:   "alice@example.com",
			Balance: 100.50,
		}, nil
	})

	// 4. 业务逻辑错误(余额不足)
	type TransferRequest struct {
		From   int     `json:"from" binding:"required"`
		To     int     `json:"to" binding:"required"`
		Amount float64 `json:"amount" binding:"required,gt=0"`
	}

	router.POST("/transfer", func(_ *fox.Context, req *TransferRequest) (map[string]any, error) {
		// 模拟检查余额
		currentBalance := 50.0

		if req.Amount > currentBalance {
			return nil, ErrInsufficientBalance
		}

		return map[string]any{
			"message": "Transfer successful",
			"from":    req.From,
			"to":      req.To,
			"amount":  req.Amount,
		}, nil
	})

	// 5. 身份验证错误
	type LoginRequest struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	router.POST("/login", func(_ *fox.Context, req *LoginRequest) (map[string]any, error) {
		// 模拟凭证检查
		if req.Username != "admin" || req.Password != "password" {
			return nil, ErrInvalidCredentials
		}

		return map[string]any{
			"token": "jwt-token-here",
		}, nil
	})

	// 6. 冲突错误(重复电子邮件)
	type SignupRequest struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
	}

	router.POST("/signup", func(_ *fox.Context, req *SignupRequest) (map[string]any, error) {
		// 模拟检查电子邮件是否存在
		existingEmails := []string{"alice@example.com", "bob@example.com"}

		for _, email := range existingEmails {
			if email == req.Email {
				return nil, ErrDuplicateEmail
			}
		}

		return map[string]any{
			"message": "Account created successfully",
			"email":   req.Email,
		}, nil
	})

	// 7. 权限错误
	router.DELETE("/user/:id", func(ctx *fox.Context) (string, error) {
		id := ctx.Param("id")

		// 模拟权限检查
		if id == "1" {
			return "", &httperrors.Error{
				HTTPCode: http.StatusForbidden,
				Code:     "CANNOT_DELETE_ADMIN",
				Err:      errors.New("cannot delete admin user"),
			}
		}

		return "User deleted successfully", nil
	})

	// 8. 带附加详情的错误
	router.GET("/detailed-error", func() (string, error) {
		return "", &httperrors.Error{
			HTTPCode: http.StatusUnprocessableEntity,
			Code:     "VALIDATION_FAILED",
			Err:      errors.New("validation failed"),
			Fields: map[string]any{
				"fields": []map[string]string{
					{"field": "email", "error": "invalid format"},
					{"field": "age", "error": "must be at least 18"},
				},
			},
		}
	})

	// 9. Panic 恢复(由默认恢复中间件处理)
	router.GET("/panic", func() string {
		panic("something went terribly wrong")
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

### 简单错误

```bash
curl http://localhost:8080/error/simple
```

响应：状态码为 `400 Bad Request` 的纯文本。

```text
something went wrong
```

### HTTP 错误

```bash
curl http://localhost:8080/error/http
```

响应 (400):
```json
{
  "code": "INVALID_REQUEST",
  "error": "(400): invalid request parameters",
  "meta": "invalid request parameters"
}
```

### 用户未找到

```bash
curl http://localhost:8080/user/999
```

响应 (404):
```json
{
  "code": "USER_NOT_FOUND",
  "error": "(404): user not found",
  "meta": "user not found"
}
```

### 余额不足

```bash
curl -X POST http://localhost:8080/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "from": 1,
    "to": 2,
    "amount": 100
  }'
```

响应 (402):
```json
{
  "code": "INSUFFICIENT_BALANCE",
  "error": "(402): insufficient account balance",
  "meta": "insufficient account balance"
}
```

### 无效凭证

```bash
curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "wrong",
    "password": "wrong"
  }'
```

响应 (401):
```json
{
  "code": "INVALID_CREDENTIALS",
  "error": "(401): invalid username or password",
  "meta": "invalid username or password"
}
```

### 重复电子邮件

```bash
curl -X POST http://localhost:8080/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123"
  }'
```

响应 (409):
```json
{
  "code": "DUPLICATE_EMAIL",
  "error": "(409): email already exists",
  "meta": "email already exists"
}
```

### 详细错误

```bash
curl http://localhost:8080/detailed-error
```

响应 (422):
```json
{
  "code": "VALIDATION_FAILED",
  "error": "(422): validation failed",
  "fields": [
    {"field": "email", "error": "invalid format"},
    {"field": "age", "error": "must be at least 18"}
  ],
  "meta": "validation failed"
}
```

### Panic 恢复

```bash
curl http://localhost:8080/panic
```

响应 (500):
```json
{
  "error": "Internal Server Error"
}
```

## 错误类型

### 1. 简单错误

返回纯文本，状态码为 Fox 默认错误状态码 `400 Bad Request`：

```go
return "", errors.New("something went wrong")
```

### 2. 带状态码的 HTTP 错误

返回带自定义状态码的错误:

```go
return "", &httperrors.Error{
    HTTPCode: http.StatusBadRequest,
    Code:     "ERROR_CODE",
    Err:      errors.New("error message"),
}
```

### 3. 带附加详情的 HTTP 错误

返回带额外信息的错误:

```go
return "", &httperrors.Error{
    HTTPCode: http.StatusUnprocessableEntity,
    Code:     "VALIDATION_FAILED",
    Err:      errors.New("validation failed"),
    Fields:  map[string]any{
        "fields": []string{"email", "password"},
    },
}
```

## HTTP 状态码

不同错误场景的常用状态码:

- `400 Bad Request` - 无效的请求参数
- `401 Unauthorized` - 需要身份验证或身份验证失败
- `403 Forbidden` - 权限被拒绝
- `404 Not Found` - 资源未找到
- `409 Conflict` - 资源冲突(例如,重复电子邮件)
- `422 Unprocessable Entity` - 验证失败
- `429 Too Many Requests` - 超过速率限制
- `500 Internal Server Error` - 服务器错误

## 最佳实践

1. **使用一致的错误代码**: 以 UPPER_SNAKE_CASE 定义错误代码
2. **提供用户友好的消息**: 不要暴露内部实现细节
3. **使用适当的状态码**: 匹配 HTTP 语义
4. **记录错误**: 使用上下文记录错误以便调试
5. **避免敏感数据**: 永远不要在错误消息中暴露敏感信息
6. **尽早处理错误**: 一旦发生错误就返回
7. **使用自定义错误类型**: 为常见场景定义可重用的错误类型
8. **添加上下文**: 在需要时用额外的上下文包装错误

## 下一步

- [自定义验证器](/zh-cn/examples/custom-validator/) - 带错误处理的自定义验证
- [中间件](/zh-cn/examples/middleware/) - 中间件中的错误处理
- [错误处理文档](/zh-cn/features/error-handling/) - 了解更多关于错误处理的信息
