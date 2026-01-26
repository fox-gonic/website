---
title: 参数绑定
description: 自动将请求参数绑定到结构体
head: []
---

# 参数绑定

Fox 自动将来自各种来源的请求参数绑定到您的处理函数参数。

## 支持的来源

Fox 可以从以下来源绑定参数：

- **URI 路径参数** - `/user/:id`
- **查询字符串** - `?name=value`
- **JSON 请求体** - `Content-Type: application/json`
- **表单数据** - `Content-Type: application/x-www-form-urlencoded`
- **请求头** - 自定义 HTTP 请求头

## 基本用法

### URI 参数

```go
type UserRequest struct {
    ID int `uri:"id" binding:"required"`
}

r.GET("/user/:id", func(req *UserRequest) (*User, error) {
    return getUserByID(req.ID)
})
```

### 查询参数

```go
type SearchRequest struct {
    Query string `form:"q" binding:"required"`
    Page  int    `form:"page"`
    Size  int    `form:"size"`
}

r.GET("/search", func(req *SearchRequest) ([]Result, error) {
    return search(req.Query, req.Page, req.Size)
})
```

### JSON 请求体

```go
type CreateUserRequest struct {
    Name     string `json:"name" binding:"required"`
    Email    string `json:"email" binding:"required,email"`
    Age      int    `json:"age" binding:"gte=0,lte=130"`
    Password string `json:"password" binding:"required,min=8"`
}

r.POST("/users", func(req *CreateUserRequest) (*User, error) {
    return createUser(req)
})
```

## 多来源绑定

在单个结构体中从多个来源绑定：

```go
type UpdateUserRequest struct {
    ID       int    `uri:"id" binding:"required"`          // 从路径
    Name     string `json:"name" binding:"required"`       // 从 JSON 请求体
    AuthUser string `header:"X-Auth-User" binding:"required"` // 从请求头
}

r.PUT("/user/:id", func(req *UpdateUserRequest) error {
    return updateUser(req.ID, req.Name, req.AuthUser)
})
```

## 验证标签

Fox 使用 [validator](https://github.com/go-playground/validator) 库进行验证：

### 常用标签

```go
type UserInput struct {
    // 必填字段
    Name string `json:"name" binding:"required"`

    // 邮箱验证
    Email string `json:"email" binding:"required,email"`

    // 长度约束
    Username string `json:"username" binding:"required,min=3,max=20"`

    // 数值范围
    Age int `json:"age" binding:"gte=0,lte=130"`

    // URL 验证
    Website string `json:"website" binding:"omitempty,url"`

    // 枚举验证
    Role string `json:"role" binding:"required,oneof=admin user guest"`

    // 自定义正则
    Phone string `json:"phone" binding:"required,e164"` // E.164 电话格式
}
```

### 嵌套结构体

```go
type Address struct {
    Street  string `json:"street" binding:"required"`
    City    string `json:"city" binding:"required"`
    Country string `json:"country" binding:"required,iso3166_1_alpha2"`
}

type CreateUserRequest struct {
    Name    string  `json:"name" binding:"required"`
    Email   string  `json:"email" binding:"required,email"`
    Address Address `json:"address" binding:"required"`
}
```

### 切片验证

```go
type BatchRequest struct {
    IDs    []int    `json:"ids" binding:"required,min=1,max=100,dive,gte=1"`
    Emails []string `json:"emails" binding:"required,dive,email"`
}
```

`dive` 标签验证切片中的每个元素。

## 可选参数

使用 `omitempty` 标记可选字段：

```go
type FilterRequest struct {
    Name     string `form:"name"`                    // 可选，无验证
    Category string `form:"category" binding:"omitempty,oneof=books electronics"`
    MinPrice *int   `form:"min_price" binding:"omitempty,gte=0"`
}
```

## 默认值

在结构体初始化时设置默认值：

```go
type PaginationRequest struct {
    Page int `form:"page"`
    Size int `form:"size"`
}

r.GET("/items", func(req *PaginationRequest) ([]Item, error) {
    // 如果未提供则设置默认值
    if req.Page == 0 {
        req.Page = 1
    }
    if req.Size == 0 {
        req.Size = 20
    }

    return getItems(req.Page, req.Size)
})
```

## 错误处理

当绑定或验证失败时，Fox 自动返回带有详细信息的 400 错误：

```json
{
  "error": "Key: 'CreateUserRequest.Email' Error:Field validation for 'Email' failed on the 'email' tag"
}
```

### 自定义错误消息

实现自定义错误处理：

```go
r.SetErrorHandler(func(c *gin.Context, err error) {
    if validationErr, ok := err.(validator.ValidationErrors); ok {
        errors := make(map[string]string)
        for _, e := range validationErr {
            errors[e.Field()] = fmt.Sprintf("'%s' 验证失败", e.Tag())
        }
        c.JSON(400, gin.H{"errors": errors})
        return
    }
    c.JSON(500, gin.H{"error": err.Error()})
})
```

## 类型转换

Fox 自动将字符串参数转换为目标类型：

```go
type Request struct {
    ID      int       `uri:"id"`      // "123" -> 123
    Active  bool      `form:"active"` // "true" -> true
    Price   float64   `form:"price"`  // "19.99" -> 19.99
    Date    time.Time `form:"date" time_format:"2006-01-02"`
}
```

## 最佳实践

1. **始终验证必填字段** - 对必需参数使用 `binding:"required"`
2. **使用特定验证标签** - 明确约束条件（`min`、`max`、`email` 等）
3. **记录结构体** - 添加注释说明字段和验证规则
4. **对可选字段使用指针** - 区分"未提供"和"零值"
5. **保持结构体专注** - 为不同操作创建独立的请求结构体

## 下一步

- [验证](/zh-cn/features/validation/) - 自定义验证规则
- [多域名路由](/zh-cn/features/multi-domain/) - 按域名路由
