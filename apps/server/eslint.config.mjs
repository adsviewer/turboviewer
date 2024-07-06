import sample from "@repo/eslint-config/library.mjs";

export default [
  ...sample,
  {
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
    }
  }
];
