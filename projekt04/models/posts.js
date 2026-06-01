import { DatabaseSync } from "node:sqlite";
import fs from "fs";

const db_path = "./db.sqlite";
const db = new DatabaseSync(db_path);

// Ensure foreign key enforcement
db.exec("PRAGMA foreign_keys = ON;");

// Create posts table with foreign key if it does not exist
db.exec(`
CREATE TABLE IF NOT EXISTS posts (
    id      INTEGER PRIMARY KEY,
    title   TEXT NOT NULL,
    content TEXT NOT NULL,
    user_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
) STRICT;
`);

// If the existing table lacks FK constraint, perform migration (safe copy + replace)
function ensureForeignKey() {
  try {
    const fk = db.prepare("PRAGMA foreign_key_list(posts);").all();
    if (!fk || fk.length === 0) {
      // backup DB
      try {
        fs.copyFileSync(db_path, db_path + ".bak");
      } catch (e) {
        console.warn("Nie udało się utworzyć kopii zapasowej DB:", e.message);
      }

      db.exec("BEGIN TRANSACTION;");
      db.exec(`
        CREATE TABLE posts_new (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          user_id INTEGER,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
        );
      `);
      db.exec("INSERT INTO posts_new (id, title, content, user_id) SELECT id, title, content, user_id FROM posts;");
      db.exec("DROP TABLE posts;");
      db.exec("ALTER TABLE posts_new RENAME TO posts;");
      db.exec("COMMIT;");
    }
  } catch (err) {
    console.error("Błąd podczas sprawdzania/migracji FK dla posts:", err);
  }
}

ensureForeignKey();

const db_ops = {
  insert_post: db.prepare(
    `INSERT INTO posts (title, content, user_id) VALUES (?, ?, ?) RETURNING id, title, content, user_id;`
  ),
  get_all_posts: db.prepare(
    `SELECT p.id, p.title, p.content, p.user_id, u.login AS author
     FROM posts p
     LEFT JOIN users u ON p.user_id = u.id
     ORDER BY p.id DESC;`
  ),
  get_post: db.prepare(
    `SELECT p.id, p.title, p.content, p.user_id, u.login AS author
     FROM posts p
     LEFT JOIN users u ON p.user_id = u.id
     WHERE p.id = ?;`
  ),
  update_post: db.prepare(
    `UPDATE posts SET title = ?, content = ? WHERE id = ? RETURNING id, title, content, user_id;`
  ),
  delete_post: db.prepare(
    `DELETE FROM posts WHERE id = ?;`
  ),
};

function safeQuery(fn, defaultValue = null) {
  try {
    return fn();
  } catch (error) {
    console.error("Błąd bazy danych", error);
    return defaultValue;
  }
}

export function getAllPosts() {
  return safeQuery(() => db_ops.get_all_posts.all(), []);
}

export function getPost(id) {
  return safeQuery(() => db_ops.get_post.get(id), null);
}

export function addPost(post, user_id) {
  return safeQuery(() => db_ops.insert_post.get(post.title, post.content, user_id), null);
}

export function updatePost(id, post) {
  return safeQuery(() => db_ops.update_post.get(post.title, post.content, id), null);
}

export function deletePost(id) {
  return safeQuery(() => db_ops.delete_post.run(id), { changes: 0 });
}

export function validatePost(post) {
  const errors = [];
  if (!post.title || post.title.trim() === "") {
    errors.push("Tytuł jest wymagany.");
  }
  if (!post.content || post.content.trim() === "") {
    errors.push("Treść posta jest wymagana.");
  }
  return errors;
}

export function seedTestData() {
  if (getAllPosts().length === 0) {
    addPost({ title: "Wpis1", content: "Tresc1" }, null);
    addPost({ title: "Wpis2", content: "Tresc2" }, null);
  }
}