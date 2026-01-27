---
title: Installation
description: How to install Fox and set up your development environment
head: []
---

# Installation

## Requirements

- **Go 1.21+** - Fox requires Go version 1.21 or higher
- **Git** - For version control and dependency management

## Installing Fox

### Using go get

The simplest way to install Fox is using `go get`:

```bash
go get -u github.com/fox-gonic/fox
```

This will download Fox and its dependencies, including Gin.

### Using Go Modules

If you're starting a new project:

```bash
# Create a new directory
mkdir myproject
cd myproject

# Initialize Go module
go mod init myproject

# Install Fox
go get -u github.com/fox-gonic/fox
```

### Specific Version

To install a specific version of Fox:

```bash
go get github.com/fox-gonic/fox@v0.1.0
```

## Verifying Installation

Create a simple test file `main.go`:

```go
package main

import (
    "github.com/fox-gonic/fox"
)

func main() {
    r := fox.Default()
    r.GET("/ping", func() string {
        return "pong"
    })
    r.Run(":8080")
}
```

Run it:

```bash
go run main.go
```

Visit `http://localhost:8080/ping` in your browser. You should see "pong".

## Development Tools

### Recommended Tools

- **Air** - Live reload for Go apps
  ```bash
  go install github.com/cosmtrek/air@latest
  ```

- **Delve** - Go debugger
  ```bash
  go install github.com/go-delve/delve/cmd/dlv@latest
  ```

### IDE Setup

**VS Code**

Install the [Go extension](https://marketplace.visualstudio.com/items?itemName=golang.go):
- Provides IntelliSense, debugging, and more
- Configure gopls for best experience

**GoLand**

GoLand has built-in support for Go. Just open your project and you're ready to go.

## Updating Fox

To update to the latest version:

```bash
go get -u github.com/fox-gonic/fox
go mod tidy
```

## Troubleshooting

### Import Cycle Error

If you encounter import cycle errors, ensure your project structure is clean and you're not creating circular dependencies.

### Gin Version Conflicts

Fox depends on a specific version of Gin. If you have version conflicts:

```bash
go mod tidy
go clean -modcache
go get -u github.com/fox-gonic/fox
```

### Build Errors

If you encounter build errors:

1. Ensure you're using Go 1.21+: `go version`
2. Clean your module cache: `go clean -modcache`
3. Re-download dependencies: `go mod download`

## Next Steps

- [Quick Start](/guides/quickstart/) - Build your first Fox application
- [Features](/features/binding/) - Explore Fox's features
