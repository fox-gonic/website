---
title: 安装
description: 如何安装 Fox 并设置开发环境
head: []
---

# 安装

## 要求

- **Go 1.21+** - Fox 需要 Go 1.21 或更高版本
- **Git** - 用于版本控制和依赖管理

## 安装 Fox

### 使用 go get

安装 Fox 最简单的方法是使用 `go get`：

```bash
go get -u github.com/fox-gonic/fox
```

这将下载 Fox 及其依赖项，包括 Gin。

### 使用 Go Modules

如果您正在开始一个新项目：

```bash
# 创建新目录
mkdir myproject
cd myproject

# 初始化 Go module
go mod init myproject

# 安装 Fox
go get -u github.com/fox-gonic/fox
```

### 特定版本

安装特定版本的 Fox：

```bash
go get github.com/fox-gonic/fox@v0.1.0
```

## 验证安装

创建一个简单的测试文件 `main.go`：

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

运行它：

```bash
go run main.go
```

在浏览器中访问 `http://localhost:8080/ping`，您应该看到 "pong"。

## 开发工具

### 推荐工具

- **Air** - Go 应用的热重载
  ```bash
  go install github.com/cosmtrek/air@latest
  ```

- **Delve** - Go 调试器
  ```bash
  go install github.com/go-delve/delve/cmd/dlv@latest
  ```

### IDE 设置

**VS Code**

安装 [Go 扩展](https://marketplace.visualstudio.com/items?itemName=golang.go)：
- 提供智能感知、调试等功能
- 配置 gopls 以获得最佳体验

**GoLand**

GoLand 内置了对 Go 的支持。只需打开您的项目即可开始使用。

## 更新 Fox

更新到最新版本：

```bash
go get -u github.com/fox-gonic/fox
go mod tidy
```

## 故障排除

### 导入循环错误

如果遇到导入循环错误，请确保项目结构清晰，并且没有创建循环依赖。

### Gin 版本冲突

Fox 依赖于特定版本的 Gin。如果您遇到版本冲突：

```bash
go mod tidy
go clean -modcache
go get -u github.com/fox-gonic/fox
```

### 构建错误

如果遇到构建错误：

1. 确保使用 Go 1.21+：`go version`
2. 清理模块缓存：`go clean -modcache`
3. 重新下载依赖项：`go mod download`

## 下一步

- [快速开始](/zh-cn/guides/quickstart/) - 构建您的第一个 Fox 应用
- [特性](/zh-cn/features/binding/) - 探索 Fox 的特性
