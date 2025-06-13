import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";

const config: Config = {
  title: "Supastash",
  tagline: "Offline-first syncing built for Supabase",
  favicon: "img/supastash-sm.png",

  future: {
    v4: true,
  },

  url: "https://0xZekeA.github.io",
  baseUrl: "/supastash/",

  organizationName: "0xZekeA",
  projectName: "supastash",

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  trailingSlash: false,

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl: "https://github.com/0xZekeA/supastash/tree/main/docs-site",
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ["rss", "atom"],
            xslt: true,
          },
          editUrl: "https://github.com/0xZekeA/supastash/tree/main/docs-site",
          onInlineTags: "warn",
          onInlineAuthors: "warn",
          onUntruncatedBlogPosts: "warn",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/supastash-sm.png",
    navbar: {
      title: "Supastash",
      logo: {
        alt: "Supastash Logo",
        src: "img/supastash-sm.png",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Docs",
        },
        {
          href: "https://github.com/0xZekeA/supastash",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "light",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Getting Started",
              to: "/docs/getting-started",
            },
          ],
        },
        {
          title: "Community",
          items: [],
        },
        {
          title: "More",
          items: [
            {
              label: "NPM",
              href: "https://www.npmjs.com/package/supastash",
            },
            {
              label: "GitHub",
              href: "https://github.com/0xZekeA/supastash",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Supastash`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
