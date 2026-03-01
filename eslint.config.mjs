import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";

export default defineConfig(
  {
    ignores: ["dist/", "node_modules/", "temp/"],
  },
  eslintConfigPrettier,
  {
    files: ["src/**/*.ts"],
    extends: [...tseslint.configs.recommended],
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": "warn",
      // Group by source only (builtin → external → internal → relative).
      // No type vs value split.
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^\\u0000"], // side-effect
            ["^node:"], // Node builtins
            ["^@?\\w"], // npm packages
            ["^(@/)(/|$)"], // app path aliases
            ["^\\."], // relative
            ["^"], // fallback
          ],
        },
      ],
      "simple-import-sort/exports": "error",
    },
  },
);
