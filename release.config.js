module.exports = {
  branches: process.env.DRY_RUN
    ? ["+([0-9])?(.{+([0-9]),x}).x", "main", "dev", "*"]
    : ["main", { name: "dev", prerelease: "alpha" }],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/npm",
    "@semantic-release/github",
  ],
};
