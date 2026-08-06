import { defineRailway, project, service, postgres, ref } from "railway/iac";

export default defineRailway(() => {
  const postgresDb = postgres("Postgres");

  const api = service("api", {
    // Deploy via the root Dockerfile. It already builds the backend
    // (RUN cd artifacts/api-server && corepack pnpm run build) and starts it
    // (WORKDIR /app/artifacts/api-server + CMD ["node", ...]).
    // Do NOT set build/start string commands here: Railway runs those in exec
    // form (no shell), so a leading `cd` fails with
    // "The executable `cd` could not be found."
    build: {
      builder: "DOCKERFILE",
      dockerfilePath: "Dockerfile",
    },
    variables: {
      PORT: "5000",
      DATABASE_URL: ref(postgresDb, "DATABASE_URL"),
      PGSSLMODE: "require",
      PNPM_CONFIG_FROZEN_LOCKFILE: "false",
      NPM_CONFIG_FROZEN_LOCKFILE: "false",
    },
  });

  const admin = service("admin", {
    // SPA dashboard served statically via nginx (artifacts/carwash-admin/Dockerfile).
    // VITE_API_BASE_URL is baked into the bundle at build time via ARG and must
    // match the API service's public URL. Update it if your API domain changes.
    build: {
      builder: "DOCKERFILE",
      dockerfilePath: "artifacts/carwash-admin/Dockerfile",
    },
    variables: {
      PORT: "3000",
      BASE_PATH: "/",
      VITE_API_BASE_URL: "https://api-production-8c55.up.railway.app",
      PNPM_CONFIG_FROZEN_LOCKFILE: "false",
      NPM_CONFIG_FROZEN_LOCKFILE: "false",
    },
  });

  return project("wash-wizard-api", {
    resources: [api, postgresDb, admin],
  });
});
