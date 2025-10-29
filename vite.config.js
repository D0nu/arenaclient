import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // You can toggle this if needed:
      protocolImports: true, // allows importing like `node:buffer`
    }),
  ],
  define: {
    global: "window",
    "process.env": {},
  },
});
