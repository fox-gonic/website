---
title: Validation
description: Custom validation rules and error handling
head: []
---

# Validation

Fox provides flexible validation options through struct tags and custom validators.

## Built-in Validation

Fox uses the [go-playground/validator](https://github.com/go-playground/validator) library for validation.

### Common Validators

```go
type UserInput struct {
    // Required field
    Name string `json:"name" binding:"required"`

    // Email validation
    Email string `json:"email" binding:"required,email"`

    // String length
    Username string `json:"username" binding:"required,min=3,max=20"`

    // Numeric range
    Age int `json:"age" binding:"required,gte=0,lte=130"`

    // URL validation
    Website string `json:"website" binding:"omitempty,url"`

    // Enum validation
    Role string `json:"role" binding:"required,oneof=admin user guest"`
}
```

## Custom Validation

### IsValider Interface

Implement the `IsValider` interface for custom validation logic:

```go
type SignupRequest struct {
    Username string `json:"username" binding:"required"`
    Password string `json:"password" binding:"required"`
    Confirm  string `json:"confirm" binding:"required"`
}

func (r *SignupRequest) IsValid() error {
    if r.Password != r.Confirm {
        return errors.New("passwords do not match")
    }

    if len(r.Password) < 8 {
        return errors.New("password must be at least 8 characters")
    }

    // Check password complexity
    if !hasUpperCase(r.Password) || !hasLowerCase(r.Password) || !hasDigit(r.Password) {
        return errors.New("password must contain uppercase, lowercase, and digit")
    }

    return nil
}
```

Fox automatically calls `IsValid()` after binding and built-in validation.

### Business Validation

```go
type CreateOrderRequest struct {
    UserID  int       `json:"user_id" binding:"required"`
    Items   []Item    `json:"items" binding:"required,min=1,dive"`
    Address Address   `json:"address" binding:"required"`
}

func (r *CreateOrderRequest) IsValid() error {
    // Check if user exists
    if !userExists(r.UserID) {
        return errors.New("user not found")
    }

    // Validate total amount
    total := 0.0
    for _, item := range r.Items {
        if item.Quantity <= 0 {
            return fmt.Errorf("invalid quantity for item %d", item.ID)
        }
        total += item.Price * float64(item.Quantity)
    }

    if total <= 0 {
        return errors.New("order total must be greater than 0")
    }

    return nil
}
```

## Error Handling

### Default Error Response

When binding or validation fails, Fox returns a `400 Bad Request` by default:

```json
{
  "code": "BIND_ERROR",
  "error": "(400): Key: 'CreateUserRequest.Email' Error:Field validation for 'Email' failed on the 'email' tag",
  "meta": "Key: 'CreateUserRequest.Email' Error:Field validation for 'Email' failed on the 'email' tag"
}
```

### Custom Error Handler

Customize automatic error responses with `RenderErrorFunc`:

```go
r := fox.New()

r.RenderErrorFunc = func(c *fox.Context, err error) {
    if validationErr, ok := err.(validator.ValidationErrors); ok {
        errors := make(map[string]string)

        for _, e := range validationErr {
            field := e.Field()
            tag := e.Tag()

            // Custom error messages
            switch tag {
            case "required":
                errors[field] = fmt.Sprintf("%s is required", field)
            case "email":
                errors[field] = "Invalid email format"
            case "min":
                errors[field] = fmt.Sprintf("%s must be at least %s characters", field, e.Param())
            case "max":
                errors[field] = fmt.Sprintf("%s must be at most %s characters", field, e.Param())
            default:
                errors[field] = fmt.Sprintf("Validation failed on '%s'", tag)
            }
        }

        c.JSON(400, gin.H{"errors": errors})
        return
    }

    c.JSON(400, gin.H{"error": err.Error()})
}
```

Response:
```json
{
  "errors": {
    "Email": "Invalid email format",
    "Password": "Password must be at least 8 characters"
  }
}
```

## Field-Level Validation

### Custom Validators

Register custom validation functions:

```go
import "github.com/go-playground/validator/v10"

func init() {
    if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
        v.RegisterValidation("username", validateUsername)
    }
}

func validateUsername(fl validator.FieldLevel) bool {
    username := fl.Field().String()

    // Custom logic: alphanumeric and underscore only
    matched, _ := regexp.MatchString(`^[a-zA-Z0-9_]+$`, username)
    return matched
}

type UserInput struct {
    Username string `json:"username" binding:"required,username"`
}
```

### Cross-Field Validation

Validate relationships between fields:

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

## Conditional Validation

### Required If

```go
type ContactForm struct {
    PreferEmail bool   `json:"prefer_email"`
    Email       string `json:"email" binding:"required_if=PreferEmail true,omitempty,email"`
    Phone       string `json:"phone" binding:"required_unless=PreferEmail true"`
}
```

### Dependent Fields

```go
type PaymentRequest struct {
    Method      string `json:"method" binding:"required,oneof=credit_card paypal"`
    CardNumber  string `json:"card_number" binding:"required_if=Method credit_card"`
    PayPalEmail string `json:"paypal_email" binding:"required_if=Method paypal,omitempty,email"`
}
```

## Testing Validation

```go
func TestUserValidation(t *testing.T) {
    tests := []struct {
        name    string
        input   SignupRequest
        wantErr bool
    }{
        {
            name: "valid input",
            input: SignupRequest{
                Username: "john_doe",
                Password: "SecurePass123",
                Confirm:  "SecurePass123",
            },
            wantErr: false,
        },
        {
            name: "password mismatch",
            input: SignupRequest{
                Username: "john_doe",
                Password: "SecurePass123",
                Confirm:  "DifferentPass",
            },
            wantErr: true,
        },
        {
            name: "weak password",
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

## Best Practices

1. **Combine struct tags and custom validation**
   ```go
   type Input struct {
       Email string `json:"email" binding:"required,email"` // Struct tag
   }

   func (i *Input) IsValid() error {
       // Custom business logic
       if isBlacklisted(i.Email) {
           return errors.New("email is blacklisted")
       }
       return nil
   }
   ```

2. **Provide clear error messages**
   - Use field names, not struct tags, in messages
   - Explain what's wrong and how to fix it
   - Support internationalization

3. **Validate early** - Fail fast on invalid input

4. **Don't duplicate database constraints** - But do validate business rules

5. **Test validation logic** - Write unit tests for IsValid() methods

## Next Steps

- [Parameter Binding](/features/binding/) - Bind request parameters
- [Structured Logging](/features/logging/) - Log validation failures
