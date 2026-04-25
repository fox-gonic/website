# Fox Web Framework Website

Official documentation website for the Fox web framework, built with [Astro](https://astro.build/) and [Starlight](https://starlight.astro.build/).

🌐 **Live Site**: [https://fox-gonic.com](https://fox-gonic.com)

## ✨ Features

Fox is a powerful extension of Gin that provides:

- 🚀 **Automatic Parameter Binding** - Bind parameters from URI, query strings, and JSON bodies with struct tags
- 🌐 **Multi-Domain Routing** - Route traffic based on domain names with exact and regex pattern matching
- 📝 **Structured Logging** - Built-in logger with TraceID, structured fields, and automatic file rotation
- 🛡️ **Crash Protection** - Graceful panic recovery with detailed error logging and stack traces
- ⚡ **High Performance** - Minimal overhead above Gin's routing engine
- 🔌 **Middleware Support** - Full compatibility with Gin middleware ecosystem
- ✅ **Custom Validation** - Implement IsValider interface for complex business validation logic
- 🔄 **100% Gin Compatible** - Use any existing Gin middleware and handlers seamlessly

## 🚀 Project Structure

```
├── public/
├── src/
│   ├── assets/
│   │   └── fox-logo.svg
│   ├── content/
│   │   └── docs/
│   │       ├── index.mdx              # Homepage with feature showcase
│   │       ├── guides/                # Getting started documentation
│   │       │   ├── introduction.md
│   │       │   ├── quickstart.md
│   │       │   └── installation.md
│   │       ├── features/              # Core features documentation
│   │       │   ├── binding.md
│   │       │   ├── multi-domain.md
│   │       │   ├── logging.md
│   │       │   └── validation.md
│   │       ├── api/                   # API reference
│   │       │   ├── router.md
│   │       │   └── context.md
│   │       ├── examples/              # Code examples
│   │       │   ├── basic.md
│   │       │   ├── binding.md
│   │       │   ├── middleware.md
│   │       │   ├── domain-routing.md
│   │       │   ├── custom-validator.md
│   │       │   ├── error-handling.md
│   │       │   └── logger-config.md
│   │       └── zh-cn/                 # Simplified Chinese translations (17 files)
│   └── styles/
│       └── custom.css
├── .github/
│   └── workflows/
│       └── deploy.yml                 # GitHub Pages deployment
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |

## 🚢 Deployment

The site is built with Astro and deployed from the `main` branch to GitHub Pages with a custom domain:

- Production URL: [https://fox-gonic.com](https://fox-gonic.com)
- Canonical site URL: configured in `astro.config.mjs`
- Deployment workflow: `.github/workflows/deploy.yml`

## 🌐 Supported Languages

- English (en)
- Simplified Chinese (zh-CN)

## 📝 Documentation Structure

The documentation is organized into four main sections:

- **Getting Started**: Introduction, Quick Start, Installation
- **Features**: Parameter Binding, Multi-Domain Routing, Structured Logging, Validation
- **API Reference**: Router, Context
- **Examples**: Basic Usage, Parameter Binding, Middleware, Domain Routing, Custom Validator, Error Handling, Logger Configuration

All content is available in both English and Simplified Chinese.

## 🎨 Customization

The website uses a custom CSS file (`src/styles/custom.css`) to match the design of [gin-gonic.com](https://gin-gonic.com/), featuring:

- Dark theme by default
- Colorful feature cards (orange, green, red, blue)
- Gradient effects
- Responsive design

## ⚙️ Technical Details

**Dependencies:**
- Astro v5.16.15
- Starlight v0.37.4
- TypeScript v5.7.3
- Sharp v0.34.5 (image optimization)

**Development:**
- Full TypeScript support with strict type checking
- Hot module replacement (HMR) for fast development
- Optimized production builds with automatic asset optimization

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details

## 🔗 Links

- [Fox GitHub Repository](https://github.com/fox-gonic/fox)
- [Gin Web Framework](https://gin-gonic.com/)
- [Astro Documentation](https://docs.astro.build)
- [Starlight Documentation](https://starlight.astro.build/)
