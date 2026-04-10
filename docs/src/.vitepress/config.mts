import { defineConfig } from 'vitepress'

export default defineConfig({
  vite: {
    server: {
      allowedHosts: true,
    },
  },
  title: 'agento-patronum',
  appearance: false,
  titleTemplate: false,
  description: 'Protect sensitive files, credentials, and commands from unintended AI access in Claude Code',
  base: '/agento-patronum/',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/agento-patronum/favicon.svg' }],
  ],

  themeConfig: {
    logo: '/shield.svg',

    nav: [
      { text: 'Get Started', link: '/getting-started/installation' },
      { text: 'Why patronum', link: '/internals/why-patronum' },
      { text: 'Skills', link: '/commands/' },
      { text: 'How It Works', link: '/internals/how-it-works' },
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Installation', link: '/getting-started/installation' },
          { text: 'Managing', link: '/getting-started/managing' },
          { text: 'Default Protections', link: '/getting-started/default-protections' },
        ],
      },
      {
        text: 'Protection Rules',
        items: [
          { text: 'File Patterns', link: '/rules/file-patterns' },
          { text: 'Bash Commands', link: '/rules/bash-commands' },
          { text: 'Custom Rules', link: '/rules/custom-rules' },
        ],
      },
      {
        text: 'Skills',
        items: [
          { text: 'Overview', link: '/commands/' },
          { text: '/patronum-add', link: '/commands/add' },
          { text: '/patronum-remove', link: '/commands/remove' },
          { text: '/patronum-list', link: '/commands/list' },
          { text: '/patronum-suggest', link: '/commands/suggest' },
          { text: '/patronum-verify', link: '/commands/verify' },
        ],
      },
      {
        text: 'Internals',
        items: [
          { text: 'Why patronum', link: '/internals/why-patronum' },
          { text: 'How It Works', link: '/internals/how-it-works' },
          { text: 'Why Hooks', link: '/internals/why-hooks' },
          { text: 'Log Format', link: '/internals/log-format' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'patronum.json Schema', link: '/reference/schema' },
          { text: 'Changelog', link: '/reference/changelog' },
          { text: 'Contributing', link: '/reference/contributing' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/emaarco/agento-patronum' },
    ],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/emaarco/agento-patronum/edit/main/docs/src/:path',
    },

    footer: {
      message: 'Open source under the <a href="https://github.com/emaarco/agento-patronum?tab=MIT-1-ov-file#readme" target="_blank">MIT License</a>. Contributions welcome!',
      copyright: 'Created with \u2665 by <a href="https://www.linkedin.com/in/schaeckm" target="_blank">Marco Sch\u00e4ck</a> \u00b7 <a href="https://www.linkedin.com/in/schaeckm" target="_blank">LinkedIn</a> \u00b7 <a href="https://medium.com/@emaarco" target="_blank">Medium</a>',
    },
  },
})
