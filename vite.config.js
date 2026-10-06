import { defineConfig } from 'vite';

// `base: './'` makes the build use relative asset paths, which is what
// GitHub Pages needs when the site is served from a sub-path like
// https://<user>.github.io/<repo>/
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
  },
});
