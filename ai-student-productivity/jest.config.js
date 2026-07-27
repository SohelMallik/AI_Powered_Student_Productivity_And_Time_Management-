// ============================================================
// Jest Configuration
// ============================================================
module.exports = {
  testEnvironment   : 'node',
  testMatch         : ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['server/**/*.js', '!server/index.js'],
  coverageReporters : ['text', 'lcov', 'html'],
  coverageThreshold : {
    global: { branches: 60, functions: 60, lines: 60, statements: 60 },
  },
  setupFilesAfterFramework: [],
  testTimeout       : 10000,
};
