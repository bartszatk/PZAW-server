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
  get_post: db.prepare(
    `SELECT id, title, content FROM posts WHERE id = ?;`
  ),
  update_post: db.prepare(
    `UPDATE posts SET title = ?, content = ? WHERE id = ? RETURNING id, title, content;`
  ),
  delete_post: db.prepare(
    `DELETE FROM posts WHERE id = ?;`
  ),
};

export function getAllPosts() {
  return db_ops.get_all_posts.all();
}

export function getPost(id) {
  return db_ops.get_post.get(id);
}

export function addPost(post) {
  return db_ops.insert_post.get(post.title, post.content);
}

export function updatePost(id, post) {
  return db_ops.update_post.get(post.title, post.content, id);
}

export function deletePost(id) {
  return db_ops.delete_post.run(id);
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
  getPost,
  addPost,
  updatePost,
  deletePost,
  validatePost,
};
