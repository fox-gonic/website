---
title: 验证
description: 自定义验证规则和错误处理
head: []
---

Fox 通过结构体标签和自定义验证器提供灵活的验证选项。

## 内置验证

Fox 使用 [go-playground/validator](https://github.com/go-playground/validator) 库进行验证。

### 常用验证器

```go
type UserInput struct {
    // 必填字段
    Name string `json:"name" binding:"required"`

    // 邮箱验证
    Email string `json:"email" binding:"required,email"`

    // 字符串长度
    Username string `json:"username" binding:"required,min=3,max=20"`

    // 数值范围
    Age int `json:"age" binding:"required,gte=0,lte=130"`

    // URL 验证
    Website string `json:"website" binding:"omitempty,url"`

    // 枚举验证
    Role string `json:"role" binding:"required,oneof=admin user guest"`
}
```

## 自定义验证

### IsValider 接口

实现 `IsValider` 接口以自定义验证逻辑：

```go
type SignupRequest struct {
    Username string `json:"username" binding:"required"`
    Password string `json:"password" binding:"required"`
    Confirm  string `json:"confirm" binding:"required"`
}

func (r *SignupRequest) IsValid() error {
    if r.Password != r.Confirm {
        return errors.New("密码不匹配")
    }

    if len(r.Password) < 8 {
        return errors.New("密码必须至少 8 个字符")
    }

    // 检查密码复杂度
    if !hasUpperCase(r.Password) || !hasLowerCase(r.Password) || !hasDigit(r.Password) {
        return errors.New("密码必须包含大写字母、小写字母和数字")
    }

    return nil
}
```

Fox 在绑定和内置验证之后自动调用 `IsValid()`。

### 业务验证

```go
type CreateOrderRequest struct {
    UserID  int       `json:"user_id" binding:"required"`
    Items   []Item    `json:"items" binding:"required,min=1,dive"`
    Address Address   `json:"address" binding:"required"`
}

func (r *CreateOrderRequest) IsValid() error {
    // 检查用户是否存在
    if !userExists(r.UserID) {
        return errors.New("用户未找到")
    }

    // 验证总金额
    total := 0.0
    for _, item := range r.Items {
        if item.Quantity <= 0 {
            return fmt.Errorf("商品 %d 的数量无效", item.ID)
        }
        total += item.Price * float64(item.Quantity)
    }

    if total <= 0 {
        return errors.New("订单总额必须大于 0")
    }

    return nil
}
```

## 错误处理

### 默认错误响应

当绑定或验证失败时，Fox 默认返回 `400 Bad Request`：

```json
{
  "code": "BIND_ERROR",
  "error": "(400): Key: 'CreateUserRequest.Email' Error:Field validation for 'Email' failed on the 'email' tag",
  "meta": "Key: 'CreateUserRequest.Email' Error:Field validation for 'Email' failed on the 'email' tag"
}
```

### 自定义错误处理器

通过 `RenderErrorFunc` 自定义自动错误响应：

```go
r := fox.New()

r.RenderErrorFunc = func(c *fox.Context, err error) {
    if validationErr, ok := err.(validator.ValidationErrors); ok {
        errors := make(map[string]string)

        for _, e := range validationErr {
            field := e.Field()
            tag := e.Tag()

            // 自定义错误消息
            switch tag {
            case "required":
                errors[field] = fmt.Sprintf("%s 为必填项", field)
            case "email":
                errors[field] = "邮箱格式无效"
            case "min":
                errors[field] = fmt.Sprintf("%s 必须至少 %s 个字符", field, e.Param())
            case "max":
                errors[field] = fmt.Sprintf("%s 最多 %s 个字符", field, e.Param())
            default:
                errors[field] = fmt.Sprintf("'%s' 验证失败", tag)
            }
        }

        c.JSON(400, gin.H{"errors": errors})
        return
    }

    c.JSON(400, gin.H{"error": err.Error()})
}
```

响应：
```json
{
  "errors": {
    "Email": "邮箱格式无效",
    "Password": "Password 必须至少 8 个字符"
  }
}
```

## 字段级验证

### 自定义验证器

注册自定义验证函数：

```go
import "github.com/go-playground/validator/v10"

func init() {
    if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
        v.RegisterValidation("username", validateUsername)
    }
}

func validateUsername(fl validator.FieldLevel) bool {
    username := fl.Field().String()

    // 自定义逻辑：仅字母数字和下划线
    matched, _ := regexp.MatchString(`^[a-zA-Z0-9_]+$`, username)
    return matched
}

type UserInput struct {
    Username string `json:"username" binding:"required,username"`
}
```

### 跨字段验证

验证字段之间的关系：

```go
func init() {
    if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
        v.RegisterValidation("gtefield_date", gtefieldDate)
    }
}

type EventInput struct {
    StartDate time.Time `json:"start_date" binding:"required"`
    EndDate   time.Time `json:"end_date" binding:"required,gtefield_date=StartDate"`
}

func gtefieldDate(fl validator.FieldLevel) bool {
    endDate := fl.Field()
    startDateField := fl.Parent().FieldByName(fl.Param())

    if !startDateField.IsValid() {
        return false
    }

    return endDate.Interface().(time.Time).After(startDateField.Interface().(time.Time))
}
```

## 条件验证

### Required If

```go
type ContactForm struct {
    PreferEmail bool   `json:"prefer_email"`
    Email       string `json:"email" binding:"required_if=PreferEmail true,omitempty,email"`
    Phone       string `json:"phone" binding:"required_unless=PreferEmail true"`
}
```

### 依赖字段

```go
type PaymentRequest struct {
    Method      string `json:"method" binding:"required,oneof=credit_card paypal"`
    CardNumber  string `json:"card_number" binding:"required_if=Method credit_card"`
    PayPalEmail string `json:"paypal_email" binding:"required_if=Method paypal,omitempty,email"`
}
```

## 测试验证

```go
func TestUserValidation(t *testing.T) {
    tests := []struct {
        name    string
        input   SignupRequest
        wantErr bool
    }{
        {
            name: "有效输入",
            input: SignupRequest{
                Username: "john_doe",
                Password: "SecurePass123",
                Confirm:  "SecurePass123",
            },
            wantErr: false,
        },
        {
            name: "密码不匹配",
            input: SignupRequest{
                Username: "john_doe",
                Password: "SecurePass123",
                Confirm:  "DifferentPass",
            },
            wantErr: true,
        },
        {
            name: "弱密码",
            input: SignupRequest{
                Username: "john_doe",
                Password: "weak",
                Confirm:  "weak",
            },
            wantErr: true,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := tt.input.IsValid()
            if (err != nil) != tt.wantErr {
                t.Errorf("IsValid() error = %v, wantErr %v", err, tt.wantErr)
            }
        })
    }
}
```

## 最佳实践

1. **结合结构体标签和自定义验证**
   ```go
   type Input struct {
       Email string `json:"email" binding:"required,email"` // 结构体标签
   }

   func (i *Input) IsValid() error {
       // 自定义业务逻辑
       if isBlacklisted(i.Email) {
           return errors.New("邮箱在黑名单中")
       }
       return nil
   }
   ```

2. **提供清晰的错误消息**
   - 使用字段名，而不是结构体标签
   - 解释错误所在以及如何修复
   - 支持国际化

3. **早期验证** - 对无效输入快速失败

4. **不要重复数据库约束** - 但要验证业务规则

5. **测试验证逻辑** - 为 IsValid() 方法编写单元测试

## 下一步

- [参数绑定](/zh-cn/features/binding/) - 绑定请求参数
- [结构化日志](/zh-cn/features/logging/) - 记录验证失败
