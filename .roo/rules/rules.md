# Code Quality Rules

1. Test Coverage:

    - Before attempting completion, always make sure that any code changes have test coverage
    - Ensure all tests pass before submitting changes
    - The vitest framework is used for testing; the `vi`, `describe`, `test`, `it`, etc functions are defined by default in `tsconfig.json` and therefore don't need to be imported from `vitest`
    - Tests must be run from the same directory as the `package.json` file that specifies `vitest` in `devDependencies`
    - Run tests with: `npx vitest run <relative-path-from-workspace-root>`
    - Do NOT run tests from project root - this causes "vitest: command not found" error
    - Tests must be run from inside the correct workspace:
        - Backend tests: `cd src && npx vitest run path/to/test-file` (don't include `src/` in path)
        - UI tests: `cd webview-ui && npx vitest run src/path/to/test-file`
    - Example: For `src/tests/user.test.ts`, run `cd src && npx vitest run tests/user.test.ts` NOT `npx vitest run src/tests/user.test.ts`

2. Lint Rules:

    - Never disable any lint rules without explicit user approval

3. Styling Guidelines:

    - Use Tailwind CSS classes instead of inline style objects for new markup
    - VSCode CSS variables must be added to webview-ui/src/index.css before using them in Tailwind classes
    - Example: `<div className="text-md text-vscode-descriptionForeground mb-2" />` instead of style objects

4. Internationalization:

    - All user-facing strings must be internationalized using the `t()` function from `src/i18n`
    - Import the translation function: `import { t } from "../i18n"`
    - Add translation keys to all language files in `src/i18n/locales/[lang]/[namespace].json`
    - Supported languages: ca, de, es, fr, hi, id, it, ja, ko, nl, pl, pt-BR, ru, tr, vi, zh-CN, zh-TW
    - Common namespaces: common, embeddings, marketplace, mcp, tools, worktrees
    - Example: `t("common:welcome")` instead of `"Welcome"`
    - Never hardcode user-facing text in English or any other language
