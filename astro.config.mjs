import { defineConfig } from "astro/config";
import { astroImageTools } from "astro-imagetools";
import icon from "astro-icon";
import mdx from "@astrojs/mdx";
import m2dx from "astro-m2dx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import rehypeExternalLinks from "rehype-external-links";
import fauxRemarkEmbedder from "@remark-embedder/core";
import fauxOembedTransformer from "@remark-embedder/transformer-oembed";

const remarkEmbedder = fauxRemarkEmbedder.default;
const oembedTransformer = fauxOembedTransformer.default;

// Wrap the oembed transformer so that network errors (e.g. in CI/agents
// environments where external fetches are blocked) do not abort the build.
const safeOembedTransformer = {
  name: oembedTransformer.name,
  shouldTransform: async (url) => {
    try {
      return await oembedTransformer.shouldTransform(url);
    } catch {
      return false;
    }
  },
  getHTML: async (url, config) => {
    try {
      return await oembedTransformer.getHTML(url, config);
    } catch {
      return null;
    }
  },
};

import vue from "@astrojs/vue";
/** @type {import('astro-m2dx').Options} */

const m2dxOptions = {
  exportComponents: true,
  unwrapImages: true,
  autoImports: true,
};

// https://astro.build/config
export default defineConfig({
  site: "https://nebulix.unfolding.io",
  integrations: [
    icon(),
    mdx({}),
    sitemap(),
    tailwind(),
    vue({
      appEntrypoint: "/src/pages/_app",
    }),
    astroImageTools,
  ],
  markdown: {
    extendDefaultPlugins: true,
    remarkPlugins: [
      [
        remarkEmbedder,
        {
          transformers: [safeOembedTransformer],
          handleError: ({ error, url }) => {
            console.warn(`[remark-embedder] Could not embed ${url}: ${error.message}`);
          },
        },
      ],
      [m2dx, m2dxOptions],
    ],
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          rel: ["nofollow"],
          target: ["_blank"],
        },
      ],
    ],
  },
  vite: {
    build: {
      rollupOptions: {
        external: [
          "/_pagefind/pagefind.js",
          "/_pagefind/pagefind-ui.js",
          "/_pagefind/pagefind-ui.css",
        ],
      },
      assetsInlineLimit: 10096,
    },
  },
  build: {
    inlineStylesheets: "always",
  },
  scopedStyleStrategy: "attribute",
  prefetch: {
    defaultStrategy: "viewport",
  },
});
