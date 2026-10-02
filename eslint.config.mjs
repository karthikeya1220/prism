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
    rules: {
      ...vitest.configs.recommended.rules,
      // Allow shared assertion helpers next to `expect(...)` calls.
      "vitest/expect-expect": [
        "error",
        { assertFunctionNames: ["expect", "expectBadRequest"] },
      ],
    },
  },
  // Playwright test files are not Vitest files.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
    "public/**",
  ]),
]);

export default eslintConfig;
