module.exports = {
  branches: process.env.DRY_RUN
    ? ["main", "testDev"]
    : ["main", { name: "testDev", prerelease: "alpha" }],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/npm",
    "@semantic-release/github",
  ],
};
