import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsConfigPaths(), svgr()],
  optimizeDeps: {
    include: ["@emotion/styled"],
    exclude: ["swiper", "swiper/module-name"],
  },
  define: {
    "process.env": process.env,
  },
});
