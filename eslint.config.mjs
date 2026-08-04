import {dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {FlatCompat} from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      ".next-*/**",
      ".next-phase1-verify/**",
      ".next-pre-v2-cutover/**",
      ".verify-tmp/**",
      "node_modules/**",
      "coverage/**",
      "out/**",
      "drizzle/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
