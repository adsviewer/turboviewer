import {resolve} from "node:path";
import vercelNode from "@vercel/style-guide/eslint/node";
import vercelTypescript from "@vercel/style-guide/eslint/typescript";

const project = resolve(process.cwd(), "tsconfig.json");

export default [
  // vercelNode,
  // vercelTypescript,
  {
    languageOptions: {
      parserOptions: {
        project,
      },
      globals: {
        React: true,
        JSX: true,
      },
    },
    settings: {
      "import/resolver": {
        typescript: {
          project,
        },
      },
    },
    ignores: ["node_modules/", "dist/"],
  }
];
