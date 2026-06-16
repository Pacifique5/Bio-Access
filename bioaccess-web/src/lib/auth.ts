import bcrypt from "bcryptjs";
import { queryOne } from "./db";
import type { Admin } from "./types";

export async function authenticateAdmin(
  username: string,
  password: string
): Promise<Admin | null> {
  const row = await queryOne<{
    id: number;
    username: string;
    password_hash: string;
    role: string;
  }>("SELECT * FROM admins WHERE username = $1", [username.trim()]);

  if (!row) return null;
  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) return null;

  return { id: row.id, username: row.username, role: row.role };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
