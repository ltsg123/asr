import { resolve } from "path";
import pkg from "./package.json";
import { BuildOptions, defineConfig } from "vite";

const sdkBuild: BuildOptions = {
  minify: "terser",
  lib: {
    name: pkg.name,
    fileName: (format) => {
      if (format === "umd") {
        return "index.js";
      } else {
        return "index.esm.js";
      }
    },
    entry: "src/index.ts",
    formats: ["umd", "es"],
  },
  sourcemap: false,
};

const demoBuild: BuildOptions = {
  minify: "terser",
  rollupOptions: {
    input: {
      main: resolve(__dirname, "index.html"),
    },
  },
  lib: {
    name: pkg.name,
    entry: "src/demo.ts",
    formats: ["umd"],
  },
  sourcemap: false,
};

export default defineConfig({
  base: "./",
  plugins: [],
  build: process.env.NODE_ENV === "demo" ? demoBuild : sdkBuild,
  server: {
    port: 5173,
  },
});
