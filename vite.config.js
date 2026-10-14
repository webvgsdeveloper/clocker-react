import process from "node:process";
import { defineConfig, loadEnv } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import react from "@vitejs/plugin-react-swc";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      nodePolyfills({
        globals: { Buffer: true, global: true, process: true },
        protocolImports: true,
      }),
    ],
    define: {
      global: "globalThis",
    },
    base: env.VITE_BASE_PATH || "/",
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 800,
      minify: "terser",
      terserOptions: {
        compress: {
          drop_debugger: true,
          pure_funcs: ["console.debug"],
        },
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (
                id.includes("node_modules/react/") ||
                id.includes("node_modules/react-dom/") ||
                id.includes("node_modules/scheduler/")
              ) {
                return "vendor-framework";
              }

              if (
                id.includes("@tremor") ||
                id.includes("recharts") ||
                id.includes("@headlessui") ||
                id.includes("d3")
              ) {
                return "vendor-charts";
              }

              if (id.includes("@fortawesome")) {
                return "vendor-icons";
              }

              if (
                id.includes("date-fns") ||
                id.includes("react-datepicker") ||
                id.includes("react-day-picker")
              ) {
                return "vendor-dates";
              }

              if (id.includes("emoji-picker-react")) {
                return "vendor-emoji";
              }
              if (id.includes("framer-motion")) {
                return "vendor-animations";
              }

              return "vendor-core";
            }
          },
        },
      },
    },
    server: {
      host: true,
      port: 5173,
    },
  };
});

