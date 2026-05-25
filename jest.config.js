/** @type {import('jest').Config} */
const config = {
  // Default to node — override with @jest-environment jsdom in DOM test files
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/__tests__/**/*.test.{ts,tsx}"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          target: "es6",
          esModuleInterop: true,
          module: "commonjs",
          moduleResolution: "node",
        },
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
};

module.exports = config;
