import eslint from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', '.tsbuild'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
        allowDefaultProject: ['eslint.config.js', 'eslint.config.mjs'],
        // Optionally specify a separate tsconfig for these files
        // defaultProject: 'tsconfig.eslint.json',
      },
        tsconfigRootDir: import.meta.dirname, // Set explicitly here
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }]
    }
  },
  {
    files: ['vite.config.ts', 'vite.config.js'],
    languageOptions: {
      globals: globals.node
    }
  }
);
