import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import vitest from "@vitest/eslint-plugin";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Vitest-aware linting for unit/integration tests.
  {
    files: ["tests/**/*.{ts,tsx}"],
    ...vitest.configs.recommended,
  },
  // Playwright test files are not Vitest files.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
    "public/**",
  ]),
]);

export default eslintConfig;
