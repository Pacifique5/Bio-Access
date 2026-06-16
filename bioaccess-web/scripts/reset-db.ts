import { pool } from "../src/lib/db";
import { RESET_SQL, SCHEMA_SQL } from "../src/lib/schema";
import { hashPassword } from "../src/lib/auth";

async function main() {
  console.log("Clearing all data (users, fingerprints, attendance, logs)...");
  await pool.query(SCHEMA_SQL);
  await pool.query(RESET_SQL);

  const hash = await hashPassword("admin123");
  await pool.query(
    "INSERT INTO admins (username, password_hash, role) VALUES ($1, $2, $3)",
    ["admin", hash, "admin"]
  );

  console.log("All data cleared.");
  console.log("Fresh admin: admin / admin123");
  console.log("No users, no fingerprints, no attendance records, no logs.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
