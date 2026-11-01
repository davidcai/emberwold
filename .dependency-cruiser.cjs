/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "engine-must-not-depend-on-client",
      severity: "error",
      from: { path: "^packages/engine" },
      to: { path: "^packages/client" },
    },
    {
      name: "engine-must-not-use-node-core",
      severity: "error",
      from: { path: "^packages/engine" },
      to: { dependencyTypes: ["core"] },
    },
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(^|/)(dist|coverage|node_modules)/" },
  },
};
