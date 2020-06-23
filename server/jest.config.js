module.exports = {
  roots: ["<rootDir>"],
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.jsx?$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  setupFiles: ["dotenv/config"],
  testEnvironment: "node",
}
