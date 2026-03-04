import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      { tsconfig: "tsconfig.jest.json" },
    ],
  },
  rootDir: ".",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  setupFiles: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@tests/(.*)$": "<rootDir>/tests/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@config/(.*)$": "<rootDir>/src/config/$1",
    "^@core/(.*)$": "<rootDir>/src/core/$1",
    "^@infrastructure/(.*)$": "<rootDir>/src/infrastructure/$1",
    "^@modules/(.*)$": "<rootDir>/src/modules/$1",
    "^@workers/(.*)$": "<rootDir>/src/workers/$1",
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/scripts/**",
    "!src/server.ts",
  ],
  testTimeout: 10000,
  forceExit: true,
  detectOpenHandles: true,
};

export default config;
