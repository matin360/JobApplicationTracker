import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default tseslint.config(
  { ignores: ['dist', 'prisma/seed.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
      parser: tsParser,
      parserOptions: {
        // Automatically provides the absolute path of this file's folder
        tsconfigRootDir: import.meta.dirname, 
        project: ['./tsconfig.json'],
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
  }
);
