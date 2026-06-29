module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/database/seed.js',
  ],
  coverageReporters: ['text', 'lcov'],
  coverageDirectory: 'coverage',
};
