module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.js', '**/*.test.ts', '**/**/*.test.ts'],
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  moduleNameMapper: {
    '@/(.*)$': '<rootDir>/$1',
  },
  testTimeout: 9000000,
};
