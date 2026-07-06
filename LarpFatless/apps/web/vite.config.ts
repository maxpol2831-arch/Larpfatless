import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      tslib: fileURLToPath(new URL("./node_modules/tslib/tslib.es6.mjs", import.meta.url))
    }
  },
  optimizeDeps: {
    include: ["tslib"]
  }
});
