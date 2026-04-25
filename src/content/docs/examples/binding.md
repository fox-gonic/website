---
title: Parameter Binding
description: Automatic parameter binding from different sources
head: []
---

This example demonstrates automatic parameter binding from different sources including JSON body, URI parameters, and query parameters.

## Features

- JSON body binding with validation
- URI parameter binding
- Query parameter binding
- Combined URI and JSON binding
- Custom validation using struct tags

## Complete Example

```go
package main

import (
	"errors"
	"net/http"

	"github.com/fox-gonic/fox"
	"github.com/fox-gonic/fox/httperrors"
)

// User represents a user model
type User struct {
	ID       int64  `json:"id"`
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Age      int    `json:"age" binding:"gte=0,lte=150"`
}

// CreateUserRequest represents the request to create a user
type CreateUserRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Age      int    `json:"age" binding:"gte=18,lte=150"`
}

// UpdateUserRequest represents the request to update a user
type UpdateUserRequest struct {
	ID       int64  `uri:"id" binding:"required,gt=0"`
	Username string `json:"username" binding:"omitempty,min=3,max=50"`
	Email    string `json:"email" binding:"omitempty,email"`
}

// QueryUsersRequest represents query parameters
// You can use either 'query' or 'form' tag for URL query parameters
type QueryUsersRequest struct {
	Page     int    `query:"page" binding:"omitempty,gte=1"`
	PageSize int    `query:"page_size" binding:"omitempty,gte=1,lte=100"`
	Keyword  string `query:"keyword"`
}

func main() {
	router := fox.New()

	// POST: Create user with JSON body binding
	router.POST("/users", func(_ *fox.Context, req *CreateUserRequest) (*User, error) {
		// In real application, save to database
		user := &User{
			ID:       1,
			Username: req.Username,
			Email:    req.Email,
			Age:      req.Age,
		}
		return user, nil
	})

	// PUT: Update user with URI and JSON binding
	router.PUT("/users/:id", func(_ *fox.Context, req *UpdateUserRequest) (*User, error) {
		// In real application, update in database
		user := &User{
			ID:       req.ID,
			Username: req.Username,
			Email:    req.Email,
		}
		return user, nil
	})

	// GET: Query users with query parameters
	router.GET("/users", func(_ *fox.Context, req *QueryUsersRequest) (map[string]any, error) {
		// Set defaults
		if req.Page == 0 {
			req.Page = 1
		}
		if req.PageSize == 0 {
			req.PageSize = 10
		}

		// In real application, query from database
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

	// GET: Get user by ID
	router.GET("/users/:id", func(ctx *fox.Context) (*User, error) {
		_ = ctx.Param("id")

		// In real application, fetch from database
		return &User{
			ID:       1,
			Username: "alice",
			Email:    "alice@example.com",
			Age:      25,
		}, nil
	})

	// Custom validation example
	router.POST("/validate", func(_ *fox.Context, req *CreateUserRequest) (string, error) {
		// Additional custom validation
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

## Running the Example

```bash
go run main.go
```

## Testing

### Create User (JSON Binding)

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

### Update User (URI + JSON)

```bash
curl -X PUT http://localhost:8080/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice_updated",
    "email": "alice.new@example.com"
  }'
```

### Query Users

```bash
curl "http://localhost:8080/users?page=1&page_size=10&keyword=alice"
```

### Get User by ID

```bash
curl http://localhost:8080/users/1
```

## Validation Tags

Fox uses `github.com/go-playground/validator/v10` for validation. Common tags:

- `required` - Field must be present
- `email` - Must be valid email format
- `min=n` - Minimum value/length
- `max=n` - Maximum value/length
- `gte=n` - Greater than or equal to
- `lte=n` - Less than or equal to
- `gt=n` - Greater than
- `lt=n` - Less than
- `omitempty` - Skip validation if empty

## Next Steps

- [Custom Validator](/examples/custom-validator/) - Implement custom validation logic
- [Error Handling](/examples/error-handling/) - Handle validation errors
- [Binding Documentation](/features/binding/) - Learn more about parameter binding
