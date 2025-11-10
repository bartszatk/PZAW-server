import express from "express";
import morgan from "morgan";
import posts from "./models/posts.js";

const app = express();
const port = 8000;

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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
