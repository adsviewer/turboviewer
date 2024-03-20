/** @type {import('@types/prettier').Config} */
const prettierrcConfig = {
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  printWidth: 120,
  importOrder: ["<THIRD_PARTY_MODULES>", "^@(.*)$", "^[./]"],

  plugins: ['@trivago/prettier-plugin-sort-imports']
};

export default prettierrcConfig;
