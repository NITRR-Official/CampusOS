import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: appName
    },
    links: [
      {
        type: 'main',
        text: 'Getting Started',
        url: '/docs/getting-started/QUICK_START',
        active: 'nested-url'
      },
      {
        type: 'main',
        text: 'Architecture',
        url: '/docs/architecture/OVERVIEW',
        active: 'nested-url'
      },
      {
        type: 'main',
        text: 'Plugins',
        url: '/docs/plugins/README',
        active: 'nested-url'
      },
      {
        type: 'main',
        text: 'Guides',
        url: '/docs/guides/plugin-development',
        active: 'nested-url'
      },
      {
        type: 'main',
        text: 'API Reference',
        url: '/docs/api/REFERENCE',
        active: 'nested-url'
      },
      {
        type: 'main',
        text: 'ADRs',
        url: '/docs/architecture/decisions/ADR-000-CORE_PRINCIPLES',
        active: 'nested-url'
      },
      {
        type: 'main',
        text: 'Contributing',
        url: '/docs/contributing/CONTRIBUTING',
        active: 'nested-url'
      }
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`
  };
}
