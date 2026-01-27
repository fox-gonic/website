---
title: Parameter Binding
description: Automatically bind request parameters to structs
head: []
---

# Parameter Binding

Fox automatically binds request parameters from various sources to your handler function parameters.

## Supported Sources

Fox can bind parameters from:

- **URI path parameters** - `/user/:id` (using `uri` tag)
- **Query strings** - `?name=value` (using `query` or `form` tag)
- **JSON request body** - `Content-Type: application/json` (using `json` tag)
- **Form data** - `Content-Type: application/x-www-form-urlencoded` (using `form` tag)
- **Headers** - Custom HTTP headers (using `header` tag)

## Basic Usage

### URI Parameters

```go
type UserRequest struct {
    ID int `uri:"id" binding:"required"`
}

r.GET("/user/:id", func(req *UserRequest) (*User, error) {
    return getUserByID(req.ID)
})
```

### Query Parameters

Fox supports both `form` and `query` tags for binding URL query parameters:

```go
type SearchRequest struct {
    Query string `query:"q" binding:"required"`  // Using query tag
    Page  int    `query:"page"`
    Size  int    `query:"size"`
}

// Or use form tag (both work the same way)
type SearchRequest struct {
    Query string `form:"q" binding:"required"`   // Using form tag
    Page  int    `form:"page"`
    Size  int    `form:"size"`
}

r.GET("/search", func(req *SearchRequest) ([]Result, error) {
    return search(req.Query, req.Page, req.Size)
})
```

### JSON Body

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

## Multiple Sources

Bind from multiple sources in a single struct:

```go
type UpdateUserRequest struct {
    ID       int    `uri:"id" binding:"required"`          // From path
    Name     string `json:"name" binding:"required"`       // From JSON body
    AuthUser string `header:"X-Auth-User" binding:"required"` // From header
}

r.PUT("/user/:id", func(req *UpdateUserRequest) error {
    return updateUser(req.ID, req.Name, req.AuthUser)
})
```

## Validation Tags

Fox uses the [validator](https://github.com/go-playground/validator) library for validation:

### Common Tags

```go
type UserInput struct {
    // Required field
    Name string `json:"name" binding:"required"`

    // Email validation
    Email string `json:"email" binding:"required,email"`

    // Length constraints
    Username string `json:"username" binding:"required,min=3,max=20"`

    // Numeric range
    Age int `json:"age" binding:"gte=0,lte=130"`

    // URL validation
    Website string `json:"website" binding:"omitempty,url"`

    // Enum validation
    Role string `json:"role" binding:"required,oneof=admin user guest"`

    // Custom regex
    Phone string `json:"phone" binding:"required,e164"` // E.164 phone format
}
```

### Nested Structs

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

### Slice Validation

```go
type BatchRequest struct {
    IDs    []int    `json:"ids" binding:"required,min=1,max=100,dive,gte=1"`
    Emails []string `json:"emails" binding:"required,dive,email"`
}
```

The `dive` tag validates each element in the slice.

## Optional Parameters

Use `omitempty` for optional fields:

```go
type FilterRequest struct {
    Name     string `form:"name"`                    // Optional, no validation
    Category string `form:"category" binding:"omitempty,oneof=books electronics"`
    MinPrice *int   `form:"min_price" binding:"omitempty,gte=0"`
}
```

## Default Values

Set default values in struct initialization:

```go
type PaginationRequest struct {
    Page int `form:"page"`
    Size int `form:"size"`
}

r.GET("/items", func(req *PaginationRequest) ([]Item, error) {
    // Set defaults if not provided
    if req.Page == 0 {
        req.Page = 1
    }
    if req.Size == 0 {
        req.Size = 20
    }

    return getItems(req.Page, req.Size)
})
```

## Error Handling

When binding or validation fails, Fox automatically returns a 400 error with details:

```json
{
  "error": "Key: 'CreateUserRequest.Email' Error:Field validation for 'Email' failed on the 'email' tag"
}
```

### Custom Error Messages

Implement custom error handling:

```go
r.SetErrorHandler(func(c *gin.Context, err error) {
    if validationErr, ok := err.(validator.ValidationErrors); ok {
        errors := make(map[string]string)
        for _, e := range validationErr {
            errors[e.Field()] = fmt.Sprintf("validation failed on '%s'", e.Tag())
        }
        c.JSON(400, gin.H{"errors": errors})
        return
    }
    c.JSON(500, gin.H{"error": err.Error()})
})
```

## Type Conversion

Fox automatically converts string parameters to the target type:

```go
type Request struct {
    ID      int       `uri:"id"`      // "123" -> 123
    Active  bool      `form:"active"` // "true" -> true
    Price   float64   `form:"price"`  // "19.99" -> 19.99
    Date    time.Time `form:"date" time_format:"2006-01-02"`
}
```

## Best Practices

1. **Always validate required fields** - Use `binding:"required"` for mandatory parameters
2. **Use specific validation tags** - Be explicit about constraints (`min`, `max`, `email`, etc.)
3. **Document your structs** - Add comments explaining fields and validation rules
4. **Use pointers for optional fields** - Distinguish between "not provided" and "zero value"
5. **Keep structs focused** - Create separate request structs for different operations

## Next Steps

- [Validation](/features/validation/) - Custom validation rules
- [Multi-Domain Routing](/features/multi-domain/) - Route by domain
