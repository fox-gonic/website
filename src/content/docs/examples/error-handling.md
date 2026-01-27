---
title: Error Handling
description: Handling errors and returning consistent error responses
head: []
---

# Error Handling

This example demonstrates various error handling patterns in Fox, including simple errors, HTTP errors with status codes, and detailed error responses.

## Features

- Simple error returns
- HTTP errors with status codes
- Custom error definitions
- Conditional error handling
- Error with additional details
- Panic recovery
- Consistent error responses

## Complete Example

```go
package main

import (
	"errors"
	"net/http"

	"github.com/fox-gonic/fox"
	"github.com/fox-gonic/fox/httperrors"
)

// Define custom errors
var (
	ErrUserNotFound = &httperrors.Error{
		HTTPCode: http.StatusNotFound,
		Code:     "USER_NOT_FOUND",
		Message:  "User not found",
	}

	ErrInsufficientBalance = &httperrors.Error{
		HTTPCode: http.StatusPaymentRequired,
		Code:     "INSUFFICIENT_BALANCE",
		Message:  "Insufficient account balance",
	}

	ErrDuplicateEmail = &httperrors.Error{
		HTTPCode: http.StatusConflict,
		Code:     "DUPLICATE_EMAIL",
		Message:  "Email already exists",
	}

	ErrInvalidCredentials = &httperrors.Error{
		HTTPCode: http.StatusUnauthorized,
		Code:     "INVALID_CREDENTIALS",
		Message:  "Invalid username or password",
	}
)

type User struct {
	ID      int     `json:"id"`
	Name    string  `json:"name"`
	Email   string  `json:"email"`
	Balance float64 `json:"balance"`
}

func main() {
	router := fox.New()

	// 1. Simple error
	router.GET("/error/simple", func() (string, error) {
		return "", errors.New("something went wrong")
	})

	// 2. HTTP error with status code
	router.GET("/error/http", func() (string, error) {
		return "", &httperrors.Error{
			HTTPCode: http.StatusBadRequest,
			Code:     "INVALID_REQUEST",
			Err:      errors.New("invalid request parameters"),
		}
	})

	// 3. Conditional error (user not found)
	router.GET("/user/:id", func(ctx *fox.Context) (*User, error) {
		id := ctx.Param("id")

		// Simulate database lookup
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

	// 4. Business logic error (insufficient balance)
	type TransferRequest struct {
		From   int     `json:"from" binding:"required"`
		To     int     `json:"to" binding:"required"`
		Amount float64 `json:"amount" binding:"required,gt=0"`
	}

	router.POST("/transfer", func(_ *fox.Context, req *TransferRequest) (map[string]any, error) {
		// Simulate checking balance
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

	// 5. Authentication error
	type LoginRequest struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	router.POST("/login", func(_ *fox.Context, req *LoginRequest) (map[string]any, error) {
		// Simulate credential check
		if req.Username != "admin" || req.Password != "password" {
			return nil, ErrInvalidCredentials
		}

		return map[string]any{
			"token": "jwt-token-here",
		}, nil
	})

	// 6. Conflict error (duplicate email)
	type SignupRequest struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
	}

	router.POST("/signup", func(_ *fox.Context, req *SignupRequest) (map[string]any, error) {
		// Simulate checking if email exists
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

	// 7. Permission error
	router.DELETE("/user/:id", func(ctx *fox.Context) (string, error) {
		id := ctx.Param("id")

		// Simulate permission check
		if id == "1" {
			return "", &httperrors.Error{
				HTTPCode: http.StatusForbidden,
				Code:     "CANNOT_DELETE_ADMIN",
				Err:      errors.New("cannot delete admin user"),
			}
		}

		return "User deleted successfully", nil
	})

	// 8. Error with additional details
	router.GET("/detailed-error", func() (string, error) {
		return "", &httperrors.Error{
			HTTPCode: http.StatusUnprocessableEntity,
			Code:     "VALIDATION_FAILED",
			Message:  "Validation failed",
			Details: map[string]any{
				"fields": []map[string]string{
					{"field": "email", "error": "invalid format"},
					{"field": "age", "error": "must be at least 18"},
				},
			},
		}
	})

	// 9. Panic recovery (handled by default recovery middleware)
	router.GET("/panic", func() string {
		panic("something went terribly wrong")
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

### Simple Error

```bash
curl http://localhost:8080/error/simple
```

Response:
```json
{
  "error": "something went wrong"
}
```

### HTTP Error

```bash
curl http://localhost:8080/error/http
```

Response (400):
```json
{
  "code": "INVALID_REQUEST",
  "error": "invalid request parameters"
}
```

### User Not Found

```bash
curl http://localhost:8080/user/999
```

Response (404):
```json
{
  "code": "USER_NOT_FOUND",
  "message": "User not found"
}
```

### Insufficient Balance

```bash
curl -X POST http://localhost:8080/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "from": 1,
    "to": 2,
    "amount": 100
  }'
```

Response (402):
```json
{
  "code": "INSUFFICIENT_BALANCE",
  "message": "Insufficient account balance"
}
```

### Invalid Credentials

```bash
curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "wrong",
    "password": "wrong"
  }'
```

Response (401):
```json
{
  "code": "INVALID_CREDENTIALS",
  "message": "Invalid username or password"
}
```

### Duplicate Email

```bash
curl -X POST http://localhost:8080/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123"
  }'
```

Response (409):
```json
{
  "code": "DUPLICATE_EMAIL",
  "message": "Email already exists"
}
```

### Detailed Error

```bash
curl http://localhost:8080/detailed-error
```

Response (422):
```json
{
  "code": "VALIDATION_FAILED",
  "message": "Validation failed",
  "details": {
    "fields": [
      {"field": "email", "error": "invalid format"},
      {"field": "age", "error": "must be at least 18"}
    ]
  }
}
```

### Panic Recovery

```bash
curl http://localhost:8080/panic
```

Response (500):
```json
{
  "error": "Internal Server Error"
}
```

## Error Types

### 1. Simple Error

Returns basic error message with 500 status:

```go
return "", errors.New("something went wrong")
```

### 2. HTTP Error with Status Code

Returns error with custom status code:

```go
return "", &httperrors.Error{
    HTTPCode: http.StatusBadRequest,
    Code:     "ERROR_CODE",
    Err:      errors.New("error message"),
}
```

### 3. HTTP Error with Additional Details

Returns error with extra information:

```go
return "", &httperrors.Error{
    HTTPCode: http.StatusUnprocessableEntity,
    Code:     "VALIDATION_FAILED",
    Message:  "Validation failed",
    Details:  map[string]any{
        "fields": []string{"email", "password"},
    },
}
```

## HTTP Status Codes

Common status codes for different error scenarios:

- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Permission denied
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate email)
- `422 Unprocessable Entity` - Validation failed
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Best Practices

1. **Use Consistent Error Codes**: Define error codes in UPPER_SNAKE_CASE
2. **Provide User-Friendly Messages**: Don't expose internal implementation details
3. **Use Appropriate Status Codes**: Match HTTP semantics
4. **Log Errors**: Log errors with context for debugging
5. **Avoid Sensitive Data**: Never expose sensitive information in error messages
6. **Handle Errors Early**: Return errors as soon as they occur
7. **Use Custom Error Types**: Define reusable error types for common scenarios
8. **Add Context**: Wrap errors with additional context when needed

## Next Steps

- [Custom Validator](/examples/custom-validator/) - Custom validation with error handling
- [Middleware](/examples/middleware/) - Error handling in middleware
- [Error Handling Documentation](/features/error-handling/) - Learn more about error handling
