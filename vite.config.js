import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "build", // Specify the output directory for build files
  },
  server: {
    port: 3000, // Set the port for the development server
  },
  resolve: {
    alias: {
      // Add any aliases you may need here
    },
    extensions: [".js", ".jsx"], // Ensure .jsx is included for JSX handling
  },
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.(js|jsx)$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  }
});
