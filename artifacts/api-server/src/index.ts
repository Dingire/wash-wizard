import app from "./app";
import { logger } from "./lib/logger";
import { syncSchema } from "./syncSchema";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  try {
    await syncSchema();
  } catch (syncErr) {
    logger.error(
      { err: syncErr },
      "Schema sync failed (the server is up, but the database may be missing tables or unreachable).",
    );
  }
});
