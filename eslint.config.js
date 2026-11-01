import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "**/playwright-report/**",
      "**/test-results/**",
      ".dependency-cruiser.cjs",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["packages/engine/**/*.ts"],
    rules: {
      "no-restricted-globals": [
        "error",
        { "name": "process", "message": "The engine must stay pure TypeScript." },
        { "name": "Buffer", "message": "The engine must stay pure TypeScript." },
        { "name": "console", "message": "The engine must stay pure TypeScript." },
        { "name": "require", "message": "The engine must stay pure TypeScript." },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react-dom", "node:*"],
              message: "The engine must stay pure TypeScript: no React, DOM or Node built-ins.",
            },
          ],
        },
      ],
    },
  },
);
