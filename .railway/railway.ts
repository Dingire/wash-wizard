import { defineRailway, project, service, postgres, preserve } from "railway/iac";

export default defineRailway(() => {
  const api = service("api", {
    // Build from the backend package inside the monorepo.
    build: "cd artifacts/api-server && corepack pnpm install --no-frozen-lockfile && corepack pnpm run build",
    start: "cd artifacts/api-server && corepack pnpm run start",
    variables: {
      PORT: "5000",
      DATABASE_URL: preserve(),
      PNPM_CONFIG_FROZEN_LOCKFILE: "false",
      NPM_CONFIG_FROZEN_LOCKFILE: "false",
    },
  });

  const postgresDb = postgres("Postgres");

  return project("wash-wizard-api", {
    resources: [api, postgresDb],
  });
});
