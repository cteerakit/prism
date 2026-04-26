import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Prism',
    description: 'A clean new-tab extension with bookmarks and ambient radio.',
    permissions: ['bookmarks', 'favicon'],
    host_permissions: [
      // SomaFM stream endpoints for in-widget audio playback.
      'https://ice1.somafm.com/*',
      'https://ice2.somafm.com/*',
    ],
    content_security_policy: {
      extension_pages:
        "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; media-src 'self' https://ice1.somafm.com https://ice2.somafm.com;",
    },
    web_accessible_resources: [
      {
        resources: ['_favicon/*'],
        matches: ['<all_urls>'],
      },
    ],
  },
});
