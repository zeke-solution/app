import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Standalone migration test scripts. Run directly with node against a
    // throwaway local Postgres, never bundled, so the app's module rules
    // (no require(), etc.) do not apply. See supabase/tests/README.md.
    "supabase/tests/**",
  ]),
]);

export default eslintConfig;
