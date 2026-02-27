/** @type {import('jest').Config} */
const config = {
  projects: [
    {
      displayName: "lib",
      testEnvironment: "jsdom",
      testMatch: ["<rootDir>/src/__tests__/lib/**/*.test.ts"],
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          { tsconfig: "tsconfig.json" },
        ],
      },
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
      setupFilesAfterSetup: ["<rootDir>/jest.setup.ts"],
    },
    {
      displayName: "api",
      testEnvironment: "node",
      testMatch: ["<rootDir>/src/__tests__/api/**/*.test.ts"],
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          { tsconfig: "tsconfig.json" },
        ],
      },
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
    },
  ],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
};

module.exports = config;
