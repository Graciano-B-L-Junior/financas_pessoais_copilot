module.exports = {
  clearMocks: true,
  collectCoverageFrom: ["src/**/*.js", "!src/public/js/**/*.js"],
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
};