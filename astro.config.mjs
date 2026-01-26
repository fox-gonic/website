import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://fox-gonic.github.io',
  integrations: [
    starlight({
      title: 'Fox Web Framework',
      logo: {
        src: './src/assets/fox-logo.svg',
      },
      social: {
        github: 'https://github.com/fox-gonic/fox',
      },
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'English',
          lang: 'en',
        },
        'zh-cn': {
          label: '简体中文',
          lang: 'zh-CN',
        },
      },
      customCss: [
        './src/styles/custom.css',
      ],
      sidebar: [
        {
          label: 'Getting Started',
          translations: {
            'zh-CN': '开始使用',
          },
          items: [
            {
              label: 'Introduction',
              link: '/guides/introduction/',
              translations: {
                'zh-CN': '介绍',
              },
            },
            {
              label: 'Quick Start',
              link: '/guides/quickstart/',
              translations: {
                'zh-CN': '快速开始',
              },
            },
            {
              label: 'Installation',
              link: '/guides/installation/',
              translations: {
                'zh-CN': '安装',
              },
            },
          ],
        },
        {
          label: 'Features',
          translations: {
            'zh-CN': '特性',
          },
          items: [
            {
              label: 'Parameter Binding',
              link: '/features/binding/',
              translations: {
                'zh-CN': '参数绑定',
              },
            },
            {
              label: 'Multi-Domain Routing',
              link: '/features/multi-domain/',
              translations: {
                'zh-CN': '多域名路由',
              },
            },
            {
              label: 'Structured Logging',
              link: '/features/logging/',
              translations: {
                'zh-CN': '结构化日志',
              },
            },
            {
              label: 'Validation',
              link: '/features/validation/',
              translations: {
                'zh-CN': '验证',
              },
            },
          ],
        },
        {
          label: 'API Reference',
          translations: {
            'zh-CN': 'API 参考',
          },
          items: [
            {
              label: 'Router',
              link: '/api/router/',
              translations: {
                'zh-CN': '路由器',
              },
            },
            {
              label: 'Context',
              link: '/api/context/',
              translations: {
                'zh-CN': '上下文',
              },
            },
          ],
        },
        {
          label: 'Examples',
          translations: {
            'zh-CN': '示例',
          },
          items: [
            {
              label: 'Basic Usage',
              link: '/examples/basic/',
              translations: {
                'zh-CN': '基本用法',
              },
            },
          ],
        },
      ],
    }),
  ],
});
