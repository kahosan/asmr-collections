import { kaho, sorting } from 'eslint-config-kaho';

export default kaho(
  {
    react: true,
    ignores: {
      customGlobs: [
        'apps/web/src/components/ui/*.tsx',
        'apps/web/tailwind.config.js'
      ]
    }
  },
  {
    ...sorting,
    files: ['apps/server/**/*.ts'],
    rules: {
      ...sorting.rules,
      'no-console': 'off'
    }
  },
  {
    rules: {
      'import-x/no-unresolved': 'off',
      'react-hooks/purity': 'off'
    }
  }
);
