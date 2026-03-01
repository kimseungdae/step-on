import { defineConfig } from "vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/lib.ts"),
        core: resolve(__dirname, "src/core/index.ts"),
      },
      formats: ["es"],
    },
    outDir: "dist-lib",
    rollupOptions: {
      external: ["vue", "lottie-web"],
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
      },
    },
    sourcemap: true,
    minify: false,
    copyPublicDir: false,
    emptyOutDir: true,
  },
});
