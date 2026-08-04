export default {
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/routes/*.js',
    '!src/controller/*.js'
  ],
  transform: {}
};
