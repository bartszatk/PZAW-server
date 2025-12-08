import express from "express";
import morgan from "morgan";
import posts from "./models/posts.js";

const app = express();
const port = 8000;

posts.seedTestData();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  const allPosts = posts.getAllPosts();
  res.render("index", { posts: allPosts });
});

app.get("/new", (req, res) => {
  res.render("new_post", { post: {}, errors: [] });
});

app.post("/new", (req, res) => {
  const post = {
    title: req.body.title,
    content: req.body.content,
  };

  const errors = posts.validatePost(post);
  if (errors.length > 0) {
    return res.render("new_post", { post, errors });
  }

  posts.addPost(post);
  res.redirect("/");
});

app.get("/edit/:id", (req, res) => {
  const post = posts.getPost(req.params.id);
  if (!post) return res.redirect("/");
  res.render("edit_post", { post, errors: [] });
});

app.post("/edit/:id", (req, res) => {
  const id = req.params.id;
  const post = { title: req.body.title, content: req.body.content };
  const errors = posts.validatePost(post);

  if (errors.length > 0) {
    return res.render("edit_post", { post: { ...post, id }, errors });
  }

  posts.updatePost(id, post);
  res.redirect("/");
});

app.post("/delete/:id", (req, res) => {
  posts.deletePost(req.params.id);
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
