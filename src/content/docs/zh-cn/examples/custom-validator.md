---
title: 自定义验证器
description: 使用 IsValider 接口实现自定义验证逻辑
head: []
---

# 自定义验证器

本示例演示如何使用 `IsValider` 接口实现超越标准结构体标签验证的自定义验证逻辑。

## 功能特性

- 自定义密码强度验证
- 用户名格式和保留字验证
- 电子邮件域名白名单验证
- 内容敏感词检查
- 标签格式验证
- 带错误代码的自定义错误消息

## 完整示例

```go
package main

import (
	"errors"
	"net/http"
	"regexp"
	"strings"

	"github.com/fox-gonic/fox"
	"github.com/fox-gonic/fox/httperrors"
)

// StrongPassword 验证密码强度
type StrongPassword struct {
	Password string `json:"password" binding:"required"`
}

func (sp *StrongPassword) IsValid() error {
	pwd := sp.Password

	// 检查最小长度
	if len(pwd) < 8 {
		return &httperrors.Error{
			HTTPCode: http.StatusBadRequest,
			Code:     "PASSWORD_TOO_SHORT",
			Err:      errors.New("password must be at least 8 characters long"),
		}
	}

	// 检查大写字母
	if !regexp.MustCompile(`[A-Z]`).MatchString(pwd) {
		return &httperrors.Error{
			HTTPCode: http.StatusBadRequest,
			Code:     "PASSWORD_NO_UPPERCASE",
			Err:      errors.New("password must contain at least one uppercase letter"),
		}
	}

	// 检查小写字母
	if !regexp.MustCompile(`[a-z]`).MatchString(pwd) {
		return &httperrors.Error{
			HTTPCode: http.StatusBadRequest,
			Code:     "PASSWORD_NO_LOWERCASE",
			Err:      errors.New("password must contain at least one lowercase letter"),
		}
	}

	// 检查数字
	if !regexp.MustCompile(`[0-9]`).MatchString(pwd) {
		return &httperrors.Error{
			HTTPCode: http.StatusBadRequest,
			Code:     "PASSWORD_NO_DIGIT",
			Err:      errors.New("password must contain at least one digit"),
		}
	}

	// 检查特殊字符
	if !regexp.MustCompile(`[!@#$%^&*(),.?":{}|<>]`).MatchString(pwd) {
		return &httperrors.Error{
			HTTPCode: http.StatusBadRequest,
			Code:     "PASSWORD_NO_SPECIAL",
			Err:      errors.New("password must contain at least one special character"),
		}
	}

	return nil
}

// SignupRequest 带自定义验证
type SignupRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (sr *SignupRequest) IsValid() error {
	// 用户名验证
	if !regexp.MustCompile(`^[a-zA-Z0-9_-]+$`).MatchString(sr.Username) {
		return &httperrors.Error{
			HTTPCode: http.StatusBadRequest,
			Code:     "INVALID_USERNAME",
			Err:      errors.New("username can only contain letters, numbers, underscore, and dash"),
		}
	}

	// 保留的用户名
	reserved := []string{"admin", "root", "system", "api", "www"}
	for _, r := range reserved {
		if strings.EqualFold(sr.Username, r) {
			return &httperrors.Error{
				HTTPCode: http.StatusBadRequest,
				Code:     "RESERVED_USERNAME",
				Err:      errors.New("this username is reserved"),
			}
		}
	}

	// 电子邮件域名验证
	allowedDomains := []string{"example.com", "test.com", "demo.com"}
	emailParts := strings.Split(sr.Email, "@")
	if len(emailParts) == 2 {
		domain := emailParts[1]
		valid := false
		for _, d := range allowedDomains {
			if domain == d {
				valid = true
				break
			}
		}
		if !valid {
			return &httperrors.Error{
				HTTPCode: http.StatusBadRequest,
				Code:     "INVALID_EMAIL_DOMAIN",
				Err:      errors.New("email domain not allowed. Use: " + strings.Join(allowedDomains, ", ")),
			}
		}
	}

	// 密码验证
	pwdReq := &StrongPassword{Password: sr.Password}
	return pwdReq.IsValid()
}

// CreatePostRequest 带内容验证
type CreatePostRequest struct {
	Title   string   `json:"title" binding:"required,min=5,max=200"`
	Content string   `json:"content" binding:"required,min=10"`
	Tags    []string `json:"tags" binding:"required,min=1,max=10"`
}

func (cpr *CreatePostRequest) IsValid() error {
	// 检查标题中的敏感词
	profanityWords := []string{"badword1", "badword2"}
	titleLower := strings.ToLower(cpr.Title)
	for _, word := range profanityWords {
		if strings.Contains(titleLower, word) {
			return &httperrors.Error{
				HTTPCode: http.StatusBadRequest,
				Code:     "PROFANITY_DETECTED",
				Err:      errors.New("title contains inappropriate content"),
			}
		}
	}

	// 验证标签
	for _, tag := range cpr.Tags {
		if len(tag) < 2 || len(tag) > 30 {
			return &httperrors.Error{
				HTTPCode: http.StatusBadRequest,
				Code:     "INVALID_TAG_LENGTH",
				Err:      errors.New("each tag must be between 2 and 30 characters"),
			}
		}

		if !regexp.MustCompile(`^[a-zA-Z0-9-]+$`).MatchString(tag) {
			return &httperrors.Error{
				HTTPCode: http.StatusBadRequest,
				Code:     "INVALID_TAG_FORMAT",
				Err:      errors.New("tags can only contain letters, numbers, and dashes"),
			}
		}
	}

	return nil
}

func main() {
	router := fox.New()

	// 密码验证端点
	router.POST("/validate-password", func(_ *fox.Context, _ *StrongPassword) (string, error) {
		return "Password is strong!", nil
	})

	// 带综合验证的注册
	router.POST("/signup", func(_ *fox.Context, req *SignupRequest) (map[string]any, error) {
		return map[string]any{
			"message":  "Account created successfully",
			"username": req.Username,
			"email":    req.Email,
		}, nil
	})

	// 带内容验证的创建帖子
	router.POST("/posts", func(_ *fox.Context, req *CreatePostRequest) (map[string]any, error) {
		return map[string]any{
			"message": "Post created successfully",
			"post": map[string]any{
				"title":   req.Title,
				"content": req.Content,
				"tags":    req.Tags,
			},
		}, nil
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

### 有效密码

```bash
curl -X POST http://localhost:8080/validate-password \
  -H "Content-Type: application/json" \
  -d '{"password": "StrongPass123!"}'
```

### 弱密码(无大写字母)

```bash
curl -X POST http://localhost:8080/validate-password \
  -H "Content-Type: application/json" \
  -d '{"password": "weakpass123!"}'
```

### 有效注册

```bash
curl -X POST http://localhost:8080/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### 无效用户名(保留字)

```bash
curl -X POST http://localhost:8080/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "SecurePass123!"
  }'
```

### 无效电子邮件域名

```bash
curl -X POST http://localhost:8080/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@gmail.com",
    "password": "SecurePass123!"
  }'
```

### 有效创建帖子

```bash
curl -X POST http://localhost:8080/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "我的第一篇文章",
    "content": "这是我的文章内容。",
    "tags": ["golang", "web-development", "fox"]
  }'
```

## IsValider 接口

Fox 提供了 `IsValider` 接口:

```go
type IsValider interface {
    IsValid() error
}
```

任何实现此接口的结构体都将在标准验证通过后自动调用其 `IsValid()` 方法。

## 错误响应格式

自定义验证器应返回 `*httperrors.Error`:

```go
&httperrors.Error{
    HTTPCode: http.StatusBadRequest,  // HTTP 状态码
    Code:     "ERROR_CODE",           // 应用错误代码
    Err:      errors.New("message"),  // 错误消息
}
```

## 验证流程

```
请求 → 解析 JSON → 验证标签 → IsValid() → 处理器
```

1. **解析 JSON**: 解析请求体
2. **验证标签**: 运行结构体标签验证(`required`、`email` 等)
3. **IsValid()**: 如果结构体实现了 `IsValider`,调用 `IsValid()`
4. **处理器**: 如果所有验证通过,调用处理器

## 最佳实践

1. **快速失败**: 一旦第一个验证失败就返回错误
2. **清晰的消息**: 提供用户友好的错误消息
3. **错误代码**: 使用一致的错误代码(UPPER_SNAKE_CASE)
4. **安全性**: 不要暴露内部实现细节
5. **性能**: 缓存编译的正则表达式模式
6. **可重用性**: 将常见的验证逻辑提取到单独的结构体中

## 下一步

- [错误处理](/zh-cn/examples/error-handling/) - 处理验证错误
- [绑定](/zh-cn/examples/binding/) - 参数绑定基础
- [验证文档](/zh-cn/features/validation/) - 了解更多关于验证的信息
