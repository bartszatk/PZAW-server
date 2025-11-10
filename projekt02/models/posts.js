import { DatabaseSync } from "node:sqlite";

const db_path = "./db.sqlite";
const db = new DatabaseSync(db_path);

db.exec(`
CREATE TABLE IF NOT EXISTS posts (
    id      INTEGER PRIMARY KEY,
    title   TEXT NOT NULL,
    content TEXT NOT NULL
) STRICT;
`);

const db_ops = {
  insert_post: db.prepare(
    `INSERT INTO posts (title, content) VALUES (?, ?) RETURNING id, title, content;`
  ),
  get_all_posts: db.prepare(
    `SELECT id, title, content FROM posts ORDER BY id DESC;`
  ),
};

export function getAllPosts() {
  return db_ops.get_all_posts.all();
}

export function addPost(post) {
  return db_ops.insert_post.get(post.title, post.content);
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

export default {
  getAllPosts,
  addPost,
  validatePost,
};
