import tseslint from 'typescript-eslint';

// The test split: mocks (page.route, and every check on a request) live in basicInit; a test() body is only
// page actions and expects.
const insideTest = "CallExpression[callee.name='test'] > :function";

export default [
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results'] },
  {
    files: ['tests/**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: `${insideTest} CallExpression[callee.property.name='route']`,
          message: 'Mocks go in basicInit, not in a test.',
        },
        {
          selector: `${insideTest} CallExpression[callee.property.name=/^waitFor(Request|Response)$/]`,
          message: 'Check requests in the mock, not in a test.',
        },
      ],
    },
  },
];
