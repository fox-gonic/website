# Fox Web Framework Website

Official documentation website for the Fox web framework, built with [Astro](https://astro.build/) and [Starlight](https://starlight.astro.build/).

## 🚀 Project Structure

```
├── public/
├── src/
│   ├── assets/
│   │   └── fox-logo.svg
│   ├── content/
│   │   └── docs/
│   │       ├── index.mdx
│   │       ├── guides/
│   │       ├── features/
│   │       ├── api/
│   │       ├── examples/
│   │       └── zh-cn/
│   └── styles/
│       └── custom.css
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

## 🌐 Supported Languages

- English (en)
- Simplified Chinese (zh-CN)

## 📝 Documentation Structure

- **Getting Started**: Introduction, Quick Start, Installation
- **Features**: Parameter Binding, Multi-Domain Routing, Structured Logging, Validation
- **API Reference**: Router, Context
- **Examples**: Basic Usage

## 🎨 Customization

The website uses a custom CSS file (`src/styles/custom.css`) to match the design of [gin-gonic.com](https://gin-gonic.com/), featuring:

- Dark theme by default
- Colorful feature cards (orange, green, red, blue)
- Gradient effects
- Responsive design

## ⚙️ Technical Details

**Dependencies:**
- Astro v4.16.19
- Starlight v0.29.3
- TypeScript v5.7.3

**Known Issues:**
- Build process shows a sitemap warning due to a Starlight bug, but this does not affect the website functionality or deployment
- The warning is handled automatically in the GitHub Actions workflow

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details

## 🔗 Links

- [Fox GitHub Repository](https://github.com/fox-gonic/fox)
- [Gin Web Framework](https://gin-gonic.com/)
- [Astro Documentation](https://docs.astro.build)
- [Starlight Documentation](https://starlight.astro.build/)
