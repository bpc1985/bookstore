import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@bookstore/lib": path.resolve(__dirname, "../../packages/lib/src"),
      "@bookstore/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@bookstore/types": path.resolve(__dirname, "../../packages/types/src"),
    },
  },
});
