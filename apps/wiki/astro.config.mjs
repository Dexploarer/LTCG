import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://wiki.ltcg.gg',
  integrations: [
    react(),
    starlight({
      title: 'LTCG Wiki',
      description: 'Complete guide to the LTCG Trading Card Game - cards, rules, archetypes, and strategies.',
      logo: {
        light: './src/assets/logo-light.svg',
        dark: './src/assets/logo-dark.svg',
        replacesTitle: false,
      },
      // Social links
      social: {
        github: 'https://github.com/ltcg',
        discord: 'https://discord.gg/ltcg',
        'x.com': 'https://x.com/ltcg',
      },
      // Favicon
      favicon: '/favicon.svg',
      // Expressive Code configuration for enhanced code blocks
      expressiveCode: {
        themes: ['github-dark', 'github-light'],
        styleOverrides: {
          borderRadius: '0.5rem',
          codePaddingInline: '1rem',
          codePaddingBlock: '0.75rem',
        },
        defaultProps: {
          wrap: true,
        },
      },
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Welcome', slug: 'index' },
            { label: 'Quick Start', slug: 'getting-started/quick-start' },
          ],
        },
        {
          label: 'Rules',
          collapsed: false,
          autogenerate: { directory: 'rules' },
        },
        {
          label: 'Mechanics',
          collapsed: true,
          autogenerate: { directory: 'mechanics' },
        },
        {
          label: 'Game Modes',
          collapsed: true,
          autogenerate: { directory: 'modes' },
        },
        {
          label: 'Economy',
          collapsed: true,
          autogenerate: { directory: 'economy' },
        },
        {
          label: 'Cards',
          collapsed: false,
          items: [
            { label: 'Card Database', slug: 'cards' },
            { label: 'By Archetype', slug: 'cards/archetypes' },
          ],
        },
        {
          label: 'Meta',
          items: [
            { label: 'Tier List', slug: 'meta' },
          ],
        },
        {
          label: 'Tools',
          collapsed: false,
          items: [
            { label: 'Overview', slug: 'tools' },
            { label: 'Deck Builder', slug: 'tools/deck-builder' },
            { label: 'Card Comparison', slug: 'tools/compare' },
            { label: 'Dust Calculator', slug: 'tools/calculator' },
          ],
        },
      ],
      customCss: ['./src/styles/custom.css'],
      editLink: {
        baseUrl: 'https://github.com/ltcg/ltcg/edit/main/apps/wiki/',
      },
      lastUpdated: true,
      pagination: true,
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      // Credits in footer
      credits: true,
      // SEO and social sharing
      head: [
        {
          tag: 'meta',
          attrs: {
            property: 'og:image',
            content: 'https://wiki.ltcg.gg/og-image.png',
          },
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:type',
            content: 'website',
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'twitter:card',
            content: 'summary_large_image',
          },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'sitemap',
            href: '/sitemap-index.xml',
          },
        },
      ],
    }),
  ],
});
