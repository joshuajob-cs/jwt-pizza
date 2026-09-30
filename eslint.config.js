import tseslint from 'typescript-eslint';

// The test file's three sections: mock data at the top, mocks (page.route, and every check on a request) in
// basicInit, and test() bodies that are only page actions and expects.
const insideTest = "CallExpression[callee.name='test'] > :function";
const mockHandler = "CallExpression[callee.property.name='route'] > :function > BlockStatement";
const checksMethod = [
  "VariableDeclaration[declarations.0.id.name='method']",
  "ExpressionStatement[expression.callee.object.callee.name='expect'][expression.callee.object.arguments.0.callee.property.name='method']",
];

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
        {
          selector: "FunctionDeclaration[id.name='basicInit'] VariableDeclarator > :matches(ObjectExpression, ArrayExpression)",
          message: 'Mock data goes at the top of the file, not inside basicInit.',
        },
        {
          selector: "Program > FunctionDeclaration[id.name='basicInit'] ~ VariableDeclaration",
          message: 'Mock data goes above basicInit.',
        },
        {
          selector: `${mockHandler} > :first-child${checksMethod.map((check) => `:not(${check})`).join('')}`,
          message: 'A mock checks the request method first.',
        },
      ],
    },
  },
];
