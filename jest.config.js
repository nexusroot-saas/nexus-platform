export default {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: ['apps/**/*.js', 'packages/**/*.js'],
  coverageThreshold: {
    global: {
      lines: 80,
    },
  },
};
