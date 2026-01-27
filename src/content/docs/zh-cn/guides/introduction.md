---
title: 介绍
description: 了解 Fox Web 框架及其核心概念
head: []
---

# 介绍

Fox 是一个构建在 [Gin](https://gin-gonic.com/) 之上的强大 Web 框架，提供自动参数绑定、灵活的响应渲染和增强功能，同时保持与 Gin 的完全兼容。

## 什么是 Fox？

Fox 通过现代化的便利功能扩展了 Gin，减少样板代码并提高开发效率。它自动处理常见任务，如：

- 从 URI 路径、查询字符串和 JSON 请求体进行**参数绑定**
- 通过自动序列化进行**响应渲染**
- 通过结构体标签和自定义验证器进行**请求验证**
- 支持 TraceID 和上下文字段的**结构化日志**

## 主要优势

### 更少的样板代码

使用 Fox，您可以编写纯粹专注于业务逻辑的处理器：

```go
// 传统的 Gin 处理器
func CreateUser(c *gin.Context) {
    var req UserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    // 业务逻辑...
    c.JSON(200, gin.H{"message": "success"})
}

// Fox 处理器 - 更简洁、更专注
func CreateUser(req *UserRequest) (any, error) {
    // 仅业务逻辑
    return map[string]string{"message": "success"}, nil
}
```

### 完全兼容 Gin

Fox 与 Gin 100% 兼容。您可以：

- 使用任何现有的 Gin 中间件
- 在同一应用中混合使用 Fox 和 Gin 处理器
- 逐步从 Gin 迁移到 Fox
- 在需要时访问底层的 `gin.Context`

### 为生产环境而生

Fox 包含生产就绪的特性：

- 用于微服务的多域名路由
- 支持轮转的结构化日志
- 优雅的错误处理
- 高性能且开销最小

## 何时使用 Fox

Fox 非常适合：

- 构建拥有众多端点的 REST API
- 需要自动参数验证的项目
- 需要简洁、可维护的处理器代码的应用
- 处理 JSON 请求/响应体的系统

## 下一步

- [快速开始](/zh-cn/guides/quickstart/) - 几分钟内启动并运行
- [安装](/zh-cn/guides/installation/) - 详细的安装说明
- [特性](/zh-cn/features/binding/) - 深入探索 Fox 的特性
