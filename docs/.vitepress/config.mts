import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'CampusOS Documentation',
  description: 'Operating System for Higher Education Campuses',
  ignoreDeadLinks: true,
  themeConfig: {
    nav: [
      { text: 'Getting Started', link: '/getting-started/QUICK_START' },
      { text: 'Architecture', link: '/architecture/OVERVIEW' },
      { text: 'Plugins', link: '/plugins/README' },
      { text: 'Contributing', link: '/contributing/CONTRIBUTING' }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/NITRR-Official/CampusOS' }
    ]
  }
});

