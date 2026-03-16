module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  transform: { '^.+\\.js$': 'babel-jest' },
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
};
