---
title: Basic Usage
description: Basic examples of using Fox
head: []
---

# Basic Usage Examples

## Hello World

```go
package main

import "github.com/fox-gonic/fox"

func main() {
    r := fox.Default()

    r.GET("/", func() string {
        return "Hello, World!"
    })

    r.Run(":8080")
}
```

## REST API Example

```go
package main

import (
    "github.com/fox-gonic/fox"
    "github.com/fox-gonic/fox/httperrors"
)

type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

type CreateUserRequest struct {
    Name  string `json:"name" binding:"required"`
    Email string `json:"email" binding:"required,email"`
}

type UpdateUserRequest struct {
    ID    int    `uri:"id" binding:"required"`
    Name  string `json:"name" binding:"required"`
    Email string `json:"email" binding:"required,email"`
}

var users = []User{
    {ID: 1, Name: "John Doe", Email: "john@example.com"},
    {ID: 2, Name: "Jane Smith", Email: "jane@example.com"},
}

func main() {
    r := fox.Default()

    // List users
    r.GET("/users", func() []User {
        return users
    })

    // Get user by ID
    type UserParams struct {
        ID int `uri:"id" binding:"required"`
    }

    r.GET("/users/:id", func(_ *fox.Context, req *UserParams) (*User, error) {
        for _, u := range users {
            if u.ID == req.ID {
                return &u, nil
            }
        }
        return nil, httperrors.ErrNotFound
    })

    // Create user
    r.POST("/users", func(_ *fox.Context, req *CreateUserRequest) (*User, error) {
        user := User{
            ID:    len(users) + 1,
            Name:  req.Name,
            Email: req.Email,
        }
        users = append(users, user)
        return &user, nil
    })

    // Update user
    r.PUT("/users/:id", func(_ *fox.Context, req *UpdateUserRequest) (*User, error) {
        for i, u := range users {
            if u.ID == req.ID {
                users[i].Name = req.Name
                users[i].Email = req.Email
                return &users[i], nil
            }
        }
        return nil, httperrors.ErrNotFound
    })

    // Delete user
    r.DELETE("/users/:id", func(_ *fox.Context, req *UserParams) error {
        for i, u := range users {
            if u.ID == req.ID {
                users = append(users[:i], users[i+1:]...)
                return nil
            }
        }
        return httperrors.ErrNotFound
    })

    r.Run(":8080")
}
```

## With Middleware

```go
package main

import (
    "time"
    "github.com/fox-gonic/fox"
)

func TimingMiddleware() func(*fox.Context) {
    return func(c *fox.Context) {
        start := time.Now()

        c.Next()

        latency := time.Since(start)
        c.Logger.WithField("latency_ms", latency.Milliseconds()).Info("Request completed")
    }
}

func main() {
    r := fox.Default()
    r.Use(TimingMiddleware())

    r.GET("/api/data", func() map[string]string {
        time.Sleep(100 * time.Millisecond) // Simulate work
        return map[string]string{
            "message": "Data retrieved",
        }
    })

    r.Run(":8080")
}
```

## Next Steps

- [Quick Start](/guides/quickstart/) - Comprehensive guide
- [Features](/features/binding/) - Explore Fox features
