# Fox Website Setup Guide

## 🎯 项目概览

Fox 官方文档网站，基于 Astro + Starlight 构建，完全模仿 gin-gonic.com 的设计风格。

## ✅ 已完成的功能

### 核心特性
- ✅ 双语支持（中文简体、英文）
- ✅ 深色主题设计
- ✅ 彩色特性卡片（橙、绿、红、蓝循环）
- ✅ 响应式布局
- ✅ 内置搜索功能
- ✅ GitHub 集成

### 文档结构
- **开始使用**：介绍、快速开始、安装
- **特性**：参数绑定、多域名路由、结构化日志、验证
- **API 参考**：Router、Context
- **示例**：基本用法

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问：http://localhost:4321

### 构建生产版本

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## ⚙️ 技术栈

- **Astro**: v4.16.19
- **Starlight**: v0.29.3
- **TypeScript**: v5.7.3
- **Sharp**: v0.33.5

## 🔧 已解决的问题

### 1. Starlight 版本兼容性
**问题**：npm install 自动安装了 Starlight v0.37.4 和 Astro v5.x
**解决**：锁定版本到稳定的 v0.29.3 和 v4.16.19

### 2. Social 配置格式
**问题**：Starlight v0.33+ 改变了 `social` 配置语法
**解决**：使用 v0.29.3 兼容的对象格式

### 3. Hero 配置错误
**问题**：`Cannot read properties of undefined (reading 'some')` 错误
**原因**：Starlight 0.29.3 在处理文档时期望 frontmatter 中有 `head` 字段
**解决**：在所有文档文件的 frontmatter 中添加 `head: []` 字段（共 22 个文件）

### 4. 安全漏洞警告
**问题**：4 个中等严重性的 lodash 漏洞
**影响**：仅开发依赖，不影响生产环境
**建议**：暂时忽略，等待上游更新

## 📁 项目结构

```
fox-gonic-website/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages 部署配置
├── src/
│   ├── assets/
│   │   └── fox-logo.svg        # Logo 文件
│   ├── content/
│   │   └── docs/
│   │       ├── index.mdx       # 英文首页
│   │       ├── guides/         # 指南文档
│   │       ├── features/       # 特性文档
│   │       ├── api/            # API 参考
│   │       ├── examples/       # 示例代码
│   │       └── zh-cn/          # 中文文档
│   └── styles/
│       └── custom.css          # 自定义样式
├── astro.config.mjs            # Astro 配置
├── package.json                # 项目依赖
├── tsconfig.json               # TypeScript 配置
└── README.md                   # 项目说明
```

## 🎨 自定义样式

网站使用自定义 CSS (`src/styles/custom.css`) 实现类似 gin-gonic.com 的设计：

- **深色主题**：黑色背景，高对比度
- **渐变效果**：Hero 区域和特性卡片使用渐变
- **彩色卡片**：4 色循环系统（橙、绿、红、蓝）
- **响应式**：移动端单列，桌面端网格布局

## 📝 内容更新指南

### 添加新文档

1. 在 `src/content/docs/` 下创建 `.md` 或 `.mdx` 文件
2. 添加 frontmatter：
   ```yaml
   ---
   title: 页面标题
   description: 页面描述
   ---
   ```
3. 在 `astro.config.mjs` 的 `sidebar` 中添加链接
4. 为中文文档在 `src/content/docs/zh-cn/` 创建对应文件

### 修改首页

编辑以下文件：
- 英文：`src/content/docs/index.mdx`
- 中文：`src/content/docs/zh-cn/index.mdx`

**注意**：首页 frontmatter 必须包含 `head: []` 字段！

## 🚢 部署

### GitHub Pages（自动）

1. 推送代码到 GitHub
2. GitHub Actions 自动构建并部署
3. 访问：`https://<username>.github.io/<repo-name>/`

### 手动部署

```bash
npm run build
# 将 dist/ 目录部署到任意静态托管服务
```

## ⚠️ 已知问题

### 构建警告

构建过程会显示 sitemap 相关警告：
```
Cannot read properties of undefined (reading 'reduce')
```

**影响**：不影响网站功能
**原因**：Starlight 的已知 bug
**解决**：GitHub Actions 配置了 `continue-on-error`，部署不受影响

### 依赖警告

npm install 会显示 10 个安全漏洞（9 moderate, 1 high）：
- 全部来自 lodash（开发依赖）
- 不影响生产环境
- 建议暂时忽略

## 📞 支持

- Fox 仓库：https://github.com/fox-gonic/fox
- Astro 文档：https://docs.astro.build
- Starlight 文档：https://starlight.astro.build

## 📄 许可证

MIT License
