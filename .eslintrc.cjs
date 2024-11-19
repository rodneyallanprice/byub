module.exports = {
  extends: ['@fs/eslint-config-frontier-react/es6', '@fs/eslint-config-frontier-react/prettierSetup'],
  ignorePatterns: ['**/node_modules', '**/dist', '**/build', 'coverage-*/'],
  rules: {
    'no-console': 'off',
    eqeqeq: 'off',
    'default-param-last': 'off',
    'import/extensions': 'off',
  },
  overrides: [
    {
      files: ['test/**/*'],
      rules: {
        'no-undef': 'off',
      },
    },
  ],
}
