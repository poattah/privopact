import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const manifestPlugin = () => ({
  name: "manifest-and-static",
  closeBundle() {
    const root = resolve(__dirname, "dist");
    const manifest = JSON.parse(
      readFileSync(resolve(__dirname, "src/manifest.json"), "utf8")
    );
    writeFileSync(resolve(root, "manifest.json"), JSON.stringify(manifest, null, 2));
  },
});

export default defineConfig({
  base: "./",
  plugins: [react(), manifestPlugin()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup.html"),
        background: resolve(__dirname, "src/background/index.ts"),
        content: resolve(__dirname, "src/content/index.ts"),
        main_world: resolve(__dirname, "src/content/main-world.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
