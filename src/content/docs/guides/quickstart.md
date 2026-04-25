---
title: Quick Start
description: Get started with Fox in minutes
head: []
---

# Quick Start

Get up and running with Fox in just a few minutes.

## Prerequisites

- Go 1.21 or higher
- Basic familiarity with Go and web development

## Installation

```bash
go get -u github.com/fox-gonic/fox
```

## Your First Fox Application

Create a new file `main.go`:

```go
package main

import (
    "github.com/fox-gonic/fox"
)

type HelloRequest struct {
    Name string `form:"name" binding:"required"`
}

func main() {
    // Create a Fox router with default middleware
    r := fox.Default()

    // Define a simple GET endpoint with automatic parameter binding
    r.GET("/hello", func(_ *fox.Context, req *HelloRequest) (any, error) {
        return map[string]string{
            "message": "Hello, " + req.Name + "!",
        }, nil
    })

    // Define a JSON POST endpoint
    type CreateUserRequest struct {
        Name  string `json:"name" binding:"required"`
        Email string `json:"email" binding:"required,email"`
    }

    r.POST("/users", func(_ *fox.Context, req *CreateUserRequest) (any, error) {
        // In a real application, you would save to a database here
        return map[string]any{
            "id":    1,
            "name":  req.Name,
            "email": req.Email,
        }, nil
    })

    // Start the server
    r.Run(":8080")
}
```

## Run Your Application

```bash
go run main.go
```

## Test Your Endpoints

Test the GET endpoint:

```bash
curl "http://localhost:8080/hello?name=World"
```

Response:
```json
{
  "message": "Hello, World!"
}
```

Test the POST endpoint:

```bash
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'
```

Response:
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com"
}
```

## What's Next?

Now that you have a basic Fox application running, explore more features:

- [Parameter Binding](/features/binding/) - Learn about different binding options
- [Multi-Domain Routing](/features/multi-domain/) - Route by domain name
- [Structured Logging](/features/logging/) - Add comprehensive logging
- [Validation](/features/validation/) - Custom validation rules

## Common Patterns

### Error Handling

```go
type UserParams struct {
    ID int `uri:"id" binding:"required"`
}

r.GET("/user/:id", func(_ *fox.Context, req *UserParams) (*User, error) {
    user, err := db.GetUser(req.ID)
    if err != nil {
        return nil, err // Fox handles error responses automatically
    }
    return user, nil
})
```

### Using Gin Context

When you need access to the underlying Gin context:

```go
r.GET("/example", func(c *fox.Context, req *Request) (any, error) {
    // Access the embedded Gin context directly
    userAgent := c.GetHeader("User-Agent")

    // Your logic here
    return response, nil
})
```

### Custom Validation

```go
type SignupRequest struct {
    Username string `json:"username" binding:"required"`
    Password string `json:"password" binding:"required"`
}

func (r *SignupRequest) IsValid() error {
    if len(r.Password) < 8 {
        return errors.New("password must be at least 8 characters")
    }
    return nil
}
```
