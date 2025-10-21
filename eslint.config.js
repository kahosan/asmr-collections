import { kaho, sorting } from 'eslint-config-kaho';

export default kaho(
  {
    react: true,
    ignores: {
      customGlobs: [
        'website/src/components/ui/*.tsx',
        'website/tailwind.config.js'
      ]
    }
  },
  {
    ...sorting,
    files: ['server/**/*.ts'],
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
