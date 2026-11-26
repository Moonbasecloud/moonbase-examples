// One small connection pool for the whole app, shared by server.js and
// migrate.js. The TLS block below is the recipe from the moonbase build guide,
// unchanged. moonbase gives the app and the migration command three variables:
//
//   DATABASE_URL          user, password, host, port and database. No TLS
//                         settings: use it as given, do not add sslmode.
//   PILOT_DB_CA_FILE      path of the PEM file that signed the server certificate.
//   PILOT_DB_SERVER_NAME  the name on the server certificate. It can differ
//                         from the host inside DATABASE_URL.
const fs = require("node:fs");
const tls = require("node:tls");
const { Pool } = require("pg");

const REQUIRED = ["DATABASE_URL", "PILOT_DB_CA_FILE", "PILOT_DB_SERVER_NAME"];

function missingSettings(env = process.env) {
  return REQUIRED.filter((name) => !env[name] || !env[name].trim());
}

function createPool() {
  const missing = missingSettings();
  if (missing.length > 0) {
    const error = new Error(
      `Missing database settings: ${missing.join(", ")}. ` +
        "On moonbase these are set for you when moonbase.json declares a database. " +
        "To run locally, see the README (\"Run it locally\").",
    );
    error.code = "DATABASE_SETTINGS_MISSING";
    throw error;
  }

  const serverName = process.env.PILOT_DB_SERVER_NAME;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    ssl: {
      ca: fs.readFileSync(process.env.PILOT_DB_CA_FILE, "utf8"),
      servername: serverName,
      checkServerIdentity: (_host, cert) => tls.checkServerIdentity(serverName, cert),
      rejectUnauthorized: true,
    },
  });
  // An idle client that loses its connection must not crash the process.
  pool.on("error", (err) => console.error("database pool error:", err.message));
  return pool;
}

module.exports = { createPool, missingSettings };
