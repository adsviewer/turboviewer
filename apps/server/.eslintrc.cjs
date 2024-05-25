/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["@repo/eslint-config/library.cjs"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: './eslint.tsconfig.json',
  },
  rules: {
    "@typescript-eslint/explicit-function-return-type": "off",
  },
};
