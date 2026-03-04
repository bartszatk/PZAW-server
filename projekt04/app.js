import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import * as posts from "./models/posts.js";
import * as users from "./models/users.js";

const app = express();
const port = 8000;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use((req, res, next) => {
  const userId = req.cookies.user_id;
  if (userId) {
    req.user = users.getUserById(userId);
  } else {
    req.user = null;
  }
  next();
});

app.get("/", (req, res) => {
  const allPosts = posts.getAllPosts();
  res.render("index", { posts: allPosts, user: req.user });
});

app.get("/register", (req, res) => {
  res.render("register", { errors: [] });
});

app.post("/register", (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.render("register", { errors: ["Wszystkie pola wymagane"] });
  }

  try {
    users.createUser(login, password);
    res.redirect("/login");
  } catch {
    res.render("register", { errors: ["Login zajęty"] });
  }
});

app.get("/login", (req, res) => {
  res.render("login", { errors: [] });
});

app.post("/login", async (req, res) => {
  const user = await users.verifyUser(req.body.login, req.body.password);
  if (!user) {
    return res.render("login", { errors: ["Niepoprawne dane"] });
  }

  res.cookie("user_id", user.id);
  res.redirect("/");
});

app.get("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/");
});

app.get("/new", (req, res) => {
  res.render("new_post", { post: {}, errors: [], user: req.user });
});

app.post("/new", (req, res) => {
  const post = { title: req.body.title, content: req.body.content };
  const errors = posts.validatePost(post);

  if (errors.length > 0) {
    return res.render("new_post", { post, errors, user: req.user });
  }

  posts.addPost(post);
  res.redirect("/");
});

app.get("/edit/:id", (req, res) => {
  const post = posts.getPost(req.params.id);
  if (!post) return res.redirect("/");

  res.render("edit_post", { post, errors: [], user: req.user });
});

app.post("/edit/:id", (req, res) => {
  const post = posts.getPost(req.params.id);
  if (!post) return res.redirect("/");

  const updated = { title: req.body.title, content: req.body.content };
  const errors = posts.validatePost(updated);

  if (errors.length > 0) {
    return res.render("edit_post", {
      post: { ...updated, id: post.id },
      errors,
      user: req.user,
    });
  }

  posts.updatePost(post.id, updated);
  res.redirect("/");
});

app.post("/delete/:id", (req, res) => {
  const post = posts.getPost(req.params.id);
  if (!post) return res.redirect("/");

  posts.deletePost(post.id);
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});