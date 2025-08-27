import type { Config } from "jest";
const config: Config = {
  testEnvironment: "node",
  transform: { "^.+\\.(ts|tsx)$": "ts-jest" },
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  globals: { "ts-jest": { useESM: true } },
  testMatch: ["**/tests/**/*.test.ts"],
  moduleFileExtensions: ["ts", "tsx", "js"],
  verbose: true,
};
export default config;
