import { pool } from "../src/lib/db";
import { SCHEMA_SQL } from "../src/lib/schema";
import { hashPassword } from "../src/lib/auth";

async function main() {
  await pool.query(SCHEMA_SQL);

  const existing = await pool.query("SELECT COUNT(*) FROM admins");
  if (Number(existing.rows[0].count) === 0) {
    const hash = await hashPassword("admin123");
    await pool.query(
      "INSERT INTO admins (username, password_hash, role) VALUES ($1, $2, $3)",
      ["admin", hash, "admin"]
    );
    console.log("Default admin created: admin / admin123");
  }

  console.log("Database initialized successfully.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
