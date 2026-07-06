import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      tslib: fileURLToPath(new URL("./src/lib/tslib.ts", import.meta.url))
    }
  },
  optimizeDeps: {
    include: ["tslib"]
  }
});
