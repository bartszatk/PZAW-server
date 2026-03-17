import { DatabaseSync } from "node:sqlite";
import argon2 from "argon2";

const db = new DatabaseSync("./db.sqlite");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    login TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user'
) STRICT;
`);

const insert_user = db.prepare(`
INSERT INTO users (login, password_hash, role)
VALUES (?, ?, ?)
RETURNING id, login, role;
`);

const get_user_by_login = db.prepare(`
SELECT * FROM users WHERE login = ?;
`);

const get_user_by_id = db.prepare(`
SELECT id, login, role FROM users WHERE id = ?;
`);

export async function createUser(login, password, role = "user") {
  const hash = await argon2.hash(password);
  return insert_user.get(login, hash, role);
}

export async function verifyUser(login, password) {
  const user = get_user_by_login.get(login);
  if (!user) return null;

  const valid = await argon2.verify(user.password_hash, password);
  if (!valid) return null;

  return { id: user.id, login: user.login, role: user.role };
}

export function getUserById(id) {
  return get_user_by_id.get(id);
}