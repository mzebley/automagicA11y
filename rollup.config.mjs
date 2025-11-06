import alias from "@rollup/plugin-alias";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRootDir = path.resolve(fileURLToPath(new URL(".", import.meta.url)));

export default {
  input: "src/index.ts",
  output: [
    { file: "dist/automagica11y.esm.js", format: "esm", sourcemap: true },
    { file: "dist/automagica11y.cjs.js", format: "cjs", sourcemap: true },
    { file: "dist/automagica11y.min.js", format: "iife", name: "automagicA11y", plugins: [terser()], sourcemap: true }
  ],
  plugins: [
    alias({
      entries: [
        { find: "@core", replacement: path.join(projectRootDir, "src/core") },
        { find: "@utils", replacement: path.join(projectRootDir, "src/utils") }
      ]
    }),
    resolve(),
    typescript()
  ]
};
